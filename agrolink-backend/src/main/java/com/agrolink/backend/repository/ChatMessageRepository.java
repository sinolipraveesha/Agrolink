package com.agrolink.backend.repository;

import com.agrolink.backend.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage c SET c.isRead = true WHERE c.conversation.id = :conversationId AND c.sender.id != :userId AND c.isRead = false")
    void markAsReadByConversationAndUser(UUID conversationId, UUID userId);
}
