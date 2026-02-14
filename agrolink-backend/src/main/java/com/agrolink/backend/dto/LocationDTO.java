package com.agrolink.backend.dto;

import java.util.UUID;

public class LocationDTO {
    private Double lat;
    private Double lng;
    private UUID driverId;
    private Double heading;

    public LocationDTO() {
    }

    public LocationDTO(Double lat, Double lng, UUID driverId, Double heading) {
        this.lat = lat;
        this.lng = lng;
        this.driverId = driverId;
        this.heading = heading;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public UUID getDriverId() {
        return driverId;
    }

    public void setDriverId(UUID driverId) {
        this.driverId = driverId;
    }

    public Double getHeading() {
        return heading;
    }

    public void setHeading(Double heading) {
        this.heading = heading;
    }
}
