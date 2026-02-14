package com.agrolink.backend.controller;

import com.agrolink.backend.dto.LocationDTO;
import com.agrolink.backend.model.DriverLocation;
import com.agrolink.backend.repository.DriverLocationRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
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

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    @MessageMapping("/update-location")
    @Transactional
    public void updateLocation(@Payload LocationDTO locationDTO) {
        if (locationDTO.getDriverId() == null || locationDTO.getLat() == null || locationDTO.getLng() == null) {
            return;
        }

        // Create JTS Point
        Point point = geometryFactory.createPoint(new Coordinate(locationDTO.getLng(), locationDTO.getLat()));

        // Check if location exists for driver
        Optional<DriverLocation> existingLocation = driverLocationRepository.findByDriverId(locationDTO.getDriverId());

        DriverLocation location;
        if (existingLocation.isPresent()) {
            location = existingLocation.get();
            location.setCurrentPosition(point);
            location.setHeading(locationDTO.getHeading());
            location.setLastUpdated(LocalDateTime.now());
        } else {
            location = new DriverLocation(
                    locationDTO.getDriverId(),
                    point,
                    locationDTO.getHeading(),
                    LocalDateTime.now());
        }

        driverLocationRepository.save(location);

        // Broadcast to subscribers
        messagingTemplate.convertAndSend("/topic/driver/" + locationDTO.getDriverId(), locationDTO);
    }
}
