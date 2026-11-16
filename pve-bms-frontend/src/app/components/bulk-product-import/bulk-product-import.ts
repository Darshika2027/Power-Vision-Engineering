import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

interface Category {
  id: number;
  name: string;
}

interface ExistingProduct {
  id?: number;
  sku: string;
  barcode?: string;
}

interface ImportRow {
  rowNumber: number;
  sku: string;
  name: string;
  categoryName: string;
  categoryId: number | null;
  barcode: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  active: boolean;
  status: 'Valid' | 'Invalid' | 'Duplicate' | 'Imported' | 'Failed';
  issues: string[];
  error?: string;
}

@Component({
  selector: 'app-bulk-product-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-product-import.html',
  styleUrl: './bulk-product-import.css'
})
export class BulkProductImport implements OnInit {

  private readonly productUrl = 'http://localhost:8080/api/products';
  private readonly categoryUrl = 'http://localhost:8080/api/categories';

  categories: Category[] = [];
  existingProducts: ExistingProduct[] = [];
  rows: ImportRow[] = [];

  selectedFile: File | null = null;
  fileName = '';

  loading = false;
  importing = false;
  dataLoading = true;

  errorMessage = '';
  successMessage = '';

  importedCount = 0;
  failedCount = 0;
  currentImport = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMasterData();
  }

  get totalRows(): number {
    return this.rows.length;
  }

  get validCount(): number {
    return this.rows.filter(row => row.status === 'Valid').length;
  }

  get invalidCount(): number {
    return this.rows.filter(row => row.status === 'Invalid').length;
  }

  get duplicateCount(): number {
    return this.rows.filter(row => row.status === 'Duplicate').length;
  }

  get importedRows(): number {
    return this.rows.filter(row => row.status === 'Imported').length;
  }

  get failedRows(): ImportRow[] {
    return this.rows.filter(row => row.status === 'Failed');
  }

  get importProgress(): number {
    if (!this.totalRows) return 0;
    return Math.round((this.currentImport / this.totalRows) * 100);
  }

  loadMasterData(): void {
    this.dataLoading = true;

    forkJoin({
      categories: this.http.get<Category[]>(this.categoryUrl),
      products: this.http.get<ExistingProduct[]>(this.productUrl)
    }).subscribe({
      next: result => {
        this.categories = result.categories || [];
        this.existingProducts = result.products || [];
        this.dataLoading = false;
      },
      error: error => {
        console.error('Master data loading failed:', error);
        this.errorMessage =
          'Unable to load products and categories. Check whether the backend is running.';
        this.dataLoading = false;
      }
    });
  }

  downloadTemplate(): void {
    const headers = [
      'SKU',
      'Product Name',
      'Category',
      'Barcode',
      'Description',
      'Cost Price',
      'Selling Price',
      'Active'
    ];

    const example = [
      'PVE-EXAMPLE-001',
      'Electrical Wire',
      this.categories[0]?.name || 'Electrical Accessories',
      '4791234567890',
      'Copper electrical wire',
      1500,
      2000,
      true
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      example
    ]);

    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 35 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 }
    ];

    const instructions = [
      ['PVE-BMS - Bulk Product Import Template'],
      ['Required fields: SKU, Product Name, Category, Cost Price, Selling Price'],
      ['Barcode and Description are optional.'],
      ['Active accepts TRUE or FALSE. If blank, TRUE is used.'],
      ['Category must exactly match an existing category name.'],
      ['Do not use an existing SKU or Barcode.'],
      ['Do not change the column headings.'],
      ['Delete the example row before importing your own products.']
    ];

    const instructionSheet = XLSX.utils.aoa_to_sheet(instructions);
    instructionSheet['!cols'] = [{ wch: 100 }];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

    XLSX.writeFile(workbook, 'PVE-BMS-Product-Import-Template.xlsx');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    this.errorMessage = '';
    this.successMessage = '';
    this.rows = [];
    this.selectedFile = null;
    this.fileName = '';

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.errorMessage = 'Please select an Excel .xlsx file.';
      input.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'File size must not exceed 10 MB.';
      input.value = '';
      return;
    }

    if (file.size === 0) {
      this.errorMessage = 'The selected file is empty.';
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.fileName = file.name;
    this.readExcelFile(file);
  }

  async readExcelFile(file: File): Promise<void> {
    this.loading = true;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });

      const sheet = workbook.Sheets['Products'] ||
        workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new Error('No worksheet found in the Excel file.');
      }

      const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        sheet,
        { defval: '', raw: false }
      );

      if (!data.length) {
        throw new Error('The Excel file does not contain product records.');
      }

      if (data.length > 5000) {
        throw new Error('A maximum of 5,000 product rows is allowed per file.');
      }

      this.rows = data.map((record, index) =>
        this.mapExcelRow(record, index + 2)
      );

      this.validateRows();

    } catch (error) {
      console.error(error);
      this.rows = [];
      this.errorMessage = error instanceof Error
        ? error.message
        : 'Unable to read the Excel file.';
    } finally {
      this.loading = false;
    }
  }

  private normalizeHeader(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private getValue(
    record: Record<string, unknown>,
    aliases: string[]
  ): string {
    const normalizedRecord: Record<string, unknown> = {};

    Object.keys(record).forEach(key => {
      normalizedRecord[this.normalizeHeader(key)] = record[key];
    });

    for (const alias of aliases) {
      const value = normalizedRecord[this.normalizeHeader(alias)];

      if (value !== undefined && value !== null) {
        return String(value).trim();
      }
    }

    return '';
  }

  private parsePrice(value: string): number {
    const cleaned = value
      .replace(/Rs\.?/gi, '')
      .replace(/,/g, '')
      .trim();

    return cleaned === '' ? NaN : Number(cleaned);
  }

  private mapExcelRow(
    record: Record<string, unknown>,
    rowNumber: number
  ): ImportRow {

    const sku = this.getValue(record, ['SKU', 'Product SKU']);
    const name = this.getValue(record, ['Product Name', 'Name']);
    const categoryName = this.getValue(record, ['Category', 'Category Name']);
    const barcode = this.getValue(record, ['Barcode', 'Bar Code']);
    const description = this.getValue(record, ['Description']);
    const costPrice = this.parsePrice(
      this.getValue(record, ['Cost Price', 'CostPrice'])
    );
    const sellingPrice = this.parsePrice(
      this.getValue(record, ['Selling Price', 'SellingPrice'])
    );

    const activeValue = this.getValue(record, ['Active', 'Status']);

    return {
      rowNumber,
      sku,
      name,
      categoryName,
      categoryId: null,
      barcode,
      description,
      costPrice,
      sellingPrice,
      active: activeValue === ''
        ? true
        : !['false', '0', 'no', 'inactive'].includes(
            activeValue.toLowerCase()
          ),
      status: 'Invalid',
      issues: []
    };
  }

  private validateRows(): void {
    const seenSkus = new Set<string>();
    const seenBarcodes = new Set<string>();

    const existingSkus = new Set(
      this.existingProducts
        .map(product => product.sku?.trim().toLowerCase())
        .filter(Boolean)
    );

    const existingBarcodes = new Set(
      this.existingProducts
        .map(product => product.barcode?.trim().toLowerCase())
        .filter(Boolean)
    );

    for (const row of this.rows) {
      row.issues = [];

      if (!row.sku) row.issues.push('SKU is required.');
      if (!row.name) row.issues.push('Product name is required.');
      if (!row.categoryName) row.issues.push('Category is required.');

      if (!Number.isFinite(row.costPrice) || row.costPrice <= 0) {
        row.issues.push('Cost price must be greater than zero.');
      }

      if (!Number.isFinite(row.sellingPrice) || row.sellingPrice <= 0) {
        row.issues.push('Selling price must be greater than zero.');
      }

      const category = this.categories.find(
        item => item.name.trim().toLowerCase() ===
          row.categoryName.trim().toLowerCase()
      );

      if (row.categoryName && !category) {
        row.issues.push('Category does not exist.');
      } else if (category) {
        row.categoryId = category.id;
      }

      const skuKey = row.sku.toLowerCase();
      const barcodeKey = row.barcode.toLowerCase();

      let duplicate = false;

      if (skuKey && (
        existingSkus.has(skuKey) || seenSkus.has(skuKey)
      )) {
        duplicate = true;
        row.issues.push('Duplicate SKU.');
      }

      if (barcodeKey && (
        existingBarcodes.has(barcodeKey) ||
        seenBarcodes.has(barcodeKey)
      )) {
        duplicate = true;
        row.issues.push('Duplicate barcode.');
      }

      if (skuKey) seenSkus.add(skuKey);
      if (barcodeKey) seenBarcodes.add(barcodeKey);

      if (duplicate) {
        row.status = 'Duplicate';
      } else if (row.issues.length > 0) {
        row.status = 'Invalid';
      } else {
        row.status = 'Valid';
      }
    }
  }

  async importProducts(): Promise<void> {
    const validRows = this.rows.filter(row => row.status === 'Valid');

    if (!validRows.length) {
      this.errorMessage = 'There are no valid products to import.';
      return;
    }

    this.importing = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.importedCount = 0;
    this.failedCount = 0;
    this.currentImport = 0;

    for (const row of validRows) {
      const payload = {
        sku: row.sku,
        name: row.name,
        barcode: row.barcode || null,
        description: row.description,
        costPrice: row.costPrice,
        sellingPrice: row.sellingPrice,
        active: row.active,
        category: {
          id: Number(row.categoryId)
        }
      };

      try {
        await firstValueFrom(
          this.http.post(this.productUrl, payload)
        );

        row.status = 'Imported';
        this.importedCount++;

      } catch (error: any) {
        row.status = 'Failed';
        row.error = error?.error?.message ||
          error?.message ||
          'Product import failed.';
        this.failedCount++;
      }

      this.currentImport++;
    }

    this.importing = false;

    if (this.failedCount === 0) {
      this.successMessage =
        `${this.importedCount} product(s) imported successfully.`;
    } else {
      this.errorMessage =
        `${this.importedCount} imported successfully. ${this.failedCount} failed.`;
    }

    this.loadMasterData();
  }

  clearFile(): void {
    if (this.importing) return;

    this.selectedFile = null;
    this.fileName = '';
    this.rows = [];
    this.errorMessage = '';
    this.successMessage = '';
    this.importedCount = 0;
    this.failedCount = 0;
    this.currentImport = 0;
  }
}
