import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useLiveLocation = (autoStart = true) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [status, setStatus] = useState('offline'); // offline, connecting, live, weak_signal, error, simulating
    const [isOnline, setIsOnline] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false); // Enable simulation mode

    // IDs for cleanup
    const watchIdRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const simulationIntervalRef = useRef(null);
    const simulationIndexRef = useRef(0);

    // Mock Route for Simulation (Empty by default)
    const mockRoute = [];

    // Toggle Online/Offline
    const toggleOnline = (shouldGoOnline, simulate = false) => {
        setIsOnline(shouldGoOnline);
        setIsSimulating(simulate);

        if (!shouldGoOnline) {
            stopTracking();
            setStatus('offline');
            setLocation(null);
        } else {
            setStatus('connecting');
            if (simulate) {
                startSimulation();
            } else {
                startTracking();
            }
        }
    };

    const stopTracking = () => {
        if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
        if (simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
    };

    const startSimulation = () => {
        stopTracking();
        setStatus('simulating');

        simulationIntervalRef.current = setInterval(() => {
            const index = simulationIndexRef.current;
            const point = mockRoute[index];

            const newLocation = {
                lat: point.lat,
                lng: point.lng,
                accuracy: 10,
                speed: 30,
                heading: point.heading
            };

            setLocation(newLocation);
            updateDatabase(newLocation.lat, newLocation.lng, newLocation.heading, newLocation.speed);

            // Move to next point, loop back
            simulationIndexRef.current = (index + 1) % mockRoute.length;
        }, 3000); // Update every 3 seconds
    };

    // IP Fallback strictly PERMANENTLY disabled
    const getIpLocation = async () => {
        console.warn("🚫 Hardware GPS required. Network/IP location is disabled for accuracy.");
        setStatus('error');
        setError("Please enable GPS. IP-based location is disabled for the Driver app.");
    };

    const startTracking = async (enableHighAccuracy = true) => {
        stopTracking(); // Clear existing

        // CRITICAL: Check for Secure Context (HTTPS)
        // Browsers block Geolocation on HTTP (except localhost)
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            const msg = "🔒 Secure Connection Required: GPS only works over HTTPS on mobile.";
            console.error(msg);
            setError(msg);
            setStatus('error');
            return;
        }

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by this browser.");
            setStatus('error');
            return;
        }

        console.log(`🛰️ Requesting GPS (HighAcc: ${enableHighAccuracy})...`);
        setStatus('connecting');

        // Force a permission check/prompt with a one-time request first
        try {
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy,
                    timeout: 8000,
                    maximumAge: 0
                });
            });
            console.log("✅ Initial GPS permission/signal check passed.");
        } catch (e) {
            console.warn("⚠️ Initial GPS check failed/timed out, but starting watch anyway...", e.message);
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 0,
        };

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy, speed, heading } = position.coords;
                console.log("📍 GPS Update:", latitude, longitude, `Acc: ${accuracy}m`);

                const newLocation = {
                    lat: latitude,
                    lng: longitude,
                    accuracy,
                    speed: speed || 0,
                    heading: heading || 0,
                    timestamp: position.timestamp // Add GPS timestamp
                };
                setLocation(newLocation);
                setError(null);

                // Stricter accuracy check: 30m instead of 50m
                if (accuracy > 30) {
                    setStatus('weak_signal');
                } else {
                    setStatus('live');
                }

                updateDatabase(latitude, longitude, heading || 0, speed || 0);
            },
            (err) => {
                console.error("❌ GPS Error:", err.message, "Code:", err.code);

                if (err.code === 1) { // PERMISSION_DENIED
                    setError("Location Access Denied. Please enable GPS in browser and phone settings.");
                    setStatus('error');
                } else if (enableHighAccuracy) {
                    console.log("🔄 High accuracy failed. Retrying with standard accuracy...");
                    startTracking(false);
                } else {
                    setError("GPS Signal Lost. Try moving to an open area.");
                    setStatus('error');
                }
            },
            options
        );
    };


    // Helper to update Supabase
    const updateDatabase = async (lat, lng, heading, speed) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Use the profiles table which is the common source of truth
            const { error } = await supabase
                .from('profiles')
                .update({
                    latitude: lat,
                    longitude: lng,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);

            if (error) {
                console.error("DB Sync Error:", error);
            }
        } catch (err) {
            console.error("Unexpected error in updateDatabase:", err);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stopTracking();
    }, []);

    // Auto-start logic
    useEffect(() => {
        if (autoStart && !isOnline) {
            // Default to normal tracking, user can toggle simulation manually
            toggleOnline(true, false);
        }
    }, [autoStart]);

    return {
        location,
        error,
        status, // offline, connecting, live, weak_signal, error, simulating
        isOnline,
        isSimulating,
        toggleOnline,
        updateDatabase // Exporting for manual testing if needed
    };
};
