package com.agrolink.backend.dto;

import java.util.UUID;

/**
 * DTO for creating a new knowledge entry or overriding an existing one.
 */
public class KnowledgeOverrideRequest {

    private String question;
    private String answer;
    private String category;
    private String keywords;

    /** Optional — ticket that motivated the correction (traceability). */
    private UUID sourceTicketId;

    public KnowledgeOverrideRequest() {}

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }

    public UUID getSourceTicketId() { return sourceTicketId; }
    public void setSourceTicketId(UUID sourceTicketId) { this.sourceTicketId = sourceTicketId; }
}
