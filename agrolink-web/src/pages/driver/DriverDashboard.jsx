import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Truck, MapPin, Package, Clock, AlertTriangle, Navigation } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useSyncDriverLocation } from '../../hooks/useDriverTracking';

// Fix for default Leaflet icon not showing
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map flying
const MapFlyTo = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo([center.lat, center.lng], 13);
        }
    }, [center, map]);
    return null;
};

// Draggable Marker for Driver
const DraggableMarker = ({ position, setPosition }) => {
    const [draggable, setDraggable] = useState(true);
    const markerRef = React.useRef(null);

    const eventHandlers = React.useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    setPosition({ lat: newPos.lat, lng: newPos.lng });
                }
            },
        }),
        [setPosition],
    );

    if (!position) return null;

    return (
        <Marker
            draggable={draggable}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        >
            <Popup>
                <b>You (Driver)</b> <br />
                <span>Drag marker to adjust location</span>
            </Popup>
        </Marker>
    );
};

import { supabase } from '../../lib/supabaseClient';

export default function DriverDashboard() {
    const [loads, setLoads] = useState([]);
    const [selectedLoad, setSelectedLoad] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [locationSource, setLocationSource] = useState('waiting'); // waiting, gps, db, default

    // Use our new robust hook
    const { location: gpsLocation, error: gpsError, loading: gpsLoading, source: gpsSource, refetchLocation } = useGeolocation(true);

    // Fetch Loads & Driver Profile from Supabase + Backend
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            let currentLoc = driverLocation;

            // 1. Fetch Driver's Last Known Location (Supabase) if not yet set
            if (!currentLoc && user) {
                const { data: profile } = await supabase
                    .from('driver_profiles')
                    .select('current_lat, current_lng')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile && profile.current_lat && profile.current_lng) {
                    currentLoc = { lat: profile.current_lat, lng: profile.current_lng };
                    setDriverLocation(currentLoc);
                    setLocationSource('db');
                }
            }

            // 2. Fetch Active Loads (Accepted by Farmer)
            if (currentLoc) {
                try {
                    // For now, fetch ALL accepted orders to ensure they show up. 
                    // Later we can filter by 'nearby' if needed, but for MVP/Testing, showing all is safer.
                    // Fetch Nearby Loads filters by status=accepted AND maxLoadWeight
                    const res = await fetch(`http://localhost:8080/api/orders/nearby?lat=${currentLoc.lat}&lon=${currentLoc.lng}&driverId=${user.id}`);

                    if (res.ok) {
                        const orders = await res.json();
                        console.log("Fetched nearby orders:", orders);

                        // Map Order entity to dashboard format
                        const mappedLoads = orders.map(o => ({
                            id: o.id,
                            description: o.items ? o.items.map(i => i.product ? i.product.name : i.customItemName).join(', ') : 'Delivery',
                            price: o.totalAmount,
                            weight: o.totalWeight || 0, // NEW: Weight
                            // If pickup address isn't set, use lat/long or generic
                            pickup_address: o.pickupAddress || (o.pickupLatitude ? `${o.pickupLatitude}, ${o.pickupLongitude}` : 'Farm Location'),
                            dropoff_address: o.deliveryAddress,
                            distance_km: 'Calc...', // We could calc this client side
                            pickup_lat: o.pickupLatitude || (currentLoc ? currentLoc.lat : 0), // Fallback to avoid crash
                            pickup_lng: o.pickupLongitude || (currentLoc ? currentLoc.lng : 0)
                        }));
                        setLoads(mappedLoads);
                    }
                } catch (e) {
                    console.error("Backend fetch failed", e);
                }
            } else {
                console.log("Waiting for location to fetch jobs...");
            }
        };

        fetchInitialData();

        // Realtime Subscription (Optional: Keep listening to transport_jobs if legacy, or polling backend)
        const interval = setInterval(fetchInitialData, 10000); // Poll backend every 10s

        return () => {
            clearInterval(interval);
        };
    }, [driverLocation]); // Re-fetch when location updates

    // Sync GPS location to state (Priority over DB location if available)
    useEffect(() => {
        if (gpsLocation) {
            setDriverLocation(gpsLocation);
            // Use the source from the hook (gps, network_fallback, or ip)
            setLocationSource(gpsSource || 'gps');
        } else if (gpsError && !driverLocation) {
            // If GPS fails and we still don't have a location (even from DB), default to Dambulla
            console.warn("GPS failed, falling back to default center.");
            setDriverLocation({ lat: 7.8731, lng: 80.7718 }); // Dambulla
            setLocationSource('default');
        }
    }, [gpsLocation, gpsError, driverLocation, gpsSource]);

    const [searchQuery, setSearchQuery] = useState('');

    // Handle manual search
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setDriverLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
                setLocationSource('manual');
            } else {
                alert("Location not found");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAcceptLoad = async (loadId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please login first");
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/api/orders/${loadId}/driver-accept?driverId=${user.id}`, {
                method: 'PUT'
            });

            if (res.ok) {
                alert("Job Accepted! Route calculated.");
                window.location.href = `/driver/active-trip?id=${loadId}`;
            } else {
                alert("Failed to accept load. It might be taken or you are not a registered driver.");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to server");
        }
    };

    // Auto-sync driver location to database for live tracking (every 10 seconds)
    useSyncDriverLocation(driverLocation, 10000);

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
            {/* Left Sidebar */}
            <div className="md:w-1/3 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 bg-[#0f2815] text-white">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Truck className="h-5 w-5" /> Available Loads
                    </h2>
                    <p className="text-xs text-green-200">Select a load to see on map</p>
                </div>

                {/* Location Status & Override */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
                    <div className="flex items-start gap-2 mb-2">
                        <MapPin className={`h-4 w-4 mt-0.5 ${locationSource === 'gps' ? 'text-green-600' : locationSource === 'ip' ? 'text-orange-500' : 'text-gray-500'}`} />
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-800">
                                {locationSource === 'gps' && '✅ GPS Location'}
                                {locationSource === 'ip' && '⚠️ Approximate Location (IP-based)'}
                                {locationSource === 'manual' && '📍 Manual Location'}
                                {locationSource === 'db' && '💾 Last Saved Location'}
                                {locationSource === 'default' && '🗺️ Default Location'}
                            </p>
                            <p className="text-xs text-gray-600 mt-0.5">
                                {locationSource === 'ip' && 'IP location is city-level only. Set your exact location:'}
                                {locationSource === 'gps' && 'Using precise GPS location'}
                                {locationSource === 'manual' && 'Using your selected location'}
                                {locationSource !== 'gps' && locationSource !== 'manual' && 'GPS unavailable. Select your location:'}
                            </p>
                        </div>
                    </div>

                    {locationSource !== 'gps' && (
                        <>
                            <button
                                onClick={() => {
                                    setLocationSource('waiting');
                                    refetchLocation();
                                }}
                                className="w-full mt-2 px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-xs font-bold hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Navigation className="h-4 w-4" />
                                🎯 Get My Exact Location (Try Again)
                            </button>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Negombo', 'Anuradhapura', 'Matara', 'Batticaloa', 'Kurunegala', 'Trincomalee'].map(city => (
                                    <button
                                        key={city}
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${city},Sri Lanka`);
                                                const data = await response.json();
                                                if (data && data.length > 0) {
                                                    const { lat, lon } = data[0];
                                                    setDriverLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
                                                    setLocationSource('manual');
                                                }
                                            } catch (err) {
                                                console.error(err);
                                            }
                                        }}
                                        className="px-2 py-1 bg-white text-xs font-medium text-gray-700 rounded border border-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Search Bar in Sidebar for clarity */}
                <form onSubmit={handleSearch} className="p-3 bg-gray-50 border-b flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your city/location..."
                        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7935]"
                    />
                    <button type="submit" className="bg-[#1a7935] text-white px-3 py-2 rounded-lg text-sm font-bold">
                        Find
                    </button>
                </form>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loads.length === 0 ? (
                        <p className="text-center text-gray-500 py-10">No active loads available.</p>
                    ) : (
                        loads.map(load => (
                            <div
                                key={load.id}
                                onClick={() => setSelectedLoad(load)}
                                className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedLoad?.id === load.id ? 'border-[#1a7935] bg-green-50 shadow-md' : 'border-gray-100 hover:border-green-200 hover:bg-gray-50'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800">{load.description || "Fresh Produce Delivery"}</h3>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold">
                                        LKR {load.price}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="truncate">{load.pickup_address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-gray-400" />
                                        <span>To: {load.dropoff_address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        <span>{load.distance_km} km</span>
                                        {load.weight > 0 && (
                                            <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full border border-gray-300 ml-auto">
                                                {load.weight} kg
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {selectedLoad?.id === load.id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAcceptLoad(load.id);
                                        }}
                                        className="mt-3 w-full py-2 bg-[#1a7935] text-white rounded-lg text-sm font-bold hover:bg-[#145d29]"
                                    >
                                        Accept Load
                                    </button>
                                )}
                            </div>
                        )))}
                </div>
            </div>

            {/* Right Map Area */}
            <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-100 relative overflow-hidden flex flex-col">

                {/* Map */}
                {driverLocation ? (
                    <MapContainer center={[driverLocation.lat, driverLocation.lng]} zoom={13} className="h-full w-full">
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        <MapFlyTo center={driverLocation} />

                        {/* Driver Marker */}
                        <DraggableMarker position={driverLocation} setPosition={setDriverLocation} />

                        {/* Fallback Warning */}
                        {locationSource !== 'gps' && (
                            <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'none', right: '10px', top: '10px' }}>
                                <div className="leaflet-control bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-3 shadow-lg rounded pointer-events-auto max-w-xs">
                                    <div className="flex items-start gap-2">
                                        <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold text-sm">
                                                {locationSource === 'ip' ? '📍 Approximate Location' :
                                                    locationSource === 'db' ? 'Using Last Saved Location' :
                                                        'Using Default Location'}
                                            </p>
                                            <p className="text-xs leading-tight mt-1">
                                                {locationSource === 'ip' ? (
                                                    <>GPS unavailable. Showing approximate area based on IP.<br />
                                                        <strong>Search your exact location above if needed.</strong></>
                                                ) : locationSource === 'db' ? (
                                                    'GPS unavailable. Using your last known location.'
                                                ) : (
                                                    'GPS unavailable. Drag the marker to adjust.'
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Load Markers */}
                        {loads.map(load => (
                            <Marker
                                key={load.id}
                                position={[load.pickup_lat, load.pickup_lng]}
                                eventHandlers={{
                                    click: () => setSelectedLoad(load)
                                }}
                            >
                                <Popup>
                                    <b>{load.description}</b> <br /> {load.pickup_address} <br />
                                    <b>To:</b> {load.dropoff_address}
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                ) : (
                    // Initial Loading State (Very short lived now)
                    <div className="absolute inset-0 bg-white z-[500] flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#1a7935]"></div>
                        <p className="mt-4 text-gray-600 font-medium">Acquiring Location...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
