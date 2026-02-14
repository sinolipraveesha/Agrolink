import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Truck, MapPin, Phone, Navigation, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import LiveTrackingMap from '../../components/LiveTrackingMap';

export default function LiveTracking() {
    const [searchParams] = useSearchParams();
    const jobId = searchParams.get('jobId');
    const driverId = searchParams.get('driverId');

    const [job, setJob] = useState(null);
    const [driver, setDriver] = useState(null);

    // Fetch Job and Driver Details
    useEffect(() => {
        if (!jobId) return;

        const fetchData = async () => {
            try {
                // Fetch order details from Backend (PostgreSQL)
                // Using getAllOrders and filtering (temporary solution as discussed)
                const allRes = await fetch(`/api/orders`);
                const allOrders = await allRes.json();

                const orderData = allOrders.find(o => o.id === jobId);

                if (orderData) {
                    const mappedJob = {
                        id: orderData.id,
                        status: orderData.status,
                        pickup_lat: orderData.pickupLatitude,
                        pickup_lng: orderData.pickupLongitude,
                        pickup_address: orderData.pickupAddress || 'Farm',
                        dropoff_lat: orderData.deliveryLatitude || 0,
                        dropoff_lng: orderData.deliveryLongitude || 0,
                        dropoff_address: orderData.deliveryAddress,
                        driver_id: orderData.driver ? orderData.driver.id : null
                    };
                    setJob(mappedJob);

                    // Fetch driver profile from Supabase if we have a driver ID
                    if (mappedJob.driver_id) {
                        try {
                            const { data: driverData, error } = await supabase
                                .from('driver_profiles')
                                .select('*, profiles(full_name, mobile_no)')
                                .eq('id', mappedJob.driver_id)
                                .single();

                            if (error) throw error;
                            setDriver(driverData);
                        } catch (err) {
                            console.warn("Could not fetch driver with profile relation, falling back to simple fetch.");
                            setDriver({
                                id: mappedJob.driver_id,
                                vehicle_type: 'Unknown',
                                vehicle_number: 'N/A',
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
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700`}>
                                <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`}></div>
                                <span className="text-xs font-medium">Driver Online</span>
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
                    <LiveTrackingMap
                        driverId={job.driver_id}
                        pickupLocation={job.pickup_lat && job.pickup_lng ? { lat: job.pickup_lat, lng: job.pickup_lng } : null}
                        dropoffLocation={job.dropoff_lat && job.dropoff_lng ? { lat: job.dropoff_lat, lng: job.dropoff_lng } : null}
                    />
                </div>
            </div>
        </div>
    );
}
