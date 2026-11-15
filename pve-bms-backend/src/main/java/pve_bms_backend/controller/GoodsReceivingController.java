package pve_bms_backend.controller;

import pve_bms_backend.entity.GoodsReceiving;
import pve_bms_backend.service.GoodsReceivingService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/goods-receivings")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4201"})
public class GoodsReceivingController {

    private final GoodsReceivingService receivingService;

    public GoodsReceivingController(GoodsReceivingService receivingService) {
        this.receivingService = receivingService;
    }

    @PostMapping
    public GoodsReceiving createReceiving(
            @RequestBody GoodsReceivingService.ReceivingRequest request) {
        return receivingService.createReceiving(request);
    }

    @GetMapping
    public List<GoodsReceiving> getAllReceivings() {
        return receivingService.getAllReceivings();
    }

    @GetMapping("/{id}")
    public GoodsReceiving getReceivingById(@PathVariable Long id) {
        return receivingService.getReceivingById(id);
    }
}