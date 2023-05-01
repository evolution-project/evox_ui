import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppSendMessageModalComponent } from './app-send-message-modal.component';

describe('AppSendMessageModalComponent', () => {
  let component: AppSendMessageModalComponent;
  let fixture: ComponentFixture<AppSendMessageModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppSendMessageModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppSendMessageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
