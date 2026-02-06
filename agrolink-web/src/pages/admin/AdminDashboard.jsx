import React from 'react';
import { Users, ShoppingBag, DollarSign, TrendingUp, BarChart } from 'lucide-react';

export default function AdminDashboard() {
    const stats = [
        { label: 'Total Users', value: '1,234', icon: Users, change: '+12%', color: 'blue' },
        { label: 'Total Sales', value: 'Rs. 4.5M', icon: DollarSign, change: '+23%', color: 'green' },
        { label: 'Active Orders', value: '56', icon: ShoppingBag, change: '-5%', color: 'orange' },
        { label: 'Monthly Growth', value: '18%', icon: TrendingUp, change: '+2%', color: 'purple' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
                <div className="flex space-x-2">
                    <button className="bg-white px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Filter: This Month</button>
                    <button className="bg-[#0f2815] px-4 py-2 rounded-lg text-sm text-white hover:bg-[#1a4a26]">Download Report</button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                            <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                                {stat.change}
                            </span>
                            <span className="text-gray-400 ml-2">vs last month</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Placeholder area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Monthly Revenue</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm">Revenue Chart (Coming Soon)</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">Top Selling Vegetables</h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 text-sm">Products Chart (Coming Soon)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
