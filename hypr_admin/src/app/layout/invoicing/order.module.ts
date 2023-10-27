import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { OrderRoutingModule } from "./order-routing.module";
import { AngularDateTimePickerModule } from "angular2-datetimepicker";
import { PackedOrdersComponent } from "./packed-orders/packed-orders.component";
import { OrderComponent  } from "./order.component";
import { NgxPermissionsModule } from "ngx-permissions";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { NgxPaginationModule } from "ngx-pagination";
import { OrderService } from "./order.service";


@NgModule({
    imports: [
        CommonModule,
        OrderRoutingModule,
        FormsModule,
        NgxPaginationModule,
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.rectangleBounce,
            backdropBackgroundColour: "rgba(0,0,0,0.1)",
            backdropBorderRadius: "0px",
            primaryColour: "#FF5733",
            secondaryColour: "#3333FF",
            tertiaryColour: "#FF33EC",
        }),
        AngularDateTimePickerModule,
        NgxPermissionsModule.forChild(),
    ],
    declarations: [
        PackedOrdersComponent,
        OrderComponent
    ],
    providers: [OrderService],
})
export class OrderModule {}
