package com.agrolink.backend.service;

import com.agrolink.backend.model.Profile;
import com.agrolink.backend.model.Ticket;
import com.agrolink.backend.model.TicketMessage;
import com.agrolink.backend.model.TicketStatus;
import com.agrolink.backend.model.UserRole;
import com.agrolink.backend.repository.ProfileRepository;
import com.agrolink.backend.repository.TicketMessageRepository;
import com.agrolink.backend.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    @Autowired
    private TicketRepository ticketRepository;

    @Autowired
    private TicketMessageRepository ticketMessageRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private NotificationService notificationService;

    public List<Ticket> getAllTickets() {
        return ticketRepository.findAll();
    }

    public List<Ticket> getTicketsByUser(UUID userId) {
        return ticketRepository.findByUserId(userId);
    }

    public Ticket createTicket(UUID userId, String subject, String description, String priority) {
        Profile user = profileRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        Ticket ticket = new Ticket();
        ticket.setUser(user);
        ticket.setSubject(subject);
        ticket.setDescription(description);
        ticket.setPriority(priority);
        // Default status is OPEN
        // Default createdAt is now
        Ticket savedTicket = ticketRepository.save(ticket);

        // Notify all admins about the new ticket
        List<Profile> admins = profileRepository.findByRole(UserRole.admin);
        for (Profile admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    "New Support Ticket",
                    user.getFullName() + " created a support ticket: " + subject,
                    "SUPPORT_TICKET",
                    savedTicket.getId());
        }

        return savedTicket;
    }

    public Ticket getTicketById(UUID id) {
        return ticketRepository.findById(id).orElse(null);
    }

    @Transactional
    public TicketMessage addMessage(UUID ticketId, UUID senderId, String text) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow(() -> new RuntimeException("Ticket not found"));
        Profile sender = profileRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        TicketMessage message = new TicketMessage();
        message.setTicket(ticket);
        message.setSender(sender);
        message.setMessage(text);
        message.setCreatedAt(LocalDateTime.now());

        // If message is from admin (not ticket owner), maybe update status?
        // For now just keep status as is or update to IN_PROGRESS if open
        boolean isTicketOwner = sender.getId().equals(ticket.getUser().getId());

        if (ticket.getStatus() == TicketStatus.OPEN && !isTicketOwner) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
            ticketRepository.save(ticket);
        }

        TicketMessage savedMessage = ticketMessageRepository.save(message);

        // Send notification
        if (isTicketOwner) {
            // User sent message → notify all admins
            List<Profile> admins = profileRepository.findByRole(UserRole.admin);
            for (Profile admin : admins) {
                notificationService.createNotification(
                        admin.getId(),
                        "New Support Message",
                        sender.getFullName() + " sent a message: "
                                + (text.length() > 50 ? text.substring(0, 50) + "..." : text),
                        "SUPPORT_MESSAGE",
                        ticketId);
            }
        } else {
            // Admin sent message → notify ticket owner
            notificationService.createNotification(
                    ticket.getUser().getId(),
                    "Support Reply",
                    "Support team replied to your ticket: " + ticket.getSubject(),
                    "SUPPORT_REPLY",
                    ticketId);
        }

        return savedMessage;
    }

    public Ticket updateStatus(UUID ticketId, TicketStatus newStatus) {
        Ticket ticket = ticketRepository.findById(ticketId).orElseThrow(() -> new RuntimeException("Ticket not found"));
        ticket.setStatus(newStatus);
        return ticketRepository.save(ticket);
    }

    public List<TicketMessage> getMessages(UUID ticketId) {
        return ticketMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId);
    }

    @Transactional
    public boolean deleteMessage(UUID messageId, UUID userId) {
        TicketMessage message = ticketMessageRepository.findById(messageId).orElse(null);
        if (message == null) {
            return false;
        }

        // Check if the user is the sender
        if (!message.getSender().getId().equals(userId)) {
            return false; // Not authorized
        }

        ticketMessageRepository.delete(message);
        return true;
    }
}
