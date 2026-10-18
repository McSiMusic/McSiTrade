# McSiTrade

McSiTrade is a small real-time market dashboard. An AssemblyScript WebAssembly
module generates simulated trades in a Web Worker, and an Angular application
displays the resulting market data.

**Live demo:** [https://mcsimusic.github.io/McSiTrade/](https://mcsimusic.github.io/McSiTrade/)

## Architecture

```text
Angular pages
    ↕
MarketDataService
    ↕
MarketWorkerAdapter ── Web Worker
                           ├── MarketWorkerController
                           ├── WasmMarketGenerator ── AssemblyScript WASM
                           └── InstrumentsSummaryCalculator
```

- **Angular** provides the dashboard and settings pages. `MarketDataService`
  owns the application state, starts and resets runs, and exposes signals to
  the UI. `MarketWorkerAdapter` encapsulates the Worker and its RxJS message
  streams. Batch updates are throttled before they reach the UI.
- **Web Worker** keeps market generation and summary calculations off the UI
  thread. `MarketWorkerController` handles start, pause, resume, reset, and
  errors. It loads the WASM generator once, then reinitializes it when a new run
  starts.
- **AssemblyScript / WebAssembly** generates batches of simulated market
  updates. Each update represents a trade and a bid/ask snapshot. Generator
  randomness and price evolution run in WASM; instrument prices are maintained
  between calls, and generated prices stay at or above $10.
- **Summary calculation** happens in the Worker. It accumulates trade volume
  and VWAP for each instrument for the current run and retains only each
  instrument's latest summary, not the complete trade history.

## Pages

### Dashboard

The dashboard displays one row for each instrument received from the Worker:

- Last traded price
- Bid-ask spread
- Cumulative trading volume
- Cumulative volume-weighted average price (VWAP)
- Latest order-book imbalance

Prices are generated and calculated in integer cents, then formatted as USD
for display. Imbalance is shown as a signed value between -1 and +1. The page
also shows producer status, reports initialization errors, and provides a
Pause/Resume control. Pausing stops generation; resuming continues the current
run without resetting its totals.

### Settings

The settings page lets you configure the next run:

| Setting | Default | Allowed range |
| --- | ---: | ---: |
| Instrument count | 5 | 1–50 |
| Updates per batch | 100 | 1–1,000 |
| Batch interval | 500 ms | 50–2,000 ms |

Settings are validated as integers and are applied only when the form is
submitted. Applying settings starts a new run, clears the previous run's
summaries and totals, and navigates back to the dashboard.

## Requirements

- Node.js 22.22.3 or a compatible version supported by Angular CLI 22
- npm

## Run locally

Install dependencies and compile the WASM module:

```bash
npm ci
npm run build:wasm
```

Start the Angular development server:

```bash
npm start
```

Open [http://localhost:4200/](http://localhost:4200/) in a browser.

## Build

Build the optimized AssemblyScript WebAssembly module and the Angular
application:

```bash
npm run build:wasm
npm run build
```

Angular build output is written to `dist/mcsitrade/browser`.

## Tests

The default Angular test configuration includes both the application unit
tests and `test/generator.spec.ts`. Build the WASM module before running the
full suite:

```bash
npm run build:wasm
npm test -- --watch=false
```

To build the WASM module and run only its generator tests:

```bash
npm run test:generator
```

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds the WASM
module, runs the test suite, builds the Angular app with the repository's
GitHub Pages base path, and deploys it to GitHub Pages when changes are pushed
to `main`.
