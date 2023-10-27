import { Component, OnInit, ViewChild } from "@angular/core";
import { routerTransition } from "../../router.animations";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../shared";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { consumerAppUrl } from '../../constants/deep-link'
import { allLanguages, getLanguageFromCode } from "../../constants/language-constants";

@Component({
    selector: "app-dashboard",
    templateUrl: "./banners.component.html",
    styleUrls: ["./banners.component.scss"],
    animations: [routerTransition()],
})
export class BannersComponent implements OnInit {
    Event = {
        target: {
            files: [],
        },
    };
    screens = [
        {
            id: 1,
            name: 'home'
        },
        {
            id: 2,
            name: 'orders'
        },
        {
            id: 3,
            name: 'help'
        },
        {
            id: 4,
            name: 'category'
        },
        {
            id: 5,
            name: 'subcategory'
        },
        {
            id: 6,
            name: 'cart'
        },
        {
            id: 7,
            name: 'coupons'
        }
    ];
    previousLink = {
        route: "",
        param1: "",
        param2: "",
        location: "",
        businessUnit: ""
    }
    businessUnits = [];
    companyId = "";
    companies = [];
    selectedBusinessUnitId = "";
    catalogues = [];
    selectedScreen: '';
    categories = [];
    selectedCategories = [];
    selectedCategory = "";
    subCategories = [];
    selectedSubCategory = "";
    path = consumerAppUrl
    locations = [];
    locationBanners = [];
    selectedLocationId = "";
    banner = {
        imageFileName: "",
        locationId: this.selectedLocationId,
        image: "",
        imageFile: "",
        launchUrl: ""
    };
    disabled = false;
    activeIndex = 0;
    itemsToBeDeleted = [];
    refModalCreateProduct: any;
    loggedInUser: any = JSON.parse(localStorage.getItem("userData"));
    loading = false;
    customUrl="";
    showCustomUrlField=false;
    languages = allLanguages;
    getLanguageFromCode = getLanguageFromCode;
    selectedLanguage= '';
    hideFields = false;
    showdeleteLink = false;
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private modalService: NgbModal,
        public sharedFunctions: SharedFunctionsService
    ) {
        this.toastr.setRootViewContainerRef(vRef);
        this.getCompanies();
    }

    ngOnInit() {
        this.getLocations();
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
            (error) => {
                console.log("failed to get company data", error.message)
             }
        );
    }

    getCompanyCatalogues() {
        this.catalogues = [];
        let params = {};
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["company_id"] = this.companyId;
        } else if (this.sharedFunctions.isCompanyListPerm()) {
            return;
        }
        let path = "/getCompanyCatalogues?company_id=" + this.companyId;
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
    refresh() {
        this.loading = true;
        this.banner = {
            imageFileName: "",
            locationId: this.selectedLocationId,
            image: "",
            imageFile: "",
            launchUrl: "",
        };
        this.activeIndex = 0;
        this.itemsToBeDeleted = [];
        this.getLocations();
    }
    refreshCategories() {
        this.selectedScreen = ""
        this.selectedCategory = ""
        this.fetchCategories();
    }

    resetLocations() {
        this.selectedLocationId = "";
        this.locations = [];
        this.resetCategory();
    }
    fetchCategories() {
        if (
            !this.sharedFunctions.emptyOrAllParam(this.selectedLocationId, true)
        ) {
            this.getCategories();
        } else {
            this.resetCategory();
        }
    }
    resetBUUnit() {
        this.businessUnits = [];
        this.selectedBusinessUnitId = "";
        this.resetLocations();
    }
    getbusinessUnits() {
        if (!this.banner) {
            this.resetBUUnit();
        }
        let params = {};
        if (!this.sharedFunctions.emptyOrAllParam(this.companyId, true)) {
            params["companyId"] = this.companyId;
        } else if (this.sharedFunctions.isCompanyListPerm()) {
            return;
        }
        let path = "/config/businessunit/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe((data) => {
            if (data.code == "OK") {
                try {
                    if (data.data && data.data.length) {
                        this.businessUnits = data.data;
                        let businessUnit: any = this.businessUnits.filter(unit => unit.id === this.previousLink.businessUnit)
                        this.previousLink.businessUnit = businessUnit[0].name
                    }

                } catch (e) {
                    this.toastr.error(e.error.message)
                }
            }
        });
    }
    getLocationByBU() {
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
        let path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data && data.data && data.data.locations) {
                    this.locations = data.data.locations;
                } else {
                    this.locations = [];
                }
            },
            (err) => {
                this.toastr.error(err.error.message)
            }
        );
    }

    getLocations() {
        this.loading = true;
        var params = {};
        this.locations = [];
        var path = "/config/location/getAll";
        this.sharedFunctions.getRequest(path, params).subscribe(
            (data) => {
                if (data.code == "OK") {
                    if (data.data && data.data.locations) {
                        this.locations = data.data.locations;
                        this.selectedLocationId = this.locations[0].id;
                        this.getLocationBanners();
                        this.loading = false;
                        let locationFilter: any = this.locations.filter(location => location.id === this.selectedLocationId)
                        this.previousLink.location = locationFilter[0].name
                        this.previousLink.businessUnit = locationFilter[0].business_unit_id
                    }
                   
                }
            },
            (error) => {
                this.loading = false;
            }
        );
    }
    onSelectLocation(deviceValue) {
        console.log(deviceValue);
    }

    updateSelectedLanguage(language) {
        if (this.activeIndex) {
            this.locationBanners[this.activeIndex - 1] = {
                ...this.locationBanners[this.activeIndex - 1],
                language: language,
            };
        }

    }

    openModalCreateProduct(content, banner = null, i = null) {
        if (banner && banner.id) {
            this.banner["id"] = banner.id;
        this.selectedLanguage= banner.language;
        } else {
            this.selectedLanguage= '';
        }
        this.activeIndex = i ? i : 0;
        this.refModalCreateProduct = this.modalService.open(content);
        
        if (banner  && banner.launchUrl.includes(consumerAppUrl))  {
            this.showCustomUrlField = false
            this.customUrl = ""
            this.hideFields = false;
            this.showdeleteLink = false;
            const [route, param1, param2] = banner.launchUrl.replace(`${consumerAppUrl}/`, '').split('/');
            this.previousLink.param1 = param1
            this.previousLink.param2 = param2
            this.getbusinessUnits()
            if (banner.launchUrl === consumerAppUrl) {
                this.previousLink.route = ''
                this.previousLink.param1 = ''
                this.previousLink.param2 = ''
                return;
            }
            if (param1 !== undefined) {
                if (param2 !== undefined) {
                    this.previousLink.route = route === 'products' ? 'subcategory' : route,
                        this.getCategories(),
                        this.categoryChanged(event)
                } else {
                    this.previousLink.route = route === 'products' ? 'category' : route
                    if (this.previousLink.route === 'category') {
                        this.getCategories(),
                            this.categoryChanged(event)
                    }
                }
            }
            else {
                if (route === 'category') {
                    this.previousLink.route = 'home'
                }
                else {
                    this.previousLink.route = route
                }
            }
        }
        else {
            if(banner && !banner.launchUrl.includes(consumerAppUrl)) {
                this.showCustomUrlField = true
                this.customUrl = banner.launchUrl
            }
            else {
                this.showCustomUrlField = false
            }
            this.hideFields = true
            this.previousLink.route = ''
            this.previousLink.param1 = ''
            this.previousLink.param2 = ''
            this.resetModal()
        }
    }
    onFileChange(event) {
        this.Event = event;
        if (event.target && event.target.files && event.target.files[0]) {
            this.banner.imageFileName = event.target.files[0].name;
            this.banner.imageFile = event.target.files[0];
        } else {
            this.banner.imageFileName = "";
            this.banner.imageFile = null;
        }
    }
    removeFile() {
        this.banner.imageFileName = "";
        this.banner.imageFile = null;
    }
    uploadFile() {
        if (this.selectedLanguage === '') {
            this.toastr.error('Please Select Language First');
            return;
        } 
        if (this.banner && this.banner.imageFile) {
            this.loading = true;
            let formData = new FormData();
            var reqPath = "/upload/uploadUserImageToS3";
            formData.append("picture", this.banner.imageFile);
            this.refModalCreateProduct.close();
            this.sharedFunctions.postRequest(reqPath, formData).subscribe(
                (data) => {
                    if (this.activeIndex) {
                        this.locationBanners[this.activeIndex - 1] = {
                            image: data.data.link,
                            locationId: this.selectedLocationId,
                            id: this.banner["id"],
                            language: this.selectedLanguage,
                            launchUrl: consumerAppUrl
                        };
                    } else {
                        this.locationBanners.push({
                            image: data.data.link,
                            locationId: this.selectedLocationId,
                            language: this.selectedLanguage,
                            launchUrl: consumerAppUrl
                        });
                    }

                    this.loading = false;
                    this.removeFile();
                    if (data.success) {
                        this.toastr.success("File/Image uploaded successfully");
                    } else {
                        this.toastr.error(data.message);
                    }
                },
                (err) => { }
            );
        }
    }

    getLocationBanners() {
        this.loading = true;
        this.sharedFunctions
            .getRequest(
                "/config/locationbanner/" + this.selectedLocationId + "/banners", { order: 'priority:ASC' })
            .subscribe(
                (data) => {
                    this.locationBanners = data.data;
                    this.banner = {
                        imageFileName: "",
                        locationId: this.selectedLocationId,
                        image: "",
                        imageFile: "",
                        launchUrl: ""
                    };

                    this.disabled = this.locationBanners.length
                        ? this.locationBanners[0].disabled
                        : false;

                    this.activeIndex = 0;
                    this.itemsToBeDeleted = [];
                    this.loading = false;

                },
                (error) => {
                    this.loading = false;
                }
            );
    }
    deleteLocationBanners() {
        this.sharedFunctions
            .deleteRequest(
                `/config/locationbanner/${this.selectedLocationId}`,
                { banners: this.itemsToBeDeleted }
            )
            .subscribe(
                (data) => {
                    this.loading = false;
                },
                (error) => {
                    this.loading = false;
                }
            );
    }
    updateLocationBanners() {
        this.loading = true;
        if (this.itemsToBeDeleted.length) {
            this.deleteLocationBanners();
        }
        let updatedBanners = this.locationBanners.map((banner, index) => {
            banner.disabled = this.disabled;
            banner.locationId = parseInt(banner.locationId);
            banner.priority = index + 1;
            return banner;
        });

        this.sharedFunctions
            .putRequest(
                "/config/locationbanner/" + this.selectedLocationId + "/banners",
                { banners: updatedBanners }
            )
            .subscribe(
                (data) => {
                    this.getLocationBanners();
                },
                (error) => {
                    this.toastr.error(error.error.message);
                    this.loading = false;
                }
            );
    }
    deleteBanner(banner, i) {
        this.locationBanners.splice(i, 1);
        if (banner.id) {
            this.itemsToBeDeleted.push(banner.id);
        }
    }
    getScreenName() {
        this.screens
    }

    setPath(scr, banner) {
        banner.launchUrl = this.path
        this.screens.forEach(item => {
            if (parseInt(scr) === item.id && item.name === 'home') {
                banner.launchUrl = banner.launchUrl + '/category'
            }
            else if (parseInt(scr) === item.id && (item.name === 'category' || item.name === 'subcategory')) {
                this.path = this.path + `/products`
            }
            else if (parseInt(scr) === item.id) {
                this.path = this.path + `/${item.name}`
                banner.launchUrl = this.path
            }
        })
        if (this.selectedCategory) {
            this.path = this.path + `/${scr}`
            banner.launchUrl = this.path
        }
    }

    resetScreen() {
        this.selectedScreen = ""
    }
    hasPrefix(url) {
        let testPattern = /^[a-z0-9]+:\/\//.test(url);
        if (testPattern) {
            return true
        }
        else {
            if (this.customUrl === "") {
                return true
            }
            else {
                return false
            }
        }
    }
    updateLink(banner) {
        this.customUrl = this.hasPrefix(this.customUrl) ? this.customUrl : `https://${this.customUrl}`
        this.loading = true;
        let updatedBanners = this.locationBanners.map((banner) => {
            banner.disabled = this.disabled;
            banner.locationId = parseInt(banner.locationId);
            return banner;
        });
        const data = updatedBanners.filter((item) => item.id === banner.id)
        if (data.length) {
            data[0].launchUrl = banner.launchUrl ? banner.launchUrl : this.customUrl ? this.customUrl : consumerAppUrl
            const mergeArrayWithObject = updatedBanners && updatedBanners.map(t => t.id === banner.id ? data[0] : t);
            this.sharedFunctions
                .putRequest(
                    "/config/locationbanner/" + this.selectedLocationId + "/banners",
                    { banners: mergeArrayWithObject }
                )
                .subscribe(
                    (data) => {
                        this.getLocationBanners();
                        if (data['success']) {
                            this.toastr.success("Link uploaded successfully");
                        }
                    },
                    (error) => {
                        this.toastr.error(error.error.message);
                        this.loading = false;
                    }
                );
                this.refModalCreateProduct.close();
        }
        else {
            this.toastr.error("Please upload a file first");
            this.loading = false
        }
    }

    resetPath() {
        this.path = consumerAppUrl

    }
    setScreen(scr) {
        this.selectedScreen = scr
        this.selectedCategory = ""
        this.subCategories = []
        this.previousLink.route=""
        this.previousLink.param1=""
        this.previousLink.param2=""
        this.resetPath()
        this.getCategories()
    }
    resetCategory() {
        this.path = consumerAppUrl + "/products"
    }

    categoryChanged(event) {
        this.sharedFunctions.getRequest("/api/v1/category", {
            categoryId: this.selectedCategory || this.previousLink.param1,
            perPage: 50, page: 1
        }).subscribe((data) => {
            this.subCategories = data.data.categories
            if (this.previousLink.param2) {
                let filteredCat: any = this.subCategories.filter(item => item.id == this.previousLink.param2)
                this.previousLink.param2 = filteredCat[0].name
            }

        }, (err) => {
            this.toastr.error(err.error.message)
        })
        this.resetCategory()

    }

    getCategories() {
        this.sharedFunctions
        this.sharedFunctions.getRequest("/api/v1/category", {
            locationId: this.selectedLocationId || this.previousLink.location,
            perPage: 50, page: 1
        }).subscribe((data) => {
            var categories = data.data;
            for (var category of categories) {
                category["selected"] = false;
                if (category.sub_categories) {
                    for (var subCat of category.sub_categories) {
                        subCat["selected"] = false;
                    }
                }
            }
            this.categories = categories.categories
            if (this.previousLink.param1) {
                let filteredCat: any = this.categories.filter(item => item.id == this.previousLink.param1)
                this.previousLink.param1 = filteredCat[0].name
            }
        }, (err) => {
            this.toastr.error(err.error.message)
        })

    }
    resetModal() {
        this.selectedScreen = ""
        this.selectedCategory = ""
        this.subCategories = []
        this.resetPath()
    }

    createCustomUrl(value) {
        if (value === 'removeUrl') {
            if (this.customUrl !== '') {
                this.showdeleteLink = true;
            }
            else {
                this.showdeleteLink = false;
            }
            this.customUrl = ""
            this.showCustomUrlField = false
        }
    }
    showInputField() {
        this.showCustomUrlField = true
        this.hideFields = true
    }
    showScreensDropdown() {
        this.hideFields = false;
        this.showCustomUrlField = false

    }
    deleteLink(banner, value) {
        let updatedBanners = this.locationBanners.map((banner) => {
            banner.disabled = this.disabled;
            banner.locationId = parseInt(banner.locationId);
            return banner;
        });
        const data = updatedBanners.filter((item) => item.id === banner.id)
        
        if(value === 'no') {
            this.refModalCreateProduct.close();
            this.showdeleteLink = false
        }
        else {
            if (data.length) {
                data[0].launchUrl = consumerAppUrl
                const mergeArrayWithObject = updatedBanners && updatedBanners.map(t => t.id === banner.id ? data[0] : t);
                this.sharedFunctions
                    .putRequest(
                        "/config/locationbanner/" + this.selectedLocationId + "/banners",
                        { banners: mergeArrayWithObject }
                    )
                    .subscribe(
                        (data) => {
                            this.getLocationBanners();
                            if (data['success']) {
                                this.toastr.success("Link deleted successfully");
                            }
                        },
                        (error) => {
                            this.toastr.error(error.error.message);
                            this.loading = false;
                        }
                    );
                    this.refModalCreateProduct.close();
            }
        }
    }
}
