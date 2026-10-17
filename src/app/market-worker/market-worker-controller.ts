import { InstrumentsSummaryCalculator } from './instruments-summary-calculator';
import { createWasmGeneratorFactory } from './wasm-market-generator-factory';
import type {
  GeneratorFactory,
  IMarketGenerator,
  RunSettings,
  WorkerCommand,
  WorkerResponse,
} from './types';

export class MarketWorkerController {
  private currentRunId = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private generator: IMarketGenerator | null = null;
  private runSettings: RunSettings | null = null;
  private readonly summaryCalculator = new InstrumentsSummaryCalculator();
  private paused = true;
  private operationId = 0;

  constructor(
    private readonly emitMessageFn: (message: WorkerResponse) => void,
    private readonly generatorFactory: GeneratorFactory =
      createWasmGeneratorFactory(),
  ) {}

  async handleMessage(message: WorkerCommand): Promise<void> {
    switch (message.type) {
      case 'START':
        this.stopTimer();
        this.currentRunId = message.runId;
        this.runSettings = {
          instrumentCount: message.instrumentCount,
          updatesPerBatch: message.updatesPerBatch,
          batchIntervalMs: message.batchIntervalMs,
        };
        this.summaryCalculator.reset();
        this.paused = false;
        await this.startRun(++this.operationId, true);
        break;

      case 'PAUSE':
        this.paused = true;
        this.operationId++;
        this.stopTimer();
        break;

      case 'RESUME':
        if (this.runSettings !== null) {
          this.paused = false;
          await this.startRun(++this.operationId, false);
        }
        break;

      case 'RESET':
        this.paused = true;
        this.operationId++;
        this.stopTimer();
        this.currentRunId = 0;
        this.runSettings = null;
        this.summaryCalculator.reset();
        break;
    }
  }

  private async startRun(
    operationId: number,
    initializeGenerator: boolean,
  ): Promise<void> {
    try {
      const isStartRestricted = () => operationId !== this.operationId || this.paused || this.runSettings === null;
      if (isStartRestricted()) return;

      const generator = this.generator ?? (await this.generatorFactory());
      this.generator ??= generator;

      if (isStartRestricted()) return;

      if (initializeGenerator) {
        generator.init(this.runSettings!.instrumentCount);
      }

      this.startTimer(generator, this.runSettings!);
    } catch (error) {
      if (operationId === this.operationId) {
        this.stopTimer();
        this.emitError(error);
      }
    }
  }

  private startTimer(
    generator: IMarketGenerator,
    settings: RunSettings,
  ): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      try {
        const generatedUpdates = generator.generateUpdates(
          settings.updatesPerBatch,
        );
        const instrumentsSummary =
          this.summaryCalculator.calculate(generatedUpdates);

        this.emitMessageFn({
          type: 'BATCH_UPDATE',
          runId: this.currentRunId,
          instrumentsSummary,
        });
      } catch (error) {
        this.stopTimer();
        this.emitError(error);
      }
    }, settings.batchIntervalMs);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private emitError(error: unknown): void {
    this.emitMessageFn({
      type: 'ERROR',
      runId: this.currentRunId,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
