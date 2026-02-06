import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Truck, MapPin, Phone, Navigation, Clock, CheckCircle } from 'lucide-react';
import { useTrackDriver } from '../../hooks/useDriverTracking';
import { supabase } from '../../lib/supabaseClient';
import 'leaflet.smooth_marker_bouncing';

// Fix for default Leaflet icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    iconRetinaUrl: iconRetina,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom blue icon for driver
const driverIcon = L.divIcon({
    className: 'custom-driver-marker',
    html: `<div style="
        background: #3b82f6;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    ">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
        <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: rgba(59, 130, 246, 0.3);
            animation: pulse 2s ease-out infinite;
        "></div>
    </div>
    <style>
        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.7; }
            100% { transform: scale(2); opacity: 0; }
        }
    </style>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
});

// Smooth marker animation component
const AnimatedMarker = ({ position, icon, children }) => {
    const markerRef = React.useRef(null);
    const prevPositionRef = React.useRef(position);

    useEffect(() => {
        const marker = markerRef.current;
        if (marker && prevPositionRef.current) {
            // Smooth animation to new position
            marker.slideTo([position.lat, position.lng], {
                duration: 1000,
                keepAtCenter: false
            });
        }
        prevPositionRef.current = position;
    }, [position]);

    return (
        <Marker position={[position.lat, position.lng]} icon={icon} ref={markerRef}>
            {children}
        </Marker>
    );
};

// Map auto-center component
const MapFlyTo = ({ center, zoom = 13 }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo([center.lat, center.lng], zoom);
        }
    }, [center, zoom, map]);
    return null;
};

export default function LiveTracking() {
    const [searchParams] = useSearchParams();
    const jobId = searchParams.get('jobId');
    const driverId = searchParams.get('driverId');

    const [job, setJob] = useState(null);
    const [driver, setDriver] = useState(null);

    // Use live tracking hook
    const { driverLocation, lastUpdated, isOnline } = useTrackDriver(driverId);

    // Fetch Job and Driver Details
    useEffect(() => {
        if (!jobId) return;

        const fetchData = async () => {
            try {
                // Fetch order details from Backend (PostgreSQL)
                const res = await fetch(`http://localhost:8080/api/orders`);
                // Note: ideally we should have a GET /api/orders/{id} endpoint
                // But for now we can filter from all orders or simpler, rely on passed state? 
                // Let's assume we implement a specific fetch or just find it in the list.
                // Or better, let's ask the controller for a specific order.
                // Wait, OrderController doesn't have GET /api/orders/{id} specifically exposed in the snippet I saw earlier?
                // It has getAllOrders. Let's use that and filter for now (not efficient but works for small scale).

                const allRes = await fetch(`http://localhost:8080/api/orders?status=accepted`); // Try fetching accepted ones
                // Ideally this page is used for ANY status. 
                const allOrders1 = await allRes.json();
                const allOrders2 = await (await fetch(`http://localhost:8080/api/orders?status=ready_to_ship`)).json();
                const allOrders3 = await (await fetch(`http://localhost:8080/api/orders?status=shipped`)).json();

                const allOrders = [...allOrders1, ...allOrders2, ...allOrders3];
                const orderData = allOrders.find(o => o.id === jobId);

                if (orderData) {
                    const mappedJob = {
                        id: orderData.id,
                        status: orderData.status,
                        pickup_lat: orderData.pickupLatitude,
                        pickup_lng: orderData.pickupLongitude,
                        pickup_address: orderData.pickupAddress || 'Farm',
                        dropoff_lat: 0, // Need to geocode delivery address or store it. For now assume it's missing or use 0
                        dropoff_lng: 0,
                        dropoff_address: orderData.deliveryAddress,
                        driver_id: orderData.driver ? orderData.driver.id : null
                    };
                    setJob(mappedJob);

                    // Fetch driver profile from Supabase if we have a driver ID
                    if (mappedJob.driver_id) {
                        try {
                            // Try fetching with relation first
                            const { data: driverData, error } = await supabase
                                .from('driver_profiles')
                                .select('*, profiles(full_name, mobile_no)')
                                .eq('id', mappedJob.driver_id)
                                .single();

                            if (error) throw error;
                            setDriver(driverData);
                        } catch (err) {
                            console.warn("Could not fetch driver with profile relation, falling back to simple fetch.");
                            // Fallback if relation fails (e.g. FK issue)

                            // Mock profile info if relation failed
                            setDriver({
                                id: mappedJob.driver_id,
                                vehicle_type: 'Unknown',
                                vehicle_no: 'N/A',
                                profiles: { full_name: 'Driver', mobile_no: '' }
                            });
                        }
                    }
                }
            } catch (e) {
                console.error("Error fetching tracking data", e);
            }
        };

        fetchData();
    }, [jobId]);

    // Ensure we have valid numbers for map center
    const isValidCoord = (c) => c && typeof c === 'number' && !isNaN(c);

    // Safely calculate map center
    const safePickup = (job && isValidCoord(job.pickup_lat) && isValidCoord(job.pickup_lng))
        ? { lat: job.pickup_lat, lng: job.pickup_lng }
        : { lat: 6.9271, lng: 79.8612 }; // Default to Colombo

    const mapCenter = (driverLocation && isValidCoord(driverLocation.lat) && isValidCoord(driverLocation.lng))
        ? driverLocation
        : safePickup;

    if (!job || !driver) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#1a7935] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading tracking information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b p-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Navigation className="h-6 w-6 text-[#1a7935]" />
                                Live Tracking
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Track your delivery in real-time</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                <span className="text-xs font-medium">{isOnline ? 'Driver Online' : 'Last seen'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-7xl mx-auto w-full">
                {/* Info Panel */}
                <div className="lg:w-1/3 space-y-4">
                    {/* Driver Info Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#1a7935] to-[#145d29] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                {driver.profiles?.full_name?.charAt(0) || 'D'}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-800">{driver.profiles?.full_name || 'Driver'}</h3>
                                <p className="text-sm text-gray-500">{driver.vehicle_type} • {driver.vehicle_number}</p>
                            </div>
                        </div>

                        {driver.profiles?.mobile_no && (
                            <a
                                href={`tel:${driver.profiles.mobile_no}`}
                                className="w-full py-3 bg-[#1a7935] text-white rounded-lg font-medium hover:bg-[#145d29] transition-colors flex items-center justify-center gap-2"
                            >
                                <Phone className="h-4 w-4" />
                                Call Driver
                            </a>
                        )}
                    </div>

                    {/* Trip Status */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-[#1a7935]" />
                            Delivery Status
                        </h3>

                        <div className="space-y-4">
                            {['accepted', 'arrived', 'picked_up', 'delivered'].map((status, index) => (
                                <div key={status} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${['accepted', 'arrived', 'picked_up', 'delivered'].indexOf(job.status) >= index
                                        ? 'bg-green-100 border-[#1a7935] text-[#1a7935]'
                                        : 'bg-gray-50 border-gray-300 text-gray-400'
                                        }`}>
                                        {['accepted', 'arrived', 'picked_up', 'delivered'].indexOf(job.status) > index ? (
                                            <CheckCircle className="h-4 w-4" />
                                        ) : (
                                            <span className="text-xs font-bold">{index + 1}</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-medium ${['accepted', 'arrived', 'picked_up', 'delivered'].indexOf(job.status) >= index
                                            ? 'text-gray-800'
                                            : 'text-gray-400'
                                            }`}>
                                            {status === 'accepted' && 'Driver Accepted'}
                                            {status === 'arrived' && 'Arrived at Pickup'}
                                            {status === 'picked_up' && 'Goods Picked Up'}
                                            {status === 'delivered' && 'Delivered'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Route Info */}
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Route Details</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-3 h-3 rounded-full bg-green-500"></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Pickup</p>
                                    <p className="text-sm text-gray-800">{job.pickup_address}</p>
                                </div>
                            </div>
                            <div className="pl-6 border-l-2 border-dashed border-gray-200 h-6"></div>
                            <div className="flex items-start gap-3">
                                <div className="mt-1 w-3 h-3 rounded-full bg-red-500"></div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium">Dropoff</p>
                                    <p className="text-sm text-gray-800">{job.dropoff_address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden relative">
                    {mapCenter && (
                        <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={13} className="h-full w-full">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <MapFlyTo center={mapCenter} />

                            {/* Driver Location (Live) */}
                            {driverLocation && (
                                <AnimatedMarker position={driverLocation} icon={driverIcon}>
                                    <Popup>
                                        <div className="text-center">
                                            <p className="font-bold text-blue-600">🚚 {driver.profiles?.full_name}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {isOnline ? 'Live Location' : 'Last Known Location'}
                                            </p>
                                            {lastUpdated && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Updated: {new Date(lastUpdated).toLocaleTimeString()}
                                                </p>
                                            )}
                                        </div>
                                    </Popup>
                                </AnimatedMarker>
                            )}

                            {/* Pickup Marker */}
                            <Marker position={[job.pickup_lat, job.pickup_lng]}>
                                <Popup>
                                    <div>
                                        <p className="font-bold text-green-600">📦 Pickup Location</p>
                                        <p className="text-xs mt-1">{job.pickup_address}</p>
                                    </div>
                                </Popup>
                            </Marker>

                            {/* Dropoff Marker */}
                            <Marker position={[job.dropoff_lat, job.dropoff_lng]}>
                                <Popup>
                                    <div>
                                        <p className="font-bold text-red-600">🎯 Dropoff Location</p>
                                        <p className="text-xs mt-1">{job.dropoff_address}</p>
                                    </div>
                                </Popup>
                            </Marker>

                            {/* Route Line */}
                            {driverLocation && (
                                <Polyline
                                    positions={[
                                        [driverLocation.lat, driverLocation.lng],
                                        job.status === 'picked_up' || job.status === 'delivered'
                                            ? [job.dropoff_lat, job.dropoff_lng]
                                            : [job.pickup_lat, job.pickup_lng]
                                    ]}
                                    color="#1a7935"
                                    weight={4}
                                    opacity={0.6}
                                    dashArray="10, 10"
                                />
                            )}
                        </MapContainer>
                    )}

                    {/* Live indicator overlay */}
                    {isOnline && (
                        <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded-lg shadow-lg border border-green-200 flex items-center gap-2 z-[1000]">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-700">Live Tracking Active</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
