package com.agrolink.backend.repository;

import com.agrolink.backend.model.Ticket;
import com.agrolink.backend.model.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByUserId(UUID userId);

    List<Ticket> findByStatus(TicketStatus status);
}
