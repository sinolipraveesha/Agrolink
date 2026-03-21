package com.agrolink.backend.service;

import com.agrolink.backend.model.FarmerShopProduct;
import com.agrolink.backend.repository.FarmerShopProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class FarmerShopProductService {

    @Autowired
    private FarmerShopProductRepository repository;

    public FarmerShopProduct createProduct(FarmerShopProduct product) {
        return repository.save(product);
    }

    public List<FarmerShopProduct> getAllProducts() {
        return repository.findAll();
    }

    public FarmerShopProduct getProductById(UUID id) {
        return repository.findById(id).orElse(null);
    }

    public FarmerShopProduct updateProduct(UUID id, FarmerShopProduct updatedProduct) {
        return repository.findById(id)
                .map(existingProduct -> {
                    existingProduct.setName(updatedProduct.getName());
                    existingProduct.setCategory(updatedProduct.getCategory());
                    existingProduct.setDescription(updatedProduct.getDescription());
                    existingProduct.setUnit(updatedProduct.getUnit());
                    existingProduct.setPrice(updatedProduct.getPrice());
                    existingProduct.setStockQuantity(updatedProduct.getStockQuantity());
                    existingProduct.setImageUrl(updatedProduct.getImageUrl());
                    existingProduct.setStatus(updatedProduct.getStatus());
                    return repository.save(existingProduct);
                })
                .orElse(null);
    }

    public void deleteProduct(UUID id) {
        repository.deleteById(id);
    }
}
