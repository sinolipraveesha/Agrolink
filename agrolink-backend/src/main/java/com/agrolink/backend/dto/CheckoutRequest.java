package com.agrolink.backend.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CheckoutRequest {
    private UUID buyerId;
    private String deliveryAddress;
    private Double deliveryLatitude;
    private Double deliveryLongitude;
    private String contactNumber;
    private List<CheckoutItem> items;

    @Data
    public static class CheckoutItem {
        private UUID productId;
        private int quantity;
    }
}
