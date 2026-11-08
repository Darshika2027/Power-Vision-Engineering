package pve_bms_backend.category.service;

import java.util.List;

import org.springframework.stereotype.Service;

import pve_bms_backend.category.entity.Category;
import pve_bms_backend.category.repository.CategoryRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // Get all categories
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Get category by ID
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
    }

    // Create category
    public Category createCategory(Category category) {

        if (categoryRepository.existsByNameIgnoreCase(category.getName())) {
            throw new RuntimeException("Category already exists");
        }

        return categoryRepository.save(category);
    }

    // Update category
    public Category updateCategory(Long id, Category updatedCategory) {

        Category existingCategory = getCategoryById(id);

        if (categoryRepository.existsByNameIgnoreCase(updatedCategory.getName())
                && !existingCategory.getName().equalsIgnoreCase(updatedCategory.getName())) {
            throw new RuntimeException("Category name already exists");
        }

        existingCategory.setName(updatedCategory.getName());
        existingCategory.setDescription(updatedCategory.getDescription());
        existingCategory.setActive(updatedCategory.isActive());

        return categoryRepository.save(existingCategory);
    }

    // Delete category
    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        categoryRepository.delete(category);
    }
}