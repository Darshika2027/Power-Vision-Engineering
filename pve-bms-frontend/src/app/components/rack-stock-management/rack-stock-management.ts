import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ProductService } from '../../services/product';
import {
  RackInventoryService,
  RackInventory,
  RackRequest,
  RackSummary
} from '../../services/rack-inventory.service';

interface ProductOption {
  id: number;
  name: string;
  sku: string;
  category: string;
  active: boolean;
}

@Component({
  selector: 'app-rack-stock-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './rack-stock-management.html',
  styleUrl: './rack-stock-management.css'
})
export class RackStockManagement implements OnInit {

  searchText = '';
  selectedLocation = 'All Locations';

  showModal = false;
  editingId: number | null = null;

  loading = false;
  saving = false;
  deletingId: number | null = null;

  errorMessage = '';
  successMessage = '';

  locations = [
    'All Locations',
    'Main Store',
    'Front Store',
    'Back Store'
  ];

  rackItems: RackInventory[] = [];
  products: ProductOption[] = [];

  summary: RackSummary = {
    totalRacks: 0,
    totalProducts: 0,
    totalStock: 0,
    lowStock: 0,
    mainStoreEntries: 0,
    frontStoreEntries: 0,
    backStoreEntries: 0
  };

  form = this.emptyForm();

  constructor(
    private rackService: RackInventoryService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadRackData();
  }

  emptyForm() {
    return {
      productId: null as number | null,
      rackNumber: '',
      quantity: 0,
      location: 'Main Store'
    };
  }

  get totalRacks(): number {
    return this.summary.totalRacks;
  }

  get totalProducts(): number {
    return this.summary.totalProducts;
  }

  get totalStock(): number {
    return this.summary.totalStock;
  }

  get lowStock(): number {
    return this.summary.lowStock;
  }

  get mainStoreEntries(): number {
    return this.summary.mainStoreEntries;
  }

  get frontStoreEntries(): number {
    return this.summary.frontStoreEntries;
  }

  get backStoreEntries(): number {
    return this.summary.backStoreEntries;
  }

  get filteredItems(): RackInventory[] {
    const search = this.searchText.trim().toLowerCase();

    return this.rackItems.filter(item => {
      const matchesSearch =
        item.rackNumber.toLowerCase().includes(search) ||
        item.productName.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search);

      const matchesLocation =
        this.selectedLocation === 'All Locations' ||
        item.location === this.selectedLocation;

      return matchesSearch && matchesLocation;
    });
  }

  get selectedProductCategory(): string {
    const selectedProduct = this.products.find(
      product => product.id === this.form.productId
    );

    return selectedProduct?.category || 'No category';
  }
  get availableProducts(): ProductOption[] {
    return this.products.filter(product =>
      product.active ||
      product.id === this.form.productId
    );
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data: any[]) => {
        this.products = (data || []).map(product => ({
          id: Number(product.id),
          name: product.name || '',
          sku: product.sku || '',
          category:
            product.category?.name ||
            product.categoryName ||
            '',
          active: product.active !== false
        }));
      },
      error: () => {
        this.errorMessage =
          'Unable to load products. Please check the Product API.';
      }
    });
  }

  loadRackData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.rackService.getAll().subscribe({
      next: data => {
        this.rackItems = data || [];
        this.loading = false;
        this.loadSummary();
      },
      error: error => {
        this.loading = false;
        this.errorMessage = this.getErrorMessage(
          error,
          'Unable to load rack inventory.'
        );
      }
    });
  }

  loadSummary(): void {
    this.rackService.getSummary().subscribe({
      next: data => {
        this.summary = data;
      },
      error: error => {
        this.errorMessage = this.getErrorMessage(
          error,
          'Unable to load rack stock summary.'
        );
      }
    });
  }

  refreshData(): void {
    this.loadRackData();
  }

  onSearchChange(): void {
    // Search is performed locally on the currently loaded records.
  }

  onLocationChange(): void {
    // Location filtering is performed locally on the currently loaded records.
  }

  getStockStatus(quantity: number): string {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 10) return 'Low Stock';
    return 'In Stock';
  }

  openAddModal(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(item: RackInventory): void {
    const product = this.products.find(
      existing => existing.sku === item.sku
    );

    if (!product) {
      this.errorMessage =
        'The product linked to this rack could not be found.';
      return;
    }

    this.editingId = item.id;

    this.form = {
      productId: product.id,
      rackNumber: item.rackNumber,
      quantity: item.quantity,
      location: item.location
    };

    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    if (this.saving) return;

    this.showModal = false;
    this.editingId = null;
    this.form = this.emptyForm();
  }

  saveRack(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      this.form.productId === null ||
      !this.form.rackNumber.trim() ||
      !this.form.location ||
      !Number.isInteger(Number(this.form.quantity)) ||
      Number(this.form.quantity) < 0
    ) {
      this.errorMessage =
        'Please complete all required fields with valid values.';
      return;
    }

    const selectedProduct = this.products.find(
      product => product.id === this.form.productId
    );

    if (!selectedProduct) {
      this.errorMessage = 'Please select a valid product.';
      return;
    }

    const request: RackRequest = {
      productId: Number(this.form.productId),
      rackNumber: this.form.rackNumber.trim(),
      quantity: Number(this.form.quantity),
      location: this.form.location
    };

    this.saving = true;

    const operation = this.editingId !== null
      ? this.rackService.update(this.editingId, request)
      : this.rackService.create(request);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        const wasEditing = this.editingId !== null;

        this.successMessage = wasEditing
          ? 'Rack location updated successfully!'
          : 'Rack location added successfully!';

        this.editingId = null;
        this.form = this.emptyForm();

        this.loadRackData();
      },
      error: error => {
        this.saving = false;
        this.errorMessage = this.getErrorMessage(
          error,
          'Unable to save rack location.'
        );
      }
    });
  }

  deleteRackItem(item: RackInventory): void {
    if (
      !confirm(
        `Remove ${item.productName} from ${item.rackNumber}?`
      )
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.deletingId = item.id;

    this.rackService.delete(item.id).subscribe({
      next: () => {
        this.deletingId = null;
        this.successMessage = 'Rack location deleted successfully.';
        this.loadRackData();
      },
      error: error => {
        this.deletingId = null;
        this.errorMessage = this.getErrorMessage(
          error,
          'Unable to delete rack location.'
        );
      }
    });
  }

  private getErrorMessage(error: any, fallback: string): string {
    const message =
      error?.error?.detail ||
      error?.error?.message ||
      error?.error?.title ||
      error?.message;

    return message || fallback;
  }
}


