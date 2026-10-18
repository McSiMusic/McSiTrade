import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketDataService } from './market-data.service';
import type { WorkerCommand, WorkerResponse } from '../market-worker/types';

describe('MarketDataService', () => {
  let service: MarketDataService;
  let messageListener:
    | ((event: MessageEvent<WorkerResponse>) => void)
    | undefined;
  let postMessageSpy: ReturnType<typeof vi.fn<(message: WorkerCommand) => void>>;
  let terminateSpy: ReturnType<typeof vi.fn<() => void>>;
  let removeEventListenerSpy: ReturnType<typeof vi.fn>;
  let lifecycleEvents: string[];

  beforeEach(() => {
    messageListener = undefined;
    postMessageSpy = vi.fn<(message: WorkerCommand) => void>();
    lifecycleEvents = [];
    terminateSpy = vi.fn<() => void>(() => lifecycleEvents.push('terminate'));
    removeEventListenerSpy = vi.fn(() => lifecycleEvents.push('remove listener'));
    vi.stubGlobal(
      'Worker',
      class {
        addEventListener(
          _type: string,
          listener: EventListenerOrEventListenerObject,
        ) {
          messageListener = (event) => {
            if (typeof listener === 'function') {
              listener(event);
            } else {
              listener.handleEvent(event);
            }
          };
        }

        removeEventListener = removeEventListenerSpy;
        postMessage = postMessageSpy;
        terminate = terminateSpy;
      },
    );
    TestBed.configureTestingModule({});
    service = TestBed.inject(MarketDataService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.instruments()).toEqual([]);
    expect(service.isRunning()).toBe(false);
    expect(postMessageSpy).not.toHaveBeenCalled();
  });

  it('starts the default run once when requested by the application', () => {
    service.start();
    service.start();

    expect(postMessageSpy).toHaveBeenCalledOnce();
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: 'START',
      runId: 1,
      instrumentCount: 5,
      updatesPerBatch: 100,
      batchIntervalMs: 500,
    });
  });

  it('throttles market data updates to one emission per second and keeps the latest values', () => {
    vi.useFakeTimers();
    expect(messageListener).toBeTypeOf('function');
    const sendResponse = (response: WorkerResponse) => {
      messageListener?.(
        new MessageEvent<WorkerResponse>('message', { data: response }),
      );
    };

    service.toggleRun();
    sendResponse({ type: 'WORKER_STATUS', runId: 1, status: 'RUNNING' });
    sendResponse({
      type: 'BATCH_UPDATE',
      runId: 1,
      instrumentsSummary: new Map([['AAPL', summary(1)]]),
    });
    expect(service.summaries().get('AAPL')?.tradingVolume).toBe(1);
    expect(service.instruments()).toEqual(['AAPL']);

    vi.advanceTimersByTime(100);
    sendResponse({
      type: 'BATCH_UPDATE',
      runId: 1,
      instrumentsSummary: new Map([['AAPL', summary(2)]]),
    });

    vi.advanceTimersByTime(899);
    expect(service.summaries().get('AAPL')?.tradingVolume).toBe(1);

    vi.advanceTimersByTime(1);
    expect(service.summaries().get('AAPL')?.tradingVolume).toBe(2);
  });

  it('refreshes instruments when a same-sized instrument set changes', () => {
    vi.useFakeTimers();
    service.toggleRun();
    const sendBatch = (instrumentsSummary: Map<string, ReturnType<typeof summary>>) => {
      messageListener?.(
        new MessageEvent<WorkerResponse>('message', {
          data: {
            type: 'BATCH_UPDATE',
            runId: 1,
            instrumentsSummary,
          },
        }),
      );
    };

    sendBatch(new Map([['AAPL', summary(1)]]));
    const firstInstruments = service.instruments();
    vi.advanceTimersByTime(1001);
    sendBatch(new Map([['MSFT', summary(2)]]));

    expect(service.instruments()).toEqual(['MSFT']);
    expect(service.instruments()).not.toBe(firstInstruments);
  });

  it('ignores batches and status messages from an outdated run', () => {
    service.toggleRun();
    service.applySettings({
      instrumentCount: 2,
      updatesPerBatch: 10,
      batchIntervalMs: 250,
    });
    messageListener?.(
      new MessageEvent<WorkerResponse>('message', {
        data: {
          type: 'BATCH_UPDATE',
          runId: 1,
          instrumentsSummary: new Map(),
        },
      }),
    );
    messageListener?.(
      new MessageEvent<WorkerResponse>('message', {
        data: { type: 'WORKER_STATUS', runId: 1, status: 'RUNNING' },
      }),
    );

    expect(service.isRunning()).toBe(false);
    expect(service.instruments()).toEqual([]);
  });

  it('toggles the run and starts a new run when settings are applied', () => {
    const sendResponse = (response: WorkerResponse) => {
      messageListener?.(new MessageEvent<WorkerResponse>('message', { data: response }));
    };

    service.toggleRun();
    expect(postMessageSpy).toHaveBeenLastCalledWith({
      type: 'START',
      runId: 1,
      ...service.settings(),
    });
    sendResponse({ type: 'WORKER_STATUS', runId: 1, status: 'RUNNING' });
    expect(service.isRunning()).toBe(true);

    service.toggleRun();
    expect(postMessageSpy).toHaveBeenLastCalledWith({ type: 'PAUSE' });
    sendResponse({ type: 'WORKER_STATUS', runId: 1, status: 'PAUSED' });
    service.toggleRun();
    expect(postMessageSpy).toHaveBeenLastCalledWith({ type: 'RESUME' });

    service.applySettings({
      instrumentCount: 2,
      updatesPerBatch: 10,
      batchIntervalMs: 250,
    });

    expect(service.settings()).toEqual({
      instrumentCount: 2,
      updatesPerBatch: 10,
      batchIntervalMs: 250,
    });
    expect(service.instruments()).toEqual([]);
    expect(postMessageSpy).toHaveBeenLastCalledWith({
      type: 'START',
      runId: 2,
      instrumentCount: 2,
      updatesPerBatch: 10,
      batchIntervalMs: 250,
    });
  });

  it('terminates the worker when the service is destroyed', () => {
    TestBed.resetTestingModule();
    expect(terminateSpy).toHaveBeenCalledOnce();
    expect(removeEventListenerSpy).toHaveBeenCalledOnce();
    expect(lifecycleEvents).toEqual(['remove listener', 'terminate']);
  });
});

function summary(tradingVolume: number) {
  return {
    lastPriceCents: 10_000,
    bidAskSpreadCents: 10,
    tradingVolume,
    vwapCents: 10_000,
    orderBookImbalance: 0,
  };
}
