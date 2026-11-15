package pve_bms_backend.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "goods_receivings")
public class GoodsReceiving {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String supplierName;

    @Column(length = 100)
    private String supplierInvoice;

    @Column(nullable = false)
    private LocalDate receivedDate;

    @Column(length = 1000)
    private String notes;

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "receiving", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoodsReceivingItem> items = new ArrayList<>();

    public GoodsReceiving() {}

    public Long getId() { return id; }
    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public String getSupplierInvoice() { return supplierInvoice; }
    public void setSupplierInvoice(String supplierInvoice) { this.supplierInvoice = supplierInvoice; }
    public LocalDate getReceivedDate() { return receivedDate; }
    public void setReceivedDate(LocalDate receivedDate) { this.receivedDate = receivedDate; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public List<GoodsReceivingItem> getItems() { return items; }

    public void addItem(GoodsReceivingItem item) {
        items.add(item);
        item.setReceiving(this);
    }
}