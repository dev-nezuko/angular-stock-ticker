import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StockCardComponent } from './components/stock-card/stock-card.component';
import { StockQuote } from './models/stock-quote';
import { StockFeedService } from './services/stock-feed.service';
import { STOCKS } from './stocks';

@Component({
  selector: 'app-root',
  imports: [StockCardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  private readonly feed = inject(StockFeedService);

  protected readonly stocks = STOCKS;
  protected readonly quotes = signal<Record<string, StockQuote>>({});

  constructor() {
    inject(DestroyRef).onDestroy(() => this.feed.stop());
    this.feed.quotes$.pipe(takeUntilDestroyed()).subscribe((q) => {
      this.quotes.update((m) => ({ ...m, [q.symbol]: q }));
    });
    this.feed.connect();
  }
}
