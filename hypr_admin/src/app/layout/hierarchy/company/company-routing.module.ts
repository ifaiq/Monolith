import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { CompanyManagementComponent } from "./company-management.component";
import { CreateCompanyComponent } from "./create-company.component";

const routes: Routes = [
    { path: "", component: CompanyManagementComponent },
    { path: "create", component: CreateCompanyComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CompanySetupRoutingModule {}