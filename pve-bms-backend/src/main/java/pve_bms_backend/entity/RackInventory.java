package pve_bms_backend.entity;

import jakarta.persistence.*;

@Entity
@Table(
    name = "rack_inventory",
    uniqueConstraints = @UniqueConstraint(
        columnNames = {"product_id", "rack_number"}
    )
)
public class RackInventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "rack_number", nullable = false, length = 50)
    private String rackNumber;

    @Column(nullable = false)
    private Integer quantity = 0;

    public RackInventory() {}

    public Long getId() { return id; }

    public Product getProduct() { return product; }

    public void setProduct(Product product) { this.product = product; }

    public String getRackNumber() { return rackNumber; }

    public void setRackNumber(String rackNumber) { this.rackNumber = rackNumber; }

    public Integer getQuantity() { return quantity; }

    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
