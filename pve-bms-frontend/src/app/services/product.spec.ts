import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { ProductService } from './product';

describe('ProductService', () => {

  let service: ProductService;
  let httpMock: HttpTestingController;

  const apiUrl = 'http://localhost:8080/api/products';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProductService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should retrieve all products', () => {

    const mockProducts = [
      {
        id: 1,
        sku: 'PVE-TEST-001',
        name: 'Test Product'
      }
    ];

    service.getProducts().subscribe(products => {
      expect(products.length).toBe(1);
      expect(products[0].name).toBe('Test Product');
    });

    const request = httpMock.expectOne(apiUrl);

    expect(request.request.method).toBe('GET');

    request.flush(mockProducts);
  });

  it('should add a product', () => {

    const newProduct = {
      sku: 'PVE-TEST-002',
      name: 'New Test Product'
    };

    service.addProduct(newProduct).subscribe(response => {
      expect(response.name).toBe('New Test Product');
    });

    const request = httpMock.expectOne(apiUrl);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(newProduct);

    request.flush({
      id: 2,
      ...newProduct
    });
  });

  it('should update a product', () => {

    const updatedProduct = {
      name: 'Updated Test Product'
    };

    service.updateProduct(2, updatedProduct).subscribe(response => {
      expect(response.name).toBe('Updated Test Product');
    });

    const request = httpMock.expectOne(`${apiUrl}/2`);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(updatedProduct);

    request.flush({
      id: 2,
      ...updatedProduct
    });
  });

  it('should delete a product', () => {

    service.deleteProduct(2).subscribe();

    const request = httpMock.expectOne(`${apiUrl}/2`);

    expect(request.request.method).toBe('DELETE');

    request.flush(null);
  });

});