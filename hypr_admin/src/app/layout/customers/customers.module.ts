import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CustomersRoutingModule } from "./customers-routing.module";
import { CustomersComponent } from "./all-customers/all-customers.component";
import { GetCustomerComponent } from "./get-customer/get-customer.component";
import { StatModule } from "../../shared";
import { AgmCoreModule } from "@agm/core";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { NgxPaginationModule } from "ngx-pagination";
import { NgxPermissionsModule } from "ngx-permissions";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AngularDateTimePickerModule } from "angular2-datetimepicker";

@NgModule({
    imports: [
        CommonModule,
        CustomersRoutingModule,
        FormsModule,
        NgxPaginationModule,
        StatModule,
        NgbModule,
        AngularDateTimePickerModule,
        AgmCoreModule.forRoot({
            apiKey: "AIzaSyBfMnykMNOY3HbqeePRwWN6O_2A3r_-VGA",
            libraries: ['places', 'drawing', 'geometry']
        }),
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.rectangleBounce,
            backdropBackgroundColour: "rgba(0,0,0,0.1)",
            backdropBorderRadius: "0px",
            primaryColour: "#FF5733",
            secondaryColour: "#3333FF",
            tertiaryColour: "#FF33EC",
        }),
        NgxPermissionsModule.forChild()
    ],
    declarations: [
        CustomersComponent, 
        GetCustomerComponent
    ],
})
export class CustomersModule {}
