package com.agrolink.backend.controller;

import com.agrolink.backend.model.Notification;
import com.agrolink.backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping("/{userId}")
    public List<Notification> getNotifications(@PathVariable UUID userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/{userId}/unread")
    public List<Notification> getUnreadNotifications(@PathVariable UUID userId) {
        return notificationRepository.findByRecipientIdAndIsReadFalse(userId);
    }

    @PutMapping("/{id}/read")
    public Notification markAsRead(@PathVariable UUID id) {
        return notificationRepository.findById(id).map(notification -> {
            notification.setIsRead(true);
            return notificationRepository.save(notification);
        }).orElse(null);
    }

    @Autowired
    private com.agrolink.backend.repository.ProfileRepository profileRepository;

    @GetMapping("/debug/check-email/{email}")
    public com.agrolink.backend.model.Profile checkEmail(@PathVariable String email) {
        return profileRepository.findAll().stream()
                .filter(p -> p.getEmail().equals(email))
                .findFirst()
                .orElse(null);
    }

    @GetMapping("/debug/admins")
    public List<com.agrolink.backend.model.Profile> checkAdmins() {
        return profileRepository.findByRole(com.agrolink.backend.model.UserRole.admin);
    }
}
