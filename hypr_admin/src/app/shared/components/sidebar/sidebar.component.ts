import { Component } from "@angular/core";
import { environment } from "../../../../environments/environment";

@Component({
    selector: "app-sidebar",
    templateUrl: "./sidebar.component.html",
    styleUrls: ["./sidebar.component.scss"],
})
export class SidebarComponent {
    isActive = false;
    showMenu = "";
    isLocationLahore = false;
    ngOnInit() {}
    eventCalled() {
        this.isActive = !this.isActive;
    }
    addExpandClass(element: any) {
        if (element === this.showMenu) {
            this.showMenu = "0";
        } else {
            this.showMenu = element;
        }
    }
    onLoggedout() {
        localStorage.removeItem("isLoggedin");
    }

    linkToLoyaltyPortal() {
        const authToken = localStorage.getItem("authToken");
        const redirectUrl = `${environment.loyaltyPortal}?token=${authToken}`;
        window.location.href = redirectUrl;
    }

    linkToCouponPortal() {
        window.location.href = `${environment.couponPortal}`;
    }

    linkToProductPortal(page?: string) {
        const authToken = localStorage.getItem("authToken");
        const path = page ? `${environment.productPortal}${page}`: `${environment.productPortal}`;
        const redirectUrl = `${path}?token=${authToken}`;
        window.location.href = redirectUrl;
    }
    
    linkToCategoryPortal(page?: string) {
        const authToken = localStorage.getItem("authToken");
        const path = page ? `${environment.categoryPortal}${page}`: `${environment.categoryPortal}`;
        const redirectUrl = `${path}?token=${authToken}`;
        window.location.href = redirectUrl;
    }

    linkToBatchPortal(useOldUrl = false) {
        const authToken = localStorage.getItem("authToken");
        const path = useOldUrl ? `/order/batch-orders` : `${environment.batchPortal}`;
        const redirectUrl = useOldUrl ? path :`${path}?token=${authToken}`;
        window.location.href = redirectUrl;
    }
}
