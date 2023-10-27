import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../../shared";
import { RoleConstants } from "../../../constants/roles-constants";

@Component({
    selector: "app-user-edit",
    templateUrl: "./user-edit.component.html",
    styleUrls: ["./user-edit.component.scss"],
})
export class UserEditComponent implements OnInit {
    users = [];
    roles = [];
    searchData = false
    locations = [];
    locationsCopy = [];
    businessUnits = [];
    selectedLocationId = "";
    selectedBusinessUnitId = "";
    loading = true;
    selectedRoleId = "";
    search = "";
    companyId = "";
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "allUsersPage";
    companies = [];
    assignHeading = null;
    features = []
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private sharedFunctions: SharedFunctionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getCompanies();
        this.getbusinessUnits();
        this.getlocations(true);
        this.getRoles();
        this.getGeneralFeature();
    }
    pagination(event) {
        this.currentPage = event;
        this.getUsers();
    }

    refresh() {
        this.loading = true;
        this.searchData = false
        this.search = "";
        this.resetPager();
        this.getRoles();
    }

    resetPager() {
        this.users = [];
        this.currentPage = 1;
        this.totalItems = 0;
    }

    resetLocations() {
        this.selectedLocationId = "";
        this.locationsCopy = [];
    }

    getlocations(isFirstTime) {
        this.searchData = false
        this.search = ''
        var params = {};
        if (!this.sharedFunctions.emptyOrAllParam(this.selectedRoleId)) {
            this.getUsers();
        }
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        }
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["businessUnitId"] = this.selectedBusinessUnitId;
        }
        else if (!isFirstTime) {
            this.resetLocations();
            if (this.sharedFunctions.isBUListPerm()) {
                return;
            }
        }
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data && data.data && data.data.locations) {
                    if (isFirstTime) {
                        this.locations = data.data.locations;
                    }
                    else {
                        this.locationsCopy = data.data.locations;
                    }
                }
            },
            (error) => {
                console.log(error);
            }
        );
    }

    getbusinessUnits() {
        var params = {};
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        }
        var path = "/config/businessunit/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data.code == "OK") {
                    try {
                        if (data.data && data.data.length) {
                            this.businessUnits = data.data;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }
            },
            (error) => {
                console.log(error);
            }
        );
    }

    getGeneralFeature() {
        this.sharedFunctions.getRequest('/feature/feature', {}).subscribe((data) => {
            this.features = data.data;
            this.loading = false;

        }, err => {
            this.toastr.error(err.error.message);
            this.loading = false;
        });
    }

    selectFeatureOption(index, option, list) {
        var selectedOption = list.filter((item) => item.id == option);
        if (selectedOption.length) {
            const findIndex = this.users[index].userFeatures.findIndex((feature) => {
                return feature.featureId === selectedOption[0].id;
            })
            if (findIndex < 0) {
                this.sharedFunctions.postRequest('/feature/user-feature',
                    {
                        userId: this.users[index].id,
                        featureId: selectedOption[0].id
                    })
                    .subscribe((data) => {
                        this.users[index].userFeatures.push({
                            ...data.data,
                            feature: { ...selectedOption[0] },
                        });
                        this.loading = false;
                    }, err => {
                        this.toastr.error(err.error.message);
                        this.loading = false;
                    });
            }
        }
    }

    getUsersFeatures(index, userId) {
        this.sharedFunctions.getRequest('/feature/user-feature', { userId: userId, relations: 'feature' })
            .subscribe((data) => {
                this.users[index].userFeatures = data.data;
                this.users[index].isCheckedFeature = true;
                this.loading = false;

            }, err => {
                this.toastr.error(err.error.message);
                this.loading = false;
            });
    }

    removeUserFeatureSelectedOption(userIndex, index) {
        if (this.users[userIndex].userFeatures[index].id) {
            this.sharedFunctions.deleteRequest(
                '/feature/user-feature/' + this.users[userIndex].userFeatures[index].id,
                {})
                .subscribe((data) => {
                    this.users[userIndex].userFeatures.splice(index, 1);
                    this.loading = false;

                }, err => {
                    this.toastr.error(err.error.message);
                    this.loading = false;
                });
        } else {
            this.users[userIndex].userFeatures.splice(index, 1);
        }

    }


    getUsers() {
        this.loading = true;

        var path = "/user/user/getAll";

        let params = {
            roleId: this.selectedRoleId,
            search: this.search,
            limit: this.itemsPerPage,
            pageNo: this.currentPage,
        };
        if (
            !this.sharedFunctions.emptyOrAllParam(
                this.selectedBusinessUnitId,
                true
            )
        ) {
            params["businessUnitId"] = this.selectedBusinessUnitId;
        }
        if (
            !this.sharedFunctions.emptyOrAllParam(this.selectedLocationId, true)
        ) {
            params["locationId"] = this.selectedLocationId;
        }
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            var users = [];
            for (var user of data.data.users) {
                user = this.selectRole(user, user.role, true);
                users.push(user);
            }
            this.users = users;
            this.totalItems = parseInt(data.data.totalCount);
            this.loading = false;

        }, err => {
            this.toastr.error(err.error.message);
            this.loading = false;
        });
    }

    getRoles() {
        this.searchData = false
        this.search = ''
        this.sharedFunctions
            .getRequest("/rbac/roles")
            .subscribe((data) => {
                if (data.data && data.data.length > 0) {
                    this.roles = data.data;
                    if (!this.selectedRoleId)
                        this.selectedRoleId = this.roles[0].id;
                    this.setAssigningHeading();
                    this.getUsers();
                } else {
                    this.loading = false;
                    this.toastr.error("No Roles Found");
                }
            }, err => {
                this.toastr.error(err.error.message);
                this.loading = false;
            });
    }

    updateUser(user) {
        if (user.password && user.password.length > 0) {
            this.updatePassword(user);
        }
        if (this.assignHeading != null && user.selectedOptions.length == 0 && !this.searchData) {
            this.toastr.error(
                "Please assign " + this.assignHeading + " to user"
            );
            return;
        }
        var data = this.setDataRoleWise(user);
        this.sharedFunctions.postRequest("/user/user/updateUser", data).subscribe(
            (data) => {
                this.toastr.success("User updated successfully");
            },
            (err) => {
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
            }
        );
    }

    updatePassword(user) {
        this.sharedFunctions
            .postRequest("/user/user/changePassword", {
                userId: user.id,
                password: user.password,
            })
            .subscribe(
                (data) => { },
                (err) => {
                    if (this.sharedFunctions.isEmpty(err.error.message)) {
                        this.toastr.error("Internal Server Error");
                    } else {
                        this.toastr.error(err.error.message);
                    }
                }
            );
    }
    searchUsers() {
        const url = '/user/user'
        const params = {
            pageNo: 1,
            limit: 20,
            searchValue: this.search,
            searchOnAttributes: 'id,name,phone',
        }
        this.sharedFunctions.getRequest(url, params).subscribe(
            (data) => {
                this.searchData = true
                this.users = data.data
                var users = [];
                for (var user of JSON.parse(JSON.stringify(data.data))) {
                    user = this.selectRole(user, user.role, true);
                    users.push({ ...user, role: 1 });
                }
                this.users = users;
                this.totalItems = data.totalCount;
                this.loading = false;
            },
            (error) => { }
        );
    }
    removedSearchItems() {
        this.getUsers();
        this.search = ''
        this.searchData = false

    }

    setRoleId(id) {
        this.selectedRoleId = id;
        this.resetPager();
        this.setAssigningHeading();
        this.getUsers();
    }

    setAssigningHeading() {
        this.roles.filter((item) => {
            if (item.id == this.selectedRoleId) {
                if (item.id == RoleConstants.COMPANY_OWNER) {
                    this.assignHeading = "Company";
                } else if (item.id == RoleConstants.BU_MANAGER) {
                    this.assignHeading = "Business Unit";
                } else if (item.id != RoleConstants.ADMIN) {
                    this.assignHeading = "Location";
                } else {
                    this.assignHeading = null;
                }
            }
        });
    }

    isConsumer() {
        return Number(this.selectedRoleId) === RoleConstants.SUPERVISOR;
    }
    undoSearch() {
        this.getUsers();
        this.search = "";
        this.searchData = false
    }

    getCompanies() {
        this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
            (data) => {
                if (data && data.data && data.data.companies) {
                    this.companies = data.data.companies;
                } else {
                    this.companies = [];
                }
            },
            (error) => { }
        );
    }

    userRoleChanged(userIndex, value) {
        this.users[userIndex] = this.selectRole(
            this.users[userIndex],
            value,
            false
        );
    }

    selectRole(user, event, isSet) {
        var options = [];
        if (event == RoleConstants.BU_MANAGER) {
            user.isBU = true;
            user.isCompany = false;
            user.isLocation = false;
            if (isSet && user.business_units)
                for (var unit of user.business_units) {
                    options.push({ id: unit.id, name: unit.name });
                }
        } else if (event == RoleConstants.COMPANY_OWNER) {
            user.isBU = false;
            user.isCompany = true;
            user.isLocation = false;
            if (isSet && user.companies)
                for (var company of user.companies) {
                    options.push({ id: company.id, name: company.name });
                }
        } else {
            user.isBU = false;
            user.isCompany = false;
            user.isLocation = true;
            if (isSet && user.locations)
                for (var location of user.locations) {
                    if (location) options.push({ id: location.id, name: location.name });
                }
        }
        user.selectedOptions = options;
        user.selectedBU = "";
        user.selectedLoc = "";
        user.seletedCompany = "";
        user.isCheckedFeature = false;
        return user;
    }

    selectOption(index, option, list, optionName) {
        var selectedOption = list.filter((item) => item.id == option);
        if (selectedOption.length) {
            this.users[index].selectedOptions = this.users[
                index
            ].selectedOptions.filter((item) => item.id != selectedOption[0].id);
            this.users[index].selectedOptions.push({
                id: selectedOption[0].id,
                name: selectedOption[0].name,
            });
        }
        setTimeout(() => {
            var user = this.users[index];
            user[optionName] = "";
            this.users[index] = user;
        }, 1);
    }

    removeSelectedOption(userIndex, index) {
        this.users[userIndex].selectedOptions.splice(index, 1);
    }



    setDataRoleWise(user) {
        var form = {
            id: user.id,
            name: user.name,
            username: user.username,
            picture: user.picture,
            cnic_picture: user.cnic_picture,
            role: user.role,
            phone: user.phone,
            cnic: user.cnic,
            address: user.address,
            disabled: user.disabled,
        };
        var options = [];
        for (var option of user.selectedOptions) {
            options.push(option.id);
        }
        this.roles.filter((item) => {
            if (item.id == form.role) {
                if (item.id == RoleConstants.COMPANY_OWNER) {
                    form["companies"] = options;
                } else if (item.id == RoleConstants.BU_MANAGER) {
                    form["business_units"] = options;
                } else if (item.id != RoleConstants.ADMIN) {
                    form["locations"] = options;
                }
                //form.role = item.id;
            }
        });
        return form;
    }
}
