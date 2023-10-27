import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { UserRoutingModule } from "./user-routing.module";
import { UserCreateComponent } from "./user-create/user-create.component";
import { UserEditComponent } from "./user-edit/user-edit.component";
import { UserPermissionComponent } from "./user-permission/user-permission.component";
import { LoadingModule, ANIMATION_TYPES } from "ngx-loading";
import { NgxPaginationModule } from "ngx-pagination";
import { NgxPermissionsModule } from 'ngx-permissions';


@NgModule({
    imports: [
        CommonModule,
        UserRoutingModule,
        FormsModule,
        NgxPaginationModule,
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
        UserCreateComponent,
        UserEditComponent,
        UserPermissionComponent,
    ],
})
export class UserModule {}
