import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { firstValueFrom, forkJoin } from 'rxjs';

interface Category {
  id: number;
  name: string;
}

interface ExistingProduct {
  id?: number;
  sku: string;
  barcode?: string;
}

type RowStatus = 'Valid' | 'Invalid' | 'Duplicate' | 'Imported' | 'Failed';

interface ImportRow {
  rowNumber: number;
  sku: string;
  name: string;
  categoryName: string;
  categoryId: number | null;
  barcode: string;
  description: string;
  costPrice: number | null;
  sellingPrice: number | null;
  active: boolean;
  status: RowStatus;
  issues: string[];
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
  dataLoading = false;

  errorMessage = '';
  successMessage = '';

  importedCount = 0;
  failedCount = 0;
  currentImport = 0;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

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

  get failedRows(): number {
    return this.rows.filter(row => row.status === 'Failed').length;
  }

  get importProgress(): number {
    if (this.validCount + this.importedRows + this.failedRows === 0) {
      return 0;
    }

    const total = this.validCount + this.importedRows + this.failedRows;

    return Math.round(
      ((this.importedRows + this.failedRows) / total) * 100
    );
  }

  loadMasterData(): void {
    this.dataLoading = true;
    this.errorMessage = '';

    forkJoin({
      categories: this.http.get<Category[]>(this.categoryUrl),
      products: this.http.get<ExistingProduct[]>(this.productUrl)
    }).subscribe({
      next: result => {
        this.categories = result.categories ?? [];
        this.existingProducts = result.products ?? [];
        this.dataLoading = false;
      },
      error: () => {
        this.errorMessage =
          'Unable to load categories and existing products. Check the backend connection.';
        this.dataLoading = false;
      }
    });
  }

  async downloadTemplate(): Promise<void> {
    const XLSX = await import('xlsx');
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
      'Electrical Accessories',
      '1234567890123',
      'Example product description',
      1500,
      2000,
      'Yes'
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([
      headers,
      example
    ]);

    const instructions = XLSX.utils.aoa_to_sheet([
      ['Bulk Product Import Instructions'],
      ['SKU: Required unique product identifier.'],
      ['Product Name: Required.'],
      ['Category: Must match an existing category.'],
      ['Barcode: Optional, but must be unique when provided.'],
      ['Description: Optional.'],
      ['Cost Price: Required positive number.'],
      ['Selling Price: Required positive number.'],
      ['Active: Yes/No, True/False, 1/0.'],
      ['Existing products are not silently overwritten.'],
      ['Review the preview and confirm before importing.']
    ]);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.utils.book_append_sheet(workbook, instructions, 'Instructions');

    XLSX.writeFile(workbook, 'PVE_Product_Import_Template.xlsx');
  }

  onFileSelected(event: Event): void {
    this.errorMessage = '';
    this.successMessage = '';

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

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

    this.importedCount = 0;
    this.failedCount = 0;
    this.currentImport = 0;
    this.rows = [];

    this.readExcelFile(file);
  }

  private readExcelFile(file: File): void {
    this.loading = true;

    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      try {
        const XLSX = await import('xlsx');
        const data = event.target?.result;

        if (!data) {
          throw new Error('Unable to read the selected file.');
        }

        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames.includes('Products')
          ? 'Products'
          : workbook.SheetNames[0];

        if (!sheetName) {
          throw new Error('No worksheet found in the Excel file.');
        }

        const worksheet = workbook.Sheets[sheetName];

        const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          worksheet,
          { defval: '', raw: false }
        );

        if (records.length === 0) {
          throw new Error('No product records found in the worksheet.');
        }

        if (records.length > 5000) {
          throw new Error('Maximum allowed rows are 5000.');
        }

        const headers = Object.keys(records[0]).map(header =>
          this.normalizeHeader(header)
        );

        const requiredHeaders = [
          'sku',
          'productname',
          'category',
          'costprice',
          'sellingprice'
        ];

        const missingHeaders = requiredHeaders.filter(
          header => !headers.includes(header)
        );

        if (missingHeaders.length > 0) {
          throw new Error(
            'Missing required columns: ' + missingHeaders.join(', ')
          );
        }

        this.rows = records.map((record, index) =>
          this.mapExcelRow(record, index + 2)
        );

        this.validateRows();

        this.loading = false;
        this.cdr.detectChanges();
      } catch (error) {
        this.loading = false;
        this.cdr.detectChanges();
        this.rows = [];

        this.errorMessage = error instanceof Error
          ? error.message
          : 'Unable to process the Excel file.';
      }
    };

    reader.onerror = () => {
      this.loading = false;
        this.cdr.detectChanges();
      this.errorMessage = 'Failed to read the selected file.';
    };

    reader.readAsArrayBuffer(file);
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

  private parsePrice(value: string): number | null {
    if (!value.trim()) {
      return null;
    }

    const cleaned = value.replace(/Rs\.?|,/gi, '').trim();

    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
      return null;
    }

    const number = Number(cleaned);

    return Number.isFinite(number) ? number : null;
  }

  private parseActive(value: string): {
    value: boolean;
    valid: boolean;
  } {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return { value: true, valid: true };
    }

    if (['true', '1', 'yes', 'active'].includes(normalized)) {
      return { value: true, valid: true };
    }

    if (['false', '0', 'no', 'inactive'].includes(normalized)) {
      return { value: false, valid: true };
    }

    return { value: true, valid: false };
  }

  private mapExcelRow(
    record: Record<string, unknown>,
    rowNumber: number
  ): ImportRow {
    const sku = this.getValue(record, [
      'SKU',
      'Product ID',
      'Product Code',
      'Item Code'
    ]);

    const name = this.getValue(record, [
      'Product Name',
      'Name',
      'Item Name'
    ]);

    const categoryName = this.getValue(record, [
      'Category',
      'Category Name'
    ]);

    const barcode = this.getValue(record, [
      'Barcode',
      'Bar Code',
      'EAN'
    ]);

    const description = this.getValue(record, [
      'Description',
      'Product Description'
    ]);

    const costPrice = this.parsePrice(
      this.getValue(record, ['Cost Price', 'Purchase Price'])
    );

    const sellingPrice = this.parsePrice(
      this.getValue(record, ['Selling Price', 'Sale Price'])
    );

    const activeText = this.getValue(record, ['Active', 'Status']);
    const active = this.parseActive(activeText);

    const category = this.categories.find(item =>
      item.name.trim().toLowerCase() === categoryName.toLowerCase()
    );

    const row: ImportRow = {
      rowNumber,
      sku,
      name,
      categoryName,
      categoryId: category?.id ?? null,
      barcode,
      description,
      costPrice,
      sellingPrice,
      active: active.value,
      status: 'Valid',
      issues: []
    };

    if (!active.valid) {
      row.issues.push('Active must be Yes/No, True/False or 1/0.');
    }

    return row;
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

    this.rows.forEach(row => {
      row.issues = row.issues.filter(issue =>
        issue.startsWith('Active must be')
      );

      if (!row.sku) {
        row.issues.push('SKU / Product ID is required.');
      }

      if (!row.name) {
        row.issues.push('Product name is required.');
      }

      if (!row.categoryName) {
        row.issues.push('Category is required.');
      } else if (!row.categoryId) {
        row.issues.push('Category does not exist.');
      }

      if (row.costPrice === null || row.costPrice <= 0) {
        row.issues.push('Cost price must be a positive number.');
      }

      if (row.sellingPrice === null || row.sellingPrice <= 0) {
        row.issues.push('Selling price must be a positive number.');
      }

      const skuKey = row.sku.toLowerCase();
      const barcodeKey = row.barcode.toLowerCase();

      let duplicate = false;

      if (skuKey) {
        if (existingSkus.has(skuKey) || seenSkus.has(skuKey)) {
          row.issues.push('Duplicate SKU / Product ID.');
          duplicate = true;
        }

        seenSkus.add(skuKey);
      }

      if (barcodeKey) {
        if (
          existingBarcodes.has(barcodeKey) ||
          seenBarcodes.has(barcodeKey)
        ) {
          row.issues.push('Duplicate barcode.');
          duplicate = true;
        }

        seenBarcodes.add(barcodeKey);
      }

      if (duplicate) {
        row.status = 'Duplicate';
      } else if (row.issues.length > 0) {
        row.status = 'Invalid';
      } else {
        row.status = 'Valid';
      }
    });
  }

  async importProducts(): Promise<void> {
    if (this.importing || this.validCount === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Import ${this.validCount} valid new products? Existing products will not be overwritten.`
    );

    if (!confirmed) {
      return;
    }

    this.importing = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.importedCount = 0;
    this.failedCount = 0;
    this.currentImport = 0;

    const validRows = this.rows.filter(row => row.status === 'Valid');

    for (const row of validRows) {
      this.currentImport++;

      const payload = {
        sku: row.sku,
        name: row.name,
        barcode: row.barcode || null,
        description: row.description,
        costPrice: row.costPrice,
        sellingPrice: row.sellingPrice,
        active: row.active,
        category: {
          id: row.categoryId
        }
      };

      try {
        await firstValueFrom(
          this.http.post(this.productUrl, payload)
        );

        row.status = 'Imported';
        this.importedCount++;
      } catch {
        row.status = 'Failed';
        row.issues.push(
          'Import failed. Check the backend response and product data.'
        );
        this.failedCount++;
      }
    }

    this.importing = false;

    this.successMessage =
      `${this.importedCount} product(s) imported successfully. ` +
      `${this.failedCount} product(s) failed.`;

    this.loadMasterData();
  }

  clearFile(): void {
    if (this.importing) {
      return;
    }

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