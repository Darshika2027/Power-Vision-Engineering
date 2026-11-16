package pve_bms_backend.controller.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class GoodsReceivingRequest {

    @NotBlank
    @Size(max = 150)
    private String supplierName;

    @Size(max = 100)
    private String supplierInvoice;

    @NotNull
    private LocalDate receivedDate;

    @Size(max = 1000)
    private String notes;

    @NotEmpty
    @Valid
    private List<Item> items;

    public static class Item {

        @NotNull
        @Positive
        private Long productId;

        @NotNull
        @Positive
        private Integer quantity;

        @NotNull
        @DecimalMin("0.00")
        @Digits(integer = 10, fraction = 2)
        private BigDecimal unitCost;

        @NotBlank
        @Size(max = 50)
        private String rackNumber;

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public BigDecimal getUnitCost() { return unitCost; }
        public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }

        public String getRackNumber() { return rackNumber; }
        public void setRackNumber(String rackNumber) { this.rackNumber = rackNumber; }
    }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getSupplierInvoice() { return supplierInvoice; }
    public void setSupplierInvoice(String supplierInvoice) { this.supplierInvoice = supplierInvoice; }

    public LocalDate getReceivedDate() { return receivedDate; }
    public void setReceivedDate(LocalDate receivedDate) { this.receivedDate = receivedDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public List<Item> getItems() { return items; }
    public void setItems(List<Item> items) { this.items = items; }
}
