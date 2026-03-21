package com.agrolink.backend.controller;

import com.agrolink.backend.model.FarmerShopProduct;
import com.agrolink.backend.service.FarmerShopProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/farmer-shop-products")
@CrossOrigin(origins = "http://localhost:5173")
public class FarmerShopProductController {

    @Autowired
    private FarmerShopProductService service;

    @PostMapping
    public FarmerShopProduct createProduct(@RequestBody FarmerShopProduct product) {
        return service.createProduct(product);
    }

    @GetMapping
    public List<FarmerShopProduct> getAllProducts() {
        return service.getAllProducts();
    }

    @GetMapping("/{id}")
    public FarmerShopProduct getProductById(@PathVariable UUID id) {
        return service.getProductById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteProduct(@PathVariable UUID id) {
        service.deleteProduct(id);
    }

    @PutMapping("/{id}")
    public FarmerShopProduct updateProduct(@PathVariable UUID id, @RequestBody FarmerShopProduct product) {
        return service.updateProduct(id, product);
    }
}
