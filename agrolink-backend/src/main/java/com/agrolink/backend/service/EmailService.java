package com.agrolink.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.util.List;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @org.springframework.scheduling.annotation.Async
    public void sendOrderConfirmationEmail(String to, String orderId, String status, String itemsHtml,
            String totalAmount) {
        System.out.println("📬 Attempting to send HTML email for Order #" + orderId);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("AgroLink <noreply@agrolink.lk>");
            helper.setTo(new String[] { "agrolinkmail42@gmail.com", "shashinkavintha@gmail.com",
                    "sandarunethsarta@gmail.com" }); // Multiple recipients
            helper.setSubject("Order Update - #" + orderId.substring(0, 8) + " [" + status.toUpperCase() + "]");

            String htmlContent = "<html>" +
                    "<body style='font-family: Arial, sans-serif; color: #333; line-height: 1.6;'>" +
                    "  <div style='max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;'>"
                    +
                    "    <div style='background-color: #1a7935; padding: 20px; text-align: center;'>" +
                    "      <h1 style='color: white; margin: 0;'>AgroLink</h1>" +
                    "    </div>" +
                    "    <div style='padding: 30px;'>" +
                    "      <h2 style='color: #1a7935;'>Order Status Update</h2>" +
                    "      <p>Dear Customer,</p>" +
                    "      <p>Your order <strong>#" + orderId + "</strong> has been <strong>" + status
                    + "</strong>.</p>" +
                    "      <hr style='border: 0; border-top: 1px solid #eee; margin: 20px 0;'>" +
                    "      <h3 style='color: #555; text-transform: uppercase; font-size: 14px;'>Order Summary</h3>" +
                    "      <div style='background-color: #f9f9f9; padding: 15px; border-radius: 8px;'>" +
                    "        <table style='width: 100%; border-collapse: collapse;'>" +
                    itemsHtml +
                    "        </table>" +
                    "        <div style='margin-top: 15px; padding-top: 15px; border-top: 2px solid #eee; display: flex; justify-content: space-between;'>"
                    +
                    "          <span style='font-weight: bold; color: #1a7935; font-size: 18px;'>Total Amount:</span>" +
                    "          <span style='font-weight: bold; color: #1a7935; font-size: 18px; float: right;'>Rs. "
                    + totalAmount + "</span>" +
                    "        </div>" +
                    "        <div style='clear: both;'></div>" +
                    "      </div>" +
                    "      <p style='margin-top: 30px;'>Thank you for choosing AgroLink!</p>" +
                    "      <p>Best Regards,<br><strong>AgroLink Team</strong></p>" +
                    "    </div>" +
                    "    <div style='background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;'>"
                    +
                    "      &copy; 2026 AgroLink Sri Lanka. All rights reserved." +
                    "    </div>" +
                    "  </div>" +
                    "</body>" +
                    "</html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("✅ SUCCESS: Beautiful HTML Email sent successfully.");
        } catch (Exception e) {
            System.err.println("❌ ERROR: Failed to send HTML email: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
