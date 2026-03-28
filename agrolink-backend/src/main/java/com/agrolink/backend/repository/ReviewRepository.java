package com.agrolink.backend.repository;

import com.agrolink.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByRevieweeId(UUID revieweeId);

    List<Review> findByReviewerId(UUID reviewerId);

    List<Review> findByOrderId(UUID orderId);

    boolean existsByOrderIdAndReviewerIdAndRevieweeId(UUID orderId, UUID reviewerId, UUID revieweeId);
    boolean existsByOrderIdAndReviewerIdAndProductId(UUID orderId, UUID reviewerId, UUID productId);

    java.util.Optional<Review> findByOrderIdAndReviewerIdAndRevieweeId(UUID orderId, UUID reviewerId, UUID revieweeId);
    java.util.Optional<Review> findByOrderIdAndReviewerIdAndProductId(UUID orderId, UUID reviewerId, UUID productId);

    List<Review> findByProductId(UUID productId);
}
