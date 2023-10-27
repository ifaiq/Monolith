import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { DashboardRoutingModule } from "./dashboard-routing.module";
import { DashboardComponent } from "./dashboard.component";
import { StatModule } from "../../shared";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { ChartsModule } from "ng2-charts";
import { AngularDateTimePickerModule } from "angular2-datetimepicker";
import { NgxPermissionsModule } from "ngx-permissions";

@NgModule({
    imports: [
        CommonModule,
        AngularDateTimePickerModule,
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.wanderingCubes,
            backdropBackgroundColour: "rgba(0,0,0,0.5)",
            backdropBorderRadius: "4px",
            primaryColour: "#FF5733",
            secondaryColour: "#3333FF",
            tertiaryColour: "#FF33EC",
        }),
        DashboardRoutingModule,
        StatModule,
        ChartsModule,
        NgxPermissionsModule.forChild(),
    ],
    declarations: [DashboardComponent],
})
export class DashboardModule {}
