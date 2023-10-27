import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthGuard } from './shared';
import { Globals } from './globals';
import { ToastModule } from 'ng2-toastr/ng2-toastr';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoadingModule, ANIMATION_TYPES } from 'ngx-loading';
import { NgxPermissionsModule } from 'ngx-permissions';
import { SharedFunctionsService } from './shared';
import { AccountSettingService } from './shared/services/account-settings';
import { AuthInterceptor } from './http-interceptors/auth-interceptor';
import { AdminOnlyRouteGuard } from './shared/guard/admin-only.guard';


// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  // for development
  // return new TranslateHttpLoader(http, '/start-angular/SB-Admin-BS4-Angular-4/master/dist/assets/i18n/', '.json');
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    LoadingModule.forRoot({
      animationType: ANIMATION_TYPES.wanderingCubes,
      backdropBackgroundColour: 'rgba(0,0,0,0.1)',
      backdropBorderRadius: '14px',
      primaryColour: '#FF5733',
      secondaryColour: '#3333FF',
      tertiaryColour: '#FF33EC'
    }),
    NgbModule.forRoot(),
    AppRoutingModule,
    ToastModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    NgxPermissionsModule.forRoot()
  ],
  providers: [AuthGuard,
    AdminOnlyRouteGuard,
    Globals,
    SharedFunctionsService,
    AuthInterceptor,
    AccountSettingService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
}
