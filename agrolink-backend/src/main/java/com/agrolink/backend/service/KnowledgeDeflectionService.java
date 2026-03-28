package com.agrolink.backend.service;

import com.agrolink.backend.model.KnowledgeEntry;
import com.agrolink.backend.repository.KnowledgeRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class KnowledgeDeflectionService {

    private final KnowledgeRepository knowledgeRepository;

    public KnowledgeDeflectionService(KnowledgeRepository knowledgeRepository) {
        this.knowledgeRepository = knowledgeRepository;
    }

    /**
     * Returns up to {@code topK} knowledge entries whose question+keywords
     * best match the given query, using Jaccard similarity.
     * Admin-verified entries receive a 1.5× score boost so they surface first.
     */
    public List<KnowledgeEntry> search(String query, int topK) {
        if (query == null || query.trim().length() < 4) {
            return Collections.emptyList();
        }

        Set<String> queryTokens = tokenize(query);
        if (queryTokens.isEmpty()) return Collections.emptyList();

        List<KnowledgeEntry> all = knowledgeRepository.findAll();

        return all.stream()
                .map(entry -> {
                    double score = jaccard(queryTokens, entryTokens(entry));
                    // Admin-verified entries get a boost — they are the authoritative answers
                    if (entry.isAdminVerified()) score *= 1.5;
                    return Map.entry(entry, score);
                })
                .filter(e -> e.getValue() > 0.05)
                .sorted(Map.Entry.<KnowledgeEntry, Double>comparingByValue().reversed())
                .limit(topK)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /** Returns all entries sorted: admin-verified first, then by correctedAt desc, then by id. */
    public List<KnowledgeEntry> searchAll() {
        return knowledgeRepository.findAll().stream()
                .sorted(Comparator
                        .<KnowledgeEntry, Boolean>comparing(KnowledgeEntry::isAdminVerified).reversed()
                        .thenComparing(e -> e.getCorrectedAt() != null ? e.getCorrectedAt() : java.time.Instant.EPOCH,
                                Comparator.reverseOrder()))
                .collect(Collectors.toList());
    }

    /** Persist a new or modified entry. */
    public KnowledgeEntry save(KnowledgeEntry entry) {
        return knowledgeRepository.save(entry);
    }

    /** Delete an entry by ID. Throws if not found. */
    public void delete(UUID id) {
        if (!knowledgeRepository.existsById(id)) {
            throw new NoSuchElementException("Knowledge entry not found: " + id);
        }
        knowledgeRepository.deleteById(id);
    }

    /** Find one entry by ID. */
    public Optional<KnowledgeEntry> findById(UUID id) {
        return knowledgeRepository.findById(id);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Set<String> tokenize(String text) {
        if (text == null) return Collections.emptySet();
        Set<String> stopWords = Set.of(
                "i", "my", "me", "the", "a", "an", "is", "it", "in", "of",
                "to", "do", "how", "can", "be", "was", "are", "for", "on",
                "at", "by", "with", "not", "this", "that", "have", "has",
                "what", "when", "why", "where", "will", "would", "should"
        );
        return Arrays.stream(text.toLowerCase().split("[^a-z0-9]+"))
                .filter(t -> t.length() > 2 && !stopWords.contains(t))
                .collect(Collectors.toSet());
    }

    private Set<String> entryTokens(KnowledgeEntry entry) {
        String combined = (entry.getQuestion() == null ? "" : entry.getQuestion())
                + " " + (entry.getKeywords() == null ? "" : entry.getKeywords());
        return tokenize(combined);
    }

    private double jaccard(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) return 0.0;
        long common = a.stream().filter(b::contains).count();
        long union = a.size() + b.size() - common;
        return union == 0 ? 0 : (double) common / union;
    }
}
