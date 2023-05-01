import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ACSComponent } from './acs.component';

describe('ACSComponent', () => {
  let component: ACSComponent;
  let fixture: ComponentFixture<ACSComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ACSComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ACSComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
