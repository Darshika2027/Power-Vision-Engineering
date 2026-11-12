import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

// Product data structure
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

// Product registration form structure
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

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  // Sample categories
  // Later, these will come from the backend database.
  categories = [
    'Lighting',
    'Electrical Accessories',
    'Power Tools',
    'Hardware',
    'Safety Equipment',
  ];

  // Sample product records
  // These products are stored temporarily in memory.
  products: Product[] = [
    {
      id: 1,
      sku: 'PVE-1001',
      name: 'LED Bulb 12W',
      barcode: '10010001',
      category: 'Lighting',
      costPrice: 540,
      sellingPrice: 850,
      description: 'Energy-saving LED bulb',
      active: true,
      icon: '💡',
    },
    {
      id: 2,
      sku: 'PVE-1002',
      name: 'Extension Cord 5m',
      barcode: '10010002',
      category: 'Electrical Accessories',
      costPrice: 970,
      sellingPrice: 1500,
      description: 'Five-metre extension cable',
      active: true,
      icon: '🔌',
    },
    {
      id: 3,
      sku: 'PVE-1003',
      name: 'Cordless Drill 18V',
      barcode: '10010003',
      category: 'Power Tools',
      costPrice: 12500,
      sellingPrice: 16900,
      description: 'Battery-powered drill',
      active: true,
      icon: '🛠️',
    },
    {
      id: 4,
      sku: 'PVE-1004',
      name: 'Safety Gloves',
      barcode: '10010004',
      category: 'Safety Equipment',
      costPrice: 600,
      sellingPrice: 950,
      description: 'Protective work gloves',
      active: false,
      icon: '🧤',
    },
  ];

  // Next temporary Product ID
  private nextId = 5;

  // Search and filter variables
  searchText = '';
  selectedCategory = 'all';
  selectedStatus = 'all';

  // Remember which product is being edited
  editingProductId: number | null = null;

  // Success and error messages
  message = '';
  messageType: 'success' | 'error' = 'success';

  // Registration form
  form: ProductForm = this.emptyForm();

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

    // Validate required fields
    if (!sku || !name || !this.form.category) {
      this.showMessage('Please complete SKU, Product Name and Category.', 'error');

      return;
    }

    // Validate prices
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

    // Check duplicate SKU
    const duplicateSku = this.products.some(
      (product) =>
        product.id !== this.editingProductId && product.sku.toLowerCase() === sku.toLowerCase(),
    );

    if (duplicateSku) {
      this.showMessage('This SKU is already used by another product.', 'error');

      return;
    }

    // Check duplicate barcode
    const duplicateBarcode =
      barcode &&
      this.products.some(
        (product) => product.id !== this.editingProductId && product.barcode === barcode,
      );

    if (duplicateBarcode) {
      this.showMessage('This barcode is already used by another product.', 'error');

      return;
    }

    // Determine whether registering or editing
    const wasEditing = this.editingProductId !== null;

    const existing = this.products.find((product) => product.id === this.editingProductId);

    if (wasEditing && !existing) {
      this.showMessage('The selected product could not be found.', 'error');

      return;
    }

    // Prepare product information
    const updatedData = {
      sku: sku,
      name: name,
      barcode: barcode,
      category: this.form.category,
      costPrice: cost,
      sellingPrice: selling,
      description: this.form.description.trim(),
      active: this.form.active,
      icon: this.iconForCategory(this.form.category),
    };

    if (existing) {
      // Update selected product
      // SKU remains unchanged during editing.
      Object.assign(existing, {
        ...updatedData,
        sku: existing.sku,
      });
    } else {
      // Register a new product
      this.products.unshift({
        id: this.nextId++,
        ...updatedData,
      });
    }

    // Clear form after saving
    this.resetForm();

    // Display success message
    this.showMessage(
      wasEditing ? 'Product updated successfully!' : 'Product registered successfully!',
      'success',
    );
  }

  // ----------------------------------
  // DELETE PRODUCT FROM DEMO LIST
  // ----------------------------------

  deleteProduct(product: Product): void {
    const confirmed = window.confirm(`Delete ${product.name} from this demo list?`);

    if (!confirmed) {
      return;
    }

    this.products = this.products.filter((item) => item.id !== product.id);

    if (this.editingProductId === product.id) {
      this.resetForm();
    }

    this.showMessage('Product removed from the demo list.', 'success');
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
  // DISPLAY MESSAGES
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
      'Power Tools': '🛠️',
      Hardware: '🔩',
      'Safety Equipment': '🧤',
    };

    return icons[category] ?? '📦';
  }
}
