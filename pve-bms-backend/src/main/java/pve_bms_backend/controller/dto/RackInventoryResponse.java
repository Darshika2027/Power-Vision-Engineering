package pve_bms_backend.controller.dto;

import java.time.LocalDate;

public record RackInventoryResponse(
        Long id,
        String rackNumber,
        String productName,
        String sku,
        String category,
        Integer quantity,
        String location,
        LocalDate updatedAt
) {}