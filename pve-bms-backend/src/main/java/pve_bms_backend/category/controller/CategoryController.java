package pve_bms_backend.category.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pve_bms_backend.category.entity.Category;
import pve_bms_backend.category.service.CategoryService;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:4200")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // Get all categories
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    // Get category by ID
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    // Create category
    @PostMapping
    public ResponseEntity<Category> createCategory(
            @RequestBody Category category) {

        return ResponseEntity.ok(
                categoryService.createCategory(category));
    }

    // Update category
    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable Long id,
            @RequestBody Category category) {

        return ResponseEntity.ok(
                categoryService.updateCategory(id, category));
    }

    // Delete category
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {

        categoryService.deleteCategory(id);

        return ResponseEntity.noContent().build();
    }
}