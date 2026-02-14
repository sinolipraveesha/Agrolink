import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { subscribeToDriver, disconnectWebSocket, connectWebSocket } from '../services/websocketService';

// Car Icon
const carIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3097/3097136.png', // Placeholder car icon
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
});

// Component to handle map center updates smoothly
function RecenterAutomatically({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([lat, lng], map.getZoom());
        }
    }, [lat, lng, map]);
    return null;
}

const LiveTrackingMap = ({ driverId, initialLat, initialLng }) => {
    const [position, setPosition] = useState(initialLat && initialLng ? [initialLat, initialLng] : null);
    const [trail, setTrail] = useState([]);
    const subscriptionRef = useRef(null);

    useEffect(() => {
        // Connect WS if not already
        connectWebSocket(
            () => console.log("Map Connected to WS"),
            (err) => console.error("Map WS Error", err)
        );

        if (driverId) {
            console.log("Subscribing to driver:", driverId);
            const sub = subscribeToDriver(driverId, (data) => {
                console.log("New location received:", data);
                const newPos = [data.lat, data.lng];
                setPosition(newPos);
                setTrail(prev => [...prev, newPos]);
            });
            subscriptionRef.current = sub;
        }

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
            // Optional: disconnectWebSocket(); // Don't disconnect global connection if used elsewhere
        };
    }, [driverId]);

    // Initial position if provided
    useEffect(() => {
        if (initialLat && initialLng && !position) {
            const startPos = [initialLat, initialLng];
            setPosition(startPos);
            setTrail([startPos]);
        }
    }, [initialLat, initialLng]);

    if (!position) {
        return <div className="h-64 flex items-center justify-center bg-gray-100">Waiting for location...</div>;
    }

    return (
        <MapContainer center={position} zoom={15} style={{ height: '400px', width: '100%' }} className="rounded-lg shadow-md">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterAutomatically lat={position[0]} lng={position[1]} />

            <Marker position={position} icon={carIcon}>
                <Popup>Driver is here</Popup>
            </Marker>

            <Polyline positions={trail} color="#1a7935" weight={4} opacity={0.7} />
        </MapContainer>
    );
};

export default LiveTrackingMap;
