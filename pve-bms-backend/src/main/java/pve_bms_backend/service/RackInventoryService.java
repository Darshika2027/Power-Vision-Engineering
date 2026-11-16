package pve_bms_backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import pve_bms_backend.entity.Product;
import pve_bms_backend.entity.RackInventory;
import pve_bms_backend.repository.ProductRepository;
import pve_bms_backend.repository.RackInventoryRepository;
import pve_bms_backend.controller.dto.RackInventoryResponse;
import pve_bms_backend.controller.dto.RackStockSummary;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
public class RackInventoryService {

    private final RackInventoryRepository rackRepository;
    private final ProductRepository productRepository;

    public RackInventoryService(
            RackInventoryRepository rackRepository,
            ProductRepository productRepository) {
        this.rackRepository = rackRepository;
        this.productRepository = productRepository;
    }

    public static class RackRequest {
        public Long productId;
        public String rackNumber;
        public Integer quantity;
        public String location;
    }

    private Product getProduct(Long id) {
        if (id == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Product ID is required");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Product not found"));

        if (!product.isActive()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Inactive products cannot be assigned to racks");
        }

        return product;
    }

    private void validate(RackRequest request) {
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Request body is required");
        }

        if (request.rackNumber == null ||
                request.rackNumber.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Rack number is required");
        }

        if (request.rackNumber.trim().length() > 50) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Rack number cannot exceed 50 characters");
        }

        if (request.quantity == null || request.quantity < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity cannot be negative");
        }

        if (request.location == null ||
                request.location.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Location is required");
        }

        if (request.location.trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Location cannot exceed 100 characters");
        }
    }

    private RackInventoryResponse toResponse(RackInventory rack) {
        Product product = rack.getProduct();

        return new RackInventoryResponse(
                rack.getId(),
                rack.getRackNumber(),
                product.getName(),
                product.getSku(),
                product.getCategory().getName(),
                rack.getQuantity(),
                rack.getLocation(),
                rack.getUpdatedAt() == null
                        ? LocalDate.now()
                        : rack.getUpdatedAt().toLocalDate()
        );
    }

    @Transactional(readOnly = true)
    public List<RackInventoryResponse> getAll(
            String search, String location) {

        String cleanSearch = search == null
                ? "" : search.trim().toLowerCase(Locale.ROOT);

        String cleanLocation = location == null
                ? "" : location.trim().toLowerCase(Locale.ROOT);

        return rackRepository.findAll().stream()
                .filter(rack -> {
                    Product product = rack.getProduct();

                    boolean matchesSearch = cleanSearch.isEmpty()
                            || rack.getRackNumber().toLowerCase(Locale.ROOT)
                                    .contains(cleanSearch)
                            || product.getName().toLowerCase(Locale.ROOT)
                                    .contains(cleanSearch)
                            || product.getSku().toLowerCase(Locale.ROOT)
                                    .contains(cleanSearch);

                    boolean matchesLocation = cleanLocation.isEmpty()
                            || cleanLocation.equals("all locations")
                            || rack.getLocation().toLowerCase(Locale.ROOT)
                                    .equals(cleanLocation);

                    return matchesSearch && matchesLocation;
                })
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RackInventoryResponse getById(Long id) {
        RackInventory rack = rackRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Rack inventory record not found"));

        return toResponse(rack);
    }

    @Transactional(readOnly = true)
    public List<RackInventoryResponse> getByProduct(Long productId) {
        getProduct(productId);

        return rackRepository.findByProduct_Id(productId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public RackStockSummary getSummary() {
        List<RackInventory> racks = rackRepository.findAll();

        long totalRacks = racks.stream()
                .map(RackInventory::getRackNumber)
                .distinct()
                .count();

        long totalStock = racks.stream()
                .mapToLong(rack -> rack.getQuantity() == null
                        ? 0 : rack.getQuantity())
                .sum();

        long lowStock = racks.stream()
                .filter(rack -> rack.getQuantity() != null
                        && rack.getQuantity() > 0
                        && rack.getQuantity() <= 10)
                .count();

        long main = racks.stream()
                .filter(rack -> "Main Store".equalsIgnoreCase(
                        rack.getLocation()))
                .count();

        long front = racks.stream()
                .filter(rack -> "Front Store".equalsIgnoreCase(
                        rack.getLocation()))
                .count();

        long back = racks.stream()
                .filter(rack -> "Back Store".equalsIgnoreCase(
                        rack.getLocation()))
                .count();

        return new RackStockSummary(
                totalRacks,
                racks.size(),
                totalStock,
                lowStock,
                main,
                front,
                back
        );
    }

    @Transactional
    public RackInventoryResponse create(RackRequest request) {
        validate(request);

        Product product = getProduct(request.productId);
        String rackNumber = request.rackNumber.trim();

        if (rackRepository.existsByProduct_IdAndRackNumber(
                product.getId(), rackNumber)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This product is already assigned to this rack");
        }

        int newStock;
        try {
            newStock = Math.addExact(
                    product.getStockQuantity(), request.quantity);
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Stock quantity is too large");
        }

        product.setStockQuantity(newStock);
        productRepository.save(product);

        RackInventory rack = new RackInventory();
        rack.setProduct(product);
        rack.setRackNumber(rackNumber);
        rack.setQuantity(request.quantity);
        rack.setLocation(request.location.trim());

        return toResponse(rackRepository.save(rack));
    }

    @Transactional
    public RackInventoryResponse update(Long id, RackRequest request) {
        validate(request);

        RackInventory rack = rackRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Rack inventory record not found"));

        Product oldProduct = rack.getProduct();
        Product newProduct = getProduct(request.productId);

        String newRackNumber = request.rackNumber.trim();

        boolean duplicate = rackRepository
                .findByProduct_IdAndRackNumber(
                        newProduct.getId(), newRackNumber)
                .filter(existing -> !existing.getId().equals(id))
                .isPresent();

        if (duplicate) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This product is already assigned to this rack");
        }

        int oldQuantity = rack.getQuantity();

        if (oldProduct.getId().equals(newProduct.getId())) {
            int adjustedStock;

            try {
                adjustedStock = Math.addExact(
                        oldProduct.getStockQuantity(),
                        request.quantity - oldQuantity);
            } catch (ArithmeticException exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Stock quantity is too large");
            }

            if (adjustedStock < 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Rack quantity cannot exceed available product stock");
            }

            oldProduct.setStockQuantity(adjustedStock);
            productRepository.save(oldProduct);

        } else {
            if (oldProduct.getStockQuantity() < oldQuantity) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Existing product stock is inconsistent with rack quantity");
            }

            int newProductStock;

            try {
                newProductStock = Math.addExact(
                        newProduct.getStockQuantity(), request.quantity);
            } catch (ArithmeticException exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Stock quantity is too large");
            }

            oldProduct.setStockQuantity(
                    oldProduct.getStockQuantity() - oldQuantity);

            newProduct.setStockQuantity(newProductStock);

            productRepository.save(oldProduct);
            productRepository.save(newProduct);
        }

        rack.setProduct(newProduct);
        rack.setRackNumber(newRackNumber);
        rack.setQuantity(request.quantity);
        rack.setLocation(request.location.trim());

        return toResponse(rackRepository.save(rack));
    }

    @Transactional
    public void delete(Long id) {
        RackInventory rack = rackRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Rack inventory record not found"));

        Product product = rack.getProduct();
        int rackQuantity = rack.getQuantity();

        if (product.getStockQuantity() < rackQuantity) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot remove rack entry because product stock is inconsistent");
        }

        product.setStockQuantity(
                product.getStockQuantity() - rackQuantity);

        productRepository.save(product);
        rackRepository.delete(rack);
    }
}