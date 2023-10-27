import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { BannersRoutingModule } from "./banners-routing.module";
import { BannersComponent } from "./banners.component";
import { StatModule } from "../../shared";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { ChartsModule } from "ng2-charts";
import { AngularDateTimePickerModule } from "angular2-datetimepicker";
import { NgxPermissionsModule } from "ngx-permissions";
import { UiSwitchModule } from "ngx-ui-switch";
import { SortablejsModule } from 'angular-sortablejs';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
    imports: [
        CommonModule,
        AngularDateTimePickerModule,
        UiSwitchModule,
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.wanderingCubes,
            backdropBackgroundColour: "rgba(0,0,0,0.5)",
            backdropBorderRadius: "4px",
            primaryColour: "#FF5733",
            secondaryColour: "#3333FF",
            tertiaryColour: "#FF33EC",
        }),
        BannersRoutingModule,
        StatModule,
        ChartsModule,
        NgxPermissionsModule.forChild(),
        SortablejsModule,
        MatIconModule,
        MatTooltipModule,
    ],
    declarations: [BannersComponent],
})
export class BannersModule {}
