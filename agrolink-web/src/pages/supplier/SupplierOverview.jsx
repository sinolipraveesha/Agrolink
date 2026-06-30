import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
    TrendingUp, Users, ShoppingBag, DollarSign, 
    ArrowUpRight, ArrowDownRight, Package, 
    CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

export default function SupplierOverview() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalSales: 0,
        totalRevenue: 0,
        activeProducts: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.id) return;
            try {
                // Fetch orders to calculate sales and revenue
                const ordersRes = await axios.get(`/api/farmershop-orders?sellerId=${user.id}`);
                const orders = ordersRes.data || [];
                
                // Fetch products count
                const productsRes = await axios.get(`/api/farmershop-products/seller/${user.id}`);
                const products = productsRes.data || [];

                const revenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                const pending = orders.filter(o => o.status === 'pending').length;

                setStats({
                    totalSales: orders.length,
                    totalRevenue: revenue,
                    activeProducts: products.length,
                    pendingOrders: pending
                });
            } catch (error) {
                console.error("Failed to fetch supplier stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user?.id]);

    const statCards = [
        { 
            label: 'Total Revenue', 
            value: `Rs. ${stats.totalRevenue.toLocaleString()}`, 
            icon: DollarSign, 
            color: 'text-green-600', 
            bg: 'bg-green-50',
            trend: '+12.5%',
            isPositive: true
        },
        { 
            label: 'Total Sales', 
            value: stats.totalSales, 
            icon: ShoppingBag, 
            color: 'text-blue-600', 
            bg: 'bg-blue-50',
            trend: '+5.2%',
            isPositive: true
        },
        { 
            label: 'Active Products', 
            value: stats.activeProducts, 
            icon: Package, 
            color: 'text-purple-600', 
            bg: 'bg-purple-50',
            trend: 'Stable',
            isPositive: true
        },
        { 
            label: 'Pending Orders', 
            value: stats.pendingOrders, 
            icon: Clock, 
            color: 'text-orange-600', 
            bg: 'bg-orange-50',
            trend: stats.pendingOrders > 0 ? 'Action Needed' : 'All Clear',
            isPositive: stats.pendingOrders === 0
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#1a7935]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800">Business Overview</h1>
                    <p className="text-gray-500 font-medium">Welcome back! Here's how your shop is performing today.</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm text-sm font-bold text-gray-600 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Live Updates
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-bold ${stat.isPositive ? 'text-green-600' : 'text-orange-600'}`}>
                                    {stat.trend}
                                    {stat.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                                <h3 className="text-2xl font-black text-gray-800 mt-1">{stat.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity or Chart Placeholder */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-full relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-[#1a7935]" /> Sales Analytics
                            </h3>
                            <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                                <div className="text-center">
                                    <TrendingUp className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Analytics Coming Soon</p>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#1a7935]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    </div>
                </div>

                {/* Quick Actions / Tips */}
                <div className="space-y-6">
                    <div className="bg-[#1a7935] p-8 rounded-3xl text-white shadow-xl shadow-green-500/10 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-lg font-black mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-[#b0db3d]" /> Seller Pro-Tip
                            </h3>
                            <p className="text-white/80 text-sm leading-relaxed mb-6 font-medium">
                                Fast deliveries lead to better reviews. Orders shipped within 24 hours receive 30% more positive feedback!
                            </p>
                            <button className="w-full py-3 bg-white text-[#1a7935] rounded-xl font-bold text-sm hover:bg-[#b0db3d] transition-colors shadow-lg">
                                View Shipping Tips
                            </button>
                        </div>
                        {/* Abstract background shape */}
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-black text-gray-800 mb-6">Quick Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <span className="text-sm font-bold text-gray-700">Shop Identity</span>
                                </div>
                                <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase">Verified</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl opacity-60">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                    <span className="text-sm font-bold text-gray-700">Complete Profile</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full uppercase">Pending</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
