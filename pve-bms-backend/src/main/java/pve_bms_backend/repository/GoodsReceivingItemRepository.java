package pve_bms_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pve_bms_backend.entity.GoodsReceivingItem;

public interface GoodsReceivingItemRepository
        extends JpaRepository<GoodsReceivingItem, Long> {
}
