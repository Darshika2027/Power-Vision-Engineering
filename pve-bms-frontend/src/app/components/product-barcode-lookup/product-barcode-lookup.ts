
import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface Product {
  id: number;
  sku: string;
  name: string;
  barcode: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  active: boolean;
  category?: {
    id: number;
    name: string;
  };
}

@Component({
  selector: 'app-product-barcode-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-barcode-lookup.html',
  styleUrl: './product-barcode-lookup.css'
})
export class ProductBarcodeLookup {

  @ViewChild('barcodeInput')
  barcodeInput!: ElementRef<HTMLInputElement>;

  private readonly apiUrl = 'http://localhost:8080/api/products';

  barcode = '';
  product: Product | null = null;

  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private http: HttpClient) {}

  searchProduct(): void {
    const enteredBarcode = this.barcode.trim();

    this.product = null;
    this.successMessage = '';
    this.errorMessage = '';

    if (!enteredBarcode) {
      this.errorMessage = 'Please enter or scan a product barcode.';
      return;
    }

    this.loading = true;

    this.http.get<Product[]>(this.apiUrl).subscribe({
      next: (products) => {

        const foundProduct = products.find(
          item => item.barcode?.trim() === enteredBarcode
        );

        if (!foundProduct) {
          this.errorMessage = 'No product found for this barcode.';
        } else if (!foundProduct.active) {
          this.errorMessage = 'This product is currently inactive.';
        } else {
          this.product = foundProduct;
          this.successMessage = 'Product found successfully!';
        }

        this.loading = false;
      },

      error: (error) => {
        console.error('Barcode lookup error:', error);

        this.errorMessage =
          'Unable to connect to the server. Please try again.';

        this.loading = false;
      }
    });
  }

  clearSearch(): void {
    this.barcode = '';
    this.product = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.loading = false;

    this.barcodeInput?.nativeElement.focus();
  }

  formatPrice(price: number | null | undefined): string {
    return Number(price ?? 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  viewDetails(): void {
    if (this.product) {
      this.successMessage = 'Product details are displayed above.';
    }
  }
}
