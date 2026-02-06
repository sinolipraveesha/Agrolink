package com.agrolink.backend.model;

public enum OrderStatus {
    pending,
    accepted,
    ready_to_ship,
    shipped,
    delivered,
    disputed,
    cancelled
}
