package com.agrolink.backend.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class SentimentAnalysisService {

    private static final List<String> URGENT_KEYWORDS = Arrays.asList(
            "urgent", "emergency", "asap", "immediately", "critical",
            "broken", "stuck", "police", "scam", "fraud", "stolen", "hacked"
    );

    private static final List<String> HIGH_KEYWORDS = Arrays.asList(
            "terrible", "worst", "bad", "angry", "hate", "awful",
            "horrible", "frustrated", "disappointed", "never", "fail", "upset"
    );

    private static final List<String> LOW_KEYWORDS = Arrays.asList(
            "great", "awesome", "thanks", "excellent", "good",
            "perfect", "amazing", "love", "happy", "resolved"
    );

    /**
     * Determines the priority level based on text sentiment.
     * Hierarchy: URGENT > HIGH > MEDIUM > LOW.
     * Higher severity always overrides lower severity within the same text.
     */
    public String analyzePriority(String text) {
        if (text == null || text.trim().isEmpty()) {
            return "MEDIUM";
        }

        String lowerText = text.toLowerCase();

        // 1. Check for URGENT (highest priority override)
        for (String keyword : URGENT_KEYWORDS) {
            // Using regex to match whole words instead of just substrings
            if (lowerText.matches(".*\\b" + keyword + "\\b.*")) {
                return "URGENT";
            }
        }

        // 2. Check for HIGH negativity
        for (String keyword : HIGH_KEYWORDS) {
            if (lowerText.matches(".*\\b" + keyword + "\\b.*")) {
                return "HIGH";
            }
        }

        // 3. Check for LOW / Positive sentiment
        for (String keyword : LOW_KEYWORDS) {
            if (lowerText.matches(".*\\b" + keyword + "\\b.*")) {
                return "LOW";
            }
        }

        // 4. Default baseline
        return "MEDIUM";
    }
}
