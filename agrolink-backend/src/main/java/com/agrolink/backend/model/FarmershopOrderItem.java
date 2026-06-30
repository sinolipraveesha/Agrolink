package com.agrolink.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "farmershop_order_items", schema = "public")
public class FarmershopOrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmershop_order_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonBackReference
    private FarmershopOrder farmershopOrder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private FarmerShopProduct product;

    @Column(nullable = false)
    private BigDecimal quantity;

    @Column(name = "price_at_time", nullable = false)
    private BigDecimal priceAtTime;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public FarmershopOrder getFarmershopOrder() {
        return farmershopOrder;
    }

    public void setFarmershopOrder(FarmershopOrder farmershopOrder) {
        this.farmershopOrder = farmershopOrder;
    }

    public FarmerShopProduct getProduct() {
        return product;
    }

    public void setProduct(FarmerShopProduct product) {
        this.product = product;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPriceAtTime() {
        return priceAtTime;
    }

    public void setPriceAtTime(BigDecimal priceAtTime) {
        this.priceAtTime = priceAtTime;
    }
}
