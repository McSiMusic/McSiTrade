/// <reference lib="webworker" />

import { MarketWorkerController } from './market-worker-controller';
import type { WorkerCommand } from './types';

const controller = new MarketWorkerController((message) => postMessage(message));

addEventListener('message', ({ data }: MessageEvent<WorkerCommand>) => {
  void controller.handleMessage(data);
});
