package com.agrolink.backend.service;

import com.agrolink.backend.dto.CheckoutRequest;
import com.agrolink.backend.model.*;
import com.agrolink.backend.repository.FarmerShopProductRepository;
import com.agrolink.backend.repository.FarmershopOrderRepository;
import com.agrolink.backend.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FarmershopOrderService {

    @Autowired
    private FarmershopOrderRepository farmershopOrderRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private FarmerShopProductRepository farmerShopProductRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    public List<FarmershopOrder> getAllOrders() {
        return farmershopOrderRepository.findAll();
    }

    public List<FarmershopOrder> getOrdersByBuyer(UUID buyerId) {
        return farmershopOrderRepository.findByBuyerId(buyerId);
    }

    public List<FarmershopOrder> getOrdersBySeller(UUID sellerId) {
        return farmershopOrderRepository.findBySellerId(sellerId);
    }

    public List<FarmershopOrder> getOrdersByStatus(FarmershopOrderStatus status) {
        return farmershopOrderRepository.findByStatus(status);
    }

    public FarmershopOrder getOrderById(UUID id) {
        return farmershopOrderRepository.findById(id).orElseThrow(() -> new RuntimeException("Order not found"));
    }

    @Transactional
    public FarmershopOrder updateStatus(UUID orderId, FarmershopOrderStatus status) {
        FarmershopOrder order = getOrderById(orderId);
        FarmershopOrderStatus oldStatus = order.getStatus();
        
        // Trigger stock reduction when confirming order (pending -> packing)
        if (oldStatus == FarmershopOrderStatus.pending && status == FarmershopOrderStatus.packing) {
            reduceStockForOrder(order);
        }
        
        order.setStatus(status);
        
        // --- SEND EMAIL TO BUYER ---
        if (status == FarmershopOrderStatus.packing && oldStatus == FarmershopOrderStatus.pending) {
            if (order.getBuyer() != null && order.getBuyer().getEmail() != null) {
                emailService.sendOrderConfirmationEmail(
                    order.getBuyer().getEmail(),
                    order.getId().toString(),
                    "APPROVED and is now being packed",
                    generateItemsHtml(order),
                    String.format("%.2f", order.getTotalAmount())
                );
            }
        }
        
        // --- SEND EMAIL FOR DISPATCHED STATUS ---
        if (status == FarmershopOrderStatus.dispatched && oldStatus != FarmershopOrderStatus.dispatched) {
            emailService.sendOrderConfirmationEmail(
                "agrolinkmail42@gmail.com",
                order.getId().toString(),
                "DISPATCHED from our warehouse",
                generateItemsHtml(order),
                String.format("%.2f", order.getTotalAmount())
            );
        }
        
        return farmershopOrderRepository.save(order);
    }

    private void reduceStockForOrder(FarmershopOrder order) {
        for (FarmershopOrderItem item : order.getItems()) {
            FarmerShopProduct product = item.getProduct();
            if (product != null) {
                int orderedQty = item.getQuantity().intValue();
                int currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                
                if (currentStock < orderedQty) {
                    throw new RuntimeException("Insufficient stock for product: " + product.getName() + 
                        ". Available: " + currentStock + ", Ordered: " + orderedQty);
                }
                
                product.setStockQuantity(currentStock - orderedQty);
                
                // If stock reaches 0, maybe set status to out of stock?
                // For now, just reduce the quantity as requested.
                farmerShopProductRepository.save(product);
                System.out.println("📉 Reduced stock for " + product.getName() + " by " + orderedQty + ". New stock: " + product.getStockQuantity());
            }
        }
    }

    @Transactional
    public List<FarmershopOrder> placeOrder(CheckoutRequest request) {
        System.out.println("📦 Placing Farmershop order for buyer: " + request.getBuyerId());
        
        Profile buyer = profileRepository.findById(request.getBuyerId())
                .orElseThrow(() -> new RuntimeException("Buyer not found"));
                
        List<UUID> productIds = request.getItems().stream()
                .map(CheckoutRequest.CheckoutItem::getProductId)
                .collect(Collectors.toList());

        List<FarmerShopProduct> shopProducts = farmerShopProductRepository.findAllById(productIds);
        Map<UUID, FarmerShopProduct> productMap = shopProducts.stream()
                .collect(Collectors.toMap(FarmerShopProduct::getId, p -> p));

        // Group items by Seller (Admin) ID
        Map<UUID, List<CheckoutRequest.CheckoutItem>> itemsBySeller = new HashMap<>();

        for (CheckoutRequest.CheckoutItem item : request.getItems()) {
            FarmerShopProduct product = productMap.get(item.getProductId());
            if (product != null) {
                UUID sellerId = product.getAdminId();
                if (sellerId != null) {
                    itemsBySeller.computeIfAbsent(sellerId, k -> new ArrayList<>()).add(item);
                } else {
                    System.err.println("⚠️ Warning: FarmerShopProduct " + product.getId() + " has no sellerId. Cannot place order.");
                }
            } else {
                System.err.println("❌ FarmerShopProduct not found: " + item.getProductId());
            }
        }

        if (itemsBySeller.isEmpty()) {
            throw new RuntimeException("InvalidCartItems");
        }

        List<FarmershopOrder> createdOrders = new ArrayList<>();

        for (Map.Entry<UUID, List<CheckoutRequest.CheckoutItem>> entry : itemsBySeller.entrySet()) {
            UUID sellerId = entry.getKey();
            List<CheckoutRequest.CheckoutItem> sellerItems = entry.getValue();

            FarmershopOrder order = new FarmershopOrder();
            order.setBuyer(buyer);
            order.setContactNumber(request.getContactNumber());
            order.setDeliveryAddress(request.getDeliveryAddress());
            order.setDeliveryLatitude(request.getDeliveryLatitude());
            order.setDeliveryLongitude(request.getDeliveryLongitude());
            order.setStatus(FarmershopOrderStatus.pending);

            Profile seller = profileRepository.findById(sellerId).orElse(null);
            if (seller == null) {
                System.err.println("❌ Critical Error: Seller Profile not found in database for ID: " + sellerId);
                throw new RuntimeException("Seller Profile not found. Please ensure the supplier account is properly registered in the profiles table.");
            }
            order.setSeller(seller);

            BigDecimal orderTotal = BigDecimal.ZERO;
            List<FarmershopOrderItem> orderItems = new ArrayList<>();

            for (CheckoutRequest.CheckoutItem itemDTO : sellerItems) {
                FarmerShopProduct product = productMap.get(itemDTO.getProductId());
                
                // Optional: Stock management could go here
                
                FarmershopOrderItem orderItem = new FarmershopOrderItem();
                orderItem.setFarmershopOrder(order);
                orderItem.setProduct(product);
                orderItem.setQuantity(BigDecimal.valueOf(itemDTO.getQuantity()));
                orderItem.setPriceAtTime(product.getPrice());
                
                orderItems.add(orderItem);

                BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
                orderTotal = orderTotal.add(itemTotal);
            }

            order.setItems(orderItems);
            order.setTotalAmount(orderTotal);

            FarmershopOrder savedOrder = farmershopOrderRepository.save(order);
            createdOrders.add(savedOrder);
            System.out.println("✅ FarmershopOrder created: " + savedOrder.getId() + " for seller: " + sellerId);
        }

        try {
            for (FarmershopOrder order : createdOrders) {
                if (order.getSeller() != null) {
                    notificationService.createNotification(
                        order.getSeller().getId(),
                        "New Order Received",
                        "You have received a new order #" + order.getId().toString().substring(0, 8),
                        "NEW_ORDER_SUPPLIER",
                        order.getId()
                    );
                }
                
                // --- SEND EMAIL NOTIFICATION FOR NEW ORDER ---
                emailService.sendOrderConfirmationEmail(
                    "agrolinkmail42@gmail.com", 
                    order.getId().toString(),
                    "PLACED (Farmers' Shop Order)",
                    generateItemsHtml(order),
                    String.format("%.2f", order.getTotalAmount())
                );
            }
        } catch (Exception e) {
            System.err.println("⚠️ Warning: Could not send order notification: " + e.getMessage());
        }

        return createdOrders;
    }
    private String generateItemsHtml(FarmershopOrder order) {
        StringBuilder sb = new StringBuilder();
        if (order.getItems() != null) {
            for (FarmershopOrderItem item : order.getItems()) {
                String name = item.getProduct() != null ? item.getProduct().getName() : "Farmers' Shop Item";
                
                String imgUrl = (item.getProduct() != null && item.getProduct().getImageUrl() != null) 
                                ? item.getProduct().getImageUrl() 
                                : "https://via.placeholder.com/60";

                sb.append("<tr>")
                  .append("<td style='padding: 10px 0; border-bottom: 1px solid #eee; width: 70px;'>")
                  .append("<img src='").append(imgUrl).append("' style='width: 60px; height: 60px; border-radius: 5px; object-fit: cover;'>")
                  .append("</td>")
                  .append("<td style='padding: 10px 0; border-bottom: 1px solid #eee;'>")
                  .append("<span style='font-weight: bold; display: block;'>").append(name).append("</span>")
                  .append("<span style='font-size: 12px; color: #888;'>Price per unit: Rs. ").append(String.format("%.2f", item.getPriceAtTime())).append("</span>")
                  .append("</td>")
                  .append("<td style='padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;'>")
                  .append("<div style='font-weight: bold;'>Rs. ").append(String.format("%.2f", item.getPriceAtTime().multiply(item.getQuantity()))).append("</div>")
                  .append("<div style='font-size: 12px; color: #1a7935;'>Qty: ").append(item.getQuantity()).append("</div>")
                  .append("</td>")
                  .append("</tr>");
            }
        }
        return sb.toString();
    }
}
