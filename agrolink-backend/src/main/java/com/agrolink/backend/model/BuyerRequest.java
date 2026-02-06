package com.agrolink.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "buyer_requests", schema = "public")
@Data
public class BuyerRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "buyer_id", nullable = false)
    private Profile buyer;

    @Column(nullable = false)
    private String category; // e.g., "Vegetables", "Fruits"

    @Column(nullable = false)
    private String description; // Description of what they need

    private Double budget; // Max price they are willing to pay

    private Integer quantity; // Quantity needed (kg/items)
    private String unit; // kg, g, items

    @Column(nullable = false)
    private String status; // OPEN, CLOSED, FULFILLED

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null)
            createdAt = LocalDateTime.now();
        if (status == null)
            status = "OPEN";
    }
}
