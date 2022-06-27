import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MuscleWidgetComponent } from './muscle-widget.component';

describe('MuscleWidgetComponent', () => {
  let component: MuscleWidgetComponent;
  let fixture: ComponentFixture<MuscleWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MuscleWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MuscleWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
