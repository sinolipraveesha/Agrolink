package com.agrolink.backend.model;

import jakarta.persistence.*;
import org.locationtech.jts.geom.Point;
import java.util.UUID;
import java.time.LocalDateTime;

@Entity
@Table(name = "driver_locations")
public class DriverLocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "driver_id", nullable = false)
    private UUID driverId;

    @Column(name = "current_position", columnDefinition = "geometry(Point,4326)")
    private Point currentPosition;

    @Column(name = "heading")
    private Double heading;

    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    public DriverLocation() {
    }

    public DriverLocation(UUID driverId, Point currentPosition, Double heading, LocalDateTime lastUpdated) {
        this.driverId = driverId;
        this.currentPosition = currentPosition;
        this.heading = heading;
        this.lastUpdated = lastUpdated;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UUID getDriverId() {
        return driverId;
    }

    public void setDriverId(UUID driverId) {
        this.driverId = driverId;
    }

    public Point getCurrentPosition() {
        return currentPosition;
    }

    public void setCurrentPosition(Point currentPosition) {
        this.currentPosition = currentPosition;
    }

    public Double getHeading() {
        return heading;
    }

    public void setHeading(Double heading) {
        this.heading = heading;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
