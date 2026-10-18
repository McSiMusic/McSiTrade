import { instantiateStreaming } from '@assemblyscript/loader';
import type { GeneratedUpdate } from '../../types';
import type { GeneratorFactory, IMarketGenerator, WasmGeneratorExports } from './types';

export class WasmMarketGenerator implements IMarketGenerator {
  private constructor(private readonly wasmExports: WasmGeneratorExports) {}

  static async load(wasmUrl: string): Promise<WasmMarketGenerator> {
    const { exports } = await instantiateStreaming(fetch(wasmUrl));

    return new WasmMarketGenerator(
      exports as typeof exports & WasmGeneratorExports,
    );
  }

  init(instrumentCount: number): void {
    this.wasmExports.reset(instrumentCount);
  }

  generateUpdates(batchSize: number): GeneratedUpdate[] {
    const pointer = this.wasmExports.generate(batchSize);
    return JSON.parse(this.wasmExports.__getString(pointer)) as GeneratedUpdate[];
  }
}

export function createWasmGeneratorFactory(wasmUrl: string = 'release.wasm'): GeneratorFactory {
  let instancePromise: Promise<IMarketGenerator> | null = null;

  return () => {
    if (!instancePromise) {
      instancePromise = WasmMarketGenerator.load(wasmUrl);
    }
    return instancePromise;
  };
}
