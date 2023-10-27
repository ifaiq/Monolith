import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProductRoutingModule } from './product-routing.module';
import { ProductCategoryComponent } from './product-category/product-category.component';
import { BrandComponent } from './brand/brand.component';
import { TagComponent } from './tag/tag.component';
import { CreateTagComponent } from './tag/create-tag/create-tag.component';
import { LoadingModule, ANIMATION_TYPES } from 'ngx-loading';
import { SortablejsModule } from 'angular-sortablejs';
import { GetProductsByCategoryComponent } from './get-products-by-category/get-products-by-category.component';
import { AngularDateTimePickerModule } from 'angular2-datetimepicker';
import { ProductComponent } from './product.component';
import { UiSwitchModule } from 'ngx-ui-switch';
import { NgxBarcodeModule } from 'ngx-barcode';
import { NgxPaginationModule } from 'ngx-pagination';
import { ProductCategorySelection } from './category-selection/category-selection.component';
import { NgxPermissionsModule } from "ngx-permissions";
import { MatInputModule, MatIconModule, MatFormFieldModule, MatChipsModule, MatAutocompleteModule } from '@angular/material';
import { NumberLimitDirective } from 'app/shared/directives/number-limit-directive';

@NgModule({
  imports: [
    CommonModule,
    ProductRoutingModule,
    FormsModule,
    SortablejsModule,
    AngularDateTimePickerModule,
    UiSwitchModule,
    NgxBarcodeModule,
    NgxPaginationModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatChipsModule,
    LoadingModule.forRoot({
      animationType: ANIMATION_TYPES.rectangleBounce,
      backdropBackgroundColour: 'rgba(0,0,0,0.1)',
      backdropBorderRadius: '0px',
      primaryColour: '#FF5733',
      secondaryColour: '#3333FF',
      tertiaryColour: '#FF33EC',
    }),
    NgxPermissionsModule.forChild()
  ],
  declarations: [ProductComponent, ProductCategoryComponent, BrandComponent, TagComponent, CreateTagComponent, GetProductsByCategoryComponent, ProductCategorySelection, NumberLimitDirective]
})
export class ProductModule {
}
