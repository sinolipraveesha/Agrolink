package com.agrolink.backend.controller;

import com.agrolink.backend.model.Order;
import com.agrolink.backend.model.OrderStatus;
import com.agrolink.backend.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @GetMapping
    public List<Order> getAllOrders(@RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) UUID buyerId, @RequestParam(required = false) UUID farmerId) {
        System.out.println("GET /api/orders hit");
        if (buyerId != null) {
            System.out.println("Fetching orders for Buyer ID: " + buyerId);
            List<Order> orders = orderService.getOrdersByBuyer(buyerId);
            System.out.println("Found " + orders.size() + " orders for buyer.");
            return orders;
        }
        if (farmerId != null) {
            System.out.println("Fetching orders for Farmer ID: " + farmerId);
            return orderService.getOrdersByFarmer(farmerId);
        }
        if (status != null) {
            return orderService.getOrdersByStatus(status);
        }
        return orderService.getAllOrders();
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) {
        return orderService.createOrder(order);
    }

    @PostMapping("/checkout")
    public ResponseEntity<List<Order>> checkout(@RequestBody com.agrolink.backend.dto.CheckoutRequest request) {
        try {
            List<Order> orders = orderService.placeOrder(request);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateStatus(@PathVariable UUID id, @RequestParam OrderStatus status) {
        Order updated = orderService.updateStatus(id, status);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/farmer-accept")
    public ResponseEntity<Order> farmerAccept(@PathVariable UUID id,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lon) {
        Order updated = orderService.farmerAcceptOrder(id, lat, lon);
        if (updated != null) {
            return ResponseEntity.ok(updated);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/driver-accept")
    public ResponseEntity<?> driverAccept(@PathVariable UUID id, @RequestParam UUID driverId) {
        try {
            Order updated = orderService.driverAcceptJob(id, driverId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/nearby")
    public List<Order> getNearbyJobs(@RequestParam double lat, @RequestParam double lon) {
        return orderService.getNearbyAvailableJobs(lat, lon);
    }
}
