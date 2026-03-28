package com.agrolink.backend.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "knowledge_entries", schema = "public")
public class KnowledgeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer;

    @Column(nullable = false)
    private String category;

    // Comma-separated extra search keywords
    @Column(columnDefinition = "TEXT")
    private String keywords;

    // ── Admin Override / Traceability Fields ──────────────────────────────────

    /** True once an admin has manually verified or corrected this entry. */
    @Column(nullable = false)
    private boolean adminVerified = false;

    /** Original AI/seed answer before the admin override (for audit trail). */
    @Column(columnDefinition = "TEXT")
    private String originalAnswer;

    /** When the admin correction was applied. */
    @Column
    private Instant correctedAt;

    /** Admin user ID who applied the correction. */
    @Column
    private UUID correctedByUserId;

    /** Ticket ID that prompted this correction/addition (traceability). */
    @Column
    private UUID sourceTicketId;

    // ── Constructors ──────────────────────────────────────────────────────────

    public KnowledgeEntry() {}

    public KnowledgeEntry(String question, String answer, String category, String keywords) {
        this.question = question;
        this.answer = answer;
        this.category = category;
        this.keywords = keywords;
    }

    // ── Getters / Setters ─────────────────────────────────────────────────────

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getKeywords() { return keywords; }
    public void setKeywords(String keywords) { this.keywords = keywords; }

    public boolean isAdminVerified() { return adminVerified; }
    public void setAdminVerified(boolean adminVerified) { this.adminVerified = adminVerified; }

    public String getOriginalAnswer() { return originalAnswer; }
    public void setOriginalAnswer(String originalAnswer) { this.originalAnswer = originalAnswer; }

    public Instant getCorrectedAt() { return correctedAt; }
    public void setCorrectedAt(Instant correctedAt) { this.correctedAt = correctedAt; }

    public UUID getCorrectedByUserId() { return correctedByUserId; }
    public void setCorrectedByUserId(UUID correctedByUserId) { this.correctedByUserId = correctedByUserId; }

    public UUID getSourceTicketId() { return sourceTicketId; }
    public void setSourceTicketId(UUID sourceTicketId) { this.sourceTicketId = sourceTicketId; }
}
