import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { ProductBarcodeLookup } from './product-barcode-lookup';

describe('ProductBarcodeLookup', () => {
  let component: ProductBarcodeLookup;
  let fixture: ComponentFixture<ProductBarcodeLookup>;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:8080/api/products/barcode/';

  const testProduct = {
    id: 29,
    sku: 'PVE-BARCODE-TEST-001',
    name: 'Barcode Test Product',
    barcode: '1234567890123',
    description: 'Barcode lookup testing',
    costPrice: 1500,
    sellingPrice: 2000,
    active: true,
    category: {
      id: 1,
      name: 'Electrical Accessories'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductBarcodeLookup],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(ProductBarcodeLookup);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify({ ignoreCancelled: true });
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display barcode input and search button', () => {
    const input = fixture.nativeElement.querySelector('#barcodeInput');
    const button = fixture.nativeElement.querySelector('.search-btn');

    expect(input).toBeTruthy();
    expect(button).toBeTruthy();
  });

  it('should reject an empty barcode without sending an API request', () => {
    component.barcode = '   ';

    component.searchProduct();

    expect(component.errorMessage)
      .toBe('Please enter or scan a product barcode.');

    expect(component.loading).toBe(false);
  });

  it('should search a valid barcode and display product details', () => {
    component.barcode = '1234567890123';

    component.searchProduct();

    expect(component.loading).toBe(true);

    const request = httpMock.expectOne(apiUrl + '1234567890123');

    expect(request.request.method).toBe('GET');

    request.flush(testProduct);

    fixture.detectChanges();

    expect(component.product?.name).toBe('Barcode Test Product');
    expect(component.successMessage).toBe('Product found successfully!');
    expect(component.loading).toBe(false);

    const result = fixture.nativeElement.querySelector('.product-result');

    expect(result).toBeTruthy();
    expect(result.textContent).toContain('Barcode Test Product');
  });

  it('should display an error for an unknown barcode', () => {
    component.barcode = '9999999999999';

    component.searchProduct();

    const request = httpMock.expectOne(apiUrl + '9999999999999');

    request.flush(
      { message: 'Product not found' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(component.errorMessage)
      .toBe('No product found for this barcode.');

    expect(component.loading).toBe(false);
    expect(component.product).toBeNull();
  });

  it('should display an error for an invalid barcode', () => {
    component.barcode = 'INVALID';

    component.searchProduct();

    const request = httpMock.expectOne(apiUrl + 'INVALID');

    request.flush(
      { message: 'Invalid barcode' },
      { status: 400, statusText: 'Bad Request' }
    );

    expect(component.errorMessage)
      .toBe('Invalid barcode. Please check and try again.');

    expect(component.loading).toBe(false);
  });

  it('should handle server errors', () => {
    component.barcode = '1234567890123';

    component.searchProduct();

    const request = httpMock.expectOne(apiUrl + '1234567890123');

    request.flush(
      { message: 'Internal server error' },
      { status: 500, statusText: 'Internal Server Error' }
    );

    expect(component.errorMessage)
      .toBe('Unable to connect to the server. Please try again.');

    expect(component.loading).toBe(false);
  });

  it('should stop loading when the request times out', async () => {
    vi.useFakeTimers();

    try {
      component.barcode = '1234567890123';

      component.searchProduct();

      expect(component.loading).toBe(true);

      await vi.advanceTimersByTimeAsync(10001);

      expect(component.loading).toBe(false);

      expect(component.errorMessage)
        .toBe('Unable to connect to the server. Please try again.');
    } finally {
      vi.useRealTimers();
    }
  });

  it('should display an inactive product message', () => {
    component.barcode = '1234567890123';

    component.searchProduct();

    const request = httpMock.expectOne(apiUrl + '1234567890123');

    request.flush({
      ...testProduct,
      active: false
    });

    expect(component.product).toBeNull();

    expect(component.errorMessage)
      .toBe('This product is currently inactive.');

    expect(component.loading).toBe(false);
  });

  it('should prevent duplicate requests while loading', () => {
    component.barcode = '1234567890123';

    component.searchProduct();
    component.searchProduct();

    const requests = httpMock.match(apiUrl + '1234567890123');

    expect(requests.length).toBe(1);

    requests[0].flush(testProduct);

    expect(component.loading).toBe(false);
  });

  it('should clear barcode, product and messages', () => {
    component.barcode = '1234567890123';
    component.product = testProduct;
    component.successMessage = 'Success';
    component.errorMessage = 'Error';

    component.clearSearch();

    expect(component.barcode).toBe('');
    expect(component.product).toBeNull();
    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toBe('');
    expect(component.loading).toBe(false);
  });

  it('should format prices correctly', () => {
    expect(component.formatPrice(2000)).toBe('2,000.00');
    expect(component.formatPrice(1500.5)).toBe('1,500.50');
    expect(component.formatPrice(null)).toBe('0.00');
  });
});