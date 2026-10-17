export interface GeneratorWasmExports
  extends Record<string, WebAssembly.ExportValue> {
  memory: WebAssembly.Memory;
  reset(instrumentsCount: number): void;
  generate(updatesCount: number): number;
  __getString(pointer: number): string;
}

export interface GeneratedUpdate {
  instrument: string;
  priceCents: number;
  bidCents: number;
  askCents: number;
  tradeQuantity: number;
  bidQuantity: number;
  askQuantity: number;
}
