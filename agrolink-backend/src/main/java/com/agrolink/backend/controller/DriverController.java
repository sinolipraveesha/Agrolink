package com.agrolink.backend.controller;

import com.agrolink.backend.model.DriverLocation;
import com.agrolink.backend.service.DriverService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/driver")
public class DriverController {

    @Autowired
    private DriverService driverService;

    @PostMapping("/{driverId}/location")
    public ResponseEntity<DriverLocation> updateLocation(@PathVariable UUID driverId,
            @RequestParam double lat,
            @RequestParam double lon) {
        DriverLocation location = driverService.updateLocation(driverId, lat, lon);
        return ResponseEntity.ok(location);
    }

    @GetMapping("/{driverId}/location")
    public ResponseEntity<DriverLocation> getLocation(@PathVariable UUID driverId) {
        DriverLocation location = driverService.getDriverLocation(driverId);
        if (location != null) {
            return ResponseEntity.ok(location);
        }
        return ResponseEntity.notFound().build();
    }
}
