import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { TaxCodesComponent } from "./tax-codes/tax-codes.component";
import { TaxGroupsComponent } from "./tax-groups/tax-groups.component";

const routes: Routes = [
  { path: "tax-groups", component: TaxGroupsComponent },
  { path: "tax-codes", component: TaxCodesComponent }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})

export class TaxationRoutingModule {}
