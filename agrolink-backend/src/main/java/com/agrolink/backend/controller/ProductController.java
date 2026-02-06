package com.agrolink.backend.controller;

import com.agrolink.backend.model.Product;
import com.agrolink.backend.model.ProductStatus;
import com.agrolink.backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    public Product createProduct(@RequestBody Product product) {
        return productService.createProduct(product);
    }

    @GetMapping("/farmer/{farmerId}")
    public List<Product> getFarmerProducts(@PathVariable UUID farmerId) {
        return productService.getProductsByFarmer(farmerId);
    }

    @GetMapping("/pending")
    public List<Product> getPendingProducts() {
        return productService.getPendingProducts();
    }

    @GetMapping("/approved")
    public List<Product> getApprovedProducts() {
        return productService.getApprovedProducts();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Product> updateStatus(@PathVariable UUID id, @RequestParam ProductStatus status) {
        Product updated = productService.updateStatus(id, status);
        if (updated != null)
            return ResponseEntity.ok(updated);
        return ResponseEntity.notFound().build();
    }
}
