import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { instantiate } from "@assemblyscript/loader";
import type { GeneratedUpdate, GeneratorWasmExports } from "../src/types.ts";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("AssemblyScript generator wasm", () => {
  let wasmModule: WebAssembly.Module;
  let generator: GeneratorWasmExports;

  function generate(updatesCount: number): string {
    return generator.__getString(
      generator.generate(updatesCount),
    );
  }

  beforeAll(async () => {
    const wasmFile = await readFile(
      resolve(process.cwd(), "public", "release.wasm"),
    );
    const wasmBytes = new Uint8Array(new ArrayBuffer(wasmFile.byteLength));
    wasmBytes.set(wasmFile);
    wasmModule = await WebAssembly.compile(wasmBytes);
  });

  beforeEach(async () => {
    const { exports } = await instantiate<GeneratorWasmExports>(wasmModule);

    generator = exports;
  });

  it("aborts when generating before initialization", () => {
    expect(() => generate(1)).toThrow(
      "Instruments have not been initialized. Call reset() first.",
    );
  });

  it("aborts when initializing with fewer than one instrument", () => {
    expect(() => generator.reset(0)).toThrow(
      "Invalid number of instruments. Must be between 1 and 50.",
    );
  });

  it("aborts when initializing with more than 50 instruments", () => {
    expect(() => generator.reset(51)).toThrow(
      "Invalid number of instruments. Must be between 1 and 50.",
    );
  });

  it("aborts when generating fewer than one update", () => {
    expect(() => generate(0)).toThrow(
      "Invalid number of updates. Must be between 1 and 10000.",
    );
  });

  it("aborts when generating more than 10,000 updates", () => {
    expect(() => generate(10001)).toThrow(
      "Invalid number of updates. Must be between 1 and 10000.",
    );
  });

  it("initializes instruments and generates valid updates", () => {
    generator.reset(1);

    const updates: GeneratedUpdate[] = JSON.parse(generate(5));

    expect(updates).toHaveLength(5);
    for (const update of updates) {
      expect(update.instrument).toBe("AAPL");
      expect(Number.isInteger(update.priceCents)).toBe(true);
      expect(Number.isInteger(update.bidCents)).toBe(true);
      expect(Number.isInteger(update.askCents)).toBe(true);
      expect(update.bidCents).toBeLessThan(update.askCents);
      expect([update.bidCents, update.askCents]).toContain(update.priceCents);
      expect(update.tradeQuantity).toBeGreaterThanOrEqual(1);
      expect(update.tradeQuantity).toBeLessThanOrEqual(100);
      expect(update.bidQuantity).toBeGreaterThanOrEqual(10);
      expect(update.bidQuantity).toBeLessThanOrEqual(500);
      expect(update.askQuantity).toBeGreaterThanOrEqual(10);
      expect(update.askQuantity).toBeLessThanOrEqual(500);
    }
  });

  it("changes generated data on a subsequent call", () => {
    generator.reset(1);

    const firstGeneration = generate(100);
    const secondGeneration = generate(100);

    expect(secondGeneration).not.toBe(firstGeneration);
  });

  it("resets instruments after generating updates", () => {
    generator.reset(1);
    generate(5);

    generator.reset(2);
    const updates: GeneratedUpdate[] = JSON.parse(generate(5));

    expect(updates).toHaveLength(5);
    expect(updates.every(({ instrument }) => ["AAPL", "GOOG"].includes(instrument))).toBe(true);
  });

  it("quotes the price from before the current generate call", () => {
    generator.reset(1);

    const [previousUpdate]: GeneratedUpdate[] = JSON.parse(generate(1));
    const [currentUpdate]: GeneratedUpdate[] = JSON.parse(generate(1));

    expect(currentUpdate.bidCents).toBeLessThanOrEqual(previousUpdate.priceCents);
    expect(previousUpdate.priceCents).toBeLessThanOrEqual(currentUpdate.askCents);
  });
});
