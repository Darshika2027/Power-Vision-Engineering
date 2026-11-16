import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RackInventory {
  id: number;
  rackNumber: string;
  productName: string;
  sku: string;
  category: string;
  quantity: number;
  location: string;
  updatedAt: string;
}

export interface RackRequest {
  productId: number;
  rackNumber: string;
  quantity: number;
  location: string;
}

export interface RackSummary {
  totalRacks: number;
  totalProducts: number;
  totalStock: number;
  lowStock: number;
  mainStoreEntries: number;
  frontStoreEntries: number;
  backStoreEntries: number;
}

@Injectable({
  providedIn: 'root'
})
export class RackInventoryService {

  private readonly apiUrl = 'http://localhost:8080/api/rack-inventory';

  constructor(private http: HttpClient) {}

  getAll(search = '', location = 'All Locations'): Observable<RackInventory[]> {
    let params = new HttpParams();

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (location !== 'All Locations') {
      params = params.set('location', location);
    }

    return this.http.get<RackInventory[]>(this.apiUrl, { params });
  }

  getSummary(): Observable<RackSummary> {
    return this.http.get<RackSummary>(`${this.apiUrl}/summary`);
  }

  create(request: RackRequest): Observable<RackInventory> {
    return this.http.post<RackInventory>(this.apiUrl, request);
  }

  update(id: number, request: RackRequest): Observable<RackInventory> {
    return this.http.put<RackInventory>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
