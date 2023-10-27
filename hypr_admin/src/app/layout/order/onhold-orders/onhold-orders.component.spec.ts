import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OnHoldOrdersComponent } from './onhold-orders.component';

describe('OnHoldOrdersComponent', () => {
  let component: OnHoldOrdersComponent;
  let fixture: ComponentFixture<OnHoldOrdersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OnHoldOrdersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OnHoldOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
