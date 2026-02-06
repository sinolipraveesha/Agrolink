package com.agrolink.backend.service;

import com.agrolink.backend.model.DriverLocation;
import com.agrolink.backend.model.Profile;
import com.agrolink.backend.repository.DriverLocationRepository;
import com.agrolink.backend.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class DriverService {

    @Autowired
    private DriverLocationRepository driverLocationRepository;

    @Autowired
    private ProfileRepository profileRepository;

    public DriverLocation updateLocation(UUID driverId, double lat, double lon) {
        DriverLocation location = driverLocationRepository.findByDriverId(driverId)
                .orElse(new DriverLocation());

        if (location.getDriver() == null) {
            Profile driver = profileRepository.findById(driverId)
                    .orElseThrow(() -> new RuntimeException("Driver not found"));
            location.setDriver(driver);
        }

        location.setLatitude(lat);
        location.setLongitude(lon);
        return driverLocationRepository.save(location);
    }

    public DriverLocation getDriverLocation(UUID driverId) {
        return driverLocationRepository.findByDriverId(driverId)
                .orElse(null);
    }
}
