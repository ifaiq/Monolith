import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { SharedFunctionsService } from "app/shared/services/shared-function.service";

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  username = '';
    pushRightClass: string = 'push-right';
    openClass: string = 'open';

    constructor(private translate: TranslateService, public router: Router, private sharedFunctions: SharedFunctionsService,        ) {
        this.router.events.subscribe((val) => {
            if (val instanceof NavigationEnd && window.innerWidth <= 992 && this.isToggled()) {
                this.toggleSidebar();
            }
        });
    }

    ngOnInit() {
      var userData = JSON.parse(localStorage.getItem('userData'));
      this.username = userData.name[0];
    }

    isToggled(): boolean {
        const dom: Element = document.querySelector('body');
        return dom.classList.contains(this.pushRightClass);
    }

    toggleSidebar() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle(this.pushRightClass);
    }

    toggleMenubar() {
        const dom: any = document.querySelector('button');
        dom.classList.toggle(this.openClass);
    }

    rltAndLtr() {
        const dom: any = document.querySelector('body');
        dom.classList.toggle('rtl');
    }

    onLoggedout() {
        localStorage.setItem("isLoggedin", "false");
        this.sharedFunctions.removeAuthData();
    }

    changeLang(language: string) {
        this.translate.use(language);
    }

}
