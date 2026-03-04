package com.agrolink.backend.repository;

import com.agrolink.backend.model.FarmerShopProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FarmerShopProductRepository extends JpaRepository<FarmerShopProduct, UUID> {
}
