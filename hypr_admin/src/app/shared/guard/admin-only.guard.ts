import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router";
import { Router } from "@angular/router";
import { RoleConstants } from "app/constants/roles-constants";

@Injectable()
export class AdminOnlyRouteGuard implements CanActivate {
    constructor(private router: Router) {}

    canActivate() {
        return this.adminOnly();
    }

    canActivateChild() {
        return this.adminOnly();
    }
    adminOnly() {
        if (localStorage.getItem("isLoggedin") == "true") {
            var userData = JSON.parse(localStorage.getItem("userData"));
            if (userData.role.id == RoleConstants.ADMIN) {
                return true;
            }
            this.router.navigate(["/product"]);
            return false;
        }
        this.router.navigate(["/login"]);
        return false;
    }
}
