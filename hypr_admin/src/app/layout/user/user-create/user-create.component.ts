import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { Router } from "@angular/router";
import { SharedFunctionsService } from "../../../shared";
import { RoleConstants } from "../../../constants/roles-constants";
import "rxjs/add/observable/throw";

@Component({
    selector: "app-user-create",
    templateUrl: "./user-create.component.html",
    styleUrls: ["./user-create.component.scss"],
})
export class UserCreateComponent implements OnInit {
    roles = [];
    locations = [];
    checkUploadType = 0;
    userForm = {
        name: "",
        username: "",
        password: "",
        picture: "",
        cnic_picture: "",
        confirmPassword: "",
        role: 7,
        phone: "",
        cnic: "",
        address: "",
    };
    event = {
        target: {
            files: [],
        },
    };
    isAdmin = false;
    companyId = "";
    isCompany = false;
    isBU = false;
    isLocation = false;
    businessUnits = [];
    companies = [];
    selectedOptions = [];
    selectedBU;
    selectedLoc;
    seletedCompany;
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    constructor(
        private sharedFunctions: SharedFunctionsService,
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private router: Router
    ) {
        this.toastr.setRootViewContainerRef(vRef);
    }

    ngOnInit() {
        this.getCompanies();
        this.getbusinessUnits();
        this.getlocations();
        this.getRoles();
    }
    onFileChange(event, type) {
        this.event = event;
        this.checkUploadType = type;
    }

    selectOption(option, list, optionName) {
        var selectedOption = list.filter((item) => item.id == option);
        if (selectedOption.length) {
            if (this.selectedOptions.indexOf(selectedOption[0]) < 0) {
                this.selectedOptions.push(selectedOption[0]);
            }
        }
        setTimeout(() => (this[optionName] = ""), 1);
    }

    removeSelectedOption(i) {
        this.selectedOptions.splice(i, 1);
        console.log(this.selectedOptions);
    }

    upload() {
        let fileBrowser = this.event.target;
        if (fileBrowser.files && fileBrowser.files[0]) {
            let formData = new FormData();
            formData.append("picture", fileBrowser.files[0]);
            this.sharedFunctions
                .postRequest("/upload/uploadUserImageToS3", formData)
                .subscribe(
                    (data) => {
                        if (data.success) {
                            if (this.checkUploadType == 1) {
                                this.userForm.picture = data.link;
                            } else {
                                this.userForm.cnic_picture = data.link;
                            }
                            this.toastr.success("Image uploaded successfully");
                        }
                        else {
                            this.toastr.error(data.message);
                        }
                    },
                    (err) => { }
                );
        }
    }
    createUser(form) {
        if (
            !form.name ||
            !form.username ||
            !form.password ||
            !form.confirmPassword ||
            !form.role ||
            !form.phone
        ) {
            this.toastr.error("Please fill all fields");
            return false;
        }
        if (form.password != form.confirmPassword) {
            this.toastr.error("Password do not match");
            return false;
        }
        if (this.selectedOptions.length == 0) {
            this.toastr.error("Please assign asset to user");
            return false;
        }
        form = this.setDataRoleWise(form);
        this.sharedFunctions.postRequest("/user/user/signup", form).subscribe(
            (data) => {
                this.toastr.success("User created successfully");
                this.router.navigateByUrl("/user/edit");
            },
            (err) => {
                console.log(err);
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
            },
            () => console.log("yay")
        );
    }

    setDataRoleWise(form) {
        var form = JSON.parse(JSON.stringify(form));
        if (form.locations) {
            delete form.locations;
        }
        if (form.business_units) {
            delete form.business_units;
        }
        if (form.companies) {
            delete form.companies;
        }
        form["roles"] = [form.role]
        var options = [];
        for (var option of this.selectedOptions) {
            options.push(option.id);
        }
        this.roles.filter((item) => {
            if (item.id == form.role) {
                if (item.id == RoleConstants.COMPANY_OWNER) {
                    form["companies"] = options;
                } else if (item.id == RoleConstants.BU_MANAGER) {
                    form["business_units"] = options;
                } else {
                    form["locations"] = options;
                }
                form.role = item.id;
            }
        });
        if (form.role) {
            delete form.role;
        }
        return form;
    }

    getlocations() {
        this.sharedFunctions
            .getRequest("/config/location/getAll")
            .subscribe((data) => {
                if (data && data.data && data.data.locations) {
                    this.locations = data.data.locations;
                }
                else {
                    this.locations = [];
                }
            });
    }

    getbusinessUnits() {
        this.sharedFunctions.getRequest("/config/businessunit/getAll").subscribe(
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
            (error) => { }
        );
    }

    getCompanies() {
        this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
            (data) => {
                if (data && data.data && data.data.companies) {
                    this.companies = data.data.companies;
                }
                else {
                    this.companies = [];
                }
            },
            (error) => { }
        );
    }

    getRoles() {
        this.sharedFunctions
            .getRequest("/rbac/roles")
            .subscribe((data) => {
                this.roles = data.data;
                if (this.roles.length > 0) {
                    this.selectRole(this.roles[0].id);
                }
            });
    }

    selectRole(event) {
        if (event == RoleConstants.BU_MANAGER) {
            this.isBU = true;
            this.isCompany = false;
            this.isLocation = false;
        } else if (event == RoleConstants.COMPANY_OWNER) {
            this.isBU = false;
            this.isCompany = true;
            this.isLocation = false;
        } else {
            this.isBU = false;
            this.isCompany = false;
            this.isLocation = true;
        }
        this.selectedOptions = [];
        this.selectedBU = "";
        this.selectedLoc = "";
        this.seletedCompany = "";
    }
}
