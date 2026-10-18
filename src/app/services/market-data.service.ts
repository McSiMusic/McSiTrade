import {
  computed,
  DestroyRef,
  Injectable,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { DEFAULT_MARKET_SETTINGS } from '../pages/settings/consts';
import type {
  InstrumentSummary,
  WorkerCommand,
  WorkerResponse,
} from '../market-worker/types';
import { MarketWorkerAdapter } from './market-worker-adapter';

export type MarketSettings = typeof DEFAULT_MARKET_SETTINGS;
export type MarketRunStatus = 'RUNNING' | 'PAUSED';

export interface MarketDataState {
  status: MarketRunStatus;
  error: string | null;
  runId: number;
  settings: MarketSettings;
  instruments: readonly string[];
  instrumentsSummary: ReadonlyMap<string, InstrumentSummary>;
}

const INITIAL_STATE: MarketDataState = {
  status: 'PAUSED',
  error: null,
  runId: 0,
  settings: DEFAULT_MARKET_SETTINGS,
  instruments: [],
  instrumentsSummary: new Map(),
};

type BatchUpdate = Extract<WorkerResponse, { type: 'BATCH_UPDATE' }>;

@Injectable({ providedIn: 'root' })
export class MarketDataService {
  private readonly stateSignal = signal<MarketDataState>(INITIAL_STATE);
  readonly isRunning = computed(
    () => this.stateSignal().status === 'RUNNING',
  );
  readonly errorMessage = computed(() => this.stateSignal().error);
  readonly summaries = computed(() => this.stateSignal().instrumentsSummary);
  readonly instruments = computed(() => this.stateSignal().instruments);
  readonly settings = computed(() => this.stateSignal().settings);
  readonly hasStarted = computed(() => this.stateSignal().runId > 0);

  private readonly workerAdapter = new MarketWorkerAdapter();

  constructor(destroyRef: DestroyRef) {
    const subscriptions = new Subscription();
    subscriptions.add(
      this.workerAdapter.batchUpdates$.subscribe((data) =>
        this.handleBatchUpdate(data),
      ),
    );
    subscriptions.add(
      this.workerAdapter.statusEvents$.subscribe((response) =>
        this.handleMarketDataResponse(response),
      ),
    );
    destroyRef.onDestroy(() => {
      subscriptions.unsubscribe();
      this.workerAdapter.terminate();
    });
  }

  toggleRun(): void {
    const state = this.stateSignal();
    if (state.status === 'RUNNING') {
      this.postCommand({ type: 'PAUSE' });
      return;
    }

    if (!state.runId) {
      this.startRun(state.settings);
      return;
    }

    this.postCommand({ type: 'RESUME' });
  }

  start(): void {
    const state = this.stateSignal();
    if (state.runId === 0) {
      this.startRun(state.settings);
    }
  }

  applySettings(settings: MarketSettings): void {
    this.startRun(settings);
  }

  private startRun(settings: MarketSettings): void {
    const runId = this.stateSignal().runId + 1;
    this.stateSignal.update((state) => ({
      ...state,
      error: null,
      runId,
      settings,
      instruments: [],
      instrumentsSummary: new Map(),
    }));

    this.postCommand({
      type: 'START',
      runId,
      ...settings,
    });
  }

  private handleBatchUpdate(data: BatchUpdate): void {
    if (data.runId !== this.stateSignal().runId) {
      return;
    }

    this.stateSignal.update((state) => ({
      ...state,
      instruments: Array.from(data.instrumentsSummary.keys()),
      instrumentsSummary: data.instrumentsSummary,
    }));
  }

  private handleMarketDataResponse(
    response: Exclude<WorkerResponse, BatchUpdate>,
  ): void {
    if (response.runId !== this.stateSignal().runId) {
      return;
    }

    switch (response.type) {
      case 'WORKER_STATUS':
        this.stateSignal.update((state) => ({
          ...state,
          status: response.status,
        }));
        break;

      case 'ERROR':
        this.stateSignal.update((state) => ({
          ...state,
          status: 'PAUSED',
          error: response.message,
        }));
        break;
    }
  }

  private postCommand(command: WorkerCommand): void {
    this.workerAdapter.postMessage(command);
  }
}
