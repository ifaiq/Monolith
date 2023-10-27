import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsRoutingModule } from './settings-routing.module';
import { AppVersionComponent } from './app-version/app-version.component';
import { AppTypeComponent } from './app-type/app-type.component';
import { ShipmentMethodComponent } from './shipment-methods/shipment-methods.component';
import { RolePermComponent } from './role_api_perm/role_api_perm.component';

@NgModule({
    imports: [
        CommonModule,
        SettingsRoutingModule,
        FormsModule
    ],
    declarations: [AppVersionComponent, ShipmentMethodComponent, AppTypeComponent, RolePermComponent]
})
export class SettingsModule {
}
