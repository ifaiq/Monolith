import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { LayoutComponent } from "./layout.component";
import { AdminOnlyRouteGuard } from "../shared/guard/admin-only.guard";
import { CatalogueComponent } from "./catalogue/catalogue.component";

const routes: Routes = [
    {
        path: "",
        component: LayoutComponent,
        children: [
            { path: "order", loadChildren: "./order/order.module#OrderModule" },
            {
                path: "user",
                loadChildren: "./user/user.module#UserModule",
                // canActivate: [AdminOnlyRouteGuard],
                // canActivateChild: [AdminOnlyRouteGuard],
            },
            {
                path: 'catalogue',
                component: CatalogueComponent
            },
            {
                path: "product",
                loadChildren: "./product/product.module#ProductModule",
            },
            {
                path: "dashboard",
                loadChildren: "./dashboard/dashboard.module#DashboardModule",
            },
            {
                path: "customers",
                loadChildren: "./customers/customers.module#CustomersModule",
                // canActivate: [AdminOnlyRouteGuard],
                // canActivateChild: [AdminOnlyRouteGuard],
            },
            {
                path: "inventory",
                loadChildren: "./inventory/inventory.module#InventoryModule",
            },
            {
                path: "notifications",
                loadChildren:
                    "./notifications/notifications.module#NotificationsModule",
            },
            {
                path: "settings",
                loadChildren: "./settings/settings.module#SettingsModule",
                // canActivate: [AdminOnlyRouteGuard],
                // canActivateChild: [AdminOnlyRouteGuard],
            },
            {
                path: "location",
                loadChildren: "./location-setting/location-setting.module#LocationSettingModule",
                // canActivate: [AdminOnlyRouteGuard],
                // canActivateChild: [AdminOnlyRouteGuard],
            },
            {
                path: "mailing-list",
                loadChildren:
                    "./mailing-lists/mailing-lists.module#MailingListsModule",
                // canActivate: [AdminOnlyRouteGuard],
                // canActivateChild: [AdminOnlyRouteGuard],
            },
            {
                path: "hierarchy",
                loadChildren:
                    "./hierarchy/hierarchy.module#HierarchySetupModule",
                // canActivate: [AdminOnlyRouteGuard],
                // canActivateChild: [AdminOnlyRouteGuard],
            },
            { path: "coupon", loadChildren: "./coupon/coupon.module#CouponModule" },
            { path: "banners", loadChildren: "./banners/banners.module#BannersModule" },
            { path: "bnpl-transactions", loadChildren: "./bnpl-transactions/bnpl-transactions.module#BnplTransactionsModule" },
            { path: "invoicing", loadChildren: "./invoicing/order.module#OrderModule" },
            { path: "delivery-slots", loadChildren: "./delivery-slots/delivery-slots.module#DeliverySlotsModule" },
            { path: "taxation", loadChildren: "./taxation/taxation.module#TaxationModule" },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LayoutRoutingModule { }
