import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NotificationsComponent } from './notifications.component';
import { SendNotificationsComponent } from './send-notifications/send-notifications.component';
import { CreateNotificationMessageComponent } from './create-notification-message.component';

const routes: Routes = [
  { path: '', component: NotificationsComponent },
  { path: 'send', component: SendNotificationsComponent },
  { path: 'create', component: CreateNotificationMessageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificationsRoutingModule { }
