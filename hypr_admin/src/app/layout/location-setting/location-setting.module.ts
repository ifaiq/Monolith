import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocationSettingRoutingModule } from './location-setting-routing.module';
import { AgmCoreModule } from '@agm/core';
import { ShowLocationComponent } from './show-location/show-location.component';
import { CreateLocationComponent } from './create-location/create-location.component';
import { NgxPermissionsModule } from "ngx-permissions";
import { PolygonService } from '../../shared/services/polygonService';
import { PolygonPointsComponent } from './polygon-points/polygon-points.component';

@NgModule({
  imports: [
    CommonModule,
    LocationSettingRoutingModule,
    FormsModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyBfMnykMNOY3HbqeePRwWN6O_2A3r_-VGA',
      libraries: ['places', 'drawing', 'geometry']
    }),
    NgxPermissionsModule.forChild()
  ],
  declarations: [ShowLocationComponent, CreateLocationComponent, PolygonPointsComponent],
  providers: [ PolygonService ]
})
export class LocationSettingModule {
}
