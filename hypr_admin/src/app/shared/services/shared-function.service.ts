import { Injectable } from "@angular/core";
import { HttpHeaders } from "@angular/common/http";
import { AuthInterceptor } from "../../http-interceptors/auth-interceptor";
import { Globals } from "../../globals";
import { _throw as throwError } from "rxjs/observable/throw";
import { NgxPermissionsService } from "ngx-permissions";
import Cookies from 'js-cookie';
import { environment } from "environments/environment";

@Injectable()
export class SharedFunctionsService {
    userData = {
        location_id: {},
    };
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));

    constructor(
        private http: AuthInterceptor,
        private globals: Globals,
        private permissionsService: NgxPermissionsService
    ) { }

    getFormattedAmount(amount) {
        if (amount == "undefined" || amount == "" || amount == null) {
            return "";
        } else {
            amount = Math.ceil(amount);
            amount = amount
                .toString()
                .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
            return amount;
        }
    }

    getFormattedDate(date, formatType) {
        var time = new Date(date);
        var tmpTime = time.toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });

        var curr_date = time.getDate();
        var curr_month = time.getMonth();
        curr_month++;
        var curr_year = time.getFullYear();

        if (formatType == 1) {
            return (
                curr_date + "/" + curr_month + "/" + curr_year + ", " + tmpTime
            );
        } else {
            return (
                tmpTime + "\n" + curr_date + "/" + curr_month + "/" + curr_year
            );
        }
    }

    getRequest(url, params?: any, walletType?: boolean) {
        let headers: any;
        const authToken = localStorage.getItem("authToken");
        if (authToken && authToken.length > 0) {
            headers = new HttpHeaders({
                Authorization: authToken
            });
        }
        if (params)
            return this.http
                .get(
                    walletType
                        ? this.globals.walletURI + url
                        : this.globals.backendURI + url,
                    {
                        headers: headers,
                        params,
                    }
                )
                .map((response) => response)
                .catch((err: any) => {
                    let error = throwError(err);
                    if (!(authToken && authToken.length > 0)) {
                        error.error.error.message = "Unauthorized!";
                    }
                    return error;
                });
        else {
            return this.http
                .get(
                    walletType
                        ? this.globals.walletURI + url
                        : this.globals.backendURI + url,
                    { headers: headers }
                )
                .map((response) => response)
                .catch((err: any) => {
                    let error = throwError(err);
                    if (!(authToken && authToken.length > 0)) {
                        error.error.error.message = "Unauthorized!";
                    }
                    return error;
                });
        }
    }

    putRequest(url, params?: any) {
        let headers: any;
        const authToken = localStorage.getItem("authToken");
        if (authToken && authToken.length > 0) {
            headers = new HttpHeaders({
                Authorization: authToken,
                "Content-Type": "application/json"
            });
        }
        if (params)
            return this.http
                .put(this.globals.backendURI + url, JSON.stringify(params), {
                    headers: headers,
                })
                .map((response) => response)
                .catch((err: any) => {
                    let error = throwError(err);
                    if (!(authToken && authToken.length > 0)) {
                        error.error.error.message = "Unauthorized!";
                    }
                    return error;
                });
        else {
            return this.http
                .get(this.globals.backendURI + url, { headers: headers })
                .map((response) => response)
                .catch((err: any) => {
                    let error = throwError(err);
                    if (!(authToken && authToken.length > 0)) {
                        error.error.error.message = "Unauthorized!";
                    }
                    return error;
                });
        }
    }

    postRequest(url, params, walletType?: boolean) {
        let headers: any;
        const authToken = localStorage.getItem("authToken");
        if (authToken && authToken.length > 0) {
            headers = new HttpHeaders({
                Authorization: authToken
            });
        }
        return this.http
            .post(
                walletType
                    ? this.globals.walletURI + url
                    : this.globals.backendURI + url,
                params,
                { headers: headers }
            )
            .map((res: any) => {
                return res;
            })
            .catch((err: any) => {
                let error = throwError(err);
                if (!(authToken && authToken.length > 0)) {
                    error.error.error.message = "Unauthorized!";
                }
                return error;
            });
    }

    deleteRequest(url, params) {
        let headers: any;
        const authToken = localStorage.getItem("authToken");
        if (authToken && authToken.length > 0) {
            headers = new HttpHeaders({
                Authorization: authToken
            });
        }
        return this.http
            .request("delete", this.globals.backendURI + url, {
                headers: headers,
                body: params,
            })
            .map((res: any) => {
                return res;
            })
            .catch((err: any) => {
                let error = throwError(err);
                if (!(authToken && authToken.length > 0)) {
                    error.error.error.message = "Unauthorized!";
                }
                return error;
            });
    }

    getFormattedPhoneNumber(number) {
        return number ? number.replace("923", "03") : '';
    }

    getUserLocations() {
        var userLocations = localStorage.getItem("userLocations");
        let result = JSON.parse(userLocations);
        return result;
    }
    getUserBusinessUnits() {
        var userBUs = localStorage.getItem("userBUs");
        let result = JSON.parse(userBUs);
        return result;
    }
    getUserCompanies() {
        var userCompanies = localStorage.getItem("userCompanies");
        let result = JSON.parse(userCompanies);
        return result;
    }
    emptyOrAllParam(param, checkZero?: any) {
        if (
            param != null &&
            param != undefined &&
            param != "" &&
            param != "all" &&
            param != "All"
        ) {
            if (checkZero) {
                if (param != 0 && param != "0") return false;
                else return true;
            }
            return false;
        }
        return true;
    }

    getRowCount(itemsPerPage, currentPage, index) {
        return itemsPerPage * (currentPage - 1) + 1 + index;
    }

    isBUListPerm() {
        let isPerm =
            this.permissionsService.getPermission("*") ||
            this.permissionsService.getPermission("L_BU");
        if (isPerm) {
            return true;
        } else {
            return false;
        }
    }
    isCompanyListPerm() {
        let isPerm =
            this.permissionsService.getPermission("*") ||
            this.permissionsService.getPermission("L_ALL_COMP");
        if (isPerm) {
            return true;
        } else {
            return false;
        }
    }

    getStartDate(date) {
        let startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        return startDate.toISOString();
    }

    getEndDate(date) {
        let endDate = new Date(date);
        endDate.setHours(23, 59, 59, 59);
        return endDate.toISOString();
    }

    getDateDifference(date1, date2) {
        const dt1 = new Date(date1);
        const dt2 = new Date(date2);
        return Math.floor(
            (Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) -
                Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate())) /
            (1000 * 60 * 60 * 24)
        );
    }

    isEmpty(obj) {
        if (obj && Object.keys(obj).length === 0) {
            return true;
        } else {
            return false;
        }
    }

    setAuthData(data) {
        Cookies.set(environment.authData, JSON.stringify(data));
    }

    getAuthData() {
        let data = { token: '', user: {} };
        if (Cookies.get(environment.authData)) {
            data = JSON.parse(Cookies.get(environment.authData));
        }
        return data;
    }

    removeAuthData() {
        Cookies.remove(environment.authData);
    }
}
