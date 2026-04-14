import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { StockQuote } from '../models/stock-quote';
import { STOCKS } from '../stocks';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

@Injectable({ providedIn: 'root' })
export class StockFeedService {
  private readonly quotes = new Subject<StockQuote>();
  private ws: WebSocket | null = null;
  private reconnect: ReturnType<typeof setTimeout> | null = null;
  private mockTimer: ReturnType<typeof setInterval> | null = null;
  private mockPrice = new Map<string, number>();
  private stopped = false;

  readonly quotes$: Observable<StockQuote> = this.quotes.asObservable();

  connect(): void {
    this.stop();
    this.stopped = false;
    if (environment.useMock) {
      for (const s of STOCKS) this.mockPrice.set(s.symbol, s.base);
      this.mockTimer = setInterval(() => this.emitMock(), 2000);
      this.emitMock();
      return;
    }
    this.socket();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnect) clearTimeout(this.reconnect);
    this.reconnect = null;
    if (this.mockTimer) clearInterval(this.mockTimer);
    this.mockTimer = null;
    this.ws?.close();
    this.ws = null;
  }

  private socket(): void {
    try {
      this.ws = new WebSocket(environment.wsUrl);
    } catch {
      this.reconnect = setTimeout(() => this.socket(), 3000);
      return;
    }
    this.ws.onopen = () => {
      if (this.reconnect) clearTimeout(this.reconnect);
      this.reconnect = null;
    };
    this.ws.onmessage = (ev) => {
      try {
        const q = JSON.parse(String(ev.data)) as StockQuote;
        if (q?.symbol) this.quotes.next(q);
      } catch {
        /* ignore */
      }
    };
    this.ws.onclose = () => {
      this.ws = null;
      if (!this.stopped && !environment.useMock) {
        this.reconnect = setTimeout(() => this.socket(), 3000);
      }
    };
    this.ws.onerror = () => this.ws?.close();
  }

  private emitMock(): void {
    for (const s of STOCKS) {
      const prev = this.mockPrice.get(s.symbol) ?? s.base;
      const cur = Math.max(1, prev + (Math.random() - 0.5) * prev * 0.004);
      this.mockPrice.set(s.symbol, cur);
      const w = 0.012 * cur;
      this.quotes.next({
        source: 'simulated',
        symbol: s.symbol,
        name: s.name,
        current: round2(cur),
        dayHigh: round2(cur + w * Math.random()),
        dayLow: round2(cur - w * Math.random()),
        week52High: round2(s.base * 1.25),
        week52Low: round2(s.base * 0.72),
        previousClose: round2(prev),
      });
    }
  }
}
