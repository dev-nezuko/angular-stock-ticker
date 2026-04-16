import { DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, effect, input, signal } from '@angular/core';
import { StockQuote } from '../../models/stock-quote';

type Trend = 'up' | 'down' | 'flat';

function trendFor(q: StockQuote, last: number | null): Trend {
  const vsClose =
    q.current > q.previousClose ? 'up' : q.current < q.previousClose ? 'down' : 'flat';
  if (last == null) return vsClose;
  if (q.current !== last) return q.current > last ? 'up' : 'down';
  return vsClose;
}

@Component({
  selector: 'app-stock-card',
  imports: [DecimalPipe, NgClass],
  templateUrl: './stock-card.component.html',
  styleUrl: './stock-card.component.scss',
})
export class StockCardComponent {
  quote = input<StockQuote | undefined>();

  enabled = signal(true);
  private frozen = signal<StockQuote | null>(null);
  private last = signal<number | null>(null);
  private trend = signal<Trend>('flat');

  display = computed((): StockQuote | undefined =>
    !this.enabled() && this.frozen() ? this.frozen()! : this.quote(),
  );

  cardClass = computed(() => {
    if (!this.enabled()) return 'card--off';
    const t = this.trend();
    return t === 'up' ? 'card--up' : t === 'down' ? 'card--down' : 'card--flat';
  });

  constructor() {
    effect(() => {
      const q = this.quote();
      if (!q || !this.enabled()) return;
      this.trend.set(trendFor(q, this.last()));
      this.last.set(q.current);
    });
  }

  toggle(): void {
    if (this.enabled()) {
      const q = this.quote();
      if (q) this.frozen.set({ ...q });
      this.enabled.set(false);
    } else {
      this.frozen.set(null);
      this.enabled.set(true);
      this.last.set(null);
    }
  }
}
