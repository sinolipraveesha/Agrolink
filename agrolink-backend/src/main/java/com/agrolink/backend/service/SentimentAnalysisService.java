package com.agrolink.backend.service;

import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

@Service
public class SentimentAnalysisService {

    private static final List<String> URGENT_KEYWORDS = Arrays.asList(
            "urgent", "emergency", "asap", "immediately", "critical",
            "broken", "stuck", "police", "scam", "fraud", "stolen", "hacked",
            "refund", "lawsuit", "illegal", "dangerous", "threat", "unacceptable",
            "help me", "disaster", "life threatening", "accident"
    );

    private static final List<String> HIGH_KEYWORDS = Arrays.asList(
            "terrible", "worst", "bad", "angry", "hate", "awful",
            "horrible", "frustrated", "disappointed", "never", "fail", "upset",
            "disgusting", "outrageous", "ridiculous", "furious", "livid",
            "unacceptable", "unprofessional", "rude", "wasted", "error"
    );

    private static final List<String> LOW_KEYWORDS = Arrays.asList(
            "great", "awesome", "thanks", "excellent", "good",
            "perfect", "amazing", "love", "happy", "resolved",
            "satisfied", "wonderful", "appreciate", "helpful", "pleased"
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
            if (containsWord(lowerText, keyword)) {
                return "URGENT";
            }
        }

        // 2. Check for HIGH negativity
        for (String keyword : HIGH_KEYWORDS) {
            if (containsWord(lowerText, keyword)) {
                return "HIGH";
            }
        }

        // 3. Check for LOW / Positive sentiment
        for (String keyword : LOW_KEYWORDS) {
            if (containsWord(lowerText, keyword)) {
                return "LOW";
            }
        }

        // 4. Default baseline
        return "MEDIUM";
    }

    /**
     * Safely checks if a keyword (single word or phrase) appears in text.
     * - For phrases: simple substring match (already space-delimited).
     * - For single words: splits the text on any non-alphanumeric character so
     *   newlines, commas, exclamation marks, etc. don't prevent a match.
     *   This avoids the Java String.matches() pitfall where '.' won't cross '\n'.
     */
    private boolean containsWord(String lowerText, String keyword) {
        if (keyword.contains(" ")) {
            // Phrase: simple substring is fine since phrase boundaries are spaces
            return lowerText.contains(keyword);
        }
        // Word: split on any non-word character and look for an exact token match
        String[] tokens = lowerText.split("[^a-z0-9]+");
        for (String token : tokens) {
            if (token.equals(keyword)) {
                return true;
            }
        }
        return false;
    }


    /**
     * Maps a priority label to a numeric rank for comparison.
     * URGENT=3, HIGH=2, MEDIUM=1, LOW=0
     */
    public int priorityRank(String priority) {
        if (priority == null) return 1;
        switch (priority.toUpperCase()) {
            case "URGENT": return 3;
            case "HIGH":   return 2;
            case "MEDIUM": return 1;
            case "LOW":    return 0;
            default:       return 1;
        }
    }

    /**
     * Returns true if newPriority is strictly higher than currentPriority.
     */
    public boolean isEscalation(String currentPriority, String newPriority) {
        return priorityRank(newPriority) > priorityRank(currentPriority);
    }
}
