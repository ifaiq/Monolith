import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProductCategoryComponent } from './product-category/product-category.component';
import { GetProductsByCategoryComponent } from './get-products-by-category/get-products-by-category.component';
import { ProductComponent } from './product.component';
import { TagComponent } from './tag/tag.component';
import { CreateTagComponent } from './tag/create-tag/create-tag.component';
import { BrandComponent } from './brand/brand.component';

const routes: Routes = [
  {path: '', component: ProductComponent},
  {path: 'category', component: ProductCategoryComponent },
  {path: 'brand', component: BrandComponent },
  {path: 'get-products/:id', component: GetProductsByCategoryComponent},
  {path: 'tag', component: TagComponent},
  {path: 'tag/create-tag', component: CreateTagComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProductRoutingModule { }
