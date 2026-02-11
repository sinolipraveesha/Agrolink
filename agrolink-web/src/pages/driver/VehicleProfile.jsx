import React, { useState, useEffect } from 'react';
import { Truck, Save } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';

export default function VehicleProfile() {
    const { user } = useAuth();
    const [vehicle, setVehicle] = useState({
        type: 'lorry',
        plateNumber: '',
        capacity: '',
        model: ''
    });

    useEffect(() => {
        if (user?.id) {
            supabase.from('driver_profiles')
                .select('*')
                .eq('id', user.id)
                .single()
                .then(({ data, error }) => {
                    if (data) {
                        setVehicle({
                            type: data.vehicle_type || 'lorry',
                            plateNumber: data.license_plate || '',
                            model: '', // Not in DB yet
                            capacity: '' // Not in DB yet
                        });
                    }
                });
        }
    }, [user]);

    const handleChange = (e) => {
        setVehicle({ ...vehicle, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('driver_profiles')
                .upsert({
                    id: user.id,
                    vehicle_type: vehicle.type,
                    license_plate: vehicle.plateNumber,
                    // Store other fields if schema updated
                });

            if (error) throw error;
            alert("Vehicle Details Updated Successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to update profile.");
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Vehicle Profile</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center mb-6">
                        <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                            <Truck className="h-10 w-10 text-gray-400" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                        <select
                            name="type"
                            value={vehicle.type}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a7935] focus:outline-none"
                        >
                            <option value="lorry">Lorry (Large Truck)</option>
                            <option value="batta">Batta (Small Truck)</option>
                            <option value="trishaw">Three-Wheeler</option>
                            <option value="van">Van</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                        <input
                            type="text"
                            name="model"
                            value={vehicle.model}
                            onChange={handleChange}
                            placeholder="e.g. Tata Ace, Isuzu Elf"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a7935] focus:outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">License Plate Number</label>
                            <input
                                type="text"
                                name="plateNumber"
                                value={vehicle.plateNumber}
                                onChange={handleChange}
                                placeholder="e.g. WP ABC-1234"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a7935] focus:outline-none uppercase"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity (kg)</label>
                            <input
                                type="number"
                                name="capacity"
                                value={vehicle.capacity}
                                onChange={handleChange}
                                placeholder="e.g. 1000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a7935] focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="w-full py-3 bg-[#1a7935] text-white rounded-lg font-bold hover:bg-[#145d29] transition-colors flex items-center justify-center gap-2"
                        >
                            <Save className="h-5 w-5" /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
