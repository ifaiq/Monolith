import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SharedFunctionsService } from '../../../shared';


@Component({
    selector: 'notification-selection',
    templateUrl: './message-selection.component.html'
})
export class NotificationSelectionComponent implements OnInit {
    itemsPerPage = 20;
    currentPage = 1;
    totalItems = 0;
    paginationId = "notificationSelectionListPage";
    messages = [];
    loading = false;
    allChecked = false;
    selectedNotifications = [];
    @Output() closeNotificationSelection = new EventEmitter();
    @Input() companyId=0;

    constructor(private sharedFunctions: SharedFunctionsService, private toastr: ToastsManager) { }

    ngOnInit() {
        this.getAllMessages();
    }

    pagination(event) {
        this.allChecked = false;
        this.currentPage = event;
        this.getAllMessages();
    }

    resetPager() {
        this.currentPage = 1;
        this.totalItems = 0;
    }

    toggleAllSelection() {
        for (var index = 0; index < this.messages.length; index++) {
            this.messages[index].checked = this.allChecked;
            let existingIndex = this.selectedNotifications.indexOf(this.messages[index].id);
            if (this.allChecked && existingIndex == -1) {
                this.selectedNotifications.push(this.messages[index].id);
            }
            if (!this.allChecked && existingIndex != -1) {
                this.selectedNotifications.splice(existingIndex, 1);
            }
        }
    }

    selectionChanged(i) {
        let selectedMessage = this.messages[i];
        let existingIndex = this.selectedNotifications.indexOf(selectedMessage.id);
        if (selectedMessage.checked && existingIndex == -1) {
            this.selectedNotifications.push(selectedMessage.id);
        }
        if (!selectedMessage.checked && existingIndex != -1) {
            this.selectedNotifications.splice(existingIndex, 1);
        }
        let selectedMessages = this.messages.filter(item => item.checked == true);
        if (selectedMessages.length == this.messages.length) {
            this.allChecked = true;
        }
        else {
            this.allChecked = false;
        }
    }

    getAllMessages(isRefresh?) {
        this.loading = true;
        this.messages = [];
        if (isRefresh) {
            this.resetPager();
        }
        var params = {
            limit: this.itemsPerPage,
            pageNo: this.currentPage,
        };
        if(this.companyId){
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
                                let existingIndex = this.selectedNotifications.indexOf(tempData[index].id);
                                messages.push({
                                    rowCount: this.sharedFunctions.getRowCount(
                                        this.itemsPerPage,
                                        this.currentPage,
                                        index
                                    ),
                                    title: tempData[index].title,
                                    text: tempData[index].text,
                                    companyName: tempData[index].companyId && tempData[index].companyId.name? tempData[index].company_id.name: "Retailo",
                                    id: tempData[index].id,
                                    checked: existingIndex > -1 ? true : false,
                                    templateName: tempData[index].templateName,
                                })
                            }
                            this.totalItems = data.pagination.totalCount;
                            this.messages = messages;
                            let selectedMessages = this.messages.filter(item => item.checked == true);
                            if (selectedMessages.length == this.messages.length) {
                                this.allChecked = true;
                            }
                            else {
                                this.allChecked = false;
                            }
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

    push() {
        if(this.selectedNotifications.length==0){
            this.toastr.error("Select atleast one notification to send");
            return;
        }
        const selectedTemplates = this.messages.filter(
            message => this.selectedNotifications.includes(message.id)
        ).map(
            message => message.templateName
        );
        this.closeNotificationSelection.emit({ isPUSH: true, selectedNotifications: selectedTemplates});
    }
}
