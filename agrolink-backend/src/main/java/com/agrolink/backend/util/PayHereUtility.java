package com.agrolink.backend.util;

import java.security.MessageDigest;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

public class PayHereUtility {

    public static String generateHash(String merchantId, String orderId, double amount, String currency,
            String merchantSecret) {

        DecimalFormat df = new DecimalFormat("0.00", new DecimalFormatSymbols(Locale.US));
        String formattedAmount = df.format(amount);

        String secretHash = getMd5(merchantSecret).toUpperCase();

        String hashString = merchantId + orderId + formattedAmount + currency + secretHash;

        System.err.println("DEBUG PayHere Hash Input: " + hashString);
        System.err.println("DEBUG PayHere Secret Hash: " + secretHash);

        return getMd5(hashString).toUpperCase();
    }

    private static String getMd5(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] messageDigest = md.digest(input.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : messageDigest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error generating MD5 hash", e);
        }
    }
}
