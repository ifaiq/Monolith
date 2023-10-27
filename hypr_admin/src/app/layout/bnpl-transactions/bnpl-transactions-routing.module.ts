import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { BnplTransactions } from "./bnpl-transactions.component";

const routes: Routes = [{ path: "", component: BnplTransactions }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class BnplTransactionsRoutingModule {}
