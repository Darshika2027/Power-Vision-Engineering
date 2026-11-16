import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product';

interface ReceivingItem {
  productId: number | null;
  productName: string;
  sku: string;
  quantity: number | null;
  unitCost: number | null;
  rackNumber: string;
}

@Component({
  selector: 'app-goods-receiving',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goods-receiving.html',
  styleUrl: './goods-receiving.css'
})
export class GoodsReceiving implements OnInit {

  constructor(private productService: ProductService) {}

  // AVAILABLE PRODUCTS
  products: any[] = [];
  isLoadingProducts = false;
  productLoadError = '';

  // RECEIVING DETAILS
  supplierName = '';
  supplierInvoice = '';
  receivedDate = new Date().toISOString().slice(0, 10);
  notes = '';

  // PRODUCT ITEMS
  items: ReceivingItem[] = [
    this.createEmptyItem()
  ];

  // MESSAGES
  errorMessage = '';
  successMessage = '';

  // DASHBOARD STATISTICS
  totalReceivings = 0;
  receivedToday = 0;
  totalUnitsReceived = 0;

  ngOnInit(): void {
    this.loadProducts();
  }

  // LOAD ACTIVE PRODUCTS
  loadProducts(): void {
    this.isLoadingProducts = true;
    this.productLoadError = '';

    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data.filter(
          (product: any) => product.active === true
        );
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('PRODUCT LOAD ERROR:', error);
        this.productLoadError =
          'Unable to load products. Please check the backend connection.';
        this.isLoadingProducts = false;
      }
    });
  }

  // CREATE EMPTY PRODUCT ROW
  createEmptyItem(): ReceivingItem {
    return {
      productId: null,
      productName: '',
      sku: '',
      quantity: null,
      unitCost: null,
      rackNumber: ''
    };
  }

  // WHEN A PRODUCT IS SELECTED
  onProductSelected(item: ReceivingItem): void {
    const selectedProduct = this.products.find(
      (product: any) =>
        Number(product.id) === Number(item.productId)
    );

    if (!selectedProduct) {
      item.productName = '';
      item.sku = '';
      item.unitCost = null;
      return;
    }

    item.productName = selectedProduct.name;
    item.sku = selectedProduct.sku;
    item.unitCost = Number(selectedProduct.costPrice);
    this.errorMessage = '';
    this.successMessage = '';
  }

  // ADD PRODUCT ROW
  addItem(): void {
    this.items.push(this.createEmptyItem());
    this.errorMessage = '';
    this.successMessage = '';
  }

  // REMOVE PRODUCT ROW
  removeItem(index: number): void {
    if (this.items.length > 1) {
      this.items.splice(index, 1);
    }

    this.errorMessage = '';
    this.successMessage = '';
  }

  // TOTAL QUANTITY
  get totalQuantity(): number {
    return this.items.reduce(
      (total, item) => total + (Number(item.quantity) || 0),
      0
    );
  }

  // TOTAL PURCHASE COST
  get totalCost(): number {
    return this.items.reduce(
      (total, item) =>
        total +
        (
          (Number(item.quantity) || 0) *
          (Number(item.unitCost) || 0)
        ),
      0
    );
  }

  // VALIDATE RECEIVING DETAILS
  onReviewReceiving(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.supplierName.trim()) {
      this.errorMessage = 'Please enter the supplier name.';
      return;
    }

    if (!this.receivedDate) {
      this.errorMessage = 'Please select the receiving date.';
      return;
    }

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];

      if (item.productId === null) {
        this.errorMessage = `Please select a product in row ${i + 1}.`;
        return;
      }

      if (
        item.quantity === null ||
        !Number.isFinite(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        this.errorMessage = `Please enter a valid quantity in row ${i + 1}.`;
        return;
      }

      if (
        item.unitCost === null ||
        !Number.isFinite(Number(item.unitCost)) ||
        Number(item.unitCost) < 0
      ) {
        this.errorMessage = `Please enter a valid purchase cost in row ${i + 1}.`;
        return;
      }

      if (!item.rackNumber.trim()) {
        this.errorMessage = `Please enter the rack number in row ${i + 1}.`;
        return;
      }
    }

    this.successMessage =
      'Details validated successfully. This is a UI preview only. No database or stock changes have been made.';
  }

  // RESET FORM
  resetForm(): void {
    this.supplierName = '';
    this.supplierInvoice = '';
    this.receivedDate = new Date().toISOString().slice(0, 10);
    this.notes = '';
    this.items = [this.createEmptyItem()];
    this.errorMessage = '';
    this.successMessage = '';
  }
}
