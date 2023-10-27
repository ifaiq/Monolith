import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CustomersComponent } from './all-customers/all-customers.component';
import { GetCustomerComponent } from './get-customer/get-customer.component';


const routes: Routes = [
  { path: 'all-customers', component: CustomersComponent },
  { path: 'get-customer/:id', component: GetCustomerComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule { }
