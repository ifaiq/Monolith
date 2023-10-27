import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {MailingListsComponent} from './mailing-lists.component';

const routes: Routes = [
    {path: '', component: MailingListsComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MailingListsRoutingModule { }
