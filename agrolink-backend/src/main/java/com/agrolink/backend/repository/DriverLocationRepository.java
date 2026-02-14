package com.agrolink.backend.repository;

import com.agrolink.backend.model.DriverLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

import org.locationtech.jts.geom.Point;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface DriverLocationRepository extends JpaRepository<DriverLocation, Long> {
    Optional<DriverLocation> findByDriverId(UUID driverId);

    @Query(value = "SELECT ST_DistanceSphere(current_position, :warehouseLocation) " +
            "FROM driver_locations " +
            "WHERE driver_id = :driverId", nativeQuery = true)
    Double calculateDistance(@Param("driverId") UUID driverId, @Param("warehouseLocation") Point warehouseLocation);

    @Query(value = "SELECT ST_DWithin(current_position::geography, :targetLocation::geography, :radius) " +
            "FROM driver_locations " +
            "WHERE driver_id = :driverId", nativeQuery = true)
    boolean isDriverWithinRadius(@Param("driverId") UUID driverId,
            @Param("targetLocation") Point targetLocation,
            @Param("radius") double radius);
}
