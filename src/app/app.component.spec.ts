import { TestBed } from '@angular/core/testing';
import { NEVER } from 'rxjs';
import { AppComponent } from './app.component';
import { StockFeedService } from './services/stock-feed.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        {
          provide: StockFeedService,
          useValue: {
            connect: (): void => undefined,
            stop: (): void => undefined,
            quotes$: NEVER,
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render header', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Stock feed dashboard');
  });
});
