package pve_bms_backend.service;

import pve_bms_backend.entity.*;
import pve_bms_backend.repository.*;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class GoodsReceivingService {

    private final GoodsReceivingRepository receivingRepository;
    private final ProductRepository productRepository;
    private final RackInventoryRepository rackInventoryRepository;

    public GoodsReceivingService(
            GoodsReceivingRepository receivingRepository,
            ProductRepository productRepository,
            RackInventoryRepository rackInventoryRepository) {

        this.receivingRepository = receivingRepository;
        this.productRepository = productRepository;
        this.rackInventoryRepository = rackInventoryRepository;
    }

    public static class ItemRequest {
        public Long productId;
        public Integer quantity;
        public BigDecimal unitCost;
        public String rackNumber;
    }

    public static class ReceivingRequest {
        public String supplierName;
        public String supplierInvoice;
        public LocalDate receivedDate;
        public String notes;
        public List<ItemRequest> items;
    }

    @Transactional
    public GoodsReceiving createReceiving(ReceivingRequest request) {

        if (request == null || request.supplierName == null ||
                request.supplierName.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Supplier name is required");
        }

        if (request.receivedDate == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Receiving date is required");
        }

        if (request.items == null || request.items.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "At least one product is required");
        }

        String supplierName = request.supplierName.trim();

        String supplierInvoice = request.supplierInvoice == null
                ? null : request.supplierInvoice.trim();

        // Reject duplicate invoice numbers for the same supplier
        if (supplierInvoice != null && !supplierInvoice.isEmpty() &&
                receivingRepository
                        .existsBySupplierNameIgnoreCaseAndSupplierInvoiceIgnoreCase(
                                supplierName, supplierInvoice)) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This invoice number already exists for this supplier");
        }

        GoodsReceiving receiving = new GoodsReceiving();
        receiving.setSupplierName(supplierName);
        receiving.setSupplierInvoice(
                supplierInvoice == null || supplierInvoice.isEmpty()
                        ? null : supplierInvoice);
        receiving.setReceivedDate(request.receivedDate);
        receiving.setNotes(request.notes);

        for (ItemRequest itemRequest : request.items) {

            if (itemRequest == null || itemRequest.productId == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Product ID is required");
            }

            if (itemRequest.quantity == null || itemRequest.quantity <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Quantity must be greater than zero");
            }

            if (itemRequest.unitCost == null ||
                    itemRequest.unitCost.compareTo(BigDecimal.ZERO) < 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Unit cost cannot be negative");
            }

            if (itemRequest.rackNumber == null ||
                    itemRequest.rackNumber.trim().isEmpty()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Rack number is required");
            }

            Product product = productRepository.findById(itemRequest.productId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Product not found: " + itemRequest.productId));

            if (!product.isActive()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Cannot receive an inactive product");
            }

            // Update total product stock
            int currentStock = product.getStockQuantity();

            product.setStockQuantity(
                    Math.addExact(currentStock, itemRequest.quantity));

            productRepository.save(product);

            // Update or create rack inventory
            String rackNumber = itemRequest.rackNumber.trim();

            RackInventory rackInventory =
                    rackInventoryRepository
                            .findByProduct_IdAndRackNumber(
                                    product.getId(), rackNumber)
                            .orElseGet(() -> {
                                RackInventory newRack = new RackInventory();
                                newRack.setProduct(product);
                                newRack.setRackNumber(rackNumber);
                                newRack.setQuantity(0);
                                return newRack;
                            });

            int rackQuantity = rackInventory.getQuantity() == null
                    ? 0 : rackInventory.getQuantity();

            rackInventory.setQuantity(
                    Math.addExact(rackQuantity, itemRequest.quantity));

            rackInventoryRepository.save(rackInventory);

            // Create receiving item
            GoodsReceivingItem receivingItem = new GoodsReceivingItem();
            receivingItem.setProduct(product);
            receivingItem.setQuantity(itemRequest.quantity);
            receivingItem.setUnitCost(itemRequest.unitCost);
            receivingItem.setRackNumber(rackNumber);

            receiving.addItem(receivingItem);
        }

        return receivingRepository.save(receiving);
    }

    @Transactional(readOnly = true)
    public List<GoodsReceiving> getAllReceivings() {
        return receivingRepository.findAll();
    }

    @Transactional(readOnly = true)
    public GoodsReceiving getReceivingById(Long id) {
        return receivingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Goods receiving record not found"));
    }
}
