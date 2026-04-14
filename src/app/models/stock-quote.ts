export interface StockQuote {
  source: 'provider' | 'simulated';
  symbol: string;
  name: string;
  current: number;
  dayHigh: number | null;
  dayLow: number | null;
  week52High: number | null;
  week52Low: number | null;
  previousClose: number;
}
