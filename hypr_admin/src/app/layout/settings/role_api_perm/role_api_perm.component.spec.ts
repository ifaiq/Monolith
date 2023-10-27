import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RolePermComponent } from './role_api_perm.component';

describe('RolePermComponent', () => {
  let component: RolePermComponent;
  let fixture: ComponentFixture<RolePermComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RolePermComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RolePermComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
