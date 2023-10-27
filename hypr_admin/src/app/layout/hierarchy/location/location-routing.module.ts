import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { LocationManagementComponent } from "./location-management.component";
import { CreateLocationComponent } from "./create-location.component";

const routes: Routes = [
    { path: "", component: LocationManagementComponent },
    { path: "create", component: CreateLocationComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class LocationSetupRoutingModule {}