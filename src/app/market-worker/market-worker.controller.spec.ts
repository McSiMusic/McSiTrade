import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarketWorkerController } from './market-worker-controller';
import type {
  GeneratorFactory,
  IMarketGenerator,
  WorkerCommand,
  WorkerResponse,
} from './types';
import type { GeneratedUpdate } from '../../types';

const TEST_UPDATES: GeneratedUpdate[] = [
  {
    instrument: 'ALFA',
    priceCents: 10000,
    bidCents: 9990,
    askCents: 10010,
    tradeQuantity: 5,
    bidQuantity: 20,
    askQuantity: 25,
  },
];

const createStartMessage = (
  runId: number,
  options: Partial<{
    instrumentCount: number;
    updatesPerBatch: number;
    batchIntervalMs: number;
  }> = {},
): WorkerCommand => ({
  type: 'START',
  runId,
  instrumentCount: options.instrumentCount ?? 3,
  updatesPerBatch: options.updatesPerBatch ?? 2,
  batchIntervalMs: options.batchIntervalMs ?? 100,
});


describe('MarketWorkerController', () => {
  let controller: MarketWorkerController;
  let generator: IMarketGenerator;

  let initSpy: ReturnType<typeof vi.fn<(instrumentCount: number) => void>>;
  let generateUpdatesSpy: ReturnType<
    typeof vi.fn<(batchSize: number) => GeneratedUpdate[]>
  >;
  let emitMessageFn: ReturnType<
    typeof vi.fn<(message: WorkerResponse) => void>
  >;
  let generatorFactory: ReturnType<typeof vi.fn<GeneratorFactory>>;

  beforeEach(() => {
    vi.useFakeTimers();

    initSpy = vi.fn<(instrumentCount: number) => void>();
    generateUpdatesSpy = vi.fn(
      (_batchSize: number): GeneratedUpdate[] => TEST_UPDATES,
    );
    generator = {
      init: initSpy,
      generateUpdates: generateUpdatesSpy,
    };
    emitMessageFn = vi.fn<(message: WorkerResponse) => void>();
    generatorFactory = vi.fn<GeneratorFactory>().mockResolvedValue(generator);
    controller = new MarketWorkerController(emitMessageFn, generatorFactory);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('creates and initializes a generator and starts an interval on START', async () => {
    await controller.handleMessage(createStartMessage(7, { instrumentCount: 12 }));

    expect(generatorFactory).toHaveBeenCalledOnce();
    expect(initSpy).toHaveBeenCalledOnce();
    expect(initSpy).toHaveBeenCalledWith(12);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('generates and emits updates on every interval tick', async () => {
    await controller.handleMessage(
      createStartMessage(8, { updatesPerBatch: 4, batchIntervalMs: 250 }),
    );

    await vi.advanceTimersByTimeAsync(250);

    expect(generateUpdatesSpy).toHaveBeenCalledOnce();
    expect(generateUpdatesSpy).toHaveBeenCalledWith(4);
    expect(emitMessageFn).toHaveBeenCalledWith({
      type: 'BATCH_UPDATE',
      runId: 8,
      updates: TEST_UPDATES,
    });
  });

  it('reinitializes the generator when a new START arrives with new settings', async () => {
    await controller.handleMessage(createStartMessage(1, { instrumentCount: 2 }));
    await controller.handleMessage(createStartMessage(2, { instrumentCount: 9 }));

    expect(generatorFactory).toHaveBeenCalledOnce();
    expect(initSpy.mock.calls).toEqual([[2], [9]]);
    expect(vi.getTimerCount()).toBe(1);
  });


  it('PAUSE stops interval ticks and RESUME continues with the same settings', async () => {
    await controller.handleMessage(
      createStartMessage(4, { updatesPerBatch: 7, batchIntervalMs: 100 }),
    );
    await vi.advanceTimersByTimeAsync(100);
    emitMessageFn.mockClear();

    await controller.handleMessage({ type: 'PAUSE' });
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(500);
    expect(emitMessageFn).not.toHaveBeenCalled();

    await controller.handleMessage({ type: 'RESUME' });
    await vi.advanceTimersByTimeAsync(100);

    expect(generateUpdatesSpy).toHaveBeenCalledTimes(2);
    expect(generateUpdatesSpy).toHaveBeenLastCalledWith(7);
    expect(initSpy).toHaveBeenCalledOnce();
    expect(emitMessageFn).toHaveBeenCalledWith({
      type: 'BATCH_UPDATE',
      runId: 4,
      updates: TEST_UPDATES,
    });
  });

  it('does nothing when RESUME arrives before START', async () => {
    await expect(
      controller.handleMessage({ type: 'RESUME' }),
    ).resolves.toBeUndefined();

    expect(generatorFactory).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(emitMessageFn).not.toHaveBeenCalled();
  });

  it('RESET stops ticks and prevents a later RESUME from restarting the run', async () => {
    await controller.handleMessage(createStartMessage(5));
    await controller.handleMessage({ type: 'RESET' });
    await controller.handleMessage({ type: 'RESUME' });
    await vi.advanceTimersByTimeAsync(1000);

    expect(vi.getTimerCount()).toBe(0);
    expect(generatorFactory).toHaveBeenCalledOnce();
    expect(generateUpdatesSpy).not.toHaveBeenCalled();
    expect(emitMessageFn).not.toHaveBeenCalled();
  });

  it('reuses the existing generator after RESET and initializes it for the new run', async () => {
    await controller.handleMessage(createStartMessage(5));
    await controller.handleMessage({ type: 'RESET' });
    await controller.handleMessage(createStartMessage(6, { instrumentCount: 8 }));

    expect(generatorFactory).toHaveBeenCalledOnce();
    expect(initSpy.mock.calls).toEqual([[3], [8]]);
    expect(vi.getTimerCount()).toBe(1);
  });

  it('emits an ERROR with the current runId when the factory rejects', async () => {
    generatorFactory.mockRejectedValueOnce(new Error('WASM Fetch Failed'));

    await controller.handleMessage(createStartMessage(6));

    expect(vi.getTimerCount()).toBe(0);
    expect(emitMessageFn).toHaveBeenCalledWith({
      type: 'ERROR',
      runId: 6,
      message: 'WASM Fetch Failed',
    });
  });

  it('emits an ERROR and does not start a timer when generator initialization throws', async () => {
    initSpy.mockImplementation(() => {
      throw new Error('Generator initialization failed');
    });

    await controller.handleMessage(createStartMessage(9));

    expect(vi.getTimerCount()).toBe(0);
    expect(emitMessageFn).toHaveBeenCalledWith({
      type: 'ERROR',
      runId: 9,
      message: 'Generator initialization failed',
    });
  });

  it('stops the interval and emits an ERROR when generation throws', async () => {
    generateUpdatesSpy.mockImplementation(() => {
      throw new Error('Generation failed');
    });
    await controller.handleMessage(createStartMessage(7));

    await vi.advanceTimersByTimeAsync(100);

    expect(vi.getTimerCount()).toBe(0);
    expect(emitMessageFn).toHaveBeenCalledWith({
      type: 'ERROR',
      runId: 7,
      message: 'Generation failed',
    });
  });
});
