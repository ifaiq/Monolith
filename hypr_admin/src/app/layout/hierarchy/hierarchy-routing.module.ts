import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

const routes: Routes = [
    { path: "company", loadChildren: "./company/company.module#CompanySetupModule" },
    { path: "business-unit", loadChildren: "./business_unit/bu.module#BUSetupModule" },
    { path: "location", loadChildren: "./location/location.module#LocationSetupModule" }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class HierarchySetupRoutingModule {}
