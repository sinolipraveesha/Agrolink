package com.agrolink.backend.repository;

import com.agrolink.backend.model.BuyerRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BuyerRequestRepository extends JpaRepository<BuyerRequest, UUID> {
    List<BuyerRequest> findByBuyerId(UUID buyerId);

    List<BuyerRequest> findByStatus(String status);
}
