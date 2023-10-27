import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppTypeComponent } from './app-type.component';

describe('AppTypeComponent', () => {
  let component: AppTypeComponent;
  let fixture: ComponentFixture<AppTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
