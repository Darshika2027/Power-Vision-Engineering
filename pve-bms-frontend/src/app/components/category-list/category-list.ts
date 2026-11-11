
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category as ApiCategory } from '../../services/category.service';

interface Category {
  id: number;
  name: string;
  description: string;
  parentId: number | null;
  status: 'Active' | 'Inactive';
  productCount: number;
  icon: string;
  color: string;
  createdAt: string;
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css'
})
export class CategoryList implements OnInit {

  constructor(private categoryService: CategoryService) {}

  categories: Category[] = [];

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data.map(item => this.mapCategory(item));
      },
      error: () => {
        this.showToast('Unable to load categories.', 'error');
      }
    });
  }

  mapCategory(item: ApiCategory): Category {
    return {
      id: item.id!,
      name: item.name,
      description: item.description || '',
      parentId: null,
      status: item.active ? 'Active' : 'Inactive',
      productCount: 0,
      icon: '📦',
      color: 'blue',
      createdAt: item.createdAt || ''
    };
  }

  searchText = '';
  statusFilter = 'All';
  viewMode: 'grid' | 'list' = 'grid';

  showForm = false;
  editingId: number | null = null;
  selectedCategory: Category | null = null;

  currentPage = 1;
  pageSize = 6;

  toastMessage = '';
  toastType = 'success';

  form = {
    name: '',
    description: '',
    parentId: null as number | null,
    icon: '📦',
    status: 'Active' as 'Active' | 'Inactive'
  };

  get totalCategories(): number {
    return this.categories.length;
  }

  get activeCount(): number {
    return this.categories.filter(c => c.status === 'Active').length;
  }

  get inactiveCount(): number {
    return this.categories.filter(c => c.status === 'Inactive').length;
  }

  get subcategoryCount(): number {
    return this.categories.filter(c => c.parentId !== null).length;
  }

  get filteredCategories(): Category[] {
    const search = this.searchText.toLowerCase().trim();

    return this.categories.filter(category => {
      const matchesSearch =
        category.name.toLowerCase().includes(search) ||
        category.description.toLowerCase().includes(search);

      const matchesStatus =
        this.statusFilter === 'All' ||
        category.status === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCategories.length / this.pageSize));
  }

  get paginatedCategories(): Category[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCategories.slice(start, start + this.pageSize);
  }

  get parentCategories(): Category[] {
    return this.categories.filter(c =>
      c.parentId === null &&
      c.id !== this.editingId
    );
  }

  get selectedParentName(): string {
    if (!this.selectedCategory?.parentId) {
      return 'Main Category';
    }

    return this.categories.find(
      c => c.id === this.selectedCategory?.parentId
    )?.name || 'Main Category';
  }

  openAddForm(): void {
    this.editingId = null;
    this.resetForm();
    this.showForm = true;
  }

  editCategory(category: Category): void {
    this.editingId = category.id;

    this.form = {
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      icon: category.icon,
      status: category.status
    };

    this.showForm = true;
  }

  saveCategory(): void {
    const name = this.form.name.trim();

    if (!name) {
      this.showToast('Please enter a category name.', 'error');
      return;
    }

    const duplicate = this.categories.some(c =>
      c.name.toLowerCase() === name.toLowerCase() &&
      c.id !== this.editingId
    );

    if (duplicate) {
      this.showToast('This category already exists.', 'error');
      return;
    }

    const categoryData: ApiCategory = {
      name,
      description: this.form.description.trim(),
      active: this.form.status === 'Active'
    };

    if (this.editingId !== null) {
      this.categoryService.updateCategory(
        this.editingId,
        categoryData
      ).subscribe({
        next: () => {
          this.showToast('Category updated successfully.', 'success');
          this.closeForm();
          this.loadCategories();
        },
        error: () => {
          this.showToast('Unable to update category.', 'error');
        }
      });

    } else {
      this.categoryService.createCategory(categoryData).subscribe({
        next: () => {
          this.currentPage = 1;
          this.showToast('New category created successfully.', 'success');
          this.closeForm();
          this.loadCategories();
        },
        error: () => {
          this.showToast('Unable to create category.', 'error');
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    if (category.productCount > 0) {
      this.showToast(
        'This category contains products and cannot be deleted.',
        'error'
      );
      return;
    }

    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.showToast('Category deleted successfully.', 'success');
        this.loadCategories();
      },
      error: () => {
        this.showToast('Unable to delete category.', 'error');
      }
    });
  }

  toggleStatus(category: Category): void {
    const newStatus = category.status === 'Active' ? 'Inactive' : 'Active';

    const categoryData: ApiCategory = {
      name: category.name,
      description: category.description,
      active: newStatus === 'Active'
    };

    this.categoryService.updateCategory(category.id, categoryData).subscribe({
      next: () => {
        this.showToast(
          `${category.name} status changed to ${newStatus}.`,
          'success'
        );
        this.loadCategories();
      },
      error: () => {
        this.showToast('Unable to change category status.', 'error');
      }
    });
  }

  viewDetails(category: Category): void {
    this.selectedCategory = category;
  }

  closeDetails(): void {
    this.selectedCategory = null;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  resetForm(): void {
    this.form = {
      name: '',
      description: '',
      parentId: null,
      icon: '📦',
      status: 'Active'
    };
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  showToast(message: string, type: string): void {
    this.toastMessage = message;
    this.toastType = type;
  }

  closeToast(): void {
    this.toastMessage = '';
  }
}
