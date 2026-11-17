package pve_bms_backend.service;

import pve_bms_backend.entity.Category;
import pve_bms_backend.repository.CategoryRepository;
import pve_bms_backend.repository.ProductRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    public CategoryService(
            CategoryRepository categoryRepository,
            ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Category not found"));
    }

    public Category createCategory(Category category) {

        if (category.getName() == null || category.getName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Category name is required");
        }

        category.setName(category.getName().trim());

        if (categoryRepository.existsByName(category.getName())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Category already exists");
        }

        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category updatedCategory) {

        Category category = getCategoryById(id);

        if (updatedCategory.getName() == null
                || updatedCategory.getName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Category name is required");
        }

        String updatedName = updatedCategory.getName().trim();

        if (categoryRepository.existsByNameAndIdNot(updatedName, id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Category name already exists");
        }

        category.setName(updatedName);
        category.setDescription(updatedCategory.getDescription());
        category.setActive(updatedCategory.isActive());

        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {

        Category category = getCategoryById(id);

        if (productRepository.existsByCategory_Id(id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete category because products are assigned to it");
        }

        categoryRepository.delete(category);
    }
}
