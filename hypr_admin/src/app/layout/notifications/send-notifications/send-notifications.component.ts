import { Component, OnInit } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { ViewContainerRef } from "@angular/core";
import { SharedFunctionsService } from '../../../shared';
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-send-notifications',
  templateUrl: './send-notifications.component.html',
  styleUrls: ['./send-notifications.component.scss']
})
export class SendNotificationsComponent implements OnInit {

  selectedAppId = "";
  selectedApp: any = {};
  apps = [];
  companyId = "";
  selectedBusinessUnitId = "";
  selectedLocationId = "";
  companies = [];
  businessUnits = [];
  locations = [];
  retailers = [];
  is_customer = 1;
  loading = false;
  itemsPerPage = 100;
  currentPage = 1;
  totalItems = 0;
  paginationId = "retailersListPage";
  allChecked = false;
  refMessageSelectionModel: any = null;
  file_name = "";
  file: any;

  search = "";

  constructor(
    private sharedFunctions: SharedFunctionsService,
    vRef: ViewContainerRef,
    private toastr: ToastsManager,
    private modalService: NgbModal
  ) {
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {
    this.getCompanies();
    this.getbusinessUnits();
    this.getlocations();
  }

  pagination(event) {
    this.allChecked = false;
    this.currentPage = event;
    this.getRetailers();
  }



  refresh() {
    this.selectedBusinessUnitId = "";
    this.selectedLocationId = "";
    //this.companyId = "";
    this.resetPager();
    /*if (this.selectedApp.is_customer) {
      this.getCompaniesByAppId();
    }
    else {
      this.getCompanies();
    }*/
    this.getbusinessUnits();
    this.getlocations();
    this.getRetailers();
  }

  resetPager() {
    this.allChecked = false;
    this.currentPage = 1;
    this.totalItems = 0;
  }

  getCompanies() {
    this.companyId = "";
    this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
      (data) => {
        if (data && data.data && data.data.companies) {
          this.companies = data.data.companies;
          if(this.companies.length > 0){
            this.companyId = this.companies[0].id;
            this.selectedAppId = "";
            this.getApps();
          }
        } else {
          this.companies = [];
        }
      },
      (error) => {
        this.companies = [];
      }
    );
  }

  getCompaniesByAppId() {
    this.companyId = "";
    let params = {
      app_id: this.selectedAppId
    }
    this.sharedFunctions.getRequest("/company/getCompaniesByAppId", params).subscribe(
      (data) => {
        if (data && data.data && data.data.companies) {
          this.companies = data.data.companies;
        } else {
          this.companies = [];
        }
      },
      (error) => {
        this.companies = [];
      }
    );
  }

  getlocations() {
    var params = {};
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
    }
    else if (this.sharedFunctions.isBUListPerm()) {
      return;
    }
    var path = "/config/location/getAll";
    this.sharedFunctions.getRequest(path, params).subscribe((data) => {
      if (data && data.data && data.data.locations) {
        this.locations = data.data.locations;
      } else {
        this.locations = [];
      }
    });
  }

  getbusinessUnits() {
    var params = {};
    this.resetBUUnit();
    this.getlocations();
    if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
      params["companyId"] = this.companyId;
    }
    else if (this.sharedFunctions.isCompanyListPerm()) {
      return;
    }
    var path = "/config/businessunit/getAll";
    this.sharedFunctions.getRequest(path, params).subscribe((data) => {
      if (data.code == "OK") {
        try {
          if (data.data && data.data.length) {
            this.businessUnits = data.data;
          }
        } catch (e) {
          console.log(e);
        }
      }
    });
  }

  resetLocations() {
    this.selectedLocationId = "";
    this.locations = [];
  }
  resetBUUnit() {
    this.businessUnits = [];
    this.selectedBusinessUnitId = "";
    this.resetLocations();
  }

  getData(isRefresh?) {
    if (isRefresh) {
      this.resetPager();
    }
    this.getRetailers();
  }

  getRetailers() {
    this.allChecked = false;
    this.loading = true;
    let path = "/notifications/getRetailersByAppId";
    let params = {
      page: this.currentPage,
      per_page: this.itemsPerPage,
      app_id: this.selectedAppId,
      is_customer: this.selectedApp.is_customer
    };
    if(this.search){
      params["phone"] = this.search;
    }
    if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
      params["company_id"] = this.companyId;
    }
    if (!this.sharedFunctions.emptyOrAllParam(this.selectedBusinessUnitId, true)) {
      params["business_unit_id"] = this.selectedBusinessUnitId;
    }
    if (!this.sharedFunctions.emptyOrAllParam(this.selectedLocationId, true)) {
      params["location_id"] = this.selectedLocationId;
    }
    this.sharedFunctions.getRequest(path, params).subscribe((data) => {
      if (data && data.data && data.data.retailers.length > 0) {
        var index = 0;
        var retailers = [];
        for (var retailer of data.data.retailers) {
          retailers.push({
            rowCount: this.sharedFunctions.getRowCount(
              this.itemsPerPage,
              this.currentPage,
              index
            ),
            name: retailer.name,
            phone: retailer.phone,
            id: retailer.id,
            checked: false,
            email: retailer.email,
            company_name: retailer.company_name
          });
          index += 1;
        }
        this.retailers = retailers;
        this.totalItems = data.data.totalCount;
      } else {
        this.retailers = [];
        this.totalItems = 0;
      }
      this.loading = false;
    }, (err) => {
      this.toastr.error(err.error.message);
      this.loading = false;
      this.retailers = [];
      this.totalItems = 0;
    });
  }



  appChanged(appId) {
    this.search = "";
    let app = this.apps.filter(item => item.id == appId);
    if (app.length && app[0].is_customer) {
      this.is_customer = 1;
      this.selectedBusinessUnitId = "";
      this.selectedLocationId = "";
    }
    else {
      this.is_customer = 0;
    }
    if (app.length > 0) {
      this.selectedApp = app[0];
    }
    else {
      this.selectedApp = {};
    }
    //this.companyId = "";
    if (!this.selectedApp.is_customer) {
      this.getbusinessUnits();
      this.getlocations();
    }
    this.getRetailers();
  }


  getApps() {
    let url = "/config/appversion";
    if(!this.companyId){
      return;
    }
    let params = {
      companyId: this.companyId,
      allData: true
    }
    this.sharedFunctions.getRequest(url, params)
      .subscribe((data) => {
        if (data.data && data.data.length > 0) {
          let apps = [];
          for (var index = 0; index < data.data.length; index++) {
            apps.push({
              id: data.data[index].id,
              name: data.data[index].name,
              is_customer: data.data[index].isCustomer
            })
          }
          this.apps = apps;
          if (this.apps.length > 0) {
            this.selectedAppId = this.apps[0].id;
            this.appChanged(this.selectedAppId);
          }
        }
      },
        (err) => {
            if (this.sharedFunctions.isEmpty(err.error.message)) {
                this.toastr.error("Internal Server Error");
            } else {
                this.toastr.error(err.error.message);
            }
        });
  }

  toggleAllSelection() {
    for (var index = 0; index < this.retailers.length; index++) {
      this.retailers[index].checked = this.allChecked;
    }
  }

  selectionChanged() {
    let selectedRetailters = this.retailers.filter(item => item.checked == true);
    if (selectedRetailters.length == this.retailers.length) {
      this.allChecked = true;
    }
    else {
      this.allChecked = false;
    }
  }

  openNotificationPopover(notificationSelection) {
    let selectedRetailters = this.retailers.filter(item => item.checked == true);
    if (selectedRetailters.length == 0) {
      if(this.file&&this.file_name){
        if(!this.companyId){
          this.toastr.error("Select company for retailers in selected file");
          return;
        }
        if(!this.selectedAppId){
          this.toastr.error("Select app for retailers in selected file");
          return;
        }
        this.refMessageSelectionModel = this.modalService.open(notificationSelection);
      }
      else{
        this.toastr.error("Select atleast one retailer to send notification");
      }
    }
    else {
      this.refMessageSelectionModel = this.modalService.open(notificationSelection);
    }
  }

  closeNotificationSelection(event) {
    if (event && event.isPUSH) {
      let params = {
        notifications: event.selectedNotifications
      }
      let selectedRetailters = this.retailers.filter(item => item.checked == true);
      if(selectedRetailters.length == 0){
        if(this.is_customer){
          if(this.companyId){
            this.loading = true;
            this.upload(params);
          }
          else{
            this.toastr.error("Select company for customers in selected file");
            if (this.refMessageSelectionModel) {
              this.refMessageSelectionModel.close();
            }
            return;
          }
        }
        else{
          this.loading = true;
          this.upload(params);
        }
      }
      else{
        this.loading = true;
        let retailers = [];
        for (var index = 0; index < selectedRetailters.length; index++) {
          retailers.push(selectedRetailters[index].id);
        }
        params["retailers"] = retailers;
        params["is_customer"] = this.selectedApp.is_customer;
        params["app_id"] = this.selectedAppId;
        let url = "/notifications/sendNotificationsToRetailers";
        this.sharedFunctions.postRequest(url, params).subscribe(result => {
          if (result.code == "OK") {
            this.toastr.success("Notifications sents successfully");
            this.refresh();
          }
          else {
            this.toastr.error("Notifications not sent try again later");
          }
        }, (err) => {
            if (this.sharedFunctions.isEmpty(err.error.message)) {
                this.toastr.error("Notifications not sent try again later");
            } else {
                this.toastr.error(err.error.message);
            }
        });
      }
    }
    if (this.refMessageSelectionModel) {
      this.refMessageSelectionModel.close();
    }
  }


  onChange(event: EventTarget) {
    let eventObj: MSInputMethodContext = <MSInputMethodContext>event;
    let target: HTMLInputElement = <HTMLInputElement>eventObj.target;
    let files: FileList = target.files;
    this.file = files[0];
    this.file_name = files[0].name;
  }

  upload(params) {
    let formData = new FormData();
    formData.append("file", this.file);
    this.sharedFunctions
      .postRequest("/upload/uploadFileToS3", formData)
      .subscribe(
        (data) => {
          if (data.success) {
            this.file_name = data.data.name;
            this.bulkSendNotifications(data.data, params);
          }
        },
        (err) => {
          
         }
      );
  }

  bulkSendNotifications(data,params) {
    let user = JSON.parse(localStorage.getItem("userData"));
    let obj = {
      file_name: data.name,
      user_id: user.id,
      file_url: data.file[0].extra.Location,
      is_customer: this.selectedApp.is_customer,
      app_id: this.selectedAppId,
      notifications: params.notifications
    };
    if(this.is_customer){
      obj["company_id"] = this.companyId;
    }
    this.sharedFunctions
      .postRequest("/notifications/bulkSendNotifications", obj)
      .subscribe((data) => {
        this.loading = false;
        this.toastr.success("Notifications sents successfully");
        try{
          this.clearFile();
        }
        catch(e){}
      },
      (err) => { 
        this.loading = false;
        if (this.sharedFunctions.isEmpty(err.error.message) && this.sharedFunctions.isEmpty(err.error.trace)) {
            this.toastr.error("Notifications not sent try again later");
        } else {
            if (err.error.trace) {
                this.toastr.error(err.error.trace);
            } else if (err.error.message) {
                this.toastr.error(err.error.message);
            }
        }
      })
  }
  clearFile(){
    try{
      let fileField:any = document.getElementById("file_upload_field");
      fileField.value = "";
      this.file = null;
    }
    catch(e){
    }
  }

  searchRetailers(){
    this.currentPage = 1;
    this.getRetailers();
  }

  undoRetSearch(){
    this.search = "";
    this.currentPage = 1;
    this.getRetailers();
  }
}
