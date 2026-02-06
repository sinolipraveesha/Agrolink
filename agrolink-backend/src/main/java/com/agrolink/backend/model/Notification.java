package com.agrolink.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications", schema = "public")
@Data
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "recipient_id", nullable = false)
    private Profile recipient; // The Farmer receiving the alert

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String message;

    private String type; // REQUEST_ALERT, ORDER_UPDATE

    @Column(name = "related_id")
    private UUID relatedId; // ID of the BuyerRequest or Order

    @Column(name = "is_read")
    private Boolean isRead = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null)
            createdAt = LocalDateTime.now();
        if (isRead == null)
            isRead = false;
    }
}
