import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../shared";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { RoleConstants } from "app/constants/roles-constants"
import { Router } from '@angular/router';
import { createAotCompiler, isNgTemplate, rendererTypeName } from '@angular/compiler';
import { renderNode } from '@angular/core/src/view/util';
import { Key } from 'protractor';
import { KmlLayerManager } from '@agm/core';

@Component({
  selector: 'app-catalogue',
  templateUrl: './catalogue.component.html',
  styleUrls: ['./catalogue.component.scss']
})
export class CatalogueComponent implements OnInit {


  Event = {
    target: {

      files: [],
    },
  };
  constructor(
    private toastr: ToastsManager,
    vRef: ViewContainerRef,
    public sharedFunctions: SharedFunctionsService,
    lc: NgZone,
    private router: Router,
    private modalService: NgbModal,
  ) {

    this.toastr.setRootViewContainerRef(vRef);
  }
  updatedCatalogue = []
  catalogues = [];
  products = [];
  catalogueId = "";
  companyId = "";
  companies = [];
  search = "";
  @ViewChild("imageInput") imageInput;
  @ViewChild("newFileInput") newFileInput;
  @ViewChild("existingFileInput") existingFileInput;
  loading;
  product = [];
  params_id = [];
  catalogueProducts = [];
  selectedCatId = "";
  refModal1: any;
  itemsPerPage = 20;
  searchKey = ''
  currentPage = 1;
  totalItems = 0;
  paginationId = "catalogueListPage";
  activeIndex = -1;
  checkUploadType: any;
  selectedFileName = "";
  editProductCategories = [];
  editCategoryOption = {
    isEdit: true,
    copyCategories: [],
  };
  pagination(event) {
    this.currentPage = event;
    this.getCatalogueProducts();
  }
  resetPager() {
    this.products = [];
    this.currentPage = 1;
    this.totalItems = 0;
  }
  ngOnInit() {
    this.getCompanies();
    this.getCatalogueProducts();
  }
  getCompanies() {
    this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
      (data) => {
        if (data && data.data && data.data.companies) {
          this.companies = data.data.companies;
          let user = JSON.parse(localStorage.getItem("userData"));
          if (user.role.id == RoleConstants.COMPANY_OWNER) {
            this.companyId = this.companies[0].id;
          }
      }
      },
      (error) => { }
    )
  }
  getCompanyCatalogues() {
    this.catalogues = [];
    var params = {
      company_id:this.companyId
    };
    this.catalogueId=''
    if (this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
      params["company_id"] = this.companyId
    }
    var path = "/getCompanyCatalogues"
    this.sharedFunctions.getRequest(path, params).subscribe((data) => {
      if (data.code == "OK") {
        try {
          if (data.data && data.data.catalogues.length) {
            this.catalogues = data.data.catalogues;
          }
        } catch (e) {
          console.log(e);
        }
      }
    });
  }
  getCatalogueProducts() {
    var catalogues = []
    var params = {
      currentPage: this.currentPage,
      itemsPerPage: this.itemsPerPage,
      searchKey: this.searchKey,
      companyId: this.companyId,
      catalogueId: this.catalogueId
    }
    if (this.sharedFunctions.emptyOrAllParam(this.catalogueId, true)) {
      params["catalogueId"] = this.catalogueId;
      catalogues.push(params.catalogueId)
    }
    else if (this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
      params["companyId"] = this.companyId;
    }
    if (this.sharedFunctions.emptyOrAllParam(this.searchKey, true)) {
      params["searchKey"] = this.searchKey
    }
    var path = "/catalogueProducts"
    this.sharedFunctions.getRequest(path, params).subscribe((data) => {
      if (data.code == "OK") {
        try {
          this.loading = false;
          let ref = this;
          this.totalItems = data.data.totalItems;
          if (data.data.catalogues.length > 0) {
            data.data.catalogues.forEach(function (product, index) {
              product["index"] = index;
              if (product.barcode == "" || product.barcode == null) {
                product["hasBarcode"] = false;
              }
              else {
                product["hasBarcode"] = true;
              }
              product.consent_required = product.consent_required
                ? true
                : false;
              product.tax_inclusive = product.tax_inclusive
                ? true
                : false;
              product["cost_price"] = parseFloat(product["cost_price"]);
              product["mrp"] = parseFloat(
                product["mrp"]
              );
              product["stock_quantity"] = product.stock_quantity
                ? product.stock_quantity
                : 0;
              product["rowCount"] = ref.sharedFunctions.getRowCount(
                ref.itemsPerPage,
                ref.currentPage,
                index
              );
              catalogues.push(product);
              index++;
            });
            this.catalogueProducts = data.data.catalogues
            this.loading = false;
          } else {
            this.catalogueProducts = [];
          }
        } catch (e) {
          console.log(e);
        }
      }
    });
  }
  captureBarocde(product) {
    const printContent = document.getElementById(product.index);
    const WindowPrt = window.open(
      "",
      "",
      "left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0"
    );
    WindowPrt.document.write(printContent.innerHTML);
    WindowPrt.document.close();
    WindowPrt.focus();
    WindowPrt.print();
    WindowPrt.close();
  }
  editBarcode(product) {
    product.hasBarcode = false;
  }
  exportMasterCatalogue(forUpdate) {
    if (this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
      this.toastr.error("Please Select Company");
      return;
    }
    if (
      this.sharedFunctions.emptyOrAllParam(this.catalogueId, true)
    ) {
      this.toastr.error("Please Select Master Catalogue to take Dump");
      return;
    }
    var path =
      "/master/dump?catalogue_id="
      + this.companyId +
      "&forUpdate=" +
      forUpdate;
    this.sharedFunctions.getRequest(path, {}).subscribe((data) => {
      if (data.data) {
        window.open(data.data, "_self");
      }
    });
  }
  rowClick(index) {
    let user = JSON.parse(localStorage.getItem("userData"));
    if (this.activeIndex == index) this.activeIndex = -1;
    else this.activeIndex = index;
  }
  update(product) {
    let user = JSON.parse(localStorage.getItem("userData"));
    product["updated_by"] = user.id;
    debugger
    this.sharedFunctions.getRequest("/updateCatalogue", product)
      .subscribe((data) => {
        if (data == "OK") {
          try {
            if (data.data && data.data.updatedcatalogue) {
              this.updatedCatalogue = data.data.updatedCatalogue;
            }
          } catch (e) {
            console.log(e);
          }
        }
        this.toastr.success("Update success");
      });
  }
  onFileChange(event, check) {
    this.Event = event;
    this.checkUploadType = check;
    if (event.target && event.target.files && event.target.files[0]) {
      this.selectedFileName = event.target.files[0].name;
    }
  }
  removeFile() {
    this.selectedFileName = "";
    this.checkUploadType = null;
    this.Event = {
      target: {
        files: [],
      },
    };
  }
  updateMasterCatalogues(data) {
    let user = JSON.parse(localStorage.getItem("userData"));
    var obj = {
      file_name: data.name,
      file_url: data.file[0].extra.Location,
      user_id: user.id,
    };
    let url = "/product/updateMasterProducts";
    obj["company_id"] = this.companyId;
    this.sharedFunctions.postRequest(url, obj).subscribe((data) => {
      this.toastr.info("Master Catalogue update in progress");
    });
  }
  uploadImage() {
    let fileBrowser = this.Event.target;
    if (fileBrowser.files && fileBrowser.files[0]) {
      for (var file of fileBrowser.files) {
        let formData = new FormData();
        formData.append("file", file);
        this.sharedFunctions
          .postRequest(
            "/upload/uploadProductImageToS3",
            formData
          )
          .subscribe(
            (data) => {
              this.toastr.success(
                "File uploaded successfully. Your changes will be reflected soon"
              );
              this.removeFile();
            },
            (err) => {
              this.toastr.error("File upload failed");
            }
          );
      }
    }
  }
  reload() {
    this.loading = true;
    this.activeIndex = -1;
    this.companyId = "";
    this.catalogueId = "";
    this.resetPager();
    this.searchKey = "";
    this.ngOnInit();
  }
  findCatalogue(key) {
    if (key == "removeSearch") {
      this.searchKey = "";
    }
    this.resetPager();
    this.getCatalogueProducts();
  }
  openModal1(content) {
    if (this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
      this.toastr.error("Please Select Company");
      return;
    }
    this.refModal1 = this.modalService.open(content);
  }
  closeModal() {
    if (this.refModal1) this.refModal1.close();
  }
  onBoardCatalogues(data, isMaster) {
    let user = JSON.parse(localStorage.getItem("userData"));
    var obj = {
      file_name: data.name,
      file_url: data.file[0].extra.Location,
      user_id: user.id,
      bulk: true,
    };
    let url = isMaster
      ? "/product/onBoardMasterProducts"
      : "/product/onBoardProducts";
    isMaster ? (obj["company_id"] = this.companyId) : null;
    this.sharedFunctions.postRequest(url, obj).subscribe((data) => {
      this.toastr.info(" Catalogue on boarding in progress");
    });
  }
  uploadFile(product) {
    let fileBrowser = this.Event.target;
    if (fileBrowser.files && fileBrowser.files[0]) {
      let formData = new FormData();
      switch (this.checkUploadType) {
        case 1:
          var reqPath = "/upload/uploadUserImageToS3";
          formData.append("picture", fileBrowser.files[0]);
          break;
        case 2:
        case 3:
        case 5:
        case 6:
        case 7:
          var reqPath = "/upload/uploadFileToS3";
          formData.append("file", fileBrowser.files[0]);
          break;
        case 4:
          this.uploadImage();
          break;
      }
      this.closeModal();
      this.sharedFunctions.postRequest(reqPath, formData).subscribe(
        (data) => {
          if (data.success) {
            debugger
            this.toastr.success("File/Image uploaded successfully");
            switch (this.checkUploadType) {
              case 1:
                product.image_url = data.data.link
                break;
                case 2:
                case 3:
                case 4: 
                case 5:
                case 6:
                  this.onBoardCatalogues(data.data, true);
                  break;
              case 7:
                  this.updateMasterCatalogues(data.data);
                  break;
            }
          }
          else {
            this.toastr.error(data.message);
          }
        },
        (err) => { }
      );
    }
  }
}