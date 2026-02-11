package com.agrolink.backend.service;

import com.agrolink.backend.model.Order;
import com.agrolink.backend.model.OrderStatus;
import com.agrolink.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }

    public List<Order> getOrdersByBuyer(UUID buyerId) {
        return orderRepository.findByBuyerId(buyerId);
    }

    public List<Order> getOrdersByFarmer(UUID farmerId) {
        return orderRepository.findByFarmerId(farmerId);
    }

    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    public Order updateStatus(UUID id, OrderStatus status) {
        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            return orderRepository.save(order);
        }).orElse(null);
    }

    public Order farmerAcceptOrder(UUID orderId, Double lat, Double lon) {
        return orderRepository.findById(orderId).map(order -> {
            order.setStatus(OrderStatus.accepted);
            if (lat != null && lon != null) {
                order.setPickupLatitude(lat);
                order.setPickupLongitude(lon);
            }
            return orderRepository.save(order);
        }).orElse(null);
    }

    public List<Order> getNearbyAvailableJobs(double driverLat, double driverLon) {
        // Radius of 20km
        return orderRepository.findNearbyOrders(OrderStatus.accepted.name(), driverLat, driverLon, 20.0);
    }

    @Autowired
    private com.agrolink.backend.repository.ProfileRepository profileRepository;

    @Autowired
    private com.agrolink.backend.repository.ProductRepository productRepository;

    public List<Order> placeOrder(com.agrolink.backend.dto.CheckoutRequest request) {
        List<Order> createdOrders = new java.util.ArrayList<>();

        // 1. Fetch relevant products
        List<UUID> productIds = request.getItems().stream()
                .map(com.agrolink.backend.dto.CheckoutRequest.CheckoutItem::getProductId)
                .collect(java.util.stream.Collectors.toList());
        List<com.agrolink.backend.model.Product> products = productRepository.findAllById(productIds);

        Map<UUID, com.agrolink.backend.model.Product> productMap = products.stream()
                .collect(java.util.stream.Collectors.toMap(com.agrolink.backend.model.Product::getId, p -> p));

        // 2. Group items by Farmer ID
        Map<UUID, List<com.agrolink.backend.dto.CheckoutRequest.CheckoutItem>> itemsByFarmer = new java.util.HashMap<>();

        for (com.agrolink.backend.dto.CheckoutRequest.CheckoutItem item : request.getItems()) {
            com.agrolink.backend.model.Product product = productMap.get(item.getProductId());
            if (product != null) {
                itemsByFarmer.computeIfAbsent(product.getFarmerId(), k -> new java.util.ArrayList<>()).add(item);
            }
        }

        // 3. Create Order per Farmer
        com.agrolink.backend.model.Profile buyer = profileRepository.findById(request.getBuyerId())
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        for (Map.Entry<UUID, List<com.agrolink.backend.dto.CheckoutRequest.CheckoutItem>> entry : itemsByFarmer
                .entrySet()) {
            UUID farmerId = entry.getKey();
            List<com.agrolink.backend.dto.CheckoutRequest.CheckoutItem> farmerItems = entry.getValue();

            Order order = new Order();
            order.setBuyer(buyer);
            com.agrolink.backend.model.Profile farmer = profileRepository.findById(farmerId).orElse(null);
            order.setFarmer(farmer); // Set Farmer

            if (farmer != null) {
                order.setPickupLatitude(farmer.getLatitude());
                order.setPickupLongitude(farmer.getLongitude());
                // order.setPickupAddress(farmer.getAddress()); // If we had address field in
                // profile
            }

            order.setDeliveryAddress(request.getDeliveryAddress());
            order.setDeliveryLatitude(request.getDeliveryLatitude());
            order.setDeliveryLongitude(request.getDeliveryLongitude());
            order.setStatus(OrderStatus.pending);

            // Calculate Total & Build Items
            java.math.BigDecimal orderTotal = java.math.BigDecimal.ZERO;
            List<com.agrolink.backend.model.OrderItem> orderItems = new java.util.ArrayList<>();

            for (com.agrolink.backend.dto.CheckoutRequest.CheckoutItem itemDTO : farmerItems) {
                com.agrolink.backend.model.Product product = productMap.get(itemDTO.getProductId());
                com.agrolink.backend.model.OrderItem orderItem = new com.agrolink.backend.model.OrderItem();
                orderItem.setProduct(product);
                orderItem.setQuantity(java.math.BigDecimal.valueOf(itemDTO.getQuantity()));
                orderItem.setPriceAtTime(product.getPrice());
                orderItem.setOrder(order); // Link back

                orderItems.add(orderItem);

                java.math.BigDecimal itemTotal = product.getPrice()
                        .multiply(java.math.BigDecimal.valueOf(itemDTO.getQuantity()));
                orderTotal = orderTotal.add(itemTotal);
            }

            order.setItems(orderItems);
            order.setTotalAmount(orderTotal);

            createdOrders.add(orderRepository.save(order));
        }

        return createdOrders;
    }

    public Order driverAcceptJob(UUID orderId, UUID driverId) {
        return orderRepository.findById(orderId).map(order -> {
            // Check if already taken?
            if (order.getStatus() != OrderStatus.accepted) {
                throw new RuntimeException("Order is not available for pickup");
            }
            order.setDriver(
                    profileRepository.findById(driverId).orElseThrow(() -> new RuntimeException("Driver not found")));
            order.setStatus(OrderStatus.ready_to_ship); // Driver assigned
            return orderRepository.save(order);
        }).orElseThrow(() -> new RuntimeException("Order not found"));
    }
}
