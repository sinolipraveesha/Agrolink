package com.agrolink.backend.service;

import com.agrolink.backend.model.Product;
import com.agrolink.backend.model.ProductStatus;
import com.agrolink.backend.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public Product createProduct(Product product) {
        return productRepository.save(product);
    }

    public List<Product> getProductsByFarmer(UUID farmerId) {
        return productRepository.findByFarmerId(farmerId);
    }

    public List<Product> getPendingProducts() {
        return productRepository.findByStatus(ProductStatus.pending);
    }

    public List<Product> getApprovedProducts() {
        return productRepository.findByStatus(ProductStatus.approved);
    }

    public Product updateStatus(UUID id, ProductStatus status) {
        return productRepository.findById(id).map(product -> {
            product.setStatus(status);
            return productRepository.save(product);
        }).orElse(null);
    }
}
