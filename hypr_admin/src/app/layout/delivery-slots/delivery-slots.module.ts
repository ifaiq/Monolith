import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DeliverySlotsRoutingModule } from "./delivery-slots-routing.module";
import { DeliverySlotsComponent } from "./delivery-slots.component";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { FormsModule } from '@angular/forms';
import { UiSwitchModule } from "ngx-ui-switch";
import { MatFormFieldModule, MatInputModule } from '@angular/material';
import { NgxPermissionsModule } from "ngx-permissions";

@NgModule({
    imports: [
        CommonModule,
        DeliverySlotsRoutingModule,
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.rectangleBounce,
            backdropBackgroundColour: "rgba(0,0,0,0.1)",
            backdropBorderRadius: "0px",
            primaryColour: "#FF5733",
            secondaryColour: "#3333FF",
            tertiaryColour: "#FF33EC",
        }),
        FormsModule,
        UiSwitchModule,
        MatFormFieldModule,
        MatInputModule,
        NgxPermissionsModule.forChild(),
    ],
    declarations: [DeliverySlotsComponent],
})
export class DeliverySlotsModule { }
