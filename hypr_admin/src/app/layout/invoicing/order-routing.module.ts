import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PackedOrdersComponent } from './packed-orders/packed-orders.component';

const routes: Routes = [
  {path: '', component: PackedOrdersComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderRoutingModule { }
