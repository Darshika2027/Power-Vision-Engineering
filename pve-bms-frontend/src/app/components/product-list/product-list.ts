import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  pageTitle = 'Product Catalogue Management';

  // Form variables
  productName = '';
  productCategory = '';
  sellingPrice: number | null = null;

  // Stores the ID of the product being edited
  editingProductId: number | null = null;

  // Temporary sample products
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

  // Register a new product
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

    // Prevent duplicate product names
    const productExists = this.products.some(
      (product) => product.name.trim().toLowerCase() === this.productName.trim().toLowerCase(),
    );

    if (productExists) {
      alert('A product with this name already exists.');
      return;
    }

    // Generate a temporary product ID
    const newId = Math.max(0, ...this.products.map((product) => product.id)) + 1;

    // Add product to the list
    this.products.push({
      id: newId,
      name: this.productName.trim(),
      category: this.productCategory,
      sellingPrice: this.sellingPrice,
      status: 'Active',
    });

    this.resetForm();

    alert('Product registered successfully!');
  }

  // Load selected product into the form
  editProduct(productId: number) {
    const selectedProduct = this.products.find((product) => product.id === productId);

    if (!selectedProduct) {
      alert('Product not found.');
      return;
    }

    this.editingProductId = selectedProduct.id;
    this.productName = selectedProduct.name;
    this.productCategory = selectedProduct.category;
    this.sellingPrice = selectedProduct.sellingPrice;
  }

  // Save changes to an existing product
  updateProduct() {
    if (this.editingProductId === null) {
      return;
    }

    const selectedProduct = this.products.find((product) => product.id === this.editingProductId);

    if (!selectedProduct) {
      alert('Product not found.');
      return;
    }

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

    // Check duplicate names, excluding the current product
    const productExists = this.products.some(
      (product) =>
        product.id !== this.editingProductId &&
        product.name.trim().toLowerCase() === this.productName.trim().toLowerCase(),
    );

    if (productExists) {
      alert('A product with this name already exists.');
      return;
    }

    // Update existing product
    selectedProduct.name = this.productName.trim();
    selectedProduct.category = this.productCategory;
    selectedProduct.sellingPrice = this.sellingPrice;

    this.resetForm();

    alert('Product updated successfully!');
  }

  // Cancel editing
  cancelEdit() {
    this.resetForm();
  }

  // Clear the form
  resetForm() {
    this.productName = '';
    this.productCategory = '';
    this.sellingPrice = null;
    this.editingProductId = null;
  }
}
