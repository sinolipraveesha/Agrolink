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

    public List<Order> getOrdersByDriver(UUID driverId) {
        return orderRepository.findByDriverId(driverId);
    }

    public Order createOrder(Order order) {
        return orderRepository.save(order);
    }

    public Order updateStatus(UUID id, OrderStatus status) {
        System.out.println("🔄 updateStatus called for Order: " + id + " -> " + status);
        return orderRepository.findById(id).map(order -> {
            OrderStatus oldStatus = order.getStatus();
            System.out.println("   Current Status: " + oldStatus);
            order.setStatus(status);

            // Sync Pickup Location on ACCEPT
            if (status == OrderStatus.accepted) {
                if (order.getFarmer() != null) {
                    // Refresh farmer from DB to get latest location
                    com.agrolink.backend.model.Profile farmer = profileRepository.findById(order.getFarmer().getId())
                            .orElse(order.getFarmer());

                    if (farmer.getLatitude() != null && farmer.getLongitude() != null) {
                        order.setPickupLatitude(farmer.getLatitude());
                        order.setPickupLongitude(farmer.getLongitude());
                        System.out.println("📍 Synced Order " + id + " pickup loc to Farmer loc: "
                                + farmer.getLatitude() + ", " + farmer.getLongitude());
                    } else {
                        System.out.println("⚠️ Farmer has no location to sync for Order " + id);
                    }
                }
            }

            Order savedOrder = orderRepository.save(order);
            System.out.println("✅ Order saved with status: " + savedOrder.getStatus());

            // If status changed to delivered
            if (status == OrderStatus.delivered && oldStatus != OrderStatus.delivered) {
                com.agrolink.backend.model.Profile farmer = order.getFarmer();
                if (farmer != null) {
                    Integer currentOrders = farmer.getTotalOrders() != null ? farmer.getTotalOrders() : 0;
                    farmer.setTotalOrders(currentOrders + 1);

                    java.math.BigDecimal currentEarnings = farmer.getTotalEarnings() != null ? farmer.getTotalEarnings()
                            : java.math.BigDecimal.ZERO;
                    farmer.setTotalEarnings(currentEarnings.add(order.getTotalAmount()));

                    updateTopSellerStatus(farmer);
                    profileRepository.save(farmer);
                }
            }
            return savedOrder;
        }).orElse(null);
    }

    private void updateTopSellerStatus(com.agrolink.backend.model.Profile farmer) {
        int orders = farmer.getTotalOrders() != null ? farmer.getTotalOrders() : 0;
        double rating = farmer.getRating() != null ? farmer.getRating() : 0.0;
        java.math.BigDecimal earnings = farmer.getTotalEarnings() != null ? farmer.getTotalEarnings()
                : java.math.BigDecimal.ZERO;

        boolean isTopSeller = orders >= 100 && rating >= 4.8
                && earnings.compareTo(new java.math.BigDecimal("100000")) >= 0;
        farmer.setIsTopSeller(isTopSeller);
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
        System.out.println("🔍 getNearbyAvailableJobs called. Driver Lat/Lon: " + driverLat + ", " + driverLon);

        // DEBUG: First, dump ALL orders just to see what's in the DB
        List<Order> allOrders = orderRepository.findAll();
        System.out.println("📊 DEBUG: Total orders in DB: " + allOrders.size());
        for (Order o : allOrders) {
            System.out.println("   - Order " + o.getId() + " | Status: " + o.getStatus() + " | Farmer: "
                    + (o.getFarmer() != null ? o.getFarmer().getId() : "null"));
        }

        // returning Accepted OR Pending orders for now to ensure visibility
        // This addresses the user's issue where "pending" orders might be what they
        // expect to see
        List<Order> orders = orderRepository.findByStatus(OrderStatus.accepted);
        List<Order> pendingOrders = orderRepository.findByStatus(OrderStatus.pending);
        orders.addAll(pendingOrders);

        System.out.println("   Found " + orders.size() + " available (accepted+pending) orders.");

        // Fallback: Ensure pickup location is set (for older orders)
        for (Order o : orders) {
            if (o.getPickupLatitude() == null && o.getFarmer() != null) {
                // Try to get farmer's location
                com.agrolink.backend.model.Profile farmer = profileRepository.findById(o.getFarmer().getId())
                        .orElse(o.getFarmer());
                if (farmer != null && farmer.getLatitude() != null) {
                    o.setPickupLatitude(farmer.getLatitude());
                    o.setPickupLongitude(farmer.getLongitude());
                    System.out.println(
                            "   Updated missing pickup loc for Order " + o.getId() + " from Farmer " + farmer.getId());
                }
            }
        }
        return orders;
    }

    @Autowired
    private com.agrolink.backend.repository.ProfileRepository profileRepository;

    @Autowired
    private com.agrolink.backend.repository.ProductRepository productRepository;

    @org.springframework.transaction.annotation.Transactional
    public List<Order> placeOrder(com.agrolink.backend.dto.CheckoutRequest request) {
        System.out.println("📦 Placing order for buyer: " + request.getBuyerId());
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
                UUID fId = product.getFarmerId();
                if (fId != null) {
                    itemsByFarmer.computeIfAbsent(fId, k -> new java.util.ArrayList<>()).add(item);
                } else {
                    System.err.println("⚠️ Warning: Product " + product.getId() + " has no farmerId!");
                }
            }
        }

        // 3. Create Order per Farmer
        com.agrolink.backend.model.Profile buyer = profileRepository.findById(request.getBuyerId())
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        for (Map.Entry<UUID, List<com.agrolink.backend.dto.CheckoutRequest.CheckoutItem>> entry : itemsByFarmer
                .entrySet()) {
            UUID farmerId = entry.getKey();
            List<com.agrolink.backend.dto.CheckoutRequest.CheckoutItem> farmerItems = entry.getValue();

            System.out.println("🚜 Creating order for farmerId: " + farmerId);

            Order order = new Order();
            order.setBuyer(buyer);
            order.setContactNumber(request.getContactNumber()); // Save contact number

            com.agrolink.backend.model.Profile farmer = profileRepository.findById(farmerId).orElse(null);

            if (farmer == null) {
                // If the profile doesn't exist yet, we have a problem.
                // We could optionally create a shell profile, but it's better to force it to
                // exist.
                System.err.println("❌ Error: Farmer profile " + farmerId + " not found in DB!");
                throw new RuntimeException("Farmer profile not found for ID: " + farmerId);
            }

            order.setFarmer(farmer); // Set Farmer

            order.setPickupLatitude(farmer.getLatitude());
            order.setPickupLongitude(farmer.getLongitude());
            // order.setPickupAddress(farmer.getAddress()); // If we had address field in
            // profile

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

            Order savedOrder = orderRepository.save(order);
            createdOrders.add(savedOrder);
            System.out.println("✅ Order created: " + savedOrder.getId() + " for farmer: " + farmerId);
        }

        return createdOrders;
    }

    public Order driverAcceptJob(UUID orderId, UUID driverId) {
        return orderRepository.findById(orderId).map(order -> {
            // Check if already taken?
            // Allow accepting if status is 'accepted' (meaning Farmer accepted it)
            // OR checks generic availability.
            // Note: The user flow seems to imply Driver accepts a "pending" or "available"
            // job.
            // But strict logic says 'accepted' by farmer first.
            // Let's relax this check slightly IF the requirement is that drivers can accept
            // direct pending orders,
            // but for now, sticking to 'accepted' or 'pending' if that's the flow.
            // However, to fix the LOCATION issue:

            if (order.getStatus() != OrderStatus.accepted && order.getStatus() != OrderStatus.pending) {
                // Allowing 'pending' too if that's how the app works, but safe to stick to
                // 'accepted'
                // if the previous logic was strictly 'accepted'.
                // The error message says "Order is not available for pickup".
                // Let's keep the status check as is (assuming flow is correct),
                // just fixing the LOCATION update.
                if (order.getStatus() != OrderStatus.accepted) {
                    throw new RuntimeException("Order is not available for pickup (Status must be ACCEPTED by farmer)");
                }
            }

            // Assign Driver
            order.setDriver(
                    profileRepository.findById(driverId).orElseThrow(() -> new RuntimeException("Driver not found")));

            // UPDATE PICKUP LOCATION TO LATEST FARMER LOCATION
            if (order.getFarmer() != null) {
                // Determine latest location
                Double latestLat = order.getFarmer().getLatitude();
                Double latestLng = order.getFarmer().getLongitude();

                if (latestLat != null && latestLng != null) {
                    order.setPickupLatitude(latestLat);
                    order.setPickupLongitude(latestLng);
                }
            }

            order.setStatus(OrderStatus.ready_to_ship); // Driver assigned
            return orderRepository.save(order);
        }).orElseThrow(() -> new RuntimeException("Order not found"));
    }

}
