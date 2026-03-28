package com.agrolink.backend.repository;

import com.agrolink.backend.model.KnowledgeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface KnowledgeRepository extends JpaRepository<KnowledgeEntry, UUID> {
}
