import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { OrderRoutingModule } from "./order-routing.module";
import { CreateOrderComponent } from "./create-order/create-order.component";
import { AngularDateTimePickerModule } from "angular2-datetimepicker";
import { PackedOrdersComponent } from "./packed-orders/packed-orders.component";
import { EditOrderComponent } from "./edit-order/edit-order.component";
import { NgxPermissionsModule } from "ngx-permissions";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { CancelledOrdersComponent } from "./cancelled-orders/cancelled-orders.component";
import { ApprovedOrdersComponent } from "./approved-orders/approved-orders.component";
import { OrderComponent } from "./order.component";
import { PackerAwaitingComponent } from "./packer-awaiting/packer-awaiting.component";
import { DeliverAwaitingComponent } from "./deliver-awaiting/deliver-awaiting.component";
import { BatchOrdersComponent } from "./batch-orders/batch-orders.component";
import { EndStateOrdersComponent } from "./end-state-orders/end-state-orders.component";
import { NgxPaginationModule } from "ngx-pagination";
import { OrderService } from "./order.service";
import { OnHoldOrdersComponent } from "./onhold-orders/onhold-orders.component";
import { PrintPageComponent } from './print-page/print-page.component'

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
        OrderComponent,
        CreateOrderComponent,
        PackedOrdersComponent,
        OnHoldOrdersComponent,
        EditOrderComponent,
        CancelledOrdersComponent,
        ApprovedOrdersComponent,
        PackerAwaitingComponent,
        DeliverAwaitingComponent,
        BatchOrdersComponent,
        EndStateOrdersComponent,
        PrintPageComponent,
    ],
    providers: [OrderService],
})
export class OrderModule {}
