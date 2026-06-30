import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Lock, 
    Save, 
    Loader2, 
    CheckCircle, 
    AlertCircle,
    Camera,
    Shield
} from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [profileData, setProfileData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        province: '',
        zipCode: '',
        avatarUrl: '',
        role: ''
    });

    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) return;
            try {
                const res = await axios.get(`/api/profiles/${user.id}`);
                setProfileData({
                    fullName: res.data.fullName || '',
                    email: res.data.email || '',
                    phoneNumber: res.data.phoneNumber || '',
                    addressLine1: res.data.addressLine1 || '',
                    addressLine2: res.data.addressLine2 || '',
                    city: res.data.city || '',
                    province: res.data.province || '',
                    zipCode: res.data.zipCode || '',
                    avatarUrl: res.data.avatarUrl || '',
                    role: res.data.role || ''
                });
            } catch (err) {
                console.error("Failed to fetch profile", err);
                setMessage({ type: 'error', text: 'Failed to load profile data.' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        
        try {
            await axios.put(`/api/profiles/${user.id}`, profileData);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            console.error("Update failed", err);
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ 
                password: passwordData.newPassword 
            });
            if (error) throw error;
            
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error("Password update failed", err);
            setMessage({ type: 'error', text: err.message || 'Failed to update password.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#1a7935]" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900">Profile Settings</h1>
                <p className="text-gray-500">Manage your personal information and security</p>
            </div>

            {/* Notification Message */}
            {message.text && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
                    message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - Avatar & Quick Info */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center text-[#1a7935] text-4xl font-black border-4 border-white shadow-lg overflow-hidden">
                                {profileData.avatarUrl ? (
                                    <img src={profileData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    profileData.fullName.charAt(0).toUpperCase() || 'U'
                                )}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-[#1a7935] text-white rounded-full shadow-lg hover:bg-[#145d29] transition-all">
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-gray-800">{profileData.fullName}</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-1 capitalize">
                            <Shield className="h-3 w-3 text-green-600" /> {profileData.role || 'User'} Account
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-[#1a7935] to-[#145d29] p-6 rounded-3xl text-white shadow-lg">
                        <h3 className="font-bold flex items-center gap-2 mb-2">
                            <CheckCircle className="h-4 w-4" /> Account Status
                        </h3>
                        <p className="text-sm text-green-100 opacity-90">Your account is verified and active. You can list products and accept orders.</p>
                    </div>
                </div>

                {/* Right Column - Forms */}
                <div className="md:col-span-2 space-y-8">
                    {/* Personal Details Form */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <User className="h-5 w-5 text-[#1a7935]" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
                        </div>

                        <form onSubmit={handleProfileUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Full Name</label>
                                    <input 
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#1a7935] outline-none"
                                        value={profileData.fullName}
                                        onChange={e => setProfileData({...profileData, fullName: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Email Address</label>
                                    <div className="flex items-center gap-2 p-3 bg-gray-100 text-gray-500 rounded-xl cursor-not-allowed">
                                        <Mail className="h-4 w-4" />
                                        <span>{profileData.email}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Email cannot be changed</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input 
                                            type="tel"
                                            className="w-full pl-10 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#1a7935] outline-none"
                                            placeholder="+94 7X XXX XXXX"
                                            value={profileData.phoneNumber}
                                            onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-50 pt-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-blue-50 rounded-lg">
                                        <MapPin className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">Address Details</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Address Line 1</label>
                                        <input 
                                            type="text"
                                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#1a7935] outline-none"
                                            value={profileData.addressLine1}
                                            onChange={e => setProfileData({...profileData, addressLine1: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Address Line 2</label>
                                        <input 
                                            type="text"
                                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#1a7935] outline-none"
                                            value={profileData.addressLine2}
                                            onChange={e => setProfileData({...profileData, addressLine2: e.target.value})}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">City</label>
                                            <input 
                                                type="text"
                                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#1a7935] outline-none"
                                                value={profileData.city}
                                                onChange={e => setProfileData({...profileData, city: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Province</label>
                                            <input 
                                                type="text"
                                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#1a7935] outline-none"
                                                value={profileData.province}
                                                onChange={e => setProfileData({...profileData, province: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2 col-span-2 md:col-span-1">
                                            <label className="text-sm font-bold text-gray-700">Zip Code</label>
                                            <input 
                                                type="text"
                                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#1a7935] outline-none"
                                                value={profileData.zipCode}
                                                onChange={e => setProfileData({...profileData, zipCode: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-[#1a7935] text-white rounded-2xl font-bold shadow-lg shadow-green-100 hover:bg-[#145d29] transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" /> Save Changes</>}
                            </button>
                        </form>
                    </div>

                    {/* Security Section */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-lg">
                                <Lock className="h-5 w-5 text-orange-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Security</h3>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">New Password</label>
                                    <input 
                                        type="password"
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Min 6 characters"
                                        value={passwordData.newPassword}
                                        onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Confirm Password</label>
                                    <input 
                                        type="password"
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="Repeat password"
                                        value={passwordData.confirmPassword}
                                        onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-lg shadow-gray-200 hover:bg-black transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update Password"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
