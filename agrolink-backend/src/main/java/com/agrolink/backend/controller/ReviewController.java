package com.agrolink.backend.controller;

import com.agrolink.backend.model.Review;
import com.agrolink.backend.service.ReviewService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")

public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody ReviewRequest request) {
        Review review = reviewService.createReview(
                request.getOrderId(),
                request.getReviewerId(),
                request.getRevieweeId(),
                request.getProductId(),
                request.getShopProductId(),
                request.getRating(),
                request.getComment(),
                request.getSellerReply());
        return ResponseEntity.ok(review);
    }

    @GetMapping("/profile/{profileId}")
    public ResponseEntity<List<Review>> getReviewsForProfile(@PathVariable UUID profileId) {
        return ResponseEntity.ok(reviewService.getReviewsForProfile(profileId));
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<Review>> getReviewsForProduct(@PathVariable UUID productId) {
        return ResponseEntity.ok(reviewService.getReviewsForProduct(productId));
    }

    @GetMapping("/shop-product/{shopProductId}")
    public ResponseEntity<List<Review>> getReviewsForShopProduct(@PathVariable UUID shopProductId) {
        return ResponseEntity.ok(reviewService.getReviewsForShopProduct(shopProductId));
    }

    @PutMapping
    public ResponseEntity<Review> updateReview(@RequestBody ReviewRequest request) {
        Review review = reviewService.updateReview(
                request.getOrderId(),
                request.getReviewerId(),
                request.getRevieweeId(),
                request.getProductId(),
                request.getShopProductId(),
                request.getRating(),
                request.getComment(),
                request.getSellerReply());
        return ResponseEntity.ok(review);
    }

    @GetMapping
    public ResponseEntity<Review> getReview(
            @RequestParam UUID orderId,
            @RequestParam UUID reviewerId,
            @RequestParam(required = false) UUID revieweeId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID shopProductId) {
        return ResponseEntity.ok(reviewService.getReview(orderId, reviewerId, revieweeId, productId, shopProductId));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable UUID reviewId,
            @RequestParam UUID reviewerId) {
        reviewService.deleteReview(reviewId, reviewerId);
        return ResponseEntity.ok().build();
    }

    public static class ReviewRequest {
        private UUID orderId;
        private UUID reviewerId;
        private UUID revieweeId;
        private UUID productId;
        private Integer rating; // 1-5
        private String comment;
        private String sellerReply;

        public UUID getOrderId() {
            return orderId;
        }

        public void setOrderId(UUID orderId) {
            this.orderId = orderId;
        }

        public UUID getReviewerId() {
            return reviewerId;
        }

        public void setReviewerId(UUID reviewerId) {
            this.reviewerId = reviewerId;
        }

        public UUID getRevieweeId() {
            return revieweeId;
        }

        public void setRevieweeId(UUID revieweeId) {
            this.revieweeId = revieweeId;
        }

        public Integer getRating() {
            return rating;
        }

        public void setRating(Integer rating) {
            this.rating = rating;
        }

        public String getComment() {
            return comment;
        }

        public void setComment(String comment) {
            this.comment = comment;
        }

        public String getSellerReply() {
            return sellerReply;
        }

        public void setSellerReply(String sellerReply) {
            this.sellerReply = sellerReply;
        }

        public UUID getProductId() {
            return productId;
        }

        public void setProductId(UUID productId) {
            this.productId = productId;
        }

        private UUID shopProductId;

        public UUID getShopProductId() {
            return shopProductId;
        }

        public void setShopProductId(UUID shopProductId) {
            this.shopProductId = shopProductId;
        }
    }
}
