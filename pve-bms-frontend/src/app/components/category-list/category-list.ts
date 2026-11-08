
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Category {
  id: number;
  categoryName: string;
  description: string;
  parentCategory: string;
  status: boolean;
}

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-list.html',
  styleUrl: './category-list.css',
})
export class CategoryList {

  categories: Category[] = [
    {
      id: 1,
      categoryName: 'Power Tools',
      description: 'Electrical power tools',
      parentCategory: 'Main Category',
      status: true
    },
    {
      id: 2,
      categoryName: 'Hand Tools',
      description: 'Manual tools',
      parentCategory: 'Main Category',
      status: true
    },
    {
      id: 3,
      categoryName: 'Drilling Tools',
      description: 'Drilling equipment',
      parentCategory: 'Power Tools',
      status: false
    }
  ];

  searchText = '';
  showForm = false;
  editingId: number | null = null;

  form = {
    categoryName: '',
    description: '',
    parentCategory: ''
  };

  get activeCount(): number {
    return this.categories.filter(c => c.status).length;
  }

  get inactiveCount(): number {
    return this.categories.filter(c => !c.status).length;
  }

  get filteredCategories(): Category[] {
    return this.categories.filter(c =>
      c.categoryName.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  openAddForm(): void {
    this.editingId = null;
    this.form = {
      categoryName: '',
      description: '',
      parentCategory: ''
    };
    this.showForm = true;
  }

  editCategory(category: Category): void {
    this.editingId = category.id;
    this.form = {
      categoryName: category.categoryName,
      description: category.description,
      parentCategory: category.parentCategory
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
  }

  saveCategory(): void {
    if (!this.form.categoryName.trim()) {
      return;
    }

    if (this.editingId !== null) {
      const category = this.categories.find(c => c.id === this.editingId);

      if (category) {
        category.categoryName = this.form.categoryName;
        category.description = this.form.description;
        category.parentCategory = this.form.parentCategory;
      }
    } else {
      const newCategory: Category = {
        id: Date.now(),
        categoryName: this.form.categoryName,
        description: this.form.description,
        parentCategory: this.form.parentCategory || 'Main Category',
        status: true
      };

      this.categories.push(newCategory);
    }

    this.closeForm();
  }

  toggleStatus(category: Category): void {
    category.status = !category.status;
  }
}
