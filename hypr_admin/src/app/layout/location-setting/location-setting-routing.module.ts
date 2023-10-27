import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {ShowLocationComponent} from  './show-location/show-location.component';
const routes: Routes = [
   { path: 'show-location', component: ShowLocationComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LocationSettingRoutingModule { }
