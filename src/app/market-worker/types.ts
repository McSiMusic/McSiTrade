import type { GeneratedUpdate } from '../../types';

export interface IMarketGenerator {
  init(instrumentCount: number): void;
  generateUpdates(batchSize: number): GeneratedUpdate[];
}

export type GeneratorFactory = () => Promise<IMarketGenerator>;

export interface WasmGeneratorExports extends WebAssembly.Exports {
  init(instrumentCount: number): void;
  generateBatchJson(batchSize: number): number;
  __getString(pointer: number): string;
  __setString(pointer: number, value: string): void;
}

export type StartMessage = {
  type: 'START';
  runId: number;
  instrumentCount: number;
  updatesPerBatch: number;
  batchIntervalMs: number;
};

export type WorkerCommand =
  | StartMessage
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' };

export type WorkerResponse =
  | { type: 'BATCH_UPDATE'; runId: number; updates: GeneratedUpdate[] }
  | { type: 'ERROR'; runId: number; message: string };

export type RunSettings = Pick<
  StartMessage,
  'instrumentCount' | 'updatesPerBatch' | 'batchIntervalMs'
>;
