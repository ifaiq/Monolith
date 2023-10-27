import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { NgxPaginationModule } from "ngx-pagination";
import { LocationSetupRoutingModule } from "./location-routing.module";
import { LocationManagementComponent } from "./location-management.component";
import { UiSwitchModule } from "ngx-ui-switch";
import { CreateLocationComponent } from "./create-location.component";
import { StoreTimingsComponent } from "./store_timings/store_timings.component";
import { EventsTimingsComponent } from "./events_timings/events_timings.component";
import { NgxPermissionsModule } from "ngx-permissions";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AngularDateTimePickerModule } from "angular2-datetimepicker";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        LocationSetupRoutingModule,
        NgxPaginationModule,
        UiSwitchModule,
        NgbModule,
        AngularDateTimePickerModule,
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.rectangleBounce,
            backdropBackgroundColour: "rgba(0,0,0,0.1)",
            backdropBorderRadius: "0px",
            primaryColour: "#FF5733",
            secondaryColour: "#3333FF",
            tertiaryColour: "#FF33EC",
        }),
        NgxPermissionsModule.forChild(),
    ],
    declarations: [
        LocationManagementComponent,
        CreateLocationComponent,
        StoreTimingsComponent,
        EventsTimingsComponent
    ],
})
export class LocationSetupModule {}