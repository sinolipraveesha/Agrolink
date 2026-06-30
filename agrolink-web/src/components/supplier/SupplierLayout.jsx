import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, LogOut, Menu, X, Sprout, ShoppingBag, User } from 'lucide-react';
import axios from 'axios';
import { supabase } from '../../lib/supabaseClient';
import NotificationDropdown from '../common/NotificationDropdown';

export default function SupplierLayout() {
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
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
                const res = await axios.get(`/api/profiles/${user.id}`);
                const profile = res.data;

/* 
                if (profile.role === 'supplier' && profile.status !== 'approved') {
                    navigate('/verification-pending');
                } else if (profile.role !== 'supplier' && profile.role !== 'admin') {
                    navigate('/');
                }
*/
            } catch (error) {
                console.error("Error checking status:", error);
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
        return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a7935]"></div></div>;
    }

    const menuItems = [
        { path: '/supplier/dashboard', label: 'Overview', icon: LayoutDashboard },
        { path: '/supplier/products', label: 'My Products', icon: Store },
        { path: '/supplier/orders', label: 'My Sales', icon: ShoppingBag },
        { path: '/supplier/profile', label: 'My Profile', icon: User }
    ];

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1a7935] text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:sticky md:top-0 md:h-screen md:translate-x-0 flex flex-col h-full overflow-hidden rounded-r-[40px] shadow-2xl`}>
                <div className="flex items-center justify-between p-4 border-b border-[#145d29] flex-shrink-0">
                    <div 
                        onClick={() => navigate('/')} 
                        className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                        title="Go to Home"
                    >
                        <Store className="h-8 w-8 text-[#b0db3d]" />
                        <span className="text-2xl font-bold tracking-tight">AgroLink</span>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-8 px-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar pb-4">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname === item.path 
                                ? 'bg-[#b0db3d] text-[#1a7935] font-bold shadow-md scale-[1.02]' 
                                : 'text-white/90 hover:bg-white/10 hover:translate-x-1'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 transition-transform duration-300 ${location.pathname === item.path ? 'scale-110' : ''}`} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 bg-[#1a7935] flex-shrink-0">
                    <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-100/70 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200 group border border-transparent hover:border-red-500/20"
                    >
                        <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between p-4 sticky top-0 z-40">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(true)} className="text-gray-600 mr-4 md:hidden"><Menu className="h-6 w-6" /></button>
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
                    </div>
                    <div className="flex items-center gap-4">
                        <NotificationDropdown userId={userId} />
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold border border-green-200">S</div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
