package com.agrolink.backend.service;

import com.agrolink.backend.model.Notification;
import com.agrolink.backend.model.Profile;
import com.agrolink.backend.repository.NotificationRepository;
import com.agrolink.backend.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ProfileRepository profileRepository;

    public Notification createNotification(UUID recipientId, String title, String message, String type,
            UUID relatedId) {
        Profile recipient = profileRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setRelatedId(relatedId);
        notification.setIsRead(false);
        notification.setCreatedAt(LocalDateTime.now());

        return notificationRepository.save(notification);
    }
}
