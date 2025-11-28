export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaResponse {
  models: OllamaModel[];
}

export interface GenerationRequest {
  model: string;
  prompt: string;
  stream?: boolean;
}

export interface GenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export enum Tab {
  SOURCE = 'SOURCE',
  TEST = 'TEST',
  ERROR = 'ERROR',
  RESULT = 'RESULT',
  DIFF = 'DIFF'
}

export interface AppState {
  endpoint: string;
  model: string;
  sourceCode: string;
  testCode: string;
  errorLog: string;
  fixResult: string;
  isFixing: boolean;
  isConnected: boolean;
  activeTab: Tab;
}