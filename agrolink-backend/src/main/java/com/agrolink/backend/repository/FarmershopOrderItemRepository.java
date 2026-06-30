package com.agrolink.backend.repository;

import com.agrolink.backend.model.FarmershopOrderItem;
import com.agrolink.backend.model.FarmerShopProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;
import java.util.List;

@Repository
public interface FarmershopOrderItemRepository extends JpaRepository<FarmershopOrderItem, UUID> {
    void deleteByProduct(FarmerShopProduct product);
    List<FarmershopOrderItem> findByProduct(FarmerShopProduct product);
}
