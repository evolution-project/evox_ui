import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { PriceComponent } from './price.component';

describe('PriceComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        PriceComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(PriceComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'widget'`, () => {
    const fixture = TestBed.createComponent(PriceComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('widget');
  });

  it('should render title in a h1 tag', () => {
    const fixture = TestBed.createComponent(PriceComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain('Welcome to widget!');
  });
});
