import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { AppVersionComponent } from "./app-version/app-version.component";
import { AppTypeComponent } from './app-type/app-type.component';
import { ShipmentMethodComponent } from './shipment-methods/shipment-methods.component';
import { RolePermComponent } from './role_api_perm/role_api_perm.component';

const routes: Routes = [
    { path: "app-versions", component: AppVersionComponent },
    { path: "app-types", component: AppTypeComponent },
    { path: "shipment-methods", component: ShipmentMethodComponent },
    { path: "role-api-permissions", component: RolePermComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class SettingsRoutingModule {}
