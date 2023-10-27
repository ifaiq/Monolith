import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SiHistoryComponent } from './si-history.component';

describe('SiHistoryComponent', () => {
  let component: SiHistoryComponent;
  let fixture: ComponentFixture<SiHistoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SiHistoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SiHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
