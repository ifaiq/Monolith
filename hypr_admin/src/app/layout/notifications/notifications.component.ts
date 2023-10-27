
import { Component, OnInit } from '@angular/core';
import { ViewContainerRef } from "@angular/core";
import { ToastsManager } from "ng2-toastr/ng2-toastr";
import { SharedFunctionsService } from "../../shared";
import {consumerAppUrl} from '../../constants/deep-link'

@Component({
  selector: 'notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  channel = "";
  typeMessage = "";
  itemsPerPage = 20;
  currentPage = 1;
  totalItems = 0;
  paginationId = "notificationListPage";
  messages = [];
  activeIndex = -1;
  messageCopy = null;
  loading = false;
  companies = [];
  companyId = "";
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
path= consumerAppUrl;
  /*Event = {
    target: {
      files: [],
    },
  };
  selectedFileName = "";*/


  constructor(
    private toastr: ToastsManager,
    vRef: ViewContainerRef,
    public sharedFunctions: SharedFunctionsService
  ) {
    this.toastr.setRootViewContainerRef(vRef);
    this.getCompanies();
  }

  ngOnInit() {
    this.getAllMessages();
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
        (error) => {
          console.log("Failed getting locations", error.message)
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
                console.log(e);
            }
        }
    });
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
        console.log("Failed getting companies info", error.message)
      }
    );
  }
  pagination(event) {
    this.currentPage = event;
    this.getAllMessages();
  }

  resetPager() {
    this.currentPage = 1;
    this.totalItems = 0;
  }

  rowClick(i) {
    if (this.activeIndex == i) {
      this.activeIndex = -1;
      this.messages[i] = JSON.parse(JSON.stringify(this.messageCopy));
    } else {
      this.activeIndex = i;
      this.messageCopy = JSON.parse(JSON.stringify(this.messages[i]));
    }
  }

  updateMessage(index) {
    var message = this.messages[index];
    if (message.title) message.title = message.title.trim();
    if (message.text) message.text = message.text.trim();
    if (!message.text) {
      this.toastr.error("Message Text is required");
      return;
    }
    if (!message.companyId) {
      this.toastr.error("Message Company is required");
      return;
    }
    if (!message.channelType.length) {
      this.toastr.error("Atleast one channel type is required");
      return;
    } 
    if (!message.messageType.length) {
      this.toastr.error("Atleast one message type is required");
      return;
    }
    let url = `/notification/notification-messages/${message.id}`;
    var param = {
      title: message.title,
      text: message.text,
      imageUrl: message.imageUrl,
      launchUrl: this.path,
      channelType: message.channelType,
      messageType: message.messageType
    };
    this.sharedFunctions.putRequest(url, param).subscribe(
      (data) => {
        if (data['data'].id) {
          this.messages[index].shortText = message.text.length > 50 ? message.text.slice(0, 50) + "......" : message.text
          this.messageCopy = JSON.parse(JSON.stringify(this.messages[index]));
          this.activeIndex = -1;
          this.getAllMessages(false);
        }
        this.toastr.success("Message updated successfully");
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

  removeMessage(messageId) {
    let url = `/notification/notification-messages/${messageId}`
    let param = {
      id: messageId
    };
    this.sharedFunctions.deleteRequest(url, param).subscribe(
      (data) => {
        if (data.code == "OK") {
          this.toastr.success("Message removed successfully");
        }
        this.getAllMessages(false);
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

  companyChanged() {
    this.resetPager();
    this.getAllMessages();
  }

  getAllMessages(isRefresh?) {
    this.loading = true;
    this.messages = [];
    if (isRefresh) {
      this.resetPager();
      this.companyId = "";
    }
    var params = {
      limit: this.itemsPerPage,
      pageNo: this.currentPage,
    };
    if (this.companyId) {
      params["companyId"] = this.companyId;
    }
    this.sharedFunctions.getRequest("/notification/notification-messages", params).subscribe(
      (data) => {
        if (data.code == "OK") {
          try {
            if (data.data && data.data.length) {
              let tempData = data.data;
              let messages = [];
              for (var index = 0; index < tempData.length; index++) {
                messages.push({
                  rowCount: this.sharedFunctions.getRowCount(
                    this.itemsPerPage,
                    this.currentPage,
                    index
                  ),
                  title: tempData[index].title,
                  text: tempData[index].text,
                  id: tempData[index].id,
                  imageUrl: tempData[index].imageUrl,
                  companyId: tempData[index].companyId ? tempData[index].companyId : 0,
                  companyName: tempData[index].companyId && tempData[index].companyId.name ? tempData[index].companyId.name : "Retailo",
                  shortText: tempData[index].text.length > 100 ? tempData[index].text.slice(0, 100) + "......" : tempData[index].text,
                  channelType: JSON.parse(tempData[index].channelType),
                  messageType: JSON.parse(tempData[index].messageType),
                  templateName: tempData[index].templateName,
                })
              }
              this.totalItems = data.pagination.totalCount;
              this.messages = messages;
            }
          } catch (e) {
            console.log(e);
          }
        }
        this.loading = false;
      },
      (error) => {
        this.toastr.error(error.error.message);
        this.loading = false;
      }
    );
  }

  messageCompanyChanged(message) {
    try {
      let selectedCompany = this.companies.filter(item => item.id == message.companyId)[0];
      if (selectedCompany) {
        message.company_name = selectedCompany.name;
      }
    }
    catch (e) {

    }
  }

  removeImage(message) {
    message.image_url = "";
  }

  onFileChange(event, message, index) {
    if (event.target && event.target.files && event.target.files[0]) {
      let fileBrowser = event.target;
      if (fileBrowser.files && fileBrowser.files[0]) {
        let formData = new FormData();
        var reqPath = "/upload/uploadUserImageToS3";
        formData.append("picture", fileBrowser.files[0]);
        this.sharedFunctions.postRequest(reqPath, formData).subscribe(
          (data) => {
            if (data.success) {
              if (index == this.activeIndex) {
                message.image_url = data.data.link;
                this.toastr.success("File/Image uploaded successfully");
              }
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
    let fileForm:any = document.getElementById("upload-image-"+index);
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
    this.path = consumerAppUrl + "/products"
}

addChannelType(channelType, event, msgIndex) {
  if (event.target.checked) {
      this.messages[msgIndex].channelType.push(channelType);
  } else {
    this.messages[msgIndex].channelType = this.messages[msgIndex].channelType.filter(
      _channelType => _channelType !== channelType
    );
  }
}

addMessageType(messageType, event, msgIndex) {
  if (event.target.checked) {
    this.messages[msgIndex].messageType.push(messageType);
  } else {
    this.messages[msgIndex].messageType = this.messages[msgIndex].messageType.filter(
      _messageType => _messageType !== messageType
    );
  }
}

isChannelIncluded(channelType, msgIndex) {
  return this.messages[msgIndex].channelType.includes(channelType);
}

isMessageTypeIncluded(messageType, msgIndex) {
  return this.messages[msgIndex].messageType.includes(messageType);
}

}