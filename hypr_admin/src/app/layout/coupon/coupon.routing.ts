import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AddCouponComponent } from './add-coupon/add-coupon.component';
import { CouponComponent } from './coupon.component';
const routes: Routes = [
    {
        path: '',
        data: {
            title: 'Coupon Management'
        },
        component: CouponComponent
    },
    {
        path: 'add',
        data: {
            title: 'Add Coupon'
        },
        component: AddCouponComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CouponRoutingModule { }