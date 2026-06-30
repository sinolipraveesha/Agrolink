import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import { User, Truck, Sprout, ShoppingBag, Loader2, Store, CreditCard, Phone, Mail, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { validationRules } from '../lib/validation';

const roles = [
    { id: 'farmer', label: 'Farmer', icon: Sprout, description: 'Sell your harvest directly to buyers.' },
    { id: 'buyer', label: 'Buyer', icon: ShoppingBag, description: 'Purchase fresh produce easily.' },
    { id: 'driver', label: 'Driver', icon: Truck, description: 'Earn money by delivering products.' },
    { id: 'supplier', label: 'Supplier', icon: Store, description: 'Supply essential items for Farmers.' }
];

const buyerTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'retail_shop', label: 'Retail Shop' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'individual', label: 'Individual' },
    { value: 'other', label: 'Other' }
];

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [buyerType, setBuyerType] = useState('');
    const [nic, setNic] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');

    // Driver Details
    const [vehicleType, setVehicleType] = useState('lorry');
    const [vehicleModel, setVehicleModel] = useState('');
    const [vehiclePlateNumber, setVehiclePlateNumber] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    const sliderImages = [
        "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=1920",
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1920",
        "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1920"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!selectedRole) {
            setError('Please select a role.');
            return;
        }
        if (selectedRole === 'buyer' && !buyerType) {
            setError('Please select a buyer type.');
            return;
        }
        if (selectedRole === 'driver' && (!vehicleType || !vehicleModel || !vehiclePlateNumber)) {
            setError('Please fill in all vehicle details.');
            return;
        }

        // --- SRI LANKAN VALIDATION ---
        if (!validationRules.nic.test(nic)) {
            setError('Invalid NIC format. (Legacy: 9 dig + V/X, Modern: 12 dig)');
            return;
        }
        if (!validationRules.mobile.test(phoneNumber)) {
            setError('Invalid Phone Number format. (e.g., 0771234567)');
            return;
        }

        // --- PASSWORD VALIDATION ---
        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }
        if (!/(?=.*[a-z])/.test(password) || !/(?=.*[A-Z])/.test(password) || !/(?=.*\d)/.test(password)) {
            setError('Password must include uppercase, lowercase, and a number.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            if (authData.user) {
                const profileData = {
                    id: authData.user.id,
                    email: email,
                    fullName: fullName,
                    role: selectedRole,
                    nic: nic,
                    phoneNumber: phoneNumber,
                    buyerType: selectedRole === 'buyer' ? buyerType : null,
                    vehicleType: selectedRole === 'driver' ? vehicleType : null,
                    vehicleModel: selectedRole === 'driver' ? vehicleModel : null,
                    vehiclePlateNumber: selectedRole === 'driver' ? vehiclePlateNumber : null,
                    status: selectedRole === 'buyer' ? 'approved' : 'pending'
                };

                await axios.post('/api/profiles', profileData);
                setMessage('Registration successful! Redirecting...');
                setTimeout(() => {
                    if (selectedRole === 'buyer') navigate('/');
                    else navigate('/verification-pending');
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side: Image Slider (Hidden on mobile) */}
            <div className="hidden lg:block lg:w-1/3 relative overflow-hidden rounded-r-[40px] shadow-xl">
                {sliderImages.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            index === currentSlide ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <img
                            src={img}
                            alt="AgroLink Background"
                            className="w-full h-full object-cover scale-105 animate-slow-zoom"
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"></div>
                    </div>
                ))}
                
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-8 text-center z-10">
                    <h1 className="text-5xl font-bold mb-6 tracking-tighter">Join AgroLink</h1>
                    <p className="text-lg font-medium text-white/90 leading-relaxed">
                        ශ්‍රී ලංකාවේ කෘෂිකාර්මික විප්ලවයේ කොටස්කරුවෙකු වන්න.
                    </p>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {sliderImages.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}></div>
                    ))}
                </div>
            </div>

            {/* Right Side: Register Form */}
            <div className="w-full lg:w-2/3 flex flex-col px-6 sm:px-12 lg:px-16 py-12 relative bg-white overflow-y-auto max-h-screen custom-scrollbar">
                {/* Back Link */}
                <Link to="/" className="mb-8 flex items-center text-gray-500 hover:text-[#1a7935] transition-colors font-bold text-sm">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Home
                </Link>

                <div className="max-w-2xl w-full mx-auto">
                    <div className="mb-8">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Create your account</h2>
                        <p className="text-gray-500 font-medium text-lg">Join the largest agricultural community in Sri Lanka</p>
                    </div>

                    <form className="space-y-8" onSubmit={handleRegister}>
                        {/* Role Selection - More prominent */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <label className="block text-base font-bold text-gray-800 mb-4">What is your role?</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {roles.map((role) => (
                                    <div
                                        key={role.id}
                                        onClick={() => setSelectedRole(role.id)}
                                        className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all group ${
                                            selectedRole === role.id
                                                ? 'border-[#1a7935] bg-[#e8f5e9]/50 shadow-md ring-1 ring-[#1a7935]'
                                                : 'border-gray-100 hover:border-gray-200 bg-gray-50/50'
                                        }`}
                                    >
                                        <role.icon className={`h-8 w-8 mb-3 transition-transform group-hover:scale-110 ${selectedRole === role.id ? 'text-[#1a7935]' : 'text-gray-400'}`} />
                                        <span className={`text-sm font-bold ${selectedRole === role.id ? 'text-[#1a7935]' : 'text-gray-600'}`}>
                                            {role.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Full Name</label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1a7935] transition-colors">
                                        <User className="h-5 w-5" />
                                    </span>
                                    <input
                                        type="text" required value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#1a7935]/10 focus:border-[#1a7935] outline-none transition-all font-medium"
                                        placeholder="Aruna Perera"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Email Address</label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1a7935] transition-colors">
                                        <Mail className="h-5 w-5" />
                                    </span>
                                    <input
                                        type="email" required value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#1a7935]/10 focus:border-[#1a7935] outline-none transition-all font-medium"
                                        placeholder="aruna@example.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 ml-1">NIC Number</label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1a7935] transition-colors">
                                        <CreditCard className="h-5 w-5" />
                                    </span>
                                    <input
                                        type="text" required value={nic}
                                        onChange={(e) => setNic(e.target.value.toUpperCase())}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#1a7935]/10 focus:border-[#1a7935] outline-none transition-all font-medium"
                                        placeholder="1995XXXXXXXX"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-gray-700 ml-1">Phone Number</label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1a7935] transition-colors">
                                        <Phone className="h-5 w-5" />
                                    </span>
                                    <input
                                        type="tel" required value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#1a7935]/10 focus:border-[#1a7935] outline-none transition-all font-medium"
                                        placeholder="07XXXXXXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 ml-1">Security Password</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1a7935] transition-colors">
                                    <Lock className="h-5 w-5" />
                                </span>
                                <input
                                    type="password" required value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#1a7935]/10 focus:border-[#1a7935] outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Conditional Sections */}
                        {selectedRole === 'buyer' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in-up">
                                <label className="block text-sm font-bold text-gray-800 mb-4">Select Buyer Type</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {buyerTypes.map((type) => (
                                        <div
                                            key={type.value}
                                            onClick={() => setBuyerType(type.value)}
                                            className={`cursor-pointer border-2 rounded-xl py-3 px-4 text-center transition-all font-bold text-sm ${
                                                buyerType === type.value
                                                    ? 'border-[#1a7935] bg-[#e8f5e9] text-[#1a7935]'
                                                    : 'border-gray-50 bg-gray-50/50 text-gray-600 hover:border-gray-200'
                                            }`}
                                        >
                                            {type.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedRole === 'driver' && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-fade-in-up">
                                <h3 className="font-bold text-gray-800 border-b pb-2">Vehicle Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Vehicle Type</label>
                                        <select
                                            value={vehicleType}
                                            onChange={(e) => setVehicleType(e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-[#1a7935] outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#1a7935]"
                                        >
                                            <option value="lorry">Lorry</option>
                                            <option value="batta">Batta</option>
                                            <option value="trishaw">Trishaw</option>
                                            <option value="van">Van</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Vehicle Model</label>
                                        <input
                                            type="text" required value={vehicleModel}
                                            onChange={(e) => setVehicleModel(e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#1a7935]"
                                            placeholder="Tata Ace"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Plate Number</label>
                                        <input
                                            type="text" required value={vehiclePlateNumber}
                                            onChange={(e) => setVehiclePlateNumber(e.target.value.toUpperCase())}
                                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold outline-none ring-1 ring-gray-100 focus:ring-2 focus:ring-[#1a7935] uppercase"
                                            placeholder="WP ABC-1234"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 font-bold rounded-xl text-center">{error}</div>}
                        {message && <div className="p-4 bg-green-50 border border-green-100 text-green-600 font-bold rounded-xl text-center">{message}</div>}

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-[#1a7935] text-white rounded-2xl font-bold text-xl shadow-xl shadow-green-900/20 hover:bg-[#145d29] hover:shadow-2xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center disabled:opacity-70 group"
                            >
                                {loading ? <Loader2 className="animate-spin h-7 w-7" /> : (
                                    <>
                                        Create Account
                                        <ChevronRight className="h-6 w-6 ml-2 transition-transform group-hover:translate-x-1" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="mt-12 text-center text-gray-600 font-medium text-lg">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#1a7935] font-bold hover:underline">
                            Sign In Here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
