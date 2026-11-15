import { Routes } from '@angular/router';
import { CategoryList } from './components/category-list/category-list';
import { ProductList } from './components/product-list/product-list';
import { ProductBarcodeLookup } from './components/product-barcode-lookup/product-barcode-lookup';

export const routes: Routes = [
  {
    path: '',
    component: CategoryList
  },
  {
    path: 'products',
    component: ProductList
  },
  {
    path: 'product-lookup',
    component: ProductBarcodeLookup
  }
];
