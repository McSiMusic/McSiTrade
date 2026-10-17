const MAX_INSTRUMENTS: i32 = 50;
const MAX_UPDATES: i32 = 10000;
const BID_OFFSET: i32 = 100;
const ASK_OFFSET: i32 = 100;
const MAX_BID_ASK_QUANTITY: i32 = 500;
const MIN_BID_ASK_QUANTITY: i32 = 10;
const MAX_TRADE_QUANTITY: i32 = 100;
const PREDEFINED_INSTRUMENT_NAMES: string[] = [
  'AAPL',
  'GOOG',
  'MSFT',
  'AMZN',
  'FB',
  'TSLA',
  'NFLX',
  'NVDA',
  'INTC',
  'AMD',
  'BABA',
  'ORCL',
  'IBM',
  'CSCO',
];

class InstrumentState {
  name: string;
  priceCents: i32;

  constructor(name: string, priceCents: i32) {
    this.name = name;
    this.priceCents = priceCents;
  }
}

let instruments: InstrumentState[] = [];

export function reset(instrumentsCount: i32): void {
  checkInstrumentCount(instrumentsCount);
  instruments = new Array<InstrumentState>(instrumentsCount);

  for (let i = 0; i < instrumentsCount; i++) {
    let name = generateInstrumentName(i);
    let initialPrice = 10000 + i32(Math.random() * 100);
    instruments[i] = new InstrumentState(name, initialPrice);
  }
}

export function generate(updatesCount: i32): string {
  if (updatesCount < 1 || updatesCount > MAX_UPDATES) {
    abort(`Invalid number of updates. Must be between 1 and ${MAX_UPDATES}.`);
  }

  if (instruments.length == 0) {
    abort('Instruments have not been initialized. Call reset() first.');
  }

  let json = '[';

  for (let i = 0; i < updatesCount; i++) {
    let instrumentIndex = i32(Math.floor(Math.random() * instruments.length));
    let currentInstrument = instruments[instrumentIndex];

    let bidOffset = i32(Math.floor(Math.random() * BID_OFFSET)) + 1;
    let askOffset = i32(Math.floor(Math.random() * ASK_OFFSET)) + 1;

    let bidCents = currentInstrument.priceCents - bidOffset;
    let askCents = currentInstrument.priceCents + askOffset;

    let isBuy = Math.random() > 0.5;
    let priceCents = isBuy ? askCents : bidCents;

    currentInstrument.priceCents = priceCents;

    let tradeQuantity = i32(Math.floor(Math.random() * MAX_TRADE_QUANTITY)) + 1;

    let bidQuantity =
      i32(Math.floor(Math.random() * (MAX_BID_ASK_QUANTITY - MIN_BID_ASK_QUANTITY + 1))) +
      MIN_BID_ASK_QUANTITY;
    let askQuantity =
      i32(Math.floor(Math.random() * (MAX_BID_ASK_QUANTITY - MIN_BID_ASK_QUANTITY + 1))) +
      MIN_BID_ASK_QUANTITY;

    json +=
      `{"instrument":"${currentInstrument.name}",` +
      `"priceCents":${currentInstrument.priceCents},` +
      `"bidCents":${bidCents},` +
      `"askCents":${askCents},` +
      `"tradeQuantity":${tradeQuantity},` +
      `"bidQuantity":${bidQuantity},` +
      `"askQuantity":${askQuantity}}`;

    if (i < updatesCount - 1) {
      json += ',';
    }
  }

  json += ']';
  return json;
}

function checkInstrumentCount(instrumentsCount: i32): void {
  if (instrumentsCount < 1 || instrumentsCount > MAX_INSTRUMENTS) {
    abort(`Invalid number of instruments. Must be between 1 and ${MAX_INSTRUMENTS}.`);
  }
}

function generateInstrumentName(index: i32): string {
  if (index < PREDEFINED_INSTRUMENT_NAMES.length) {
    return PREDEFINED_INSTRUMENT_NAMES[index];
  }

  return `INST_${index - PREDEFINED_INSTRUMENT_NAMES.length + 1}`;
}
