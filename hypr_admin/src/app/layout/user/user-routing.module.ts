import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { UserCreateComponent } from "./user-create/user-create.component";
import { UserEditComponent } from "./user-edit/user-edit.component";
import { UserPermissionComponent } from "./user-permission/user-permission.component";
const routes: Routes = [
    { path: "create", component: UserCreateComponent },
    { path: "edit", component: UserEditComponent },
    { path: "role", component: UserPermissionComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class UserRoutingModule {}
