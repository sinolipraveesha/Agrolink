import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2, Lock, Mail, ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);

    const sliderImages = [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1920",
        "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&q=80&w=1920",
        "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=1920"
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;
            navigate('/');
        } catch (err) {
            console.error("Login Check Error:", err);
            if (err.message.includes("Invalid login credentials") || err.status === 400) {
                setError("Invalid Email or Password. Please try again.");
            } else {
                setError(err.message || 'Login failed. Please check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white font-sans">
            {/* Left Side: Image Slider (Hidden on mobile) */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden rounded-r-[40px] shadow-xl">
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
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
                    </div>
                ))}
                
                {/* Branding on Image */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-12 text-center z-10">
                    <h1 className="text-6xl font-bold mb-6 tracking-tighter">AgroLink</h1>
                    <p className="text-xl font-medium text-white/90 max-w-md leading-relaxed">
                        ශ්‍රී ලංකාවේ විශ්වාසවන්තම කෘෂිකාර්මික ජාලය සමඟ අදම සම්බන්ධ වන්න.
                    </p>
                </div>

                {/* Progress Indicators */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                    {sliderImages.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-10 bg-white' : 'w-2 bg-white/40'}`}
                        ></div>
                    ))}
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-20 py-12 relative bg-white">
                {/* Back to Home Button */}
                <Link to="/" className="absolute top-8 left-8 sm:left-12 flex items-center text-gray-500 hover:text-[#1a7935] transition-colors font-medium">
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Back to Home
                </Link>

                <div className="max-w-md w-full mx-auto">
                    <div className="mb-10">
                        <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Welcome Back</h2>
                        <p className="text-gray-500 font-medium">Sign in to your AgroLink account</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1a7935] transition-colors">
                                    <Mail className="h-5 w-5" />
                                </span>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#1a7935]/10 focus:border-[#1a7935] outline-none transition-all font-medium"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-700">Password</label>
                                <a href="#" className="text-sm font-bold text-[#1a7935] hover:underline">Forgot?</a>
                            </div>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#1a7935] transition-colors">
                                    <Lock className="h-5 w-5" />
                                </span>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-[#1a7935]/10 focus:border-[#1a7935] outline-none transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-xl animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#1a7935] text-white rounded-xl font-bold text-lg shadow-lg shadow-green-900/20 hover:bg-[#145d29] hover:shadow-xl transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center justify-center disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin h-6 w-6" /> : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-gray-600 font-medium">
                        New to AgroLink?{' '}
                        <Link to="/register" className="text-[#1a7935] font-bold hover:underline">
                            Create an Account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
