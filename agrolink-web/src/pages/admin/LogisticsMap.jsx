import React from 'react';
import { MapPin, Truck, Navigation } from 'lucide-react';

export default function LogisticsMap() {
    const drivers = [
        { id: 1, name: 'Saman Kumara', location: 'Dambulla', status: 'En Route', lat: '7.8731', lng: '80.7718' },
        { id: 2, name: 'Kamal Perera', location: 'Colombo', status: 'Idle', lat: '6.9271', lng: '79.8612' },
        { id: 3, name: 'Nimal Siripala', location: 'Kandy', status: 'Loading', lat: '7.2906', lng: '80.6337' },
    ];

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Live Logistics Tracking / රියදුරු සෙවීම</h1>
                <div className="flex space-x-2">
                    <span className="flex items-center text-sm"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span> Active</span>
                    <span className="flex items-center text-sm"><span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span> Idle</span>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex">
                {/* Sidebar List */}
                <div className="w-80 border-r border-gray-100 bg-gray-50 overflow-y-auto">
                    <div className="p-4">
                        <h3 className="font-bold text-gray-700 mb-4">Active Drivers</h3>
                        <div className="space-y-3">
                            {drivers.map(driver => (
                                <div key={driver.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-[#1a7935]">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center">
                                            <div className="bg-blue-100 p-2 rounded-full mr-3">
                                                <Truck className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-gray-900">{driver.name}</p>
                                                <p className="text-xs text-gray-500">{driver.status}</p>
                                            </div>
                                        </div>
                                        {driver.status === 'En Route' && <span className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></span>}
                                    </div>
                                    <div className="mt-2 flex items-center text-xs text-gray-400">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {driver.location}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Map Area (Mockup) */}
                <div className="flex-1 bg-blue-50 relative">
                    {/* This would be the Leaflet Map container */}
                    <div className="absolute inset-0 flex items-center justify-center bg-[#e5e7eb] opacity-50">
                        <p className="text-gray-500 font-bold text-xl">Interactive Map Component</p>
                    </div>

                    {/* Mock Pins */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-10 -translate-y-10 group cursor-pointer">
                        <div className="bg-[#1a7935] text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                            <Truck className="h-5 w-5" />
                        </div>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white px-2 py-1 rounded shadow text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Saman Kumara
                        </div>
                    </div>

                    <div className="absolute top-1/3 left-1/3 transform group cursor-pointer">
                        <div className="bg-gray-600 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
                            <Truck className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
