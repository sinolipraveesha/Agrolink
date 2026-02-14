import { useState, useEffect } from 'react';

export const useGeolocation = (watch = false) => {
    const [location, setLocation] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [source, setSource] = useState('gps');

    const getLocation = () => {
        setLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            setLoading(false);
            return;
        }

        const success = (position) => {
            console.log("Location successfully acquired:", position.coords);
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lng: longitude });
            setSource('gps');
            setLoading(false);
            setError(null);
        };

        const errorCallback = async (err) => {
            console.error("High accuracy location failed:", err.message, "Code:", err.code);

            // Try IP-based location as final fallback
            try {
                console.log("🌐 Attempting IP-based location fallback...");
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();

                if (data.latitude && data.longitude) {
                    console.log("✅ IP-based location acquired:", data.city, data.country_name);
                    setLocation({
                        lat: data.latitude,
                        lng: data.longitude
                    });
                    setSource('ip');
                    setError(`Using approximate location: ${data.city}, ${data.region}`);
                    setLoading(false);
                    return;
                }
            } catch (ipError) {
                console.error("IP location also failed:", ipError);
            }

            setLoading(false);

            // Detailed Error Handling
            if (err.code === 1) {
                setError("Permission Denied. Please check browser settings AND System Settings.");
            } else if (err.code === 2) {
                setError("Signal Unavailable. Using IP-based location.");
            } else if (err.code === 3) {
                setError("Location request timed out. Using IP-based location.");
            } else {
                setError("Location detection failed.");
            }
        };

        // Retry Mechanism: High Accuracy -> Retries -> Low Accuracy Fallback -> IP Fallback
        const makeLocationRequest = (retries = 2, highAccuracy = true) => {
            navigator.geolocation.getCurrentPosition(
                success,
                (err) => {
                    console.warn(`Location attempt failed (HighAccuracy: ${highAccuracy}, Retries: ${retries}):`, err.message);

                    if (err.code === 1) {
                        errorCallback(err); // Permission denied - stop immediately
                        return;
                    }

                    if (retries > 0) {
                        console.log("Retrying location request in 500ms...");
                        setTimeout(() => makeLocationRequest(retries - 1, highAccuracy), 500);
                    } else if (highAccuracy) {
                        console.warn("High Accuracy failed. Trying WiFi/Network location...");
                        setSource('network_fallback');
                        makeLocationRequest(1, false);
                    } else {
                        // Everything failed - try IP fallback
                        console.warn("All browser geolocation methods failed. Trying IP fallback...");
                        errorCallback(err);
                    }
                },
                {
                    enableHighAccuracy: highAccuracy,
                    timeout: highAccuracy ? 15000 : 20000, // Increased timeout 
                    maximumAge: 10000 // Allow 10s old cached location
                }
            );
        };

        makeLocationRequest(2); // Increase retries back to 2
    };

    useEffect(() => {
        getLocation();

        let watchId;
        if (watch && navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    console.log("Watch Position Update:", position.coords);
                    const { latitude, longitude } = position.coords;
                    setLocation({ lat: latitude, lng: longitude });
                    setSource('gps');
                    setLoading(false);
                },
                (err) => console.warn("Watch position error:", err),
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [watch]);

    return { location, error, loading, source, refetchLocation: getLocation };
};
