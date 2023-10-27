import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxGroupsComponent } from './tax-groups.component';

describe('TaxGroupsComponent', () => {
  let component: TaxGroupsComponent;
  let fixture: ComponentFixture<TaxGroupsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TaxGroupsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TaxGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
