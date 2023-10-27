import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { InventoryManagementComponent } from "./inventory-management/inventory-management.component";
import { InventoryInComponent } from "./inventory-in/inventory-in.component";
import { InventoryHistoryComponent } from "./inventory-history/inventory-history.component";
import { SiHistoryComponent } from "./si-history/si-history.component";
import { SiApprovalComponent } from "./si-approval/si-approval.component";

const routes: Routes = [
    { path: "inventory-management", component: InventoryManagementComponent },
    { path: "inventory-in", component: InventoryInComponent },
    { path: "inventory-history", component: InventoryHistoryComponent },
    { path: "si-history", component: SiHistoryComponent },
    { path: "si-approval", component: SiApprovalComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class InventoryRoutingModule {}
