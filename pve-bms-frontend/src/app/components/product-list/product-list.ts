
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
  styleUrl: './product-list.css'
})
export class ProductList implements OnInit, OnDestroy {

  products: any[] = [];
  categories: any[] = [];
  searchText = '';
  isEditing = false;
  editingId: number | null = null;

  errorMessage = '';
  successMessage = '';
  showSuccessPopup = false;
  successPopupMessage = '';

  private successPopupTimer: ReturnType<typeof setTimeout> | null = null;

  product = {
    sku: '',
    name: '',
    barcode: '',
    description: '',
    costPrice: 0,
    sellingPrice: 0,
    active: true,
    categoryId: 0
  };

  private categoryUrl = 'http://localhost:8080/api/categories';

  constructor(
    private productService: ProductService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    if (this.successPopupTimer !== null) {
      clearTimeout(this.successPopupTimer);
    }
  }

  get totalProducts(): number {
    return this.products.length;
  }

  get activeProducts(): number {
    return this.products.filter(p => p.active).length;
  }

  get inactiveProducts(): number {
    return this.products.filter(p => !p.active).length;
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: data => {
        this.products = data;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('PRODUCT LOAD ERROR:', err);
        this.errorMessage = 'Unable to load products.';
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories(): void {
    this.http.get<any[]>(this.categoryUrl).subscribe({
      next: data => {
        this.categories = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Unable to load categories.';
        this.cdr.detectChanges();
      }
    });
  }

  get filteredProducts(): any[] {
    const search = this.searchText.toLowerCase().trim();

    return this.products.filter(p =>
      p.name?.toLowerCase().includes(search) ||
      p.sku?.toLowerCase().includes(search) ||
      p.barcode?.toLowerCase().includes(search) ||
      p.category?.name?.toLowerCase().includes(search)
    );
  }

  showProductSuccess(message: string): void {
    console.log('SUCCESS POPUP TRIGGERED:', message);

    if (this.successPopupTimer !== null) {
      clearTimeout(this.successPopupTimer);
    }

    this.successPopupMessage = message;
    this.showSuccessPopup = true;

    this.cdr.detectChanges();

    console.log('POPUP STATE:', this.showSuccessPopup);

    this.successPopupTimer = setTimeout(() => {
      this.showSuccessPopup = false;
      this.successPopupTimer = null;
      this.cdr.detectChanges();
    }, 1000);
  }

  saveProduct(): void {
    console.log('SAVE PRODUCT FUNCTION CALLED');

    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.product.sku.trim() ||
      !this.product.name.trim() ||
      !this.product.categoryId ||
      this.product.costPrice <= 0 ||
      this.product.sellingPrice <= 0
    ) {
      this.errorMessage = 'Please fill all required fields correctly.';
      console.log('PRODUCT VALIDATION FAILED');
      this.cdr.detectChanges();
      return;
    }

    const payload = {
      sku: this.product.sku.trim(),
      name: this.product.name.trim(),
      barcode: this.product.barcode.trim() || null,
      description: this.product.description,
      costPrice: Number(this.product.costPrice),
      sellingPrice: Number(this.product.sellingPrice),
      active: this.product.active,
      category: { id: Number(this.product.categoryId) }
    };

    const editing = this.isEditing;

    const request = editing && this.editingId !== null
      ? this.productService.updateProduct(this.editingId, payload)
      : this.productService.addProduct(payload);

    request.subscribe({
      next: () => {
        console.log('PRODUCT SAVE SUCCESS');

        const message = editing
          ? 'Product updated successfully!'
          : 'Product added successfully!';

        this.resetForm();
        this.loadProducts();

        this.successMessage = message;
        this.showProductSuccess(message);
      },
      error: err => {
        console.error('PRODUCT SAVE ERROR:', err);

        this.errorMessage =
          err.error?.detail ||
          err.error?.message ||
          err.error?.error ||
          'Unable to save product. Please check the details.';

        this.cdr.detectChanges();
      }
    });
  }

  editProduct(p: any): void {
    this.isEditing = true;
    this.editingId = p.id;

    this.product = {
      sku: p.sku,
      name: p.name,
      barcode: p.barcode || '',
      description: p.description || '',
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      active: p.active,
      categoryId: p.category?.id || 0
    };

    this.successMessage = '';
    this.errorMessage = '';

    this.cdr.detectChanges();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteProduct(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) {
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
      error: err => {
        console.error('PRODUCT DELETE ERROR:', err);

        this.errorMessage =
          err.error?.detail ||
          err.error?.message ||
          'Unable to delete product.';

        this.cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.product = {
      sku: '',
      name: '',
      barcode: '',
      description: '',
      costPrice: 0,
      sellingPrice: 0,
      active: true,
      categoryId: 0
    };

    this.isEditing = false;
    this.editingId = null;

    this.cdr.detectChanges();
  }
}
