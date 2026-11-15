import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../services/product';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit, OnDestroy {
  // ----------------------------------
  // PRODUCT AND CATEGORY DATA
  // ----------------------------------

  products: any[] = [];
  categories: any[] = [];

  // ----------------------------------
  // SEARCH AND FILTER VARIABLES
  // ----------------------------------

  searchText = '';

  selectedCategoryId = 0;

  selectedStatus: 'all' | 'active' | 'inactive' = 'all';

  // ----------------------------------
  // EDITING VARIABLES
  // ----------------------------------

  isEditing = false;
  editingId: number | null = null;

  // ----------------------------------
  // SUCCESS AND ERROR MESSAGES
  // ----------------------------------

  errorMessage = '';
  successMessage = '';

  showSuccessPopup = false;
  successPopupMessage = '';

  private successPopupTimer: ReturnType<typeof setTimeout> | null = null;

  // ----------------------------------
  // PRODUCT FORM
  // ----------------------------------

  product = {
    sku: '',
    name: '',
    barcode: '',
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    active: true,
    categoryId: 0,
  };

  // ----------------------------------
  // CATEGORY API
  // ----------------------------------

  private categoryUrl = 'http://localhost:8080/api/categories';

  // ----------------------------------
  // CONSTRUCTOR
  // ----------------------------------

  constructor(
    private productService: ProductService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  // ----------------------------------
  // INITIALIZE COMPONENT
  // ----------------------------------

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    if (this.successPopupTimer !== null) {
      clearTimeout(this.successPopupTimer);
    }
  }

  // ----------------------------------
  // PRODUCT STATISTICS
  // ----------------------------------

  get totalProducts(): number {
    return this.products.length;
  }

  get activeProducts(): number {
    return this.products.filter((product) => product.active).length;
  }

  get inactiveProducts(): number {
    return this.products.filter((product) => !product.active).length;
  }

  // ----------------------------------
  // LOAD PRODUCTS FROM BACKEND
  // ----------------------------------

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.errorMessage = '';
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('PRODUCT LOAD ERROR:', err);

        this.errorMessage = 'Unable to load products.';

        this.cdr.detectChanges();
      },
    });
  }

  // ----------------------------------
  // LOAD CATEGORIES FROM BACKEND
  // ----------------------------------

  loadCategories(): void {
    this.http.get<any[]>(this.categoryUrl).subscribe({
      next: (data) => {
        this.categories = data;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('CATEGORY LOAD ERROR:', err);

        this.errorMessage = 'Unable to load categories.';

        this.cdr.detectChanges();
      },
    });
  }

  // ----------------------------------
  // SEARCH AND FILTER PRODUCTS
  // ----------------------------------

  get filteredProducts(): any[] {
    const search = this.searchText.toLowerCase().trim();

    return this.products.filter((product) => {
      // Search by name, SKU, barcode or category
      const matchesSearch =
        !search ||
        product.name?.toLowerCase().includes(search) ||
        product.sku?.toLowerCase().includes(search) ||
        product.barcode?.toLowerCase().includes(search) ||
        product.category?.name?.toLowerCase().includes(search);

      // Filter by category ID
      const matchesCategory =
        this.selectedCategoryId === 0 ||
        Number(product.category?.id) === Number(this.selectedCategoryId);

      // Filter by active/inactive status
      const matchesStatus =
        this.selectedStatus === 'all' ||
        (this.selectedStatus === 'active' ? product.active === true : product.active === false);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }

  // ----------------------------------
  // SUCCESS POPUP
  // ----------------------------------

  showProductSuccess(message: string): void {
    if (this.successPopupTimer !== null) {
      clearTimeout(this.successPopupTimer);
    }

    this.successPopupMessage = message;
    this.showSuccessPopup = true;

    this.cdr.detectChanges();

    this.successPopupTimer = setTimeout(() => {
      this.showSuccessPopup = false;
      this.successPopupTimer = null;

      this.cdr.detectChanges();
    }, 1000);
  }

  // ----------------------------------
  // ADD OR UPDATE PRODUCT
  // ----------------------------------

  saveProduct(): void {
    this.errorMessage = '';
    this.successMessage = '';

    // Validate required fields
    if (
      !this.product.sku.trim() ||
      !this.product.name.trim() ||
      !this.product.categoryId ||
      !Number.isFinite(Number(this.product.costPrice)) ||
      !Number.isFinite(Number(this.product.sellingPrice)) ||
      Number(this.product.costPrice) <= 0 ||
      Number(this.product.sellingPrice) <= 0
    ) {
      this.errorMessage = 'Please fill all required fields correctly.';

      this.cdr.detectChanges();
      return;
    }

    // Validate category from the database
    const selectedCategory = this.categories.find(
      (category) => Number(category.id) === Number(this.product.categoryId),
    );

    if (!selectedCategory) {
      this.errorMessage = 'Please select a valid category.';

      this.cdr.detectChanges();
      return;
    }

    // Prepare request body
    const payload = {
      sku: this.product.sku.trim(),
      name: this.product.name.trim(),
      barcode: this.product.barcode.trim() || null,
      description: this.product.description.trim(),
      costPrice: Number(this.product.costPrice),
      sellingPrice: Number(this.product.sellingPrice),
      active: this.product.active,
      category: {
        id: Number(this.product.categoryId),
      },
    };

    const editing = this.isEditing;

    // Select Add or Update API
    const request =
      editing && this.editingId !== null
        ? this.productService.updateProduct(this.editingId, payload)
        : this.productService.addProduct(payload);

    // Send request to Spring Boot
    request.subscribe({
      next: () => {
        const message = editing ? 'Product updated successfully!' : 'Product added successfully!';

        this.resetForm();

        this.loadProducts();

        this.successMessage = message;

        this.showProductSuccess(message);
      },

      error: (err) => {
        console.error('PRODUCT SAVE ERROR:', err);

        this.errorMessage =
          err.error?.detail ||
          err.error?.message ||
          err.error?.error ||
          'Unable to save product. Please check the details.';

        this.cdr.detectChanges();
      },
    });
  }

  // ----------------------------------
  // EDIT PRODUCT
  // ----------------------------------

  editProduct(product: any): void {
    this.isEditing = true;
    this.editingId = product.id;

    this.product = {
      sku: product.sku,
      name: product.name,
      barcode: product.barcode || '',
      description: product.description || '',
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      active: product.active,
      categoryId: product.category?.id || 0,
    };

    this.successMessage = '';
    this.errorMessage = '';

    this.cdr.detectChanges();

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // ----------------------------------
  // DELETE PRODUCT
  // ----------------------------------

  deleteProduct(id: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this product?');

    if (!confirmed) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.loadProducts();

        this.successMessage = 'Product deleted successfully!';

        this.showProductSuccess(this.successMessage);
      },

      error: (err) => {
        console.error('PRODUCT DELETE ERROR:', err);

        this.errorMessage = err.error?.detail || err.error?.message || 'Unable to delete product.';

        this.cdr.detectChanges();
      },
    });
  }

  // ----------------------------------
  // RESET PRODUCT FORM
  // ----------------------------------

  resetForm(): void {
    this.product = {
      sku: '',
      name: '',
      barcode: '',
      description: '',
      costPrice: 0,
      sellingPrice: 0,
      active: true,
      categoryId: 0,
    };

    this.isEditing = false;
    this.editingId = null;

    this.cdr.detectChanges();
  }
}
