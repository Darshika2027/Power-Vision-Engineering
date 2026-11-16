import { Routes } from '@angular/router';
import { CategoryList } from './components/category-list/category-list';
import { ProductList } from './components/product-list/product-list';
import { ProductBarcodeLookup } from './components/product-barcode-lookup/product-barcode-lookup';
import { GoodsReceiving } from './components/goods-receiving/goods-receiving';
import { RackStockManagement } from './components/rack-stock-management/rack-stock-management';

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
  },
  {
    path: 'goods-receiving',
    component: GoodsReceiving
  },
  {
    path: 'rack-stock-management',
    component: RackStockManagement
  }
];