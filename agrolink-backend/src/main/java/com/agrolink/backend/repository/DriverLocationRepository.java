package com.agrolink.backend.repository;

import com.agrolink.backend.model.DriverLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DriverLocationRepository extends JpaRepository<DriverLocation, Long> {
        Optional<DriverLocation> findByDriverId(UUID driverId);

        @Query(value = "SELECT (6371 * acos(cos(radians(:targetLat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:targetLng)) + sin(radians(:targetLat)) * sin(radians(latitude)))) * 1000 "
                        +
                        "FROM driver_locations " +
                        "WHERE driver_id = :driverId", nativeQuery = true)
        Double calculateDistance(@Param("driverId") UUID driverId, @Param("targetLat") double targetLat,
                        @Param("targetLng") double targetLng);

        @Query(value = "SELECT CASE WHEN (6371 * acos(cos(radians(:targetLat)) * cos(radians(latitude)) * cos(radians(longitude) - radians(:targetLng)) + sin(radians(:targetLat)) * sin(radians(latitude)))) * 1000 <= :radius THEN true ELSE false END "
                        +
                        "FROM driver_locations " +
                        "WHERE driver_id = :driverId", nativeQuery = true)
        Boolean isDriverWithinRadius(@Param("driverId") UUID driverId,
                        @Param("targetLat") double targetLat,
                        @Param("targetLng") double targetLng,
                        @Param("radius") double radius);
}
