import React, { useState } from 'react';
import AdminCategoryManager from '../../components/admin/AdminCategoryManager';
import AdminProductManager from '../../components/admin/AdminProductManager';
import { ShoppingBag, Tags } from 'lucide-react';

export default function AdminFarmersShop() {
    const [activeTab, setActiveTab] = useState('products');

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Farmers Shop Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage agricultural inputs, seeds, and fertilizers.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex space-x-1 w-fit">
                <button
                    onClick={() => setActiveTab('products')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'products'
                        ? 'bg-[#1a7935] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Products</span>
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'categories'
                        ? 'bg-[#1a7935] text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                        }`}
                >
                    <Tags className="h-4 w-4" />
                    <span>Categories</span>
                </button>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'products' ? <AdminProductManager /> : <AdminCategoryManager />}
            </div>
        </div>
    );
}
