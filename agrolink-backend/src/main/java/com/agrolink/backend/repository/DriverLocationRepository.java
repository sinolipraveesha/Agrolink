package com.agrolink.backend.repository;

import com.agrolink.backend.model.DriverLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverLocationRepository extends JpaRepository<DriverLocation, UUID> {
    Optional<DriverLocation> findByDriverId(UUID driverId);
}
