import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TaxationRoutingModule } from "./taxation-routing.module";
import { TaxCodesComponent } from "./tax-codes/tax-codes.component";
import { TaxGroupsComponent } from "./tax-groups/tax-groups.component";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { NgxPaginationModule } from "ngx-pagination";
import { NgxPermissionsModule } from "ngx-permissions";

@NgModule({
  imports: [
      CommonModule,
      FormsModule,
      TaxationRoutingModule,
      // NgxPaginationModule,
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
      TaxGroupsComponent,
      TaxCodesComponent,
  ],
})
export class TaxationModule {}
