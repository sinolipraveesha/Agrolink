import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook to sync driver location to Supabase (for drivers)
 * Throttles updates to avoid excessive writes
 */
export const useSyncDriverLocation = (location, intervalMs = 10000) => {
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        if (!location) return;

        const now = Date.now();
        if (now - lastUpdateRef.current < intervalMs) {
            // Too soon, skip
            return;
        }

        lastUpdateRef.current = now;

        // Update driver location in database
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                supabase.from('driver_profiles')
                    .update({
                        current_lat: location.lat,
                        current_lng: location.lng,
                        last_updated: new Date().toISOString()
                    })
                    .eq('id', user.id)
                    .then(({ error }) => {
                        if (error) console.error("Location sync failed:", error);
                        else console.log("✅ Location synced to database");
                    });
            }
        });
    }, [location, intervalMs]);
};

/**
 * Hook to track a driver's live location (for buyers/farmers)
 * Uses Supabase Realtime to get live updates
 */
export const useTrackDriver = (driverId) => {
    const [driverLocation, setDriverLocation] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [isOnline, setIsOnline] = useState(false);

    useEffect(() => {
        if (!driverId) return;

        // Fetch initial location
        const fetchInitialLocation = async () => {
            const { data, error } = await supabase
                .from('driver_profiles')
                .select('current_lat, current_lng, last_updated')
                .eq('id', driverId)
                .maybeSingle();

            if (data && data.current_lat && data.current_lng) {
                setDriverLocation({ lat: data.current_lat, lng: data.current_lng });
                setLastUpdated(data.last_updated);

                // Check if online (updated within last 2 minutes)
                const lastUpdate = new Date(data.last_updated);
                const now = new Date();
                const diffMinutes = (now - lastUpdate) / 1000 / 60;
                setIsOnline(diffMinutes < 2);
            }
        };

        fetchInitialLocation();

        // Subscribe to real-time updates
        const subscription = supabase
            .channel(`driver_location_${driverId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'driver_profiles',
                    filter: `id=eq.${driverId}`
                },
                (payload) => {
                    console.log("📍 Live driver location update:", payload.new);
                    if (payload.new.current_lat && payload.new.current_lng) {
                        setDriverLocation({
                            lat: payload.new.current_lat,
                            lng: payload.new.current_lng
                        });
                        setLastUpdated(payload.new.last_updated);
                        setIsOnline(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [driverId]);

    return { driverLocation, lastUpdated, isOnline };
};
