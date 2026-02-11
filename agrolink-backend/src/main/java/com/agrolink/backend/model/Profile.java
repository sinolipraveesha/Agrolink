package com.agrolink.backend.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "profiles", schema = "public")
@Data
public class Profile {

    @Id
    private UUID id;

    @Column(name = "full_name")
    private String fullName;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private UserStatus status;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "nic_front_url")
    private String nicFrontUrl;

    @Column(name = "nic_back_url")
    private String nicBackUrl;

    @Column(name = "buyer_type")
    private String buyerType;

    @Column(name = "proof_photo_url")
    private String proofPhotoUrl;

    @Column(name = "vehicle_type")
    private String vehicleType;

    @Column(name = "vehicle_model")
    private String vehicleModel;

    @Column(name = "vehicle_plate_number")
    private String vehiclePlateNumber;

    @Column(name = "max_load_weight")
    private java.math.BigDecimal maxLoadWeight;

    @Column(name = "vehicle_photo_url")
    private String vehiclePhotoUrl;

    @Column(name = "vehicle_plate_photo_url")
    private String vehiclePlatePhotoUrl;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "rating")
    private Double rating = 0.0;

    @Column(name = "total_orders")
    private Integer totalOrders = 0;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = UserStatus.pending;
        }
    }

    // Manual getters and setters to ensure Jackson serializes them
    public String getVehiclePhotoUrl() {
        return vehiclePhotoUrl;
    }

    public void setVehiclePhotoUrl(String vehiclePhotoUrl) {
        this.vehiclePhotoUrl = vehiclePhotoUrl;
    }

    public String getVehiclePlatePhotoUrl() {
        return vehiclePlatePhotoUrl;
    }

    public void setVehiclePlatePhotoUrl(String vehiclePlatePhotoUrl) {
        this.vehiclePlatePhotoUrl = vehiclePlatePhotoUrl;
    }
}
