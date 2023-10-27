import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiApprovalComponent } from './si-approval.component';

describe('SiApprovalComponent', () => {
  let component: SiApprovalComponent;
  let fixture: ComponentFixture<SiApprovalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SiApprovalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SiApprovalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
