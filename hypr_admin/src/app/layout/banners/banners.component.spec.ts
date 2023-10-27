import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { StatModule } from '../../shared';
import { BannersComponent } from './banners.component';

describe('BannersComponent', () => {
  let component: BannersComponent;
  let fixture: ComponentFixture<BannersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    imports: [
        StatModule,
    ],
      declarations: [
        BannersComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BannersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
