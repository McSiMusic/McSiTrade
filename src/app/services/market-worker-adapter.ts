import {
  asyncScheduler,
  filter,
  fromEvent,
  map,
  share,
  throttleTime,
  type Observable,
} from 'rxjs';
import { MARKET_UI_UPDATE_INTERVAL_MS } from '../pages/settings/consts';
import type { WorkerCommand, WorkerResponse } from '../market-worker/types';

type BatchUpdate = Extract<WorkerResponse, { type: 'BATCH_UPDATE' }>;
type StatusEvent = Exclude<WorkerResponse, BatchUpdate>;

export class MarketWorkerAdapter {
  private readonly worker: Worker;
  readonly batchUpdates$: Observable<BatchUpdate>;
  readonly statusEvents$: Observable<StatusEvent>;

  constructor() {
    this.worker = new Worker(
      new URL('../market-worker/market.worker', import.meta.url),
      { type: 'module' },
    );
    const workerMessages$ = fromEvent<MessageEvent<WorkerResponse>>(
      this.worker,
      'message',
    ).pipe(
      filter((event) => event.data !== undefined),
      share(),
    );

    this.batchUpdates$ = workerMessages$.pipe(
      filter((event): event is MessageEvent<BatchUpdate> => {
        return event.data.type === 'BATCH_UPDATE';
      }),
      throttleTime(MARKET_UI_UPDATE_INTERVAL_MS, asyncScheduler, {
        leading: true,
        trailing: true,
      }),
      map(({ data }) => data),
    );
    this.statusEvents$ = workerMessages$.pipe(
      filter(
        (event): event is MessageEvent<StatusEvent> =>
          event.data.type !== 'BATCH_UPDATE',
      ),
      map(({ data }) => data),
    );
  }

  postMessage(command: WorkerCommand): void {
    this.worker.postMessage(command);
  }

  terminate(): void {
    this.worker.terminate();
  }
}
