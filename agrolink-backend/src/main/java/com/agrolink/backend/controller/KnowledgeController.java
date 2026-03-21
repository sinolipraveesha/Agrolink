package com.agrolink.backend.controller;

import com.agrolink.backend.dto.KnowledgeOverrideRequest;
import com.agrolink.backend.model.KnowledgeEntry;
import com.agrolink.backend.service.KnowledgeDeflectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    private final KnowledgeDeflectionService deflectionService;

    public KnowledgeController(KnowledgeDeflectionService deflectionService) {
        this.deflectionService = deflectionService;
    }

    // ── Public ────────────────────────────────────────────────────────────────

    /**
     * GET /api/knowledge/search?q=...&limit=3
     * Live suggestion search for the Create Ticket modal.
     */
    @GetMapping("/search")
    public ResponseEntity<List<KnowledgeEntry>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "3") int limit) {
        return ResponseEntity.ok(deflectionService.search(q, limit));
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * GET /api/knowledge/all
     * Returns all entries sorted by verified-first for the admin panel.
     */
    @GetMapping("/all")
    public ResponseEntity<List<KnowledgeEntry>> all() {
        return ResponseEntity.ok(deflectionService.searchAll());
    }

    /**
     * POST /api/knowledge
     * Creates a new entry (admin adds from scratch or from ticket chat).
     */
    @PostMapping
    public ResponseEntity<KnowledgeEntry> create(@RequestBody KnowledgeOverrideRequest req) {
        KnowledgeEntry entry = new KnowledgeEntry(
                req.getQuestion(), req.getAnswer(), req.getCategory(), req.getKeywords());
        entry.setAdminVerified(true);
        entry.setCorrectedAt(Instant.now());
        entry.setSourceTicketId(req.getSourceTicketId());
        return ResponseEntity.ok(deflectionService.save(entry));
    }

    /**
     * PUT /api/knowledge/{id}/override
     * Admin overrides the answer of an existing entry.
     * Saves the old answer for traceability before applying the correction.
     */
    @PutMapping("/{id}/override")
    public ResponseEntity<?> override(
            @PathVariable UUID id,
            @RequestBody KnowledgeOverrideRequest req,
            @RequestHeader(value = "X-Admin-User-Id", required = false) UUID adminUserId) {

        return deflectionService.findById(id).map(entry -> {
            // Preserve original answer for audit trail
            if (!entry.isAdminVerified()) {
                entry.setOriginalAnswer(entry.getAnswer());
            }
            entry.setQuestion(req.getQuestion() != null ? req.getQuestion() : entry.getQuestion());
            entry.setAnswer(req.getAnswer());
            entry.setKeywords(req.getKeywords() != null ? req.getKeywords() : entry.getKeywords());
            entry.setCategory(req.getCategory() != null ? req.getCategory() : entry.getCategory());
            entry.setAdminVerified(true);
            entry.setCorrectedAt(Instant.now());
            entry.setCorrectedByUserId(adminUserId);
            if (req.getSourceTicketId() != null) {
                entry.setSourceTicketId(req.getSourceTicketId());
            }
            return ResponseEntity.ok(deflectionService.save(entry));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/knowledge/{id}
     * Removes a knowledge entry permanently.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            deflectionService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
