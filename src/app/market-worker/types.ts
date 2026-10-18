import type { GeneratedUpdate } from '../../types';

export interface IMarketGenerator {
  init(instrumentCount: number): void;
  generateUpdates(batchSize: number): GeneratedUpdate[];
}

export interface InstrumentAccumulator {
  totalVolume: number;
  totalVolumePrice: number;
}

export interface InstrumentSummary {
  lastPriceCents: number;
  bidAskSpreadCents: number;
  tradingVolume: number;
  vwapCents: number | 'unknown';
  orderBookImbalance: number | 'unknown';
}

export type GeneratorFactory = () => Promise<IMarketGenerator>;

export interface WasmGeneratorExports extends WebAssembly.Exports {
  __getString(pointer: number): string;
  reset(instrumentCount: number): void;
  generate(batchSize: number): number;
}

export type StartMessage = {
  type: 'START';
  runId: number;
  instrumentCount: number;
  updatesPerBatch: number;
  batchIntervalMs: number;
};

export type WorkerCommand =
  StartMessage | { type: 'PAUSE' } | { type: 'RESUME' } | { type: 'RESET' };

export type WorkerResponse =
  | {
      type: 'BATCH_UPDATE';
      runId: number;
      instrumentsSummary: ReadonlyMap<string, InstrumentSummary>;
    }
  | { type: 'WORKER_STATUS'; runId: number; status: 'RUNNING' | 'PAUSED' }
  | { type: 'ERROR'; runId: number; message: string };

export type RunSettings = Pick<
  StartMessage,
  'instrumentCount' | 'updatesPerBatch' | 'batchIntervalMs'
>;
