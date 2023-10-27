import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { BnplTransactionsRoutingModule } from "./bnpl-transactions-routing.module";
import { BnplTransactions } from "./bnpl-transactions.component";
import { StatModule } from "../../shared";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { ChartsModule } from "ng2-charts";
import { AngularDateTimePickerModule } from "angular2-datetimepicker";
import { NgxPermissionsModule } from "ngx-permissions";
import { NgxPaginationModule } from "ngx-pagination";
import { UiSwitchModule } from "ngx-ui-switch";

@NgModule({
    imports: [
        CommonModule,
        AngularDateTimePickerModule,
        NgxPaginationModule,
        UiSwitchModule,
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.wanderingCubes,
            backdropBackgroundColour: "rgba(0,0,0,0.5)",
            backdropBorderRadius: "4px",
            primaryColour: "#FF5733",
            secondaryColour: "#3333FF",
            tertiaryColour: "#FF33EC",
        }),
        BnplTransactionsRoutingModule,
        StatModule,
        ChartsModule,
        NgxPermissionsModule.forChild(),
    ],
    declarations: [BnplTransactions],
})
export class BnplTransactionsModule {}
