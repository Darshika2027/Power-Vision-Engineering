
package pve_bms_backend.service;

import pve_bms_backend.entity.Product;
import pve_bms_backend.entity.Category;
import pve_bms_backend.repository.ProductRepository;
import pve_bms_backend.repository.CategoryRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"));
    }

    public Product createProduct(Product product) {

        if (productRepository.existsBySku(product.getSku())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "SKU already exists");
        }

        if (product.getBarcode() != null &&
                productRepository.existsByBarcode(product.getBarcode())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Barcode already exists");
        }

        Category category = categoryRepository.findById(
                product.getCategory().getId()).orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Category not found"));

        product.setCategory(category);

        return productRepository.save(product);
    }

    public Product updateProduct(Long id, Product updatedProduct) {

        Product product = getProductById(id);

        product.setName(updatedProduct.getName());
        product.setBarcode(updatedProduct.getBarcode());
        product.setDescription(updatedProduct.getDescription());
        product.setCostPrice(updatedProduct.getCostPrice());
        product.setSellingPrice(updatedProduct.getSellingPrice());
        product.setActive(updatedProduct.isActive());

        Category category = categoryRepository.findById(
                updatedProduct.getCategory().getId()).orElseThrow(
                        () -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Category not found"));

        product.setCategory(category);

        return productRepository.save(product);
    }

    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }
}
