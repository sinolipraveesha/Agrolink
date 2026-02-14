package com.agrolink.backend.service;

import com.agrolink.backend.model.Order;
import com.agrolink.backend.model.Profile;
import com.agrolink.backend.model.Review;
import com.agrolink.backend.repository.OrderRepository;
import com.agrolink.backend.repository.ProfileRepository;
import com.agrolink.backend.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service

public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProfileRepository profileRepository;
    private final OrderRepository orderRepository;

    public ReviewService(ReviewRepository reviewRepository, ProfileRepository profileRepository,
            OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.profileRepository = profileRepository;
        this.orderRepository = orderRepository;
    }

    @Transactional
    public Review createReview(UUID orderId, UUID reviewerId, UUID revieweeId, Integer rating, String comment) {
        if (reviewRepository.existsByOrderIdAndReviewerIdAndRevieweeId(orderId, reviewerId, revieweeId)) {
            throw new IllegalStateException("Review already exists for this order and user");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        Profile reviewer = profileRepository.findById(reviewerId)
                .orElseThrow(() -> new IllegalArgumentException("Reviewer profile not found"));

        Profile reviewee = profileRepository.findById(revieweeId)
                .orElseThrow(() -> new IllegalArgumentException("Reviewee profile not found"));

        // Validate that the reviewer and reviewee are part of the order (basic check)
        // Reviewer should be BUYER. Reviewee should be FARMER or DRIVER.
        // Or generic participants check:
        // boolean isParticipant = order.getBuyer().getId().equals(reviewerId) || ...

        if (order.getStatus() != com.agrolink.backend.model.OrderStatus.delivered) {
            throw new IllegalStateException("Order must be delivered to leave a review");
        }

        Review review = new Review();
        review.setOrder(order);
        review.setReviewer(reviewer);
        review.setReviewee(reviewee);
        review.setRating(rating);
        review.setComment(comment);
        review.setCreatedAt(LocalDateTime.now());

        Review savedReview = reviewRepository.save(review);

        updateProfileRating(revieweeId);

        return savedReview;
    }

    public List<Review> getReviewsForProfile(UUID profileId) {
        return reviewRepository.findByRevieweeId(profileId);
    }

    private void updateProfileRating(UUID profileId) {
        List<Review> reviews = reviewRepository.findByRevieweeId(profileId);
        if (reviews.isEmpty()) {
            return;
        }
        double sum = reviews.stream().mapToInt(Review::getRating).sum();
        double average = sum / reviews.size();

        // Round to 1 decimal place
        average = Math.round(average * 10.0) / 10.0;

        Profile profile = profileRepository.findById(profileId).orElseThrow();
        profile.setRating(average);

        // Check Top Seller Status
        // Only for FARMER role (though logic is generic, request specifically mentioned
        // farmers)
        if (profile.getRole() == com.agrolink.backend.model.UserRole.farmer) {
            int orders = profile.getTotalOrders() != null ? profile.getTotalOrders() : 0;
            java.math.BigDecimal earnings = profile.getTotalEarnings() != null ? profile.getTotalEarnings()
                    : java.math.BigDecimal.ZERO;

            boolean isTopSeller = orders >= 100 && average >= 4.8
                    && earnings.compareTo(new java.math.BigDecimal("100000")) >= 0;
            profile.setIsTopSeller(isTopSeller);
        }

        profileRepository.save(profile);
    }

    @Transactional
    public Review updateReview(UUID orderId, UUID reviewerId, UUID revieweeId, Integer rating, String comment) {
        Review review = reviewRepository.findByOrderIdAndReviewerIdAndRevieweeId(orderId, reviewerId, revieweeId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found for this order and user"));

        review.setRating(rating);
        review.setComment(comment);
        review.setCreatedAt(LocalDateTime.now()); // Or updatedAt if we had it

        Review savedReview = reviewRepository.save(review);
        updateProfileRating(revieweeId);
        return savedReview;
    }

    public Review getReview(UUID orderId, UUID reviewerId, UUID revieweeId) {
        return reviewRepository.findByOrderIdAndReviewerIdAndRevieweeId(orderId, reviewerId, revieweeId).orElse(null);
    }
}
