package pve_bms_backend.controller;

import org.springframework.web.bind.annotation.*;

import pve_bms_backend.controller.dto.RackInventoryResponse;
import pve_bms_backend.controller.dto.RackStockSummary;
import pve_bms_backend.service.RackInventoryService;
import pve_bms_backend.service.RackInventoryService.RackRequest;

import java.util.List;

@RestController
@RequestMapping("/api/rack-inventory")
@CrossOrigin(origins = {
    "http://localhost:4200",
    "http://localhost:4201"
})
public class RackInventoryController {

    private final RackInventoryService rackService;

    public RackInventoryController(RackInventoryService rackService) {
        this.rackService = rackService;
    }

    @GetMapping
    public List<RackInventoryResponse> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String location) {
        return rackService.getAll(search, location);
    }

    @GetMapping("/summary")
    public RackStockSummary getSummary() {
        return rackService.getSummary();
    }

    @GetMapping("/product/{productId}")
    public List<RackInventoryResponse> getByProduct(
            @PathVariable Long productId) {
        return rackService.getByProduct(productId);
    }

    @GetMapping("/{id}")
    public RackInventoryResponse getById(@PathVariable Long id) {
        return rackService.getById(id);
    }

    @PostMapping
    public RackInventoryResponse create(
            @RequestBody RackRequest request) {
        return rackService.create(request);
    }

    @PutMapping("/{id}")
    public RackInventoryResponse update(
            @PathVariable Long id,
            @RequestBody RackRequest request) {
        return rackService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        rackService.delete(id);
    }
}