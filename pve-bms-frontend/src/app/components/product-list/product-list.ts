import { Component, OnInit } from '@angular/core';
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
export class ProductList implements OnInit {

  products: any[] = [];
  categories: any[] = [];
  searchText = '';
  isEditing = false;
  editingId: number | null = null;
  errorMessage = '';
  successMessage = '';

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
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
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
      next: data => this.products = data,
      error: () => this.errorMessage = 'Unable to load products.'
    });
  }

  loadCategories(): void {
    this.http.get<any[]>(this.categoryUrl).subscribe({
      next: data => this.categories = data,
      error: () => this.errorMessage = 'Unable to load categories.'
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

  saveProduct(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      sku: this.product.sku,
      name: this.product.name,
      barcode: this.product.barcode || null,
      description: this.product.description,
      costPrice: Number(this.product.costPrice),
      sellingPrice: Number(this.product.sellingPrice),
      active: this.product.active,
      category: { id: Number(this.product.categoryId) }
    };

    const request = this.isEditing && this.editingId !== null
      ? this.productService.updateProduct(this.editingId, payload)
      : this.productService.addProduct(payload);

    request.subscribe({
      next: () => {
        this.successMessage = this.isEditing
          ? 'Product updated successfully!'
          : 'Product added successfully!';
        this.resetForm();
        this.loadProducts();
      },
      error: err => {
        this.errorMessage = err.error?.detail ||
          err.error?.message ||
          'Unable to save product. Please check the details.';
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteProduct(id: number): void {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.successMessage = 'Product deleted successfully!';
        this.loadProducts();
      },
      error: () => this.errorMessage = 'Unable to delete product.'
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
  }
}
