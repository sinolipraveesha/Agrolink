import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Phone, Navigation, Camera, ArrowRight, User, Package, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useSyncDriverLocation, useTrackDriver } from '../../hooks/useDriverTracking';
import { useTrackFarmer } from '../../hooks/useFarmerTracking';

// Fix for default Leaflet icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Driver Icon
const driverIcon = L.divIcon({
    className: 'custom-driver-marker',
    html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const Routing = ({ from, to }) => {
    const map = useMap();
    const routingControlRef = useRef(null);

    useEffect(() => {
        if (!map || !from || !to) return;
        if (!from.lat || !from.lng || !to.lat || !to.lng) return;

        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(from.lat, from.lng),
                L.latLng(to.lat, to.lng)
            ],
            routeWhileDragging: false,
            show: false,
            lineOptions: {
                styles: [{ color: '#1a7935', opacity: 0.8, weight: 6 }]
            },
            createMarker: function () { return null; },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            showAlternatives: false,
        }).addTo(map);

        routingControlRef.current = routingControl;

        return () => {
            // Cleanup previous control
            if (routingControlRef.current) {
                try {
                    if (map && routingControlRef.current.getPlan()) {
                        map.removeControl(routingControlRef.current);
                    }
                } catch (e) {
                    // Ignore cleanup errors - control might already be detached
                    console.debug("Routing cleanup ignored");
                }
                routingControlRef.current = null;
            }
        };
    }, [map, from, to]);

    return null;
};

export default function ActiveTrip() {
    const [searchParams] = useSearchParams();
    const tripId = searchParams.get('id');
    const [trip, setTrip] = useState(null);
    const [farmer, setFarmer] = useState(null);

    const [tripStatus, setTripStatus] = useState('accepted');
    const [driverLocation, setDriverLocation] = useState(null);
    const [showProofModal, setShowProofModal] = useState(false);
    const [distanceToTarget, setDistanceToTarget] = useState(null);

    // Geolocation
    const { location: gpsLocation } = useGeolocation(true);

    // Fetch Trip Data (from Orders table)
    useEffect(() => {
        if (!tripId) return;

        const fetchTrip = async () => {
            try {
                const { data: job, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', tripId)
                    .single();

                if (job) {
                    const normalizeCoord = (val, defaultVal) => (val && !isNaN(val)) ? val : defaultVal;

                    const mappedTrip = {
                        ...job,
                        pickup_lat: normalizeCoord(job.pickup_latitude, 6.9271),
                        pickup_lng: normalizeCoord(job.pickup_longitude, 79.8612),
                        pickup_address: job.pickup_address,
                        dropoff_address: job.delivery_address,
                        raw_dropoff_lat: job.delivery_latitude,
                        raw_dropoff_lng: job.delivery_longitude,
                        dropoff_lat: normalizeCoord(job.delivery_latitude, 6.9271),
                        dropoff_lng: normalizeCoord(job.delivery_longitude, 79.8612)
                    };

                    setTrip(mappedTrip);
                    setTripStatus(job.status || 'accepted');

                    if (job.farmer_id) {
                        try {
                            const { data: farmerProfile } = await supabase
                                .from('profiles')
                                .select('*')
                                .eq('id', job.farmer_id)
                                .single();

                            if (error) {
                                console.error("❌ Error fetching farmer profile:", error);
                            } else {
                                console.log("✅ Farmer Profile Fetched:", farmerProfile);
                                setFarmer(farmerProfile);
                            }
                        } catch (err) { console.warn("Farmer profile fetch error", err); }
                    }
                } else {
                    console.error("Order not found or access denied", error);
                }
            } catch (err) {
                console.error("Unexpected error fetching trip", err);
            }
        };

        fetchTrip();
    }, [tripId]);

    // Determines phase
    const isPickupPhase = ['accepted', 'ready_to_ship', 'arrived'].includes(tripStatus);
    // Target location - Logic updated to fallback to Farmer Profile if Order Location is missing/default
    const DEFAULT_LAT = 6.9271;
    const DEFAULT_LNG = 79.8612;

    const isDefaultLocation = (lat, lng) => (Math.abs(lat - DEFAULT_LAT) < 0.0001 && Math.abs(lng - DEFAULT_LNG) < 0.0001);

    // Track Farmer Live Location - Use trip.farmer_id directly to avoid waiting for profile fetch
    const { farmerLocation: liveFarmerLoc } = useTrackFarmer(trip?.farmer_id);

    // DEBUG LOGGING
    useEffect(() => {
        if (isPickupPhase) {
            console.log("📍 [ActiveTrip] Debug Location:");
            console.log("   Trip Pickup:", trip?.pickup_lat, trip?.pickup_lng);
            console.log("   Is Default Trip Loc?", trip ? isDefaultLocation(trip.pickup_lat, trip.pickup_lng) : "N/A");
            console.log("   Farmer Profile:", farmer?.latitude, farmer?.longitude);
            console.log("   Live Farmer Loc:", liveFarmerLoc);
        }
    }, [trip, farmer, liveFarmerLoc, isPickupPhase]);

    const getPickupLocation = () => {
        // Priority 1: Live Farmer Location (if available & valid)
        if (liveFarmerLoc && liveFarmerLoc.lat && liveFarmerLoc.lng) {
            console.log("✅ Using Live Farmer Location");
            return { lat: liveFarmerLoc.lat, lng: liveFarmerLoc.lng };
        }

        if (!trip) return { lat: 0, lng: 0 };

        // Priority 2: Trip Specific Location (if not default)
        if (!isDefaultLocation(trip.pickup_lat, trip.pickup_lng)) {
            console.log("Using Trip Specific Location");
            return { lat: trip.pickup_lat, lng: trip.pickup_lng };
        }

        // Priority 3: Farmer Profile Static Location
        if (farmer && farmer.latitude && farmer.longitude) {
            console.log("Using Farmer Profile Static Location");
            return { lat: farmer.latitude, lng: farmer.longitude };
        }

        // Fallback: Default / Trip Location
        console.log("⚠️ Using Default/Fallback Location");
        return { lat: trip.pickup_lat, lng: trip.pickup_lng };
    };

    const pickupLoc = getPickupLocation();

    const targetLocation = trip ? (isPickupPhase
        ? { lat: pickupLoc.lat, lng: pickupLoc.lng, address: trip.pickup_address, name: farmer?.full_name || "Farmer" }
        : { lat: trip.dropoff_lat, lng: trip.dropoff_lng, address: trip.dropoff_address, name: "Buyer" })
        : { lat: 0, lng: 0 };

    // Update Driver Location Local State & Auto-Arrival Logic
    useEffect(() => {
        if (gpsLocation) {
            setDriverLocation(gpsLocation);

            // Auto-Detect Arrival (Geofencing)
            if (trip && targetLocation && targetLocation.lat) {
                const dist = L.latLng(gpsLocation.lat, gpsLocation.lng).distanceTo(
                    L.latLng(targetLocation.lat, targetLocation.lng)
                );

                setDistanceToTarget(Math.round(dist)); // Store distance in meters

                // If within 150 meters
                if (dist < 150) {
                    if (isPickupPhase && (tripStatus === 'accepted' || tripStatus === 'ready_to_ship')) {
                        updateStatus('arrived', null);
                        if (navigator.vibrate) navigator.vibrate(200);
                    }
                }
            }
        }
    }, [gpsLocation, trip, tripStatus]);

    // Sync Location to DB
    useSyncDriverLocation(gpsLocation, 5000);

    const handleCall = (number) => {
        if (number) window.location.href = `tel:${number}`;
        else alert("Phone number not available");
    };

    const handleNavigate = (lat, lng) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };

    const updateStatus = async (newStatus, backendStatus) => {
        setTripStatus(newStatus);

        try {
            if (backendStatus) {
                await fetch(`http://localhost:8080/api/orders/${tripId}/status?status=${backendStatus}`, {
                    method: 'PUT'
                });
            }
            console.log(`Updated status to ${newStatus} (Backend: ${backendStatus})`);
        } catch (e) {
            console.error("Failed to update status", e);
        }
    };

    const handleSwipeAction = () => {
        // Prevent manual update for 'accepted' -> 'arrived' transition
        if (tripStatus === 'accepted' || tripStatus === 'ready_to_ship') return;

        if (tripStatus === 'arrived') {
            updateStatus('picked_up', 'shipped');
        } else if (tripStatus === 'picked_up' || tripStatus === 'shipped') {
            setShowProofModal(true);
        }
    };

    const confirmDelivery = async () => {
        await updateStatus('delivered', 'delivered');
        alert("Delivery Completed! Good job.");
        window.location.href = '/driver/dashboard';
    };

    if (!trip) return <div className="flex h-screen items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-green-600 rounded-full border-t-transparent"></div></div>;

    const actionLabel =
        tripStatus === 'accepted' || tripStatus === 'ready_to_ship' ? "Arrived at Pickup" :
            tripStatus === 'arrived' ? "Start & Navigate to Dropoff" :
                tripStatus === 'picked_up' || tripStatus === 'shipped' ? "Complete Delivery" : "Completed";

    return (
        <div className="h-screen flex flex-col relative bg-gray-100">
            {/* Map Background */}
            <div className="flex-1 z-0 relative">
                <MapContainer
                    center={[driverLocation?.lat || targetLocation.lat, driverLocation?.lng || targetLocation.lng]}
                    zoom={15}
                    className="h-full w-full"
                    zoomControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; OpenStreetMap contributors'
                    />

                    {driverLocation && <Marker position={driverLocation} icon={driverIcon} />}

                    <Marker position={[targetLocation.lat, targetLocation.lng]}>
                        <Popup>
                            <div className="font-bold">{isPickupPhase ? "Pickup" : "Dropoff"}</div>
                            <div className="text-xs">{targetLocation.address}</div>
                        </Popup>
                    </Marker>

                    {driverLocation && <Routing from={driverLocation} to={targetLocation} />}
                </MapContainer>

                {/* Top Overlay: Next Step Instruction */}
                <div className="absolute top-4 left-4 right-4 z-[400] space-y-2">
                    {/* DEBUG PANEL - REMOVE LATER */}
                    <div className="bg-black/80 text-white p-2 rounded text-xs font-mono break-all">
                        <p>Trip ID: {tripId}</p>
                        <p>Mode: {isPickupPhase ? "PICKUP" : "DROPOFF"}</p>
                        <p>--- PICKUP INFO ---</p>
                        <p>Trip Pickup: {trip?.pickup_lat?.toFixed(4)}, {trip?.pickup_lng?.toFixed(4)}</p>
                        <p>Farmer Live: {liveFarmerLoc ? `${liveFarmerLoc.lat.toFixed(4)}, ${liveFarmerLoc.lng.toFixed(4)}` : "Waiting..."}</p>
                        <p>--- DROPOFF INFO ---</p>
                        <p>Raw DB Lat: {trip?.raw_dropoff_lat ?? "NULL"}</p>
                        <p>Raw DB Lng: {trip?.raw_dropoff_lng ?? "NULL"}</p>
                        <p>Used Lat/Lng: {trip?.dropoff_lat?.toFixed(4)}, {trip?.dropoff_lng?.toFixed(4)}</p>
                    </div>

                    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg flex items-center gap-4">
                        <Navigation className="h-8 w-8 text-green-400" />
                        <div className="flex-1">
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                {isPickupPhase ? "Navigate to Pickup" : "Navigate to Dropoff"}
                            </p>
                            <p className="font-bold text-lg leading-tight truncate">{targetLocation.address || 'Address Hidden'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Sheet - Uber Style */}
            <div className="bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-[500] p-6 pb-8 transition-all duration-300">
                {/* Drag Handle */}
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>

                {/* Customer/Target Info */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            {isPickupPhase ? <User className="h-6 w-6 text-gray-600" /> : <Package className="h-6 w-6 text-gray-600" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-gray-900">{targetLocation.name}</h3>
                            <p className="text-sm text-gray-500">{isPickupPhase ? "Farmer" : "Customer"}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleCall(isPickupPhase ? farmer?.mobile_no : null)}
                            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200"
                        >
                            <Phone className="h-6 w-6" />
                        </button>
                        <button
                            onClick={() => handleNavigate(targetLocation.lat, targetLocation.lng)}
                            className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200"
                        >
                            <Navigation className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Main Action Button or Status Indicator */}
                {tripStatus === 'accepted' || tripStatus === 'ready_to_ship' ? (
                    <div className="w-full py-4 rounded-xl font-bold text-gray-500 bg-gray-100 text-lg flex flex-col items-center justify-center gap-1 border border-gray-200">
                        <span className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 animate-pulse text-blue-500" />
                            Heading to Pickup
                        </span>
                        <span className="text-xs font-normal text-gray-400">
                            {distanceToTarget ? `${(distanceToTarget / 1000).toFixed(2)} km away` : "Calculating distance..."}
                        </span>
                    </div>
                ) : (
                    <button
                        onClick={handleSwipeAction}
                        className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all
                            ${tripStatus === 'shipped' || tripStatus === 'picked_up' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1a7935] hover:bg-[#145d29]'}
                        `}
                    >
                        <span className="flex-1 text-center pl-8">{actionLabel}</span>
                        <div className="bg-white/20 p-2 rounded-full mr-2">
                            <ArrowRight className="h-6 w-6" />
                        </div>
                    </button>
                )}
            </div>

            {/* Proof of Delivery Modal */}
            {showProofModal && (
                <div className="fixed inset-0 bg-black/80 z-[1000] flex items-end sm:items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b">
                            <h3 className="text-xl font-bold">Proof of Delivery</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                                <Camera className="h-10 w-10 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500 font-medium">Take Photo</span>
                            </div>
                            <button
                                onClick={confirmDelivery}
                                className="w-full py-4 bg-[#1a7935] text-white font-bold rounded-xl text-lg shadow-lg hover:bg-[#145d29]"
                            >
                                Confirm Delivery
                            </button>
                            <button
                                onClick={() => setShowProofModal(false)}
                                className="w-full py-4 text-gray-500 font-bold rounded-xl hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
