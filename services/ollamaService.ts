import { OllamaModel, GenerateResponse } from '../types';

// Helper to ensure endpoint formatting is consistent
const cleanUrl = (url: string) => url.replace(/\/$/, '');

export const checkConnection = async (endpoint: string): Promise<boolean> => {
  if (!endpoint) return false;
  try {
    const response = await fetch(`${cleanUrl(endpoint)}/api/tags`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return response.ok;
  } catch (e) {
    // Log as debug to avoid cluttering console with expected connection failures
    // This often happens if Ollama is not running or CORS is not configured
    console.debug("Connection check failed:", e);
    return false;
  }
};

export const fetchModels = async (endpoint: string): Promise<OllamaModel[]> => {
  if (!endpoint) return [];
  try {
    const response = await fetch(`${cleanUrl(endpoint)}/api/tags`);
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return data.models || [];
  } catch (e) {
    console.warn("Fetch models failed:", e);
    return [];
  }
};

export const generateFix = async (
  endpoint: string,
  model: string,
  sourceCode: string,
  testCode: string,
  errorLog: string,
  onChunk: (chunk: string) => void
): Promise<void> => {
  const prompt = `
You are an expert software engineer and test specialist (Jester). 
Your goal is to fix the source code so that it passes the provided tests.

CONTEXT:
1.  **Source Code**: The current implementation (potentially buggy).
2.  **Test Suite**: The tests that define the expected behavior.
3.  **Error Log**: The output from the test runner showing failures.

INSTRUCTIONS:
- Analyze the error log to understand why the test failed.
- Modify the Source Code to resolve the issues.
- Do NOT modify the Test Suite unless the test itself is logically flawed (rare).
- Provide a brief explanation of the fix, followed by the COMPLETE fixed source code block.
- Wrap the code in markdown code blocks, e.g., \`\`\`javascript ... \`\`\`.

--- SOURCE CODE ---
${sourceCode}

--- TEST SUITE ---
${testCode}

--- ERROR LOG ---
${errorLog}

--- YOUR RESPONSE ---
`;

  try {
    const response = await fetch(`${cleanUrl(endpoint)}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true, 
      }),
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last line in the buffer as it might be incomplete
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json: GenerateResponse = JSON.parse(line);
          if (json.response) {
            onChunk(json.response);
          }
        } catch (e) {
          console.warn("Failed to parse JSON chunk", e);
        }
      }
    }
    
    // Process any remaining buffer content
    if (buffer.trim()) {
      try {
        const json: GenerateResponse = JSON.parse(buffer);
        if (json.response) onChunk(json.response);
      } catch (e) {
        console.warn("Failed to parse final JSON chunk", e);
      }
    }

  } catch (e) {
    console.error("Generation failed:", e);
    throw e;
  }
};