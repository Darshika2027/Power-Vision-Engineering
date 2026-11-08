
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
export class CategoryList {

  categories: Category[] = [
    {
      id: 1, name: 'Power Tools',
      description: 'Electric and battery powered tools',
      parentId: null, status: 'Active',
      productCount: 45, icon: '⚡', color: 'blue',
      createdAt: '2026-11-01'
    },
    {
      id: 2, name: 'Electrical Wires',
      description: 'Electrical cables and wiring products',
      parentId: null, status: 'Active',
      productCount: 32, icon: '〰️', color: 'purple',
      createdAt: '2026-11-02'
    },
    {
      id: 3, name: 'Electrical Switches',
      description: 'Switches, sockets and accessories',
      parentId: null, status: 'Active',
      productCount: 28, icon: '🔌', color: 'green',
      createdAt: '2026-11-03'
    },
    {
      id: 4, name: 'Hardware',
      description: 'Bolts, nuts and fixing accessories',
      parentId: null, status: 'Active',
      productCount: 37, icon: '🔩', color: 'orange',
      createdAt: '2026-11-04'
    },
    {
      id: 5, name: 'Safety Equipment',
      description: 'Personal protective equipment',
      parentId: null, status: 'Active',
      productCount: 22, icon: '🦺', color: 'cyan',
      createdAt: '2026-11-05'
    },
    {
      id: 6, name: 'Spare Parts',
      description: 'Replacement and repair parts',
      parentId: null, status: 'Inactive',
      productCount: 29, icon: '⚙️', color: 'pink',
      createdAt: '2026-11-06'
    },
    {
      id: 7, name: 'Drilling Tools',
      description: 'Drills and drilling accessories',
      parentId: 1, status: 'Active',
      productCount: 12, icon: '🛠️', color: 'blue',
      createdAt: '2026-11-07'
    }
  ];

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

    if (this.editingId !== null) {
      const category = this.categories.find(
        c => c.id === this.editingId
      );

      if (category) {
        category.name = name;
        category.description = this.form.description.trim();
        category.parentId = this.form.parentId;
        category.icon = this.form.icon;
        category.status = this.form.status;
      }

      this.showToast('Category updated successfully.', 'success');
    } else {
      const newCategory: Category = {
        id: Date.now(),
        name,
        description: this.form.description.trim(),
        parentId: this.form.parentId,
        status: this.form.status,
        productCount: 0,
        icon: this.form.icon,
        color: 'blue',
        createdAt: new Date().toISOString().slice(0, 10)
      };

      this.categories.unshift(newCategory);
      this.currentPage = 1;
      this.showToast('New category created successfully.', 'success');
    }

    this.closeForm();
  }

  deleteCategory(category: Category): void {
    const hasChildren = this.categories.some(
      c => c.parentId === category.id
    );

    if (hasChildren) {
      this.showToast(
        'Move or delete its subcategories before deleting this category.',
        'error'
      );
      return;
    }

    if (category.productCount > 0) {
      this.showToast(
        'This category contains products and cannot be deleted in this demo.',
        'error'
      );
      return;
    }

    this.categories = this.categories.filter(
      c => c.id !== category.id
    );

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    this.showToast('Category deleted successfully.', 'success');
  }

  toggleStatus(category: Category): void {
    category.status =
      category.status === 'Active' ? 'Inactive' : 'Active';

    this.showToast(
      `${category.name} status changed to ${category.status}.`,
      'success'
    );
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
