package com.agrolink.backend.repository;

import com.agrolink.backend.model.ReviewReplyTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewReplyTemplateRepository extends JpaRepository<ReviewReplyTemplate, UUID> {
    List<ReviewReplyTemplate> findBySentiment(String sentiment);
}
