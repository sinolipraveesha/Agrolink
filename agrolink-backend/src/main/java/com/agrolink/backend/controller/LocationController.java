package com.agrolink.backend.controller;

import com.agrolink.backend.dto.LocationDTO;
import com.agrolink.backend.model.DriverLocation;
import com.agrolink.backend.repository.DriverLocationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Controller
public class LocationController {

    @Autowired
    private DriverLocationRepository driverLocationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/update-location")
    @Transactional
    public void updateLocation(@Payload LocationDTO locationDTO) {
        if (locationDTO.getDriverId() == null || locationDTO.getLat() == null || locationDTO.getLng() == null) {
            return;
        }

        // Check if location exists for driver
        Optional<DriverLocation> existingLocation = driverLocationRepository.findByDriverId(locationDTO.getDriverId());

        DriverLocation location;
        if (existingLocation.isPresent()) {
            location = existingLocation.get();
            location.setLatitude(locationDTO.getLat());
            location.setLongitude(locationDTO.getLng());
            location.setHeading(locationDTO.getHeading());
            location.setLastUpdated(LocalDateTime.now());
        } else {
            location = new DriverLocation(
                    locationDTO.getDriverId(),
                    locationDTO.getLat(),
                    locationDTO.getLng(),
                    locationDTO.getHeading(),
                    LocalDateTime.now());
        }

        driverLocationRepository.save(location);

        // Broadcast to subscribers
        messagingTemplate.convertAndSend("/topic/driver/" + locationDTO.getDriverId(), locationDTO);
    }
}
