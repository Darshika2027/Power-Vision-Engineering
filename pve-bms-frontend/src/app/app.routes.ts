import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/category-list/category-list')
        .then(m => m.CategoryList)
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./components/product-list/product-list')
        .then(m => m.ProductList)
  },
  {
    path: 'product-lookup',
    loadComponent: () =>
      import('./components/product-barcode-lookup/product-barcode-lookup')
        .then(m => m.ProductBarcodeLookup)
  },
  {
    path: 'goods-receiving',
    loadComponent: () =>
      import('./components/goods-receiving/goods-receiving')
        .then(m => m.GoodsReceiving)
  },
  {
    path: 'rack-stock-management',
    loadComponent: () =>
      import('./components/rack-stock-management/rack-stock-management')
        .then(m => m.RackStockManagement)
  },
  {
    path: 'bulk-product-import',
    loadComponent: () =>
      import('./components/bulk-product-import/bulk-product-import')
        .then(m => m.BulkProductImport)
  }
];