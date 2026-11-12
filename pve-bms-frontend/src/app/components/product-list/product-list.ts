import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],

  selector: 'app-product-list',
  styleUrl: './product-list.css',
  templateUrl: './product-list.html',
})
export class ProductList {
  pageTitle = 'Product Catalogue Management';

  productName = '';

  productCategory = '';

  sellingPrice: number | null = null;

  products = [
    {
      id: 1,
      name: 'LED Bulb 12W',
      category: 'Lighting',
      sellingPrice: 850,
      status: 'Active',
    },
    {
      id: 2,
      name: 'Extension Cord',
      category: 'Electrical Accessories',
      sellingPrice: 1500,
      status: 'Active',
    },
  ];

  registerProduct() {
    if (!this.productName.trim()) {
      alert('Please enter a product name.');
      return;
    }

    if (!this.productCategory) {
      alert('Please select a product category.');
      return;
    }

    if (
      this.sellingPrice === null ||
      !Number.isFinite(this.sellingPrice) ||
      this.sellingPrice <= 0
    ) {
      alert('Please enter a valid selling price greater than zero.');
      return;
    }

    console.log('Product Name:', this.productName);
    console.log('Category:', this.productCategory);
    console.log('Selling Price:', this.sellingPrice);
  }
}
