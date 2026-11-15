import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

// ----------------------------------
// FRONTEND PRODUCT STRUCTURE
// ----------------------------------

interface Product {
  id: number;
  sku: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  description: string;
  active: boolean;
  icon: string;
}

// ----------------------------------
// PRODUCT FORM STRUCTURE
// ----------------------------------

interface ProductForm {
  sku: string;
  name: string;
  barcode: string;
  category: string;
  costPrice: number | null;
  sellingPrice: number | null;
  description: string;
  active: boolean;
}

// ----------------------------------
// BACKEND CATEGORY STRUCTURE
// ----------------------------------

interface BackendCategory {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt?: string;
}

// ----------------------------------
// BACKEND PRODUCT STRUCTURE
// ----------------------------------

interface BackendProduct {
  id: number;
  sku: string;
  name: string;
  barcode: string | null;
  category: BackendCategory;
  costPrice: number | string;
  sellingPrice: number | string;
  description: string | null;
  active: boolean;
  createdAt?: string;
}

// ----------------------------------
// ANGULAR COMPONENT
// ----------------------------------

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList implements OnInit {
  // ----------------------------------
  // BACKEND API URLS
  // ----------------------------------

  private readonly productApiUrl = 'http://localhost:8080/api/products';

  private readonly categoryApiUrl = 'http://localhost:8080/api/categories';

  // ----------------------------------
  // CONSTRUCTOR
  // ----------------------------------

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  // ----------------------------------
  // REAL DATABASE DATA
  // ----------------------------------

  products: Product[] = [];

  categories: string[] = [];

  backendCategories: BackendCategory[] = [];

  // ----------------------------------
  // SEARCH AND FILTER VARIABLES
  // ----------------------------------

  searchText = '';

  selectedCategory = 'all';

  selectedStatus = 'all';

  // ----------------------------------
  // EDITING PRODUCT
  // ----------------------------------

  editingProductId: number | null = null;

  // ----------------------------------
  // SUCCESS AND ERROR MESSAGES
  // ----------------------------------

  message = '';

  messageType: 'success' | 'error' = 'success';

  // ----------------------------------
  // PRODUCT FORM
  // ----------------------------------

  form: ProductForm = this.emptyForm();

  // ----------------------------------
  // INITIALIZE COMPONENT
  // ----------------------------------

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  // ----------------------------------
  // LOAD PRODUCTS FROM SPRING BOOT
  // ----------------------------------

  loadProducts(): void {
    this.http.get<BackendProduct[]>(this.productApiUrl).subscribe({
      next: (data) => {
        this.products = data.map((product) => this.convertBackendProduct(product));

        console.log('Real products loaded:', this.products);

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error loading products:', error);

        this.showMessage('Could not load products from the backend.', 'error');

        this.cdr.detectChanges();
      },
    });
  }

  // ----------------------------------
  // LOAD CATEGORIES FROM SPRING BOOT
  // ----------------------------------

  loadCategories(): void {
    this.http.get<BackendCategory[]>(this.categoryApiUrl).subscribe({
      next: (data) => {
        this.backendCategories = data;

        this.categories = data
          .filter((category) => category.active)
          .map((category) => category.name);

        console.log('Real categories loaded:', this.backendCategories);

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error loading categories:', error);

        this.showMessage('Could not load categories from the backend.', 'error');

        this.cdr.detectChanges();
      },
    });
  }

  // ----------------------------------
  // CONVERT BACKEND PRODUCT
  // TO FRONTEND PRODUCT
  // ----------------------------------

  private convertBackendProduct(product: BackendProduct): Product {
    const categoryName = product.category?.name ?? '';

    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      barcode: product.barcode ?? '',
      category: categoryName,
      costPrice: Number(product.costPrice),
      sellingPrice: Number(product.sellingPrice),
      description: product.description ?? '',
      active: product.active,
      icon: this.iconForCategory(categoryName),
    };
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
  // SEARCH AND FILTER PRODUCTS
  // ----------------------------------

  get filteredProducts(): Product[] {
    const term = this.searchText.trim().toLowerCase();

    return this.products.filter((product) => {
      const matchesText =
        !term ||
        [product.sku, product.name, product.barcode].some((value) =>
          value.toLowerCase().includes(term),
        );

      const matchesCategory =
        this.selectedCategory === 'all' || product.category === this.selectedCategory;

      const matchesStatus =
        this.selectedStatus === 'all' ||
        (this.selectedStatus === 'active' ? product.active : !product.active);

      return matchesText && matchesCategory && matchesStatus;
    });
  }

  // ----------------------------------
  // FORMAT PRICE IN SRI LANKAN RUPEES
  // ----------------------------------

  formatPrice(value: number): string {
    return (
      'Rs. ' +
      value.toLocaleString('en-LK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  // ----------------------------------
  // START REGISTERING NEW PRODUCT
  // ----------------------------------

  startNewProduct(): void {
    this.resetForm();
  }

  // ----------------------------------
  // EDIT EXISTING PRODUCT
  // ----------------------------------

  editProduct(product: Product): void {
    this.editingProductId = product.id;

    this.form = {
      sku: product.sku,
      name: product.name,
      barcode: product.barcode,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      description: product.description,
      active: product.active,
    };

    this.message = '';
  }

  // ----------------------------------
  // SAVE OR UPDATE PRODUCT
  // ----------------------------------

  saveProduct(): void {
    const sku = this.form.sku.trim().toUpperCase();

    const name = this.form.name.trim();

    const barcode = this.form.barcode.trim();

    const cost = this.form.costPrice;

    const selling = this.form.sellingPrice;

    // ----------------------------------
    // VALIDATE REQUIRED FIELDS
    // ----------------------------------

    if (!sku || !name || !this.form.category) {
      this.showMessage('Please complete SKU, Product Name and Category.', 'error');

      return;
    }

    // ----------------------------------
    // VALIDATE PRICES
    // ----------------------------------

    if (
      cost === null ||
      !Number.isFinite(cost) ||
      cost < 0 ||
      selling === null ||
      !Number.isFinite(selling) ||
      selling <= 0
    ) {
      this.showMessage('Enter valid prices (cost at least 0, selling above 0).', 'error');

      return;
    }

    // ----------------------------------
    // FIND REAL DATABASE CATEGORY
    // ----------------------------------

    const selectedCategory = this.backendCategories.find(
      (category) => category.name === this.form.category && category.active,
    );

    if (!selectedCategory) {
      this.showMessage('Please select a valid database category.', 'error');

      return;
    }

    // ----------------------------------
    // CHECK DUPLICATE SKU
    // ----------------------------------

    const duplicateSku = this.products.some(
      (product) =>
        product.id !== this.editingProductId && product.sku.toLowerCase() === sku.toLowerCase(),
    );

    if (duplicateSku) {
      this.showMessage('This SKU is already used by another product.', 'error');

      return;
    }

    // ----------------------------------
    // CHECK DUPLICATE BARCODE
    // ----------------------------------

    const duplicateBarcode =
      barcode !== '' &&
      this.products.some(
        (product) => product.id !== this.editingProductId && product.barcode === barcode,
      );

    if (duplicateBarcode) {
      this.showMessage('This barcode is already used by another product.', 'error');

      return;
    }

    // ----------------------------------
    // PREPARE BACKEND PRODUCT DATA
    // ----------------------------------

    const productData = {
      sku: sku,
      name: name,
      barcode: barcode || null,
      description: this.form.description.trim(),
      costPrice: cost,
      sellingPrice: selling,
      active: this.form.active,
      category: {
        id: selectedCategory.id,
      },
    };

    // ----------------------------------
    // UPDATE EXISTING PRODUCT
    // ----------------------------------

    if (this.editingProductId !== null) {
      const productId = this.editingProductId;

      const existingProduct = this.products.find((product) => product.id === productId);

      if (!existingProduct) {
        this.showMessage('The selected product could not be found.', 'error');

        return;
      }

      // Keep the original SKU when editing.
      // The backend does not update SKU.

      productData.sku = existingProduct.sku;

      this.http.put<BackendProduct>(`${this.productApiUrl}/${productId}`, productData).subscribe({
        next: (updatedProduct) => {
          const convertedProduct = this.convertBackendProduct(updatedProduct);

          this.products = this.products.map((product) =>
            product.id === productId ? convertedProduct : product,
          );

          this.resetForm();

          this.showMessage('Product updated successfully!', 'success');

          this.cdr.detectChanges();
        },

        error: (error) => {
          console.error('Error updating product:', error);

          this.showMessage(
            'Could not update product. Please check the details and try again.',
            'error',
          );

          this.cdr.detectChanges();
        },
      });

      return;
    }

    // ----------------------------------
    // CREATE NEW PRODUCT
    // ----------------------------------

    this.http.post<BackendProduct>(this.productApiUrl, productData).subscribe({
      next: (savedProduct) => {
        const convertedProduct = this.convertBackendProduct(savedProduct);

        this.products = [convertedProduct, ...this.products];

        this.resetForm();

        this.showMessage('Product registered successfully!', 'success');

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error saving product:', error);

        this.showMessage(
          'Could not save product. Check the backend or duplicate SKU/barcode.',
          'error',
        );

        this.cdr.detectChanges();
      },
    });
  }

  // ----------------------------------
  // DELETE PRODUCT FROM DATABASE
  // ----------------------------------

  deleteProduct(product: Product): void {
    const confirmed = window.confirm(`Delete ${product.name} from the database?`);

    if (!confirmed) {
      return;
    }

    this.http.delete<void>(`${this.productApiUrl}/${product.id}`).subscribe({
      next: () => {
        this.products = this.products.filter((item) => item.id !== product.id);

        if (this.editingProductId === product.id) {
          this.resetForm();
        }

        this.showMessage('Product deleted successfully!', 'success');

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error('Error deleting product:', error);

        this.showMessage('Could not delete product from the database.', 'error');

        this.cdr.detectChanges();
      },
    });
  }

  // ----------------------------------
  // RESET PRODUCT FORM
  // ----------------------------------

  resetForm(): void {
    this.form = this.emptyForm();

    this.editingProductId = null;

    this.message = '';
  }

  // ----------------------------------
  // CREATE EMPTY PRODUCT FORM
  // ----------------------------------

  private emptyForm(): ProductForm {
    return {
      sku: '',
      name: '',
      barcode: '',
      category: '',
      costPrice: null,
      sellingPrice: null,
      description: '',
      active: true,
    };
  }

  // ----------------------------------
  // DISPLAY SUCCESS OR ERROR MESSAGES
  // ----------------------------------

  private showMessage(text: string, type: 'success' | 'error'): void {
    this.message = text;

    this.messageType = type;
  }

  // ----------------------------------
  // PRODUCT CATEGORY ICONS
  // ----------------------------------

  private iconForCategory(category: string): string {
    const icons: Record<string, string> = {
      Lighting: '💡',
      'Electrical Accessories': '🔌',
      'Electrical Wires': '🔌',
      'Electrical Switches': '🔌',
      'Power Tools': '🛠️',
      Hardware: '🔩',
      'Safety Equipment': '🧤',
      'Spare Parts': '⚙️',
      'Drilling Tools': '🛠️',
    };

    return icons[category] ?? '📦';
  }
}
