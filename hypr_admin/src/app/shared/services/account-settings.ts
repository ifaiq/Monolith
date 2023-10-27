import { Injectable } from "@angular/core";

@Injectable()
export class AccountSettingService {
    currency = "PKR";
    language = "";
    timezone = "";

    constructor() {
        this.setUserAccountSettings();
    }

    setUserAccountSettings() {
        try {
            if (localStorage.getItem("isLoggedin") == "true") {
                var userData = JSON.parse(localStorage.getItem("userData"));
                if (userData && userData.settings) {
                    this.currency = userData.settings.currency;
                    this.language = userData.settings.language;
                    this.timezone = userData.settings.timezone;
                }
            }
        } catch (e) {}
    }
}
