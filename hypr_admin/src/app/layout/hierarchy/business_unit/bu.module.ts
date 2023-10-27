import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { NgxPaginationModule } from "ngx-pagination";
import { BUSetupRoutingModule } from "./bu-routing.module";
import { BUManagementComponent } from "./bu-management.component";
import { UiSwitchModule } from "ngx-ui-switch";
import { CreateBUComponent } from "./create-bu.component";
import { NgxPermissionsModule } from "ngx-permissions";



@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        BUSetupRoutingModule,
        NgxPaginationModule,
        UiSwitchModule,
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
        BUManagementComponent,
        CreateBUComponent
    ],
})
export class BUSetupModule {}