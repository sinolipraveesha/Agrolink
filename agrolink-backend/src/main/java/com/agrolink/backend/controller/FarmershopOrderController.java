package com.agrolink.backend.controller;

import com.agrolink.backend.dto.CheckoutRequest;
import com.agrolink.backend.model.FarmershopOrder;
import com.agrolink.backend.model.FarmershopOrderStatus;
import com.agrolink.backend.service.FarmershopOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/farmershop-orders")
@CrossOrigin(origins = "http://localhost:5173")
public class FarmershopOrderController {

    @Autowired
    private FarmershopOrderService farmershopOrderService;

    @GetMapping
    public List<FarmershopOrder> getAllOrders(
            @RequestParam(required = false) FarmershopOrderStatus status,
            @RequestParam(required = false) UUID buyerId,
            @RequestParam(required = false) UUID sellerId) {
        
        if (buyerId != null) {
            return farmershopOrderService.getOrdersByBuyer(buyerId);
        }
        if (sellerId != null) {
            return farmershopOrderService.getOrdersBySeller(sellerId);
        }
        // DEBUG: Return all orders if no ID provided
        System.out.println("DEBUG: Fetching ALL farmershop orders for diagnostic purposes");
        if (status != null) {
            return farmershopOrderService.getOrdersByStatus(status);
        }
        return farmershopOrderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FarmershopOrder> getOrderById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(farmershopOrderService.getOrderById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@RequestBody CheckoutRequest request) {
        try {
            List<FarmershopOrder> orders = farmershopOrderService.placeOrder(request);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("Error during Farmershop Checkout: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(java.util.Collections.singletonMap("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<FarmershopOrder> updateStatus(
            @PathVariable UUID id, 
            @RequestParam FarmershopOrderStatus status) {
        try {
            FarmershopOrder updated = farmershopOrderService.updateStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
