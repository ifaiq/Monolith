import { Component, OnInit } from '@angular/core';
import { RoleConstants } from 'app/constants/roles-constants';
// import { RoleConstants } from 'app/constants/roles-constants';
import { SharedFunctionsService } from 'app/shared';
import { ToastsManager } from 'ng2-toastr/src/toast-manager';

@Component({
  selector: 'app-tax-codes',
  templateUrl: './tax-codes.component.html',
  styleUrls: ['./tax-codes.component.scss']
})
export class TaxCodesComponent implements OnInit {
  activeIndex = -1;
  taxCodes = [];
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
  searchedTaxCode: ""

  constructor(
    private toaster: ToastsManager,
    public sharedFunctions: SharedFunctionsService
    ) { }

  ngOnInit() {
    this.SearchTaxCodes('');
    this.getbusinessUnits();
    this.getCompanies();
    this.getlocations();
  }

  refresh() {
    this.loading = true;
    this.activeIndex = -1;
    this.searchedTaxCode = "";
    this.selectedLocationId = "",
    this.companyId = "";
    this.ngOnInit();
}

  setActiveIndex(param, index) {
    const getTaxCodeByIDUrl = '/taxation/api/v1/tax-codes/' + this.taxCodes[index].id + '/tax-percentages';
    if (this[param] == index) {
        this[param] = -1;
    } else {
        this[param] = index;
        this.loading = true;
        this.sharedFunctions.getRequest(getTaxCodeByIDUrl).subscribe((data) => {
            this.taxCodes[index].taxPercentages = data.data.taxPercentages;
            this.loading = false;
        }, (err) => {
            this.loading = false;
            this.toaster.error('TAX PERCENTAGE ' + err.error.errors[0].name);
        })
    }
  }

  SearchTaxCodes(refresh?: string) {
    this.loading = true;
    this.activeIndex = -1;
    const url = "/taxation/api/v1/tax-codes/";
    let params= {};
    if (this.searchedTaxCode) {
      params["name"] = this.searchedTaxCode;
    }
    if (this.selectedLocationId) {
      params["locationId"] = this.selectedLocationId;
    }
    this.sharedFunctions.getRequest(url, params).subscribe((data) => {
      if (data && data.data) {
        this.taxCodes = data.data;
      }
      this.loading = false;
    }, err => {
      this.loading = false;
      this.toaster.error(err.error.errors[0].name);
    })
  }

  undoSearch() {
    this.loading = true;
    this.searchedTaxCode = "";
    this.SearchTaxCodes();
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

  compareDates(fromDate, toDate) {
    const compareDate = new Date().setHours(0, 0, 0, 0);
    const startDate = new Date(fromDate).setHours(0, 0, 0, 0);
    const endDate = new Date(toDate).setHours(0, 0, 0, 0);
    return compareDate <= endDate && compareDate >= startDate;
  }

}
