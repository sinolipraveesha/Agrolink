import React, { useState } from 'react';
import SupplierProductManager from '../../components/supplier/SupplierProductManager';
import { Store, Package, Clock } from 'lucide-react';

export default function SupplierDashboard() {
    const [activeFilter, setActiveFilter] = useState('all');

    return (
        <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                    onClick={() => setActiveFilter('all')}
                    className={`p-6 rounded-xl shadow-sm border transition-all flex items-center justify-between text-left ${activeFilter === 'all' ? 'bg-green-50 border-green-200 ring-2 ring-green-100' : 'bg-white border-gray-100 hover:border-green-100'}`}
                >
                    <div>
                        <p className="text-sm font-medium text-gray-500">My Products</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">Manage</h3>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${activeFilter === 'all' ? 'bg-green-100' : 'bg-gray-50'}`}>
                        <Package className={`h-6 w-6 ${activeFilter === 'all' ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                </button>
                
                <button 
                    onClick={() => setActiveFilter('pending')}
                    className={`p-6 rounded-xl shadow-sm border transition-all flex items-center justify-between text-left ${activeFilter === 'pending' ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-100' : 'bg-white border-gray-100 hover:border-orange-100'}`}
                >
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">Status</h3>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${activeFilter === 'pending' ? 'bg-orange-100' : 'bg-gray-50'}`}>
                        <Clock className={`h-6 w-6 ${activeFilter === 'pending' ? 'text-orange-600' : 'text-gray-400'}`} />
                    </div>
                </button>

                <button 
                    onClick={() => setActiveFilter('stock')}
                    className={`p-6 rounded-xl shadow-sm border transition-all flex items-center justify-between text-left ${activeFilter === 'stock' ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-100' : 'bg-white border-gray-100 hover:border-blue-100'}`}
                >
                    <div>
                        <p className="text-sm font-medium text-gray-500">Farmers Shop</p>
                        <h3 className="text-2xl font-bold text-gray-800 mt-1">Stock Manage</h3>
                    </div>
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${activeFilter === 'stock' ? 'bg-blue-100' : 'bg-gray-50'}`}>
                        <Store className={`h-6 w-6 ${activeFilter === 'stock' ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                </button>
            </div>

            <div className="mt-8">
                <SupplierProductManager filter={activeFilter} />
            </div>
        </div>
    );
}
