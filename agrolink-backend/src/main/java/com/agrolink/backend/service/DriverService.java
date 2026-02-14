package com.agrolink.backend.service;

import com.agrolink.backend.model.DriverLocation;
import com.agrolink.backend.repository.DriverLocationRepository;
import com.agrolink.backend.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class DriverService {

    @Autowired
    private DriverLocationRepository driverLocationRepository;

    @Autowired
    private ProfileRepository profileRepository;

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

        location.setLatitude(lat);
        location.setLongitude(lon);
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
        Double distance = driverLocationRepository.calculateDistance(driverId, warehouseLat, warehouseLon);
        return distance != null ? distance : -1.0;
    }

    // Geofencing check
    public boolean checkArrivalAndNotify(UUID driverId, double targetLat, double targetLon) {
        Boolean arrived = driverLocationRepository.isDriverWithinRadius(driverId, targetLat, targetLon, 500.0); // 500
                                                                                                                // meters

        if (Boolean.TRUE.equals(arrived)) {
            System.out.println("Driver " + driverId + " has arrived at the destination!");
            // Here you would trigger notification or update status
        }

        return Boolean.TRUE.equals(arrived);
    }
}
