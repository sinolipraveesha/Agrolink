package com.agrolink.backend.service;

import com.agrolink.backend.util.PayHereUtility;
import com.agrolink.backend.model.Order;
import com.agrolink.backend.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Locale;

@Service
public class PayHereService {

    @Value("${payhere.merchant-id}")
    private String merchantId;

    @Value("${payhere.merchant-secret}")
    private String merchantSecret;

    @Autowired
    private OrderRepository orderRepository;

    public Map<String, String> generateHash(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        double amount = order.getTotalAmount().doubleValue();
        String currency = "LKR"; // Assuming LKR for now

        String hash = PayHereUtility.generateHash(merchantId, orderId.toString(), amount, currency, merchantSecret);

        Map<String, String> paymentDetails = new HashMap<>();
        paymentDetails.put("merchant_id", merchantId);
        paymentDetails.put("order_id", orderId.toString());
        paymentDetails.put("amount", String.format(Locale.US, "%.2f", amount));
        paymentDetails.put("currency", currency);
        paymentDetails.put("hash", hash);

        // Add other details if needed like return_url, cancel_url, etc.
        // Frontend usually handles URLs but we can provide defaults.

        return paymentDetails;
    }
}
