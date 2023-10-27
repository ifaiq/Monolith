import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MailingListsComponent } from './mailing-lists.component';

describe('MailingListsComponent', () => {
  let component: MailingListsComponent;
  let fixture: ComponentFixture<MailingListsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MailingListsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MailingListsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
