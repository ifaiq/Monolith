import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';
import { LayoutRoutingModule } from './layout-routing.module';
import { LayoutComponent } from './layout.component';
import { HeaderComponent, SidebarComponent } from '../shared';
import { NgxPermissionsModule } from 'ngx-permissions';
import { LoadingModule, ANIMATION_TYPES } from 'ngx-loading';
import { CatalogueComponent } from './catalogue/catalogue.component';
import { FormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';
import { NgxBarcodeModule } from 'ngx-barcode';
import { UiSwitchModule } from 'ngx-ui-switch';


@NgModule({
    imports: [
        FormsModule,
        CommonModule,
        NgbDropdownModule.forRoot(),
        LayoutRoutingModule,
        UiSwitchModule,
        NgxBarcodeModule,
        NgxPaginationModule,
        LoadingModule.forRoot({
            animationType: ANIMATION_TYPES.rectangleBounce,
            backdropBackgroundColour: 'rgba(0,0,0,0.1)',
            backdropBorderRadius: '0px',
            primaryColour: '#FF5733',
            secondaryColour: '#3333FF',
            tertiaryColour: '#FF33EC'
        }),
        TranslateModule,
        NgxPermissionsModule.forChild()
    ],
    declarations: [
        LayoutComponent,
        HeaderComponent,
        SidebarComponent,
        CatalogueComponent,
    ],
    exports: [NgxBarcodeModule]
})
export class LayoutModule {}