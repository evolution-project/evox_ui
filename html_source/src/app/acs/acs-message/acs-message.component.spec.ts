import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AcsMessageComponent } from './acs-message.component';

describe('AcsMessageComponent', () => {
  let component: AcsMessageComponent;
  let fixture: ComponentFixture<AcsMessageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AcsMessageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcsMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
