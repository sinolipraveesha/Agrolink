package com.agrolink.backend.controller;

import com.agrolink.backend.model.BuyerRequest;
import com.agrolink.backend.service.BuyerRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = "http://localhost:5173")
public class BuyerRequestController {

    @Autowired
    private BuyerRequestService requestService;

    @PostMapping
    public BuyerRequest createRequest(@RequestBody BuyerRequest request) {
        return requestService.createRequest(request);
    }

    @GetMapping
    public List<BuyerRequest> getAllRequests() {
        return requestService.getAllRequests();
    }

    @GetMapping("/buyer/{buyerId}")
    public List<BuyerRequest> getRequestsByBuyer(@PathVariable UUID buyerId) {
        return requestService.getRequestsByBuyer(buyerId);
    }

    @DeleteMapping("/{id}")
    public void deleteRequest(@PathVariable UUID id) {
        requestService.deleteRequest(id);
    }

    @PutMapping("/{id}")
    public BuyerRequest updateRequest(@PathVariable UUID id, @RequestBody BuyerRequest request) {
        return requestService.updateRequest(id, request);
    }
}
