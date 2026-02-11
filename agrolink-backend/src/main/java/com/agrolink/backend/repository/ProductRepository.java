package com.agrolink.backend.repository;

import com.agrolink.backend.model.Product;
import com.agrolink.backend.model.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    List<Product> findByStatus(ProductStatus status);

    List<Product> findByFarmerId(UUID farmerId);

    List<Product> findByCategory_Type(String type);

    List<Product> findByCategory_TypeAndStatus(String type, ProductStatus status);
}
