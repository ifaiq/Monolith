import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PackerAwaitingComponent } from './packer-awaiting.component';

describe('PackerAwaitingComponent', () => {
  let component: PackerAwaitingComponent;
  let fixture: ComponentFixture<PackerAwaitingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PackerAwaitingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PackerAwaitingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
