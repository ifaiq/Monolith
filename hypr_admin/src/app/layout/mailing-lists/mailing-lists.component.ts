import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { SharedFunctionsService } from '../../shared/services/shared-function.service';

@Component({
  selector: 'app-mailing-lists',
  templateUrl: './mailing-lists.component.html',
  styleUrls: ['./mailing-lists.component.scss']
})
export class MailingListsComponent implements OnInit {
  mailingList = [];
  activeIndex = -1;
  newEmail = '';

  constructor(private toastr: ToastsManager, vRef: ViewContainerRef, private sharedFunctions: SharedFunctionsService) { 
    this.toastr.setRootViewContainerRef(vRef);
  }

  ngOnInit() {
    this.getMailingLists();
  }

  getMailingLists(){
    this.sharedFunctions.getRequest('/mailinglist/getMailingLists')
    .subscribe(data => {
      this.mailingList = data;
    }, error => {
      
    })
  }

  updateList(list){
    this.sharedFunctions.postRequest('/mailinglist/updateMailingList', list)
    .subscribe(data => {
      this.toastr.success("Mailing list updated");
    }, error => {
      this.toastr.error("Mailing list could not be updated");
    })
  }

  expandList(i){
    if(i == this.activeIndex){
      this.activeIndex = -1;
      return; 
    }
    this.activeIndex = i;
  }

  addEmailToList(){
    this.mailingList[this.activeIndex].mailing_list_user.push(this.newEmail);
    this.newEmail = '';
  }

  removeFromList(index){
    this.mailingList[this.activeIndex].mailing_list_user.splice(index, 1);
  }

}
