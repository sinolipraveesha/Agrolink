import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    MapPin,
    Navigation,
    Wallet,
    Truck,
    User,
    LogOut,
    Menu,
    X,
    LayoutDashboard,
    LifeBuoy,
    MessageCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import NotificationDropdown from '../common/NotificationDropdown';
import Chatbot from '../IT24100581/Chatbot';

export default function DriverLayout() {
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isChatbotOpen, setIsChatbotOpen] = useState(false);
    const [userId, setUserId] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }
            setUserId(user.id);

            try {
                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('role, status')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (profile.role === 'driver' && profile.status !== 'approved') {
                    navigate('/verification-pending');
                } else if (profile.role !== 'driver' && profile.role !== 'admin') {
                    navigate('/');
                }
            } catch (error) {
                console.error("Error checking driver status:", error);
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
        { path: '/driver/dashboard', label: 'Find Loads', icon: MapPin },
        { path: '/driver/active-trip', label: 'Active Trip', icon: Navigation },
        { path: '/driver/wallet', label: 'My Wallet', icon: Wallet },
        { path: '/driver/vehicle', label: 'Vehicle Profile', icon: Truck },
        { path: '/driver/support', label: 'Driver Support', icon: LifeBuoy },
        { path: '/driver/profile', label: 'My Profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar Overlay for Mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[4900] md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-[5000] w-64 bg-[#0f2815] text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } md:sticky md:top-0 md:h-screen md:translate-x-0 flex flex-col h-full overflow-hidden rounded-r-[40px] shadow-2xl`}
            >
                <div className="flex items-center justify-between p-4 border-b border-[#1a7935]">
                    <div className="flex items-center space-x-2">
                        <Truck className="h-6 w-6 text-[#b0db3d]" />
                        <span className="text-xl font-bold tracking-tight">AgroLink</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="mt-6 px-4 space-y-1 flex-1 overflow-y-auto custom-scrollbar pb-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => {
                                navigate(item.path);
                                if (window.innerWidth < 768) setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname === item.path
                                ? 'bg-[#b0db3d] text-[#1a7935] font-bold shadow-md scale-[1.02]'
                                : 'text-white/70 hover:text-white hover:bg-white/5 hover:translate-x-1'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 transition-transform duration-300 ${location.pathname === item.path ? 'scale-110' : ''}`} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5 bg-[#0f2815] flex-shrink-0 space-y-3">
                    <button
                        onClick={() => {
                            setIsChatbotOpen(true);
                            if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-[#b0db3d] hover:bg-white/5 border border-[#b0db3d]/30 hover:border-[#b0db3d]/50 group"
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
                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 group border border-transparent hover:border-red-500/20"
                    >
                        <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Top Header for Mobile */}
                <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 md:hidden flex items-center justify-between px-4 py-3 z-[4000] sticky top-0">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-800 -ml-2">
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="font-black text-sm text-[#0f2815] ml-2 tracking-tighter uppercase">AgroLink</span>
                    </div>
                    <NotificationDropdown userId={userId} />
                </header>

                {/* Desktop Top Bar */}
                <header className="hidden md:flex bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 justify-between items-center z-[4000] sticky top-0">
                    <h2 className="text-lg font-black text-gray-800 tracking-tight">
                        {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                    </h2>
                    <div className="flex items-center gap-6">
                        <NotificationDropdown userId={userId} />
                        <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Driver</p>
                                <p className="text-xs font-black text-gray-900">Active Session</p>
                            </div>
                            <div className="w-10 h-10 bg-[#1a7935] rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-green-900/10">
                                D
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6">
                    <Outlet />
                </main>
            </div>

            <Chatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
        </div>
    );
}
