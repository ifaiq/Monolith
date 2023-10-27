import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderComponent } from './order.component';
import { CreateOrderComponent } from './create-order/create-order.component';
import { PackedOrdersComponent } from './packed-orders/packed-orders.component';
import { EditOrderComponent } from './edit-order/edit-order.component';
import { CancelledOrdersComponent } from './cancelled-orders/cancelled-orders.component';
import { ApprovedOrdersComponent } from './approved-orders/approved-orders.component';
import { PackerAwaitingComponent } from './packer-awaiting/packer-awaiting.component';
import { DeliverAwaitingComponent } from "./deliver-awaiting/deliver-awaiting.component";
import { BatchOrdersComponent } from "./batch-orders/batch-orders.component";
import { OnHoldOrdersComponent } from './onhold-orders/onhold-orders.component';
import { EndStateOrdersComponent } from "./end-state-orders/end-state-orders.component";
import { PrintPageComponent } from './print-page/print-page.component'

const routes: Routes = [
  {path: '', component: OrderComponent},
  { path: 'create-order', component: CreateOrderComponent },
  { path: 'pack-orders', component: PackedOrdersComponent },
  { path: 'cancelled-orders', component: CancelledOrdersComponent },
  { path: 'approved-orders', component: ApprovedOrdersComponent },
  { path: 'edit-order/:id', component: EditOrderComponent },
  { path: 'packer/awaiting', component: PackerAwaitingComponent },
  { path: 'intransit-orders', component: DeliverAwaitingComponent },
  { path: 'batch-orders', component: BatchOrdersComponent },
  { path: 'onhold-orders', component: OnHoldOrdersComponent },
  { path: 'end-state-orders', component: EndStateOrdersComponent },
  { path: 'print-page' , component: PrintPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderRoutingModule { }
