package com.agrolink.backend.service;

import com.agrolink.backend.model.*;
import com.agrolink.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class BuyerRequestService {

    @Autowired
    private BuyerRequestRepository requestRepository;

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public BuyerRequest createRequest(BuyerRequest request) {
        request.setStatus("OPEN");
        BuyerRequest savedRequest = requestRepository.save(request);

        // Notify Top Seller Farmers (Rating >= 4.5)
        // Notify Top Seller Farmers (Rating >= 4.5) -> Temporarily changed to 0.0 for
        // testing
        // Notify Top Seller Farmers (Rating >= 4.5) -> Temporarily changed to 0.0 for
        // testing
        // Fetch all farmers and filter in memory to handle NULL ratings safely
        List<Profile> allFarmers = profileRepository.findByStatus(UserStatus.approved).stream()
                .filter(p -> p.getRole() == UserRole.farmer)
                .toList();

        List<Profile> topSellers = allFarmers.stream()
                .filter(p -> {
                    Double rating = p.getRating() != null ? p.getRating() : 0.0;
                    return rating >= 0.0; // Threshold
                })
                .toList();

        System.out.println("DEBUG: Found " + topSellers.size() + " farmers to notify out of " + allFarmers.size());

        for (Profile farmer : topSellers) {
            Notification notification = new Notification();
            notification.setRecipient(farmer);
            notification.setTitle("New Buyer Request!");
            notification
                    .setMessage("A new request for " + request.getCategory() + " matches your profile. Check it out!");
            notification.setType("REQUEST_ALERT");
            notification.setRelatedId(savedRequest.getId());
            notificationRepository.save(notification);
        }

        return savedRequest;
    }

    public List<BuyerRequest> getAllRequests() {
        return requestRepository.findAll();
    }

    public List<BuyerRequest> getRequestsByBuyer(UUID buyerId) {
        return requestRepository.findByBuyerId(buyerId);
    }

    public void deleteRequest(UUID id) {
        requestRepository.deleteById(id);
    }

    public BuyerRequest updateRequest(UUID id, BuyerRequest updatedRequest) {
        return requestRepository.findById(id).map(request -> {
            request.setCategory(updatedRequest.getCategory());
            request.setDescription(updatedRequest.getDescription());
            request.setBudget(updatedRequest.getBudget());
            request.setQuantity(updatedRequest.getQuantity());
            request.setUnit(updatedRequest.getUnit());
            return requestRepository.save(request);
        }).orElseThrow(() -> new RuntimeException("Request not found"));
    }
}
