package com.agrolink.backend.repository;

import com.agrolink.backend.model.FarmershopOrder;
import com.agrolink.backend.model.FarmershopOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FarmershopOrderRepository extends JpaRepository<FarmershopOrder, UUID> {
    List<FarmershopOrder> findByBuyerId(UUID buyerId);
    List<FarmershopOrder> findBySellerId(UUID sellerId);
    List<FarmershopOrder> findByStatus(FarmershopOrderStatus status);
}
