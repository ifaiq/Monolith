import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { InventoryRoutingModule } from "./inventory-routing.module";
import { InventoryManagementComponent } from "./inventory-management/inventory-management.component";
import { InventoryInComponent } from "./inventory-in/inventory-in.component";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { InventoryHistoryComponent } from "./inventory-history/inventory-history.component";
import { SiHistoryComponent } from "./si-history/si-history.component";
import { SiApprovalComponent } from "./si-approval/si-approval.component";
import { NgxPaginationModule } from "ngx-pagination";
import { NgxPermissionsModule } from "ngx-permissions";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        InventoryRoutingModule,
        NgxPaginationModule,
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
        InventoryManagementComponent,
        InventoryInComponent,
        InventoryHistoryComponent,
        SiHistoryComponent,
        SiApprovalComponent,
    ],
})
export class InventoryModule {}
