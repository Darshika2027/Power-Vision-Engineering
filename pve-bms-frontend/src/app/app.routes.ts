import { Routes } from '@angular/router';
import { CategoryList } from './components/category-list/category-list';
import { ProductList } from './components/product-list/product-list';

export const routes: Routes = [
  {
    path: '',
    component: CategoryList,
  },
  {
    path: 'products',
    component: ProductList,
  },
];
