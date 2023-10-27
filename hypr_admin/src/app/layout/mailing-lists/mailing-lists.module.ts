import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MailingListsRoutingModule } from './mailing-lists-routing.module';
import {MailingListsComponent} from './mailing-lists.component';
import { NgxPermissionsModule } from "ngx-permissions";

@NgModule({
    imports: [
        CommonModule,
        MailingListsRoutingModule,
        FormsModule,
        NgxPermissionsModule.forChild()
    ],
    declarations: [MailingListsComponent]
})
export class MailingListsModule {
}
