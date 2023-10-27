import { Component, OnInit } from "@angular/core";
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../shared";
import { Router } from "@angular/router";
import { consumerAppUrl } from "app/constants/deep-link";

@Component({
    selector: "create-notification-message",
    templateUrl: "./create-notification-message.component.html",
    styleUrls: ['./notifications.component.scss']
})
export class CreateNotificationMessageComponent implements OnInit {
    channel = "";
    typeMessage = "";
    channelType: any = [];
    messageType: any = [];
    Event = {
        target: {
            files: [],
        },
    };
    selectedFileName = "";
    message = {
        templateName: "",
        title: "",
        text: "",
        companyId: "",
        imageUrl: "",
        launchUrl: "",
        channelType: [],
        messageType: []
    };
    screens=[
        {
            id:1,
            name: 'home'
        },
        {
            id:2,
            name: 'orders'
        },
        {
            id:3,
            name: 'help'
        },
        {
            id:4,
            name: 'category'
        },
        {
            id:5,
            name: 'subcategory'
        },
        {
            id:6,
            name: 'cart'
        },
        {
            id:7,
            name: 'coupons'
        },
        {
            id: 8,
            name: 'loyalty'
        },
        {
            id: 9,
            name: 'recommended'
        },
        {
            id: 10,
            name: 'search'
        },
        {
            id: 11,
            name: 'previousItem'
        },
        {
            id: 12,
            name: 'likedItem'
        },
    ];
    businessUnits = [];
    companyId = "";
    selectedBusinessUnitId = "";
    selectedLocationId = "";
    locations =[];
    catalogues = [];
    selectedScreen:'';
    categories = [];
    selectedCategories = [];
    selectedCategory = "";
    subCategories = [];
    selectedSubCategory = "";
    path = consumerAppUrl
    companies = [];
    constructor(
        private toastr: ToastsManager,
        vRef: ViewContainerRef,
        private sharedFunctions: SharedFunctionsService,
        private router: Router
    ) {
        this.toastr.setRootViewContainerRef(vRef);
        this.getCompanies();
    }

    ngOnInit() {
        this.getbusinessUnits();
        this.getlocations();
    }
    resetLocations() {
        this.selectedLocationId = "";
        this.locations = [];
        this.resetCategory();
    }
    refresh() {
        this.selectedScreen=""
        this.selectedCategory=""
        this.fetchCategories();
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
            (err) => {
                this.toastr.error(err.error.message)
            }
        );
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
                } catch (e) {
                    this.toastr.error(e)
                }
            }
        });
    }

    getCompanies() {
        this.sharedFunctions.getRequest("/config/company/getAll").subscribe(
            (data) => {
                if (data && data.data && data.data.companies) {
                    this.companies = data.data.companies;
                    this.message.companyId = this.companies[0].id;                 
                } else {
                    this.companies = [];
                }
            },
            (err) => {
                this.toastr.error(err.error.message)
             
             }
        );
    }

    createMessage() {
        let url = "/notification/notification-messages";
        if (this.message.title) this.message.title = this.message.title.trim();
        if (this.message.text) this.message.text = this.message.text.trim();
        this.message.launchUrl = this.path
        if (!this.message.templateName) {
            this.toastr.error("Template Name is required");
            return;
        }
        if (!this.message.text) {
            this.toastr.error("Message Text is required");
            return;
        }
        if (!this.message.companyId) {
            this.toastr.error("Message Company is required");
            return;
        }
        if (!this.message.channelType.length) {
            this.toastr.error("Atleast one channel type is required");
            return;
        } 
        if (!this.message.messageType.length) {
            this.toastr.error("Atleast one message type is required");
            return;
        }
        this.sharedFunctions.postRequest(url, {
            templateName: this.message.templateName,
            title: this.message.title,
            text: this.message.text,
            imageUrl: this.message.imageUrl,
            launchUrl: this.message.launchUrl,
            companyId: parseInt(this.message.companyId),
            channelType: this.message.channelType,
            messageType: this.message.messageType,
        }).subscribe(
            (data) => {
                this.toastr.success("Notification added successfully");
                this.router.navigateByUrl("/notifications");
            },
            (err: any) => {
                if (this.sharedFunctions.isEmpty(err.error.message)) {
                    this.toastr.error("Internal Server Error");
                } else {
                    this.toastr.error(err.error.message);
                }
            }
        );
    }

    removeImage() {
        this.message.imageUrl = "";
    }

    onFileChange(event, index) {
        if (event.target && event.target.files && event.target.files[0]) {
            let fileBrowser = event.target;
            if (fileBrowser.files && fileBrowser.files[0]) {
                let formData = new FormData();
                var reqPath = "/upload/uploadUserImageToS3";
                formData.append("picture", fileBrowser.files[0]);
                this.sharedFunctions.postRequest(reqPath, formData).subscribe(
                    (data) => {
                        if (data.success) {
                            this.message.imageUrl = data.data.link;
                            this.toastr.success("File/Image uploaded successfully");
                            this.removeFile(index);
                        } else {
                            this.toastr.error(data.message);
                        }
                    },
                    (err) => { }
                );
            }
        }
    }

    removeFile(index) {
        let fileForm: any = document.getElementById("upload-image-" + index);
        fileForm.reset();
    }
    resetPath() {
        this.path = consumerAppUrl

    }
    setScreen(scr) {
        this.selectedScreen = scr,
        this.selectedCategory=""
        this.subCategories=[]
        this.resetPath()
    }

    setPath(scr) {
        this.screens.forEach(item => {
            
            if(parseInt(scr) === item.id && item.name === 'home' ) {
                this.path = this.path + '/category'
            }
            
            else if(parseInt(scr) === item.id &&( item.name === 'category' || item.name==='subcategory')) {
                this.path = this.path + `/products`
               
               
            }
           else if (parseInt(scr) === item.id ) {
                this.path = this.path + `/${item.name}`
            }
            
            

        })
       if(this.selectedCategory) {
        this.path = this.path + `/${scr}`
    }
        
        
    }
    addChannelType(channelType, event) {
        if (event.target.checked) {
            this.message.channelType.push(channelType);
        } else {
            this.message.channelType = this.message.channelType.filter(
                _channelType => _channelType !== channelType
            );
        }
    }

    addMessageType(messageType, event) {
        if (event.target.checked) {
            this.message.messageType.push(messageType);
        } else {
            this.message.messageType = this.message.messageType.filter(
                _messageType => _messageType !== messageType
            );
        }
    }

    categoryChanged(event) {
        this.sharedFunctions.getRequest("/api/v1/category", {categoryId: this.selectedCategory, 
            perPage: 10, page: 1}).subscribe((data)=>{
            this.subCategories = data.data.categories
            
        },(err) => {
            this.toastr.error(err.error.message)
        })
        this.resetCategory()
    }

    getCategories() {
        this.sharedFunctions.getRequest("/api/v1/category", {locationId: this.selectedLocationId, 
            perPage: 50, page: 1}).subscribe((data)=>{
            let categories = data.data;
                for (let category of categories) {
                    category["selected"] = false;
                    if (category.sub_categories) {
                        for (let subCat of category.sub_categories) {
                            subCat["selected"] = false;
                        }
                    }
                }
                this.categories = categories.categories
        },(err) => {
            this.toastr.error(err.error.message)
        })

    }
    resetCategory() {
        if (this.selectedScreen) {
            this.path = consumerAppUrl + "/products"
        }
    }
}