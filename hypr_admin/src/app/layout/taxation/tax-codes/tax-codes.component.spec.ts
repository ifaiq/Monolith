import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxCodesComponent } from './tax-codes.component';

describe('TaxCodesComponent', () => {
  let component: TaxCodesComponent;
  let fixture: ComponentFixture<TaxCodesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaxCodesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxCodesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
