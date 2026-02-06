import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Hook to sync farmer (current user) location to Supabase 'profiles' table
 * Throttles updates to avoid excessive writes (default 10s)
 */
export const useSyncFarmerLocation = (location, shouldSync = true, intervalMs = 10000) => {
    const lastUpdateRef = useRef(0);

    useEffect(() => {
        if (!shouldSync || !location) return;

        const now = Date.now();
        if (now - lastUpdateRef.current < intervalMs) {
            return;
        }

        lastUpdateRef.current = now;

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
                // Update profile location directly (upsert in case row is missing)
                console.log(`📡 Syncing location for Farmer ID: ${user.id} -> ${location.lat}, ${location.lng}`);

                supabase.from('profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        role: 'farmer', // Default to farmer since this hook is used in Farmer context
                        latitude: location.lat,
                        longitude: location.lng,
                        updated_at: new Date().toISOString()
                    })
                    .select()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error("❌ Farmer location sync FAILED:", error.message, error.details, error.hint);
                        } else {
                            console.log("✅ Farmer Location synced SUCCESS:", data);
                        }
                    });
            }
        });
    }, [location, shouldSync, intervalMs]);
};

/**
 * Hook to track a farmer's live location (for drivers)
 * Uses Supabase Realtime to get live updates from 'profiles' table
 */
export const useTrackFarmer = (farmerId) => {
    const [farmerLocation, setFarmerLocation] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    useEffect(() => {
        if (!farmerId) return;

        // Fetch initial location
        const fetchInitial = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('latitude, longitude, updated_at')
                .eq('id', farmerId)
                .single();

            if (data && data.latitude && data.longitude) {
                setFarmerLocation({ lat: data.latitude, lng: data.longitude });
                setLastUpdated(data.updated_at);
            }
        };

        fetchInitial();

        // Subscribe to Realtime updates
        const subscription = supabase
            .channel(`farmer_tracking_${farmerId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${farmerId}`
                },
                (payload) => {
                    console.log("📍 Live farmer location update:", payload.new);
                    if (payload.new.latitude && payload.new.longitude) {
                        setFarmerLocation({
                            lat: payload.new.latitude,
                            lng: payload.new.longitude
                        });
                        setLastUpdated(payload.new.updated_at);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [farmerId]);

    return { farmerLocation, lastUpdated };
};
