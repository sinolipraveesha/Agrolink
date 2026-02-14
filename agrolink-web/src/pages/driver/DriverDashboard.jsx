import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Truck, MapPin, Package, Clock, AlertTriangle, Navigation, Star, User, X } from 'lucide-react';
import { useLiveLocation } from '../../hooks/useLiveLocation';
import { useTrackFarmer } from '../../hooks/useFarmerTracking'; // Add live farmer tracking
import { supabase } from '../../lib/supabaseClient';

// Fix for default marker icons in React-Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { connectWebSocket, sendLocation, disconnectWebSocket } from '../../services/websocketService';
import { Lock, Globe, Terminal } from 'lucide-react'; // Added icons for security warnings

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Helper to calculate distance in KM
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

export default function DriverDashboard() {
    const [loads, setLoads] = useState([]);
    const [selectedLoad, setSelectedLoad] = useState(null);
    const [driverLocation, setDriverLocation] = useState(null);
    const [activeRoute, setActiveRoute] = useState(null); // { from: {lat, lng}, to: {lat, lng} }
    const [routePath, setRoutePath] = useState(null); // Array of [lat, lng] coordinates for the actual road path

    // Delivery State
    const [currentJob, setCurrentJob] = useState(null); // The active job object
    const [jobStatus, setJobStatus] = useState(null); // 'accepted', 'ready_to_ship', 'shipped', 'delivered'

    // Geofencing State
    const [isNearPickup, setIsNearPickup] = useState(false);
    const [isNearDropoff, setIsNearDropoff] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const GEOFENCE_RADIUS_KM = 0.2; // 200 meters

    // Use live location hook
    // Use live location hook
    const { location: liveLocation, status: liveStatus, error: gpsError, isOnline, toggleOnline, isSimulating, updateDatabase } = useLiveLocation(true);
    const [shouldFollowDriver, setShouldFollowDriver] = useState(true);
    const [lastRouteUpdateLoc, setLastRouteUpdateLoc] = useState(null);
    const [isManualCorrection, setIsManualCorrection] = useState(false);
    const driverLocationLoaded = React.useRef(false);

    // Track farmer live if job is active and we are in pickup phase
    const { farmerLocation: liveFarmerLoc } = useTrackFarmer(
        (jobStatus === 'ready_to_ship' && currentJob?.farmer_id) ? currentJob.farmer_id : null
    );

    // Initial WS Connection
    useEffect(() => {
        // Connect to WebSocket when dashboard mounts
        connectWebSocket(
            () => console.log("Driver Dashboard Connected to WS 🟢"),
            (err) => console.error("WS Connection Failed 🔴", err)
        );

        return () => {
            disconnectWebSocket();
        };
    }, []);

    useEffect(() => {
        if (liveLocation && !isManualCorrection) {
            // Live GPS always wins over saved/search coordinates
            setDriverLocation(liveLocation);

            // Update route 'from' point if we have an active job and move significantly (>50m)
            if (activeRoute && (!lastRouteUpdateLoc || calculateDistance(liveLocation.lat, liveLocation.lng, lastRouteUpdateLoc.lat, lastRouteUpdateLoc.lng) > 0.05)) {
                setActiveRoute(prev => ({
                    ...prev,
                    from: { lat: liveLocation.lat, lng: liveLocation.lng }
                }));
                setLastRouteUpdateLoc(liveLocation);
            }

            // Get current user ID from Supabase session to send with location
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user && liveLocation.accuracy < 100) { // Only broadcast good location
                    sendLocation(user.id, liveLocation.lat, liveLocation.lng, liveLocation.heading || 0);
                }
            });
        }
    }, [liveLocation, activeRoute]);

    // Geofencing Check
    useEffect(() => {
        if (!driverLocation || !currentJob) {
            setIsNearPickup(false);
            setIsNearDropoff(false);
            return;
        }

        // Check Pickup Proximity
        if (currentJob.pickup_lat && currentJob.pickup_lng) {
            const dist = calculateDistance(
                driverLocation.lat, driverLocation.lng,
                currentJob.pickup_lat, currentJob.pickup_lng
            );
            setIsNearPickup(dist <= GEOFENCE_RADIUS_KM);
        }

        // Check Delivery Proximity
        if (currentJob.delivery_lat && currentJob.delivery_lng) {
            const dist = calculateDistance(
                driverLocation.lat, driverLocation.lng,
                currentJob.delivery_lat, currentJob.delivery_lng
            );
            setIsNearDropoff(dist <= GEOFENCE_RADIUS_KM);
        }

    }, [driverLocation, currentJob]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                // Fetch available jobs (Using backend endpoint)
                const res = await fetch(`/api/orders?status=ready_to_ship`);
                const data = await res.json();
                // setAvailableJobs(data); // This state variable is not defined in the original code

                // Also check for active jobs (accepted/picked_up)
                const activeRes = await fetch(`/api/orders?status=accepted`);
                const activeData = await activeRes.json();
                if (activeData.length > 0) {
                    // Start job logic if needed
                }

            } catch (error) {
                console.error("Error fetching jobs:", error);
            } finally {
                // setLoading(false); // This state variable is not defined in the original code
            }
        };

        fetchJobs();
    }, []);

    // New states for reviews
    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [showReviews, setShowReviews] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Fetch Loads & Driver Profile from Supabase + Backend
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            let currentLoc = driverLocation;

            // 1. Fetch Driver's Last Known Location ONCE on mount
            if (!driverLocationLoaded.current && user) {
                console.log("📦 Fetching last known location for driver...");
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('latitude, longitude')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile?.latitude && profile?.longitude) {
                    const savedLoc = { lat: profile.latitude, lng: profile.longitude, isSaved: true };
                    setDriverLocation(savedLoc);
                    console.log("✅ Loaded last known location:", savedLoc);
                }
                driverLocationLoaded.current = true;

                // Fetch Reviews from Backend (one time)
                try {
                    const res = await fetch(`/api/reviews/profile/${user.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setReviews(data);
                        if (data.length > 0) {
                            const total = data.reduce((acc, r) => acc + r.rating, 0);
                            setAverageRating(total / data.length);
                        }
                    }
                } catch (e) {
                    // Silent fail
                }
            }

            // 2. Fetch Active Loads (Accepted by Farmer)
            // Also check if driver has any ongoing job
            if (user) {
                try {
                    // Check for current active job for this driver
                    // We can filter orders by driverId and status != delivered/cancelled
                    // For now, simpler approach: fetch all and filter client side or use a specific endpoint
                    // Ideally backend should provide "my-active-job"

                    const res = await fetch(`/api/orders?status=accepted`);
                    if (res.ok) {
                        const orders = await res.json();

                        // Filter for available loads (no driver yet or driver is me)
                        // This logic might need refinement based on backend 'accepted' vs 'driver assigned' logic
                        const availableLoads = orders.filter(o => !o.driver || o.driver.id !== user.id); // Show only unassigned
                        // const myJobs = orders.filter(o => o.driver && o.driver.id === user.id); // This endpoint filters by status 'accepted', so it might not show 'assigned' ones if status changes.

                        const mappedLoads = availableLoads.map(o => ({
                            id: o.id,
                            description: o.items ? o.items.map(i => i.product ? i.product.name : i.customItemName).join(', ') : 'Delivery',
                            price: o.totalAmount,
                            pickup_address: o.pickupAddress || (o.pickupLatitude ? `Lat: ${o.pickupLatitude.toFixed(4)}, Lng: ${o.pickupLongitude.toFixed(4)}` : 'Farm Location'),
                            dropoff_address: o.deliveryAddress,
                            distance_km: '...',
                            pickup_lat: o.pickupLatitude,
                            pickup_lng: o.pickupLongitude,
                            delivery_lat: o.deliveryLatitude,
                            delivery_lng: o.deliveryLongitude,
                            status: o.status,
                            farmer_id: o.farmer ? o.farmer.id : null
                        }));
                        setLoads(mappedLoads);
                    }
                } catch (e) {
                    console.error("Backend fetch failed", e);
                }
            }
        };

        fetchInitialData();
        // Removed 30s interval to prevent live location flicker
    }, []); // Run ONCE on mount

    // Check for active job logic
    // We need to know if the driver already has an active job. 
    // Since we don't have a dedicated API for "my active job", we rely on local state or fetch checks.
    // For now, let's assume if we accept a load, we lock into it.


    // Handle search form submission
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)},Sri Lanka`);
            const data = await response.json();

            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                setDriverLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
            } else {
                alert("Location not found");
            }
        } catch (err) {
            console.error("Search failed:", err);
            alert("Search failed. Please try again.");
        }
    };

    // Handle accepting a load
    const handleAcceptLoad = async (load) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert("Please login first");
                return;
            }

            const response = await fetch(`/api/orders/${load.id}/driver-accept?driverId=${user.id}`, {
                method: 'PUT'
            });

            if (response.ok) {
                const updatedOrder = await response.json();

                // Map the backend order object to our local load format
                // Use profile lat/lng as fallback if order pickup coords are missing
                const mappedJob = {
                    id: updatedOrder.id,
                    description: updatedOrder.items ? updatedOrder.items.map(i => i.product ? i.product.name : i.customItemName).join(', ') : 'Delivery',
                    price: updatedOrder.totalAmount,
                    pickup_address: updatedOrder.pickupAddress || (updatedOrder.pickupLatitude ? `Lat: ${updatedOrder.pickupLatitude.toFixed(4)}, Lng: ${updatedOrder.pickupLongitude.toFixed(4)}` : 'Farm Location'),
                    dropoff_address: updatedOrder.deliveryAddress,
                    pickup_lat: updatedOrder.pickupLatitude || (updatedOrder.farmer ? updatedOrder.farmer.latitude : null),
                    pickup_lng: updatedOrder.pickupLongitude || (updatedOrder.farmer ? updatedOrder.farmer.longitude : null),
                    delivery_lat: updatedOrder.deliveryLatitude || (updatedOrder.buyer ? updatedOrder.buyer.latitude : null),
                    delivery_lng: updatedOrder.deliveryLongitude || (updatedOrder.buyer ? updatedOrder.buyer.longitude : null),
                    status: updatedOrder.status,
                    farmer_id: updatedOrder.farmer ? updatedOrder.farmer.id : null
                };

                setCurrentJob(mappedJob);
                setJobStatus('ready_to_ship'); // Driver assigned

                // Set navigation to Farmer (Pickup)
                if (driverLocation && mappedJob.pickup_lat && mappedJob.pickup_lng) {
                    setActiveRoute({
                        from: { lat: driverLocation.lat, lng: driverLocation.lng },
                        to: { lat: mappedJob.pickup_lat, lng: mappedJob.pickup_lng }
                    });
                }
                alert("Job Accepted! Navigate to Pickup.");
            } else {
                alert("Failed to accept job. It might remain taken.");
            }
        } catch (e) {
            console.error("Accept error:", e);
            alert("Error accepting job");
        }
    };

    // Handle Confirm Pickup
    const handleConfirmPickup = async () => {
        if (!currentJob) return;
        try {
            // Status: shipped (Picked Up / In Transit)
            const response = await fetch(`/api/orders/${currentJob.id}/status?status=shipped`, {
                method: 'PUT'
            });

            if (response.ok) {
                setJobStatus('shipped');

                // Set navigation to Buyer (Dropoff)
                if (currentJob.delivery_lat && currentJob.delivery_lng) {
                    // Start from current location (which should be farmer location now)
                    setActiveRoute({
                        from: { lat: driverLocation.lat, lng: driverLocation.lng },
                        to: { lat: currentJob.delivery_lat, lng: currentJob.delivery_lng }
                    });
                } else {
                    // If no delivery coords, clear route or alert
                    setActiveRoute(null);
                    alert("No delivery coordinates found. Please check address.");
                }
                alert("Pickup Confirmed! Navigate to Buyer.");
            } else {
                alert("Failed to update status.");
            }
        } catch (e) {
            console.error("Pickup error:", e);
        }
    };

    // IP Fallback strictly disabled as per 100% accuracy requirement
    const getIpLocation = async () => {
        console.warn("🚫 IP Location disabled. Waiting for hardware GPS fix...");
        if (status !== 'error') {
            setStatus('error');
            setError("100% Accuracy Required: Waiting for GPS signal...");
        }
    };
    // Handle Confirm Delivery
    const handleConfirmDelivery = async () => {
        if (!currentJob) return;
        try {
            const response = await fetch(`/api/orders/${currentJob.id}/status?status=delivered`, {
                method: 'PUT'
            });

            if (response.ok) {
                setJobStatus('delivered');
                setActiveRoute(null); // Clear route
                alert("Delivery Confirmed! Great Job.");

                // Reset state after a short delay
                setTimeout(() => {
                    setCurrentJob(null);
                    setJobStatus(null);
                    setRoutePath(null);
                }, 2000);
            } else {
                alert("Failed to confirm delivery.");
            }
        } catch (e) {
            console.error("Delivery error:", e);
        }
    };


    // Fetch actual road route when activeRoute changes
    useEffect(() => {
        if (!activeRoute) {
            setRoutePath(null);
            return;
        }

        const fetchRoute = async () => {
            try {
                // OSRM API call
                const url = `https://router.project-osrm.org/route/v1/driving/${activeRoute.from.lng},${activeRoute.from.lat};${activeRoute.to.lng},${activeRoute.to.lat}?overview=full&geometries=geojson`;

                const response = await fetch(url);
                const data = await response.json();

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const coordinates = data.routes[0].geometry.coordinates;
                    const path = coordinates.map(coord => [coord[1], coord[0]]);
                    setRoutePath(path);
                } else {
                    // Fallback to straight line
                    setRoutePath([
                        [activeRoute.from.lat, activeRoute.from.lng],
                        [activeRoute.to.lat, activeRoute.to.lng]
                    ]);
                }
            } catch (error) {
                console.error('Error fetching route:', error);
                setRoutePath([
                    [activeRoute.from.lat, activeRoute.from.lng],
                    [activeRoute.to.lat, activeRoute.to.lng]
                ]);
            }
        };

        fetchRoute();
    }, [activeRoute]);

    // Update active route if live farmer location changes
    useEffect(() => {
        if (jobStatus === 'ready_to_ship' && liveFarmerLoc && driverLocation) {
            setActiveRoute({
                from: { lat: driverLocation.lat, lng: driverLocation.lng },
                to: { lat: liveFarmerLoc.lat, lng: liveFarmerLoc.lng }
            });
        }
    }, [liveFarmerLoc, jobStatus]);



    // Simplified map centering helper
    function MapRecenter({ center, follow }) {
        const map = useMap();
        useEffect(() => {
            if (center && follow) {
                map.panTo([center.lat, center.lng], { animate: true });
            }
        }, [center, follow, map]);
        return null;
    }

    // Draggable marker component
    function DraggableMarker({ position, onDragEnd }) {
        const markerRef = React.useRef(null);
        // Event handlers for drag
        const eventHandlers = {
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const newPos = marker.getLatLng();
                    onDragEnd({ lat: newPos.lat, lng: newPos.lng });
                }
            },
        };

        const icon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png', // Green delivery truck
            shadowUrl: null,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });

        return (
            <Marker
                draggable={true}
                eventHandlers={eventHandlers}
                position={[position.lat, position.lng]}
                ref={markerRef}
                icon={icon}
            >
                <Popup>You are here (Drag to correct location)</Popup>
            </Marker>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
            {/* Left Sidebar */}
            <div className="md:w-1/3 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col overflow-hidden">

                {/* Driver Profile Header */}
                <div className="bg-[#1a7935] p-4 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <User className="h-5 w-5" /> Driver Dashboard
                            </h2>
                            <div className="flex items-center gap-2 mt-2 cursor-pointer hover:bg-white/10 p-1 rounded transition-colors" onClick={() => setShowReviews(true)}>
                                <div className="flex bg-white/20 px-2 py-1 rounded">
                                    <Star className="h-4 w-4 text-yellow-300 fill-current mr-1" />
                                    <span className="font-bold text-sm">{averageRating.toFixed(1)}</span>
                                </div>
                                <span className="text-xs text-green-100 hover:underline">{reviews.length} Reviews</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Bar - Auto Online */}
                <div className="p-3 bg-gray-50 border-b flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase">Status</span>
                        <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full animate-pulse ${isSimulating ? 'bg-purple-500' : liveStatus === 'live' ? 'bg-green-500' :
                                liveStatus === 'weak_signal' ? 'bg-yellow-500' :
                                    liveStatus === 'connecting' ? 'bg-blue-500' :
                                        'bg-gray-400'
                                }`} />
                            <span className="text-sm font-medium text-gray-700">
                                {isSimulating ? 'Simulating Route 🔄' : isOnline ? (
                                    liveStatus === 'live' ? 'Online & Tracking' :
                                        liveStatus === 'error' ? 'GPS Error ⚠️' :
                                            'Connecting...'
                                ) : 'Offline'}
                            </span>
                        </div>
                    </div>

                    {/* Simulation Toggle */}
                    <button
                        onClick={() => toggleOnline(true, !isSimulating)}
                        className={`w-full py-1.5 rounded text-xs font-bold border transition-colors ${isSimulating
                            ? 'bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        {isSimulating ? 'Stop Simulation' : 'Enable Simulation Mode (Test)'}
                    </button>
                </div>

                {/* Job Control Panel (If Active Job) */}
                {currentJob && (
                    <div className="bg-blue-50 p-4 border-b border-blue-200">
                        <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                            <Truck className="h-4 w-4" /> Current Active Job
                        </h3>
                        <div className="text-sm text-blue-900 mb-3 space-y-1">
                            <p><strong>Job ID:</strong> {currentJob.id.substring(0, 8)}...</p>
                            <p><strong>Status:</strong> <span className="uppercase">{jobStatus}</span></p>
                        </div>

                        {jobStatus === 'ready_to_ship' && (
                            <div className="space-y-2">
                                <button
                                    onClick={handleConfirmPickup}
                                    disabled={!isNearPickup}
                                    className={`w-full py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${isNearPickup
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isNearPickup ? 'Confirm Pickup (At Farmer)' : 'Move Closer to Pickup'}
                                </button>
                                {!isNearPickup && (
                                    <p className="text-xs text-red-500 font-bold text-center">
                                        * You must be within 200m of the farm.
                                    </p>
                                )}
                            </div>
                        )}

                        {jobStatus === 'shipped' && (
                            <div className="space-y-2">
                                <button
                                    onClick={handleConfirmDelivery}
                                    disabled={!isNearDropoff}
                                    className={`w-full py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${isNearDropoff
                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isNearDropoff ? 'Confirm Delivery (At Buyer)' : 'Move Closer to Buyer'}
                                </button>
                                {!isNearDropoff && (
                                    <p className="text-xs text-red-500 font-bold text-center">
                                        * You must be within 200m of the delivery location.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!currentJob && (
                    <div className="p-2 bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider px-4 py-2 border-b">
                        Available Loads
                    </div>
                )}


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
                    {/* If Active Job, maybe hide available loads or show them disabled? For now, hide if active job exists to focus */}
                    {currentJob ? (
                        <div className="text-center text-gray-500 py-10">
                            <p>You have an active job.</p>
                            <p className="text-sm">Complete it to see more loads.</p>
                        </div>
                    ) : (
                        loads.length === 0 ? (
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
                                    </div>

                                    {selectedLoad?.id === load.id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAcceptLoad(load);
                                            }}
                                            className="mt-3 w-full py-2 bg-[#1a7935] text-white rounded-lg text-sm font-bold hover:bg-[#145d29]"
                                        >
                                            Accept Load
                                        </button>
                                    )}
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Right Map Area */}
            <div className={`transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[2000] bg-white' : 'flex-1 bg-white rounded-xl shadow-lg border border-gray-100 relative overflow-hidden flex flex-col'}`}>

                {/* Fullscreen Close Button */}
                {isFullscreen && (
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="absolute top-4 left-4 z-[2100] bg-white shadow-xl p-3 rounded-full text-gray-800 hover:bg-gray-100 border border-gray-200"
                    >
                        <X className="h-6 w-6" />
                    </button>
                )}

                {/* Expand Hint (Only when job active and NOT fullscreen) */}
                {currentJob && !isFullscreen && (
                    <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
                        <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 animate-pulse">
                            <Navigation className="h-3 w-3" />
                            Tap map for Fullscreen Navigation
                        </div>
                    </div>
                )}

                {/* Floating Map Controls */}
                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                    {/* Simulation Toggle */}
                    <button
                        onClick={() => toggleOnline(true, !isSimulating)}
                        className={`shadow-lg px-4 py-2 rounded-lg text-sm font-bold border flex items-center gap-2 transition-colors ${isSimulating ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-gray-700 border-gray-200'}`}
                    >
                        <Truck className="h-4 w-4" />
                        {isSimulating ? 'Simulating' : 'Start Simulation'}
                    </button>

                    {isManualCorrection && (
                        <button
                            onClick={() => setIsManualCorrection(false)}
                            className="bg-blue-600 text-white shadow-lg px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 border border-blue-700 flex items-center gap-2"
                        >
                            <MapPin className="h-4 w-4" />
                            Reset to GPS
                        </button>
                    )}

                    {activeRoute && (
                        <button
                            onClick={() => {
                                setActiveRoute(null);
                                setRoutePath(null);
                            }}
                            className="bg-white shadow-lg px-4 py-2 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 border border-gray-200 flex items-center gap-2"
                        >
                            <X className="h-4 w-4" />
                            Clear Route
                        </button>
                    )}
                    <button
                        onClick={() => setShouldFollowDriver(!shouldFollowDriver)}
                        className={`shadow-lg px-4 py-2 rounded-lg text-sm font-bold border flex items-center gap-2 transition-colors ${shouldFollowDriver ? 'bg-[#1a7935] text-white border-[#1a7935]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Navigation className={`h-4 w-4 ${shouldFollowDriver ? 'fill-current' : ''}`} />
                        {shouldFollowDriver ? 'Following' : 'Follow Me'}
                    </button>
                </div>

                {/* Map Container - now always visible */}
                <div className="h-full w-full relative">
                    {/* GPS Status Overlay - Only hide when we have a REAL signal */}
                    {(liveStatus === 'connecting' || liveStatus === 'error' || liveStatus === 'offline') && (
                        <div className="absolute inset-0 bg-white/90 z-[2001] flex flex-col items-center justify-center backdrop-blur-xl p-6">
                            <div className="bg-white p-8 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col items-center max-w-[340px] text-center">
                                {!window.isSecureContext && window.location.hostname !== 'localhost' ? (
                                    <>
                                        <div className="bg-red-50 p-6 rounded-full mb-6">
                                            <Lock className="h-16 w-16 text-red-500" />
                                        </div>
                                        <h3 className="font-bold text-2xl text-gray-800">Connection Insecure</h3>
                                        <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                                            Browsers block GPS on <span className="font-bold text-red-600 underline">HTTP</span> connections (IP addresses).
                                        </p>
                                        <div className="mt-6 p-4 bg-gray-50 rounded-2xl w-full text-left">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Solution for Testing:</p>
                                            <code className="text-[10px] block bg-black text-green-400 p-2 rounded mb-2 font-mono">
                                                npx localtunnel --port 5173
                                            </code>
                                            <p className="text-[10px] text-gray-400">Use the <span className="font-bold text-green-600">https://</span> link provided by the command above on your phone.</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative mb-8">
                                            <div className="absolute inset-0 animate-ping bg-green-100 rounded-full scale-150 opacity-20"></div>
                                            <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-gray-100 border-t-[#1a7935]"></div>
                                            <Globe className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#1a7935]" />
                                        </div>
                                        <h3 className="font-bold text-2xl text-gray-800">Searching...</h3>
                                        <p className="text-sm text-gray-500 mt-4">
                                            {gpsError || "Standing by for high-accuracy hardware GPS signal. Please move outdoors."}
                                        </p>
                                    </>
                                )}

                                <div className="mt-8 flex flex-col gap-3 w-full">
                                    <button
                                        onClick={() => toggleOnline(true, false)}
                                        className="w-full bg-[#1a7935] text-white font-bold py-4 rounded-2xl hover:bg-[#15612a] transition-all shadow-lg active:scale-95"
                                    >
                                        RETRY GPS HARDWARE
                                    </button>
                                    <button
                                        onClick={() => toggleOnline(true, true)}
                                        className="w-full bg-white text-gray-400 font-bold py-3 rounded-xl border border-gray-100 text-xs"
                                    >
                                        ENTER SIMULATION MODE
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* GPS Info Diagnostic Header */}
                    {driverLocation && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                            <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full text-[10px] font-mono flex items-center gap-4 shadow-xl">
                                <div className="flex items-center gap-1">
                                    <div className={`h-2 w-2 rounded-full ${driverLocation.isSaved ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                                    <span>{driverLocation.isSaved ? 'SAVED (STALE)' : 'LIVE GPS'}</span>
                                </div>
                                <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                                    {window.isSecureContext ? <Lock className="h-3 w-3 text-green-400" /> : <AlertTriangle className="h-3 w-3 text-red-500 animate-pulse" />}
                                    <span className={window.isSecureContext ? 'text-green-400' : 'text-red-500'}>
                                        {window.location.protocol.toUpperCase().replace(':', '')}
                                    </span>
                                </div>
                                <span>{driverLocation.lat.toFixed(6)}, {driverLocation.lng.toFixed(6)}</span>
                                <span className={driverLocation.accuracy > 50 ? 'text-yellow-400' : 'text-green-400'}>
                                    ±{Math.round(driverLocation.accuracy || 0)}m
                                </span>
                                {driverLocation.timestamp && (
                                    <span className={`font-bold ${Date.now() - driverLocation.timestamp > 15000 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                                        {new Date(driverLocation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        {Date.now() - driverLocation.timestamp > 15000 && " (STALE)"}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div
                        className="h-full w-full relative"
                        onClick={() => { if (currentJob) setIsFullscreen(true); }}
                    >
                        {/* MapContainer with a default center if driverLocation is still null */}
                        <MapContainer
                            center={driverLocation ? [driverLocation.lat, driverLocation.lng] : [7.8731, 80.7718]}
                            zoom={driverLocation ? 13 : 8}
                            className="h-full w-full"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Signal Diagnostics overlay */}
                            <div className="absolute top-20 left-4 z-[1000] pointer-events-none">
                                {liveStatus === 'weak_signal' && (
                                    <div className="bg-orange-100 text-orange-700 px-3 py-2 rounded-lg border border-orange-200 shadow-sm flex items-center gap-2 text-xs font-bold animate-pulse">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Weak GPS Signal</span>
                                    </div>
                                )}
                                {liveStatus === 'simulating' && (
                                    <div className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg border border-blue-200 shadow-sm flex items-center gap-2 text-xs font-bold">
                                        <Truck className="h-4 w-4" />
                                        <span>SIMULATION ACTIVE</span>
                                    </div>
                                )}
                            </div>

                            {/* Signal Type Indicator */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
                                {liveStatus === 'weak_signal' && (
                                    <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full border border-orange-200 shadow-lg flex items-center gap-2 text-[10px] font-bold text-orange-700 whitespace-nowrap">
                                        <AlertTriangle className="h-3 w-3" />
                                        <span>WEAK GPS SIGNAL - PLEASE MOVE TO CLEAR AREA</span>
                                    </div>
                                )}
                            </div>

                            {driverLocation && (
                                <>
                                    {/* Auto-centering helper */}
                                    <MapRecenter center={driverLocation} follow={shouldFollowDriver} />

                                    <DraggableMarker
                                        position={driverLocation}
                                        onDragEnd={(newPos) => {
                                            setDriverLocation(newPos);
                                            setIsManualCorrection(true);
                                            setShouldFollowDriver(false);
                                            updateDatabase(newPos.lat, newPos.lng, 0, 0);
                                        }}
                                    />

                                    {/* Route Polyline (if active) */}
                                    {routePath && (
                                        <Polyline
                                            positions={routePath}
                                            color="#1a7935"
                                            weight={5}
                                            opacity={0.7}
                                            dashArray="10, 10"
                                        />
                                    )}

                                    {/* Destination Marker */}
                                    {activeRoute?.to && (
                                        <Marker position={[activeRoute.to.lat, activeRoute.to.lng]}>
                                            <Popup>Destination</Popup>
                                        </Marker>
                                    )}
                                </>
                            )}

                            {/* ... existing markers logic ... */}
                        </MapContainer>
                    </div>
                </div>
            </div>

            {/* Reviews Modal */}
            {
                showReviews && (
                    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowReviews(false)}>
                        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                                    My Ratings & Reviews
                                </h3>
                                <button onClick={() => setShowReviews(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto">
                                <div className="text-center mb-6">
                                    <div className="text-5xl font-bold text-gray-800">{averageRating.toFixed(1)}</div>
                                    <div className="flex justify-center gap-1 my-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <Star
                                                key={star}
                                                className={`h-6 w-6 ${star <= Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-200'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-gray-500 text-sm">Based on {reviews.length} reviews</p>
                                </div>

                                <div className="space-y-4">
                                    {reviews.length === 0 ? (
                                        <p className="text-center text-gray-500 italic">No reviews yet.</p>
                                    ) : (
                                        reviews.map((review) => (
                                            <div key={review.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`h-3 w-3 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-gray-600 text-sm italic">"{review.comment}"</p>
                                                <div className="mt-2 text-xs font-bold text-gray-400">
                                                    - {review.reviewer?.email?.split('@')[0] || 'Customer'}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
