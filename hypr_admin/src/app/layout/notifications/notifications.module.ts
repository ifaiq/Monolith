
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { NgxPaginationModule } from "ngx-pagination";
import { NgxPermissionsModule } from "ngx-permissions";

import { NotificationsRoutingModule } from './notifications-routing.module';
import { SendNotificationsComponent } from './send-notifications/send-notifications.component';
import { NotificationsComponent } from './notifications.component';
import { CreateNotificationMessageComponent } from './create-notification-message.component';
import { NotificationSelectionComponent } from './message-selection/message-selection.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgxPermissionsModule.forChild(),
        NgxPaginationModule,
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.rectangleBounce,
            backdropBackgroundColour: "rgba(0,0,0,0.1)",
            backdropBorderRadius: "0px",
            primaryColour: "#FF5733",
            secondaryColour: "#3333FF",
            tertiaryColour: "#FF33EC",
        }),
        NotificationsRoutingModule

    ],
    declarations: [SendNotificationsComponent, NotificationsComponent, CreateNotificationMessageComponent, NotificationSelectionComponent]
})
export class NotificationsModule {
}
