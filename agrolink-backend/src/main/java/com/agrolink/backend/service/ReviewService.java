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
    private final RankingService rankingService;

    public ReviewService(ReviewRepository reviewRepository, ProfileRepository profileRepository,
            OrderRepository orderRepository, RankingService rankingService) {
        this.reviewRepository = reviewRepository;
        this.profileRepository = profileRepository;
        this.orderRepository = orderRepository;
        this.rankingService = rankingService;
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

        // Epic 2: Fake Review Detection - Verified Purchase
        boolean isVerified = order.getStatus() == com.agrolink.backend.model.OrderStatus.delivered;
        review.setIsVerifiedPurchase(isVerified);

        // Heuristic: Rating Deviation
        // If rating is far from their Bayesian Average, flag it for manual review
        double currentAvg = reviewee.getBayesianAverage() != null ? reviewee.getBayesianAverage() : 3.0;
        double deviation = Math.abs(rating - currentAvg);
        if (deviation >= 2.5) {
            review.setIsFlagged(true);
            review.setDetectionScore(0.85); // High probability of spam if it is an outlier
            review.setFlagReason("High rating deviation (outlier)");
        }

        Review savedReview = reviewRepository.save(review);

        updateProfileRating(revieweeId);

        return savedReview;
    }

    public List<Review> getReviewsForProfile(UUID profileId) {
        return reviewRepository.findByRevieweeId(profileId);
    }

    private void updateProfileRating(UUID profileId) {
        rankingService.updateFarmerRanksAndKPIs(profileId);
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
