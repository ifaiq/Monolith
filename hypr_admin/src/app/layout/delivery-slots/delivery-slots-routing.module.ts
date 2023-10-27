import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { DeliverySlotsComponent } from "./delivery-slots.component";

const routes: Routes = [{ path: "", component: DeliverySlotsComponent }];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class DeliverySlotsRoutingModule {}