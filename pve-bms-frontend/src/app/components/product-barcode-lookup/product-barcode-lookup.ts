import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';

interface Product {
  id: number;
  sku: string;
  name: string;
  barcode: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  active: boolean;
  category?: { id: number; name: string };
}

@Component({
  selector: 'app-product-barcode-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  searchProduct(): void {
    const enteredBarcode = this.barcode.trim();

    if (this.loading) return;

    this.product = null;
    this.successMessage = '';
    this.errorMessage = '';

    if (!enteredBarcode) {
      this.errorMessage = 'Please enter or scan a product barcode.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const url = `${this.apiUrl}/barcode/${encodeURIComponent(enteredBarcode)}`;

    this.http.get<Product>(url).pipe(
      timeout({ first: 10000 })
    ).subscribe({
      next: (foundProduct) => {
        if (!foundProduct.active) {
          this.errorMessage = 'This product is currently inactive.';
        } else {
          this.product = foundProduct;
          this.successMessage = 'Product found successfully!';
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Barcode lookup error:', error);

        if (error.status === 404) {
          this.errorMessage = 'No product found for this barcode.';
        } else if (error.status === 400) {
          this.errorMessage = 'Invalid barcode. Please check and try again.';
        } else {
          this.errorMessage = 'Unable to connect to the server. Please try again.';
        }

        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  clearSearch(): void {
    this.barcode = '';
    this.product = null;
    this.successMessage = '';
    this.errorMessage = '';
    this.loading = false;

    this.cdr.markForCheck();
    this.barcodeInput?.nativeElement.focus();
  }

  formatPrice(price: number | null | undefined): string {
    return Number(price ?? 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
