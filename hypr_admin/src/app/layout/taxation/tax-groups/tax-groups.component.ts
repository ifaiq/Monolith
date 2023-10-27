import { Component, OnInit } from '@angular/core';
import { SharedFunctionsService } from 'app/shared';
import { RoleConstants } from "app/constants/roles-constants";
import { empty } from 'rxjs/Observer';
import { ToastsManager } from 'ng2-toastr/src/toast-manager';
@Component({
  selector: 'app-tax-groups',
  templateUrl: './tax-groups.component.html',
  styleUrls: ['./tax-groups.component.scss']
})
export class TaxGroupsComponent implements OnInit {
  activeIndex = -1;
  taxGroups = [];
  loading = false;
  companyId = "";
  companies = [];
  selectedLocationId = "";
  selectedBusinessUnitId = "";
  locations = [];
  businessUnits = [];
  selectedCategory = "";
  selectedSubCategory = "";
  categories = [];
  selectedCategories = [];
  subCategories = [];
  taxCodes = [];
  searchedTaxGroupName: ""

  constructor(
    private toaster: ToastsManager,
    public sharedFunctions: SharedFunctionsService
  ) { }

  ngOnInit() {
    this.SearchTaxGroups('');
    this.getbusinessUnits();
    this.getCompanies();
    this.getlocations();
  }

  refresh() {
    this.loading = true;
    this.activeIndex = -1;
    this.companyId = "";
    this.selectedCategory = "",
    this.selectedLocationId = "",
    this.searchedTaxGroupName = "";
    this.ngOnInit();
}

  setActiveIndex(param, index, id?: string) {
    if (this[param] == index) {
        this[param] = -1;
    } else {
        this.loading = true;
        this[param] = index;
        const url = "/taxation/api/v1/tax-groups/" + id;
        this.sharedFunctions.getRequest(url).subscribe((data) => {
          if (data && data.data) {
            this.taxCodes = data.data && data.data.taxCodes;
          }
          this.loading = false;
        }, err => {
            this.loading = false;
            this.toaster.error(err.error.errors[0].name);
        });
    }
  }

  SearchTaxGroups(refresh?: string) {
    let params = {};
    this.loading = true;
    this.activeIndex = -1;
    if (this.searchedTaxGroupName) {
      params["name"] = this.searchedTaxGroupName;
    }
    if (!this.sharedFunctions.emptyOrAllParam(this.selectedCategory)) {
      params["type"] = this.selectedCategory;
    }
    if (!this.sharedFunctions.emptyOrAllParam(this.selectedLocationId)) {
      params["locationId"] = this.selectedLocationId;
    }
    let url = `/taxation/api/v1/tax-groups`;
    this.sharedFunctions.getRequest(url, params).subscribe((data) => {
        if (data && data.data) {
          this.taxGroups = data.data;
        }
        this.loading = false;
      }, err => {
          this.loading = false;
          this.toaster.error(err.error.errors[0].name);
      });
  }

  undoSearch() {
    this.loading = true;
    this.searchedTaxGroupName = "";
    this.SearchTaxGroups();
  }

  resetCategory() {
    this.selectedCategory = "";
    this.selectedSubCategory = "";
    this.categories = [];
    this.subCategories = [];
  }

  resetLocations() {
    this.selectedLocationId = "";
    this.locations = [];
    this.resetCategory();
  }

  resetBUUnit() {
    this.businessUnits = [];
    this.selectedBusinessUnitId = "";
    this.resetLocations();
  }

  getbusinessUnits() {
    this.resetBUUnit();
    let params = {};
    if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
        params["companyId"] = this.companyId;
    } else if (this.sharedFunctions.isCompanyListPerm()) {
        return;
    }
    const path = "/config/businessunit/getAll";
    this.sharedFunctions.getRequest(path, params).subscribe((data) => {
        if (data.code == "OK") {
            try {
                if (data.data && data.data.length) {
                    this.businessUnits = data.data;
                }
            } catch (err) {
              this.toaster.error(err.error.errors[0].name);
            }
        }
    });
  }

  getCompanies() {
    this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
        (data) => {
            if (data && data.data && data.data.companies) {
                this.companies = data.data.companies;
                let user = JSON.parse(localStorage.getItem("userData"));
                if (user.role.id == RoleConstants.COMPANY_OWNER) {
                    this.companyId = this.companies[0].id;
                    this.getbusinessUnits();
                }
            } else {
                this.companies = [];
            }
        },
        (error) => {}
    );
  }

  getlocations() {
    let params = {};
    this.resetLocations();
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
    } else if (this.sharedFunctions.isBUListPerm()) {
        return;
    }
    const path = "/config/location/getAll";
    this.sharedFunctions.getRequest(path, params).subscribe(
        (data) => {
            if (data && data.data && data.data.locations) {
                this.locations = data.data.locations;
            } else {
                this.locations = [];
            }
        },
        (error) => {}
    );
  }

  categoryChanged() {
    this.SearchTaxGroups();
  }

}
