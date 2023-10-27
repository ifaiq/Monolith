import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { BUManagementComponent } from "./bu-management.component";
import { CreateBUComponent } from "./create-bu.component";

const routes: Routes = [
    { path: "", component: BUManagementComponent },
    { path: "create", component: CreateBUComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class BUSetupRoutingModule {}