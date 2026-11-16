package pve_bms_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pve_bms_backend.entity.GoodsReceiving;

public interface GoodsReceivingRepository
        extends JpaRepository<GoodsReceiving, Long> {

    boolean existsBySupplierNameIgnoreCaseAndSupplierInvoiceIgnoreCase(
            String supplierName,
            String supplierInvoice
    );
}
