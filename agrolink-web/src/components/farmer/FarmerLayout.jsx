import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    PackagePlus,
    ShoppingBasket,
    Truck,
    Wallet,
    User,
    LogOut,
    Menu,
    X,
    Sprout,
    LifeBuoy,
    Bell,
    MessageCircle,
    ShoppingBag
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useSyncFarmerLocation } from '../../hooks/useFarmerTracking';
import NotificationDropdown from '../common/NotificationDropdown';
import Chatbot from '../IT24100581/Chatbot';

export default function FarmerLayout() {
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Global Location Sync for Farmer
    // This ensures location works on ANY farmer page, not just Orders
    const { location: gpsLocation } = useGeolocation(true);
    useSyncFarmerLocation(gpsLocation, true, 10000);

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }
            setUserId(user.id);

            try {
                // We should use axios for consistency if possible, or direct supabase query
                // Since user is logged in, we can query profiles
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role, status')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

/* 
                if (profile.role === 'farmer' && profile.status !== 'approved') {
                    navigate('/verification-pending');
                } else if (profile.role !== 'farmer' && profile.role !== 'admin') {
                    // Basic role protection (optional but good)
                    navigate('/');
                }
*/
            } catch (error) {
                console.error("Error checking farmer status:", error);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [navigate]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a7935]"></div>
            </div>
        );
    }

    const menuItems = [
        { path: '/farmer/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/farmer/products', label: 'My Products', icon: ShoppingBasket },
        { path: '/farmer/add-product', label: 'Add Product', icon: PackagePlus },
        { path: '/farmer/orders', label: 'Orders', icon: ShoppingBasket },
        { path: '/farmer/purchases', label: 'My Purchases', icon: ShoppingBag },
        { path: '/farmer/requests', label: 'Buyer Requests', icon: Bell },
        { path: '/farmer/wallet', label: 'My Wallet', icon: Wallet },
        { path: '/farmer/insights', label: 'AI Crop Advisor', icon: Sprout },
        { path: '/farmer/profile', label: 'Profile', icon: User },
        { path: '/farmer/support', label: 'Support', icon: LifeBuoy },
    ];

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a7935] text-white transform transition-transform duration-300 ease-in-out flex flex-col rounded-r-[40px] shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:sticky md:top-0 md:h-screen md:translate-x-0`}
            >
                <div className="flex items-center justify-between p-4 border-b border-[#145d29]">
                    <div 
                        className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" 
                        onClick={() => navigate('/')}
                    >
                        <Sprout className="h-8 w-8 text-[#b0db3d]" />
                        <span className="text-2xl font-bold tracking-tight">AgroLink</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-4 px-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar pb-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname === item.path
                                ? 'bg-[#b0db3d] text-[#1a7935] font-bold shadow-md scale-[1.02]'
                                : 'text-white/90 hover:bg-white/10 hover:translate-x-1'
                                }`}
                        >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}

                    <div className="pt-4 mt-4 border-t border-white/10 space-y-1">
                        <button
                            onClick={() => setIsChatbotOpen(true)}
                            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-[#b0db3d] hover:bg-white/10 border border-[#b0db3d]/30 hover:border-[#b0db3d]/50 group"
                        >
                            <div className="relative">
                                <MessageCircle className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#b0db3d] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b0db3d]"></span>
                                </span>
                            </div>
                            <span className="font-bold tracking-wide">AI Assistant</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-red-100/70 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200 group border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-bold">Log Out</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Top Header for Mobile */}
                <header className="bg-white/80 backdrop-blur-md shadow-sm md:hidden flex items-center justify-between px-4 py-3 z-40 sticky top-0">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(true)} className="text-gray-600 mr-4">
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="font-bold text-[#1a7935]">Dashboard</span>
                    </div>
                    <NotificationDropdown userId={userId} />
                </header>

                {/* Desktop Top Bar (Optional but good for notifications) */}
                <header className="hidden md:flex bg-white/80 backdrop-blur-md shadow-sm p-4 justify-between items-center z-40 sticky top-0">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {(() => {
                            const item = menuItems.find(i => i.path === location.pathname);
                            const Icon = item?.icon;
                            return (
                                <>
                                    {Icon && <Icon className="h-6 w-6 text-[#1a7935]" />}
                                    <span>{item?.label || 'Dashboard'}</span>
                                </>
                            );
                        })()}
                    </h2>
                    <div className="flex items-center gap-4">
                        <NotificationDropdown userId={userId} />
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold border border-green-200">
                            F
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>

            <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
        </div>
    );
}
