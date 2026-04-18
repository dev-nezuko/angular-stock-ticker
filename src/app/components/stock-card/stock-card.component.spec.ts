import { TestBed } from '@angular/core/testing';
import { StockCardComponent } from './stock-card.component';
import { StockQuote } from '../../models/stock-quote';

describe('StockCardComponent data provenance', () => {
  it('labels simulated data and freezes a paused card until resumed', () => {
    const fixture = TestBed.createComponent(StockCardComponent);
    const quote: StockQuote = { source: 'simulated', symbol: 'AAPL', name: 'Apple', current: 100, previousClose: 99, dayHigh: 101, dayLow: 98, week52High: 120, week52Low: 80 };
    fixture.componentRef.setInput('quote', quote);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Simulated · demo data');
    fixture.componentInstance.toggle();
    fixture.componentRef.setInput('quote', { ...quote, current: 110 });
    fixture.detectChanges();
    expect(fixture.componentInstance.display()?.current).toBe(100);
    expect(fixture.nativeElement.textContent).toContain('Paused');
    fixture.componentInstance.toggle();
    fixture.detectChanges();
    expect(fixture.componentInstance.display()?.current).toBe(110);
  });
  it('shows missing provider ranges as unavailable', () => {
    const fixture = TestBed.createComponent(StockCardComponent);
    fixture.componentRef.setInput('quote', { source: 'provider', symbol: 'AAPL', name: 'Apple', current: 100, previousClose: 99, dayHigh: null, dayLow: null, week52High: null, week52Low: null });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Provider quote');
    expect(fixture.nativeElement.querySelectorAll('.card__stat-value')[0].textContent).toContain('Unavailable');
  });
});
