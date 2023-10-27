import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CouponRoutingModule } from './coupon.routing';
import { CouponService } from './coupon.service';

import { CouponComponent } from './coupon.component';
import { AddCouponComponent } from './add-coupon/add-coupon.component';
import { CustomerSelectionComponent } from './customer-selection/customer-selection.component';
import { AngularDateTimePickerModule } from "angular2-datetimepicker";
import { NgxPermissionsModule } from "ngx-permissions";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { NgxPaginationModule } from "ngx-pagination";
import { UiSwitchModule } from "ngx-ui-switch";


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        CouponRoutingModule,
        AngularDateTimePickerModule,
        NgxPermissionsModule.forChild(),
        UiSwitchModule,
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.wanderingCubes,
            backdropBackgroundColour: "rgba(0,0,0,0.5)",
            backdropBorderRadius: "4px",
            primaryColour: "#FF5733",
            secondaryColour: "#3333FF",
            tertiaryColour: "#FF33EC",
        }),
        NgxPaginationModule
    ],
    declarations: [
        AddCouponComponent,
        CouponComponent,
        CustomerSelectionComponent
    ],
    providers: [
        CouponService
    ]
})
export class CouponModule { }
