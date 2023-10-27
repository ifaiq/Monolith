import { Component, Renderer2 } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Globals } from './globals';
import { NgxPermissionsService } from 'ngx-permissions';
import { SharedFunctionsService } from './shared';
import Cookies from 'js-cookie';
import { environment } from "environments/environment";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  loading;
  constructor(private translate: TranslateService, private globals: Globals, private permissionsService: NgxPermissionsService, public sharedFunctions: SharedFunctionsService, private renderer2: Renderer2) {
    translate.addLangs(['en', 'fr', 'ur', 'es', 'it', 'fa']);
    translate.setDefaultLang('en');
    const browserLang = translate.getBrowserLang();
    translate.use(browserLang.match(/en|fr|ur|es|it|fa/) ? browserLang : 'en');
  }


  private unlistener: () => void;

  ngOnInit(): void {
    if (localStorage.getItem('isLoggedin') == 'true') {
      let userData = JSON.parse(localStorage.getItem('userData'));
      this.permissionsService.flushPermissions();
      if (userData && userData.perms) {
        userData.perms.length > 0 ? this.permissionsService.loadPermissions(userData.perms) : null;
      }
    }
    this.unlistener = this.renderer2.listen("window", "pageshow", this.onPageChangeFromBrowser);
  }

  onPageChangeFromBrowser(event) {
    // more on bfcache in web https://web.dev/bfcache/
    if (event.persisted && !Cookies.get(environment.authData)) {
      // Force a reload if the user has logged out.
      location.reload();
    }
  }

  load(event) {
    this.loading = true;
  }

  hide() {
    this.loading = false;
  }

  ngOnDestroy() {
    this.unlistener();
  }

}
