package pve_bms_backend.controller.dto;

public record RackStockSummary(
        long totalRacks,
        long totalProducts,
        long totalStock,
        long lowStock,
        long mainStoreEntries,
        long frontStoreEntries,
        long backStoreEntries
) {}