package com.agrolink.backend.service;

import com.agrolink.backend.model.DriverLocation;
import com.agrolink.backend.model.Profile;
import com.agrolink.backend.repository.DriverLocationRepository;
import com.agrolink.backend.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import java.time.LocalDateTime;

@Service
public class DriverService {

    @Autowired
    private DriverLocationRepository driverLocationRepository;

    @Autowired
    private ProfileRepository profileRepository;

    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public DriverLocation updateLocation(UUID driverId, double lat, double lon) {
        // Validation: Verify driver exists
        if (!profileRepository.existsById(driverId)) {
            throw new RuntimeException("Driver not found");
        }

        DriverLocation location = driverLocationRepository.findByDriverId(driverId)
                .orElse(new DriverLocation());

        if (location.getDriverId() == null) {
            location.setDriverId(driverId);
        }

        Point point = geometryFactory.createPoint(new Coordinate(lon, lat));
        location.setCurrentPosition(point);
        location.setLastUpdated(LocalDateTime.now());

        // Default heading if not provided
        if (location.getHeading() == null) {
            location.setHeading(0.0);
        }

        return driverLocationRepository.save(location);
    }

    public DriverLocation getDriverLocation(UUID driverId) {
        return driverLocationRepository.findByDriverId(driverId)
                .orElse(null);
    }

    public double calculateDistanceToWarehouse(UUID driverId, double warehouseLat, double warehouseLon) {
        Point warehousePoint = geometryFactory.createPoint(new Coordinate(warehouseLon, warehouseLat));
        Double distance = driverLocationRepository.calculateDistance(driverId, warehousePoint);
        return distance != null ? distance : -1.0;
    }

    // Geofencing check
    public boolean checkArrivalAndNotify(UUID driverId, double targetLat, double targetLon) {
        Point targetPoint = geometryFactory.createPoint(new Coordinate(targetLon, targetLat));
        boolean arrived = driverLocationRepository.isDriverWithinRadius(driverId, targetPoint, 500.0); // 500 meters

        if (arrived) {
            System.out.println("Driver " + driverId + " has arrived at the destination!");
            // Here you would trigger notification or update status
            // notificationService.sendNotification(driverId, "You have arrived!");
        }

        return arrived;
    }
}
