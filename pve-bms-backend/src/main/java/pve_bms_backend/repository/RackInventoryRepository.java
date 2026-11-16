package pve_bms_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pve_bms_backend.entity.RackInventory;

import java.util.List;
import java.util.Optional;

public interface RackInventoryRepository
        extends JpaRepository<RackInventory, Long> {

    Optional<RackInventory> findByProduct_IdAndRackNumber(
            Long productId, String rackNumber);

    List<RackInventory> findByProduct_Id(Long productId);

    boolean existsByProduct_IdAndRackNumber(
            Long productId, String rackNumber);
}