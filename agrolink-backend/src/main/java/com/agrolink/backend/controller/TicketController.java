package com.agrolink.backend.controller;

import com.agrolink.backend.model.Ticket;
import com.agrolink.backend.model.TicketMessage;
import com.agrolink.backend.model.TicketStatus;
import com.agrolink.backend.service.SentimentAnalysisService;
import com.agrolink.backend.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private SentimentAnalysisService sentimentAnalysisService;

    @GetMapping
    public List<Ticket> getAllTickets() {
        return ticketService.getAllTickets();
    }

    /**
     * Returns all tickets sorted by priority (URGENT first) then createdAt descending.
     * Intended for the admin dashboard sort-by-priority feature.
     */
    @GetMapping("/sorted")
    public List<Ticket> getTicketsSortedByPriority() {
        List<Ticket> tickets = ticketService.getAllTickets();
        tickets.sort(Comparator
                .comparingInt((Ticket t) -> sentimentAnalysisService.priorityRank(t.getPriority()))
                .reversed()
                .thenComparing(Comparator.comparing(Ticket::getCreatedAt).reversed()));
        return tickets;
    }

    @GetMapping("/user/{userId}")
    public List<Ticket> getTicketsByUser(@PathVariable UUID userId) {
        return ticketService.getTicketsByUser(userId);
    }

    @PostMapping("/create")
    public ResponseEntity<Ticket> createTicket(@RequestBody CreateTicketRequest request) {
        return ResponseEntity.ok(ticketService.createTicket(request.getUserId(), request.getSubject(),
                request.getDescription(), request.getPriority()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicket(@PathVariable UUID id, @RequestParam(required = false) UUID requesterId) {
        Ticket ticket = ticketService.getTicketById(id, requesterId);
        if (ticket == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<TicketMessage> addMessage(@PathVariable UUID id, @RequestBody AddMessageRequest request) {
        return ResponseEntity.ok(ticketService.addMessage(id, request.getSenderId(), request.getMessage()));
    }

    @GetMapping("/{id}/messages")
    public List<TicketMessage> getMessages(@PathVariable UUID id) {
        return ticketService.getMessages(id);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(@PathVariable UUID id, @RequestParam TicketStatus status, @RequestParam UUID requesterId) {
        Ticket updated = ticketService.updateStatus(id, status, requesterId);
        if (updated == null)
            return ResponseEntity.status(403).build();
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/messages/read")
    public ResponseEntity<Void> markMessagesAsRead(@PathVariable UUID id, @RequestParam UUID userId) {
        ticketService.markMessagesAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable UUID messageId, @RequestParam UUID userId) {
        boolean deleted = ticketService.deleteMessage(messageId, userId);
        if (deleted) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(403).build(); // Forbidden if not the sender or if reply exists
        }
    }

    @PutMapping("/messages/{messageId}")
    public ResponseEntity<TicketMessage> editMessage(@PathVariable UUID messageId, @RequestBody EditMessageRequest request) {
        try {
            return ResponseEntity.ok(ticketService.editMessage(messageId, request.getUserId(), request.getNewText()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTicket(@PathVariable UUID id, @RequestParam UUID requesterId) {
        boolean deleted = ticketService.deleteTicket(id, requesterId);
        if (deleted) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(403).build();
        }
    }

    // DTOs
    public static class CreateTicketRequest {
        private UUID userId;
        private String subject;
        private String description;
        private String priority;

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getSubject() {
            return subject;
        }

        public void setSubject(String subject) {
            this.subject = subject;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }
    }

    public static class AddMessageRequest {
        private UUID senderId;
        private String message;

        public UUID getSenderId() {
            return senderId;
        }

        public void setSenderId(UUID senderId) {
            this.senderId = senderId;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }
    }

    public static class EditMessageRequest {
        private UUID userId;
        private String newText;

        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getNewText() {
            return newText;
        }

        public void setNewText(String newText) {
            this.newText = newText;
        }
    }
}
