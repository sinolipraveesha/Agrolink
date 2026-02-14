import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, CheckCircle, AlertCircle, Loader2, Truck } from 'lucide-react';

export default function VerificationPending() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [nicFront, setNicFront] = useState(null);
    const [nicBack, setNicBack] = useState(null);
    const [proofPhoto, setProofPhoto] = useState(null);
    const [vehiclePhoto, setVehiclePhoto] = useState(null);
    const [vehiclePlatePhoto, setVehiclePlatePhoto] = useState(null);

    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/register');
                return;
            }
            setUser(user);

            try {
                const res = await axios.get(`/api/profiles/${user.id}`);
                setProfile(res.data);
                if (res.data.status === 'submitted') {
                    setSubmitted(true);
                } else if (res.data.status === 'approved') {
                    // Redirect based on role
                    if (res.data.role === 'farmer') navigate('/farmer/dashboard');
                    else if (res.data.role === 'driver') navigate('/driver/dashboard');
                    else navigate('/');
                }
            } catch (e) {
                console.error("Error fetching profile", e);
            }
        };
        checkUser();
    }, [navigate]);

    const handleUpload = async (file, path) => {
        const { data, error } = await supabase.storage
            .from('verification_docs')
            .upload(`${user.id}/${path}-${Date.now()}`, file);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('verification_docs')
            .getPublicUrl(data.path);
        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nicFront || !nicBack || !proofPhoto) {
            alert("Please upload all required personal documents.");
            return;
        }
        if (profile.role === 'driver' && (!vehiclePhoto || !vehiclePlatePhoto)) {
            alert("Please upload all required vehicle documents.");
            return;
        }
        setUploading(true);

        try {
            const nicFrontUrl = await handleUpload(nicFront, 'nic_front');
            const nicBackUrl = await handleUpload(nicBack, 'nic_back');
            const proofUrl = await handleUpload(proofPhoto, 'proof_photo');

            let vehiclePhotoUrl = null;
            let vehiclePlatePhotoUrl = null;

            if (profile.role === 'driver') {
                if (!vehiclePhoto || !vehiclePlatePhoto) {
                    // Safety check, though pre-validation handles this
                    setUploading(false);
                    alert("Please upload vehicle documents.");
                    return;
                }
                vehiclePhotoUrl = await handleUpload(vehiclePhoto, 'vehicle_photo');
                vehiclePlatePhotoUrl = await handleUpload(vehiclePlatePhoto, 'vehicle_plate_photo');
            }

            await axios.put(`/api/profiles/${user.id}/submit-verification`, {
                nicFrontUrl,
                nicBackUrl,
                proofPhotoUrl: proofUrl,
                vehiclePhotoUrl,
                vehiclePlatePhotoUrl
            });

            setSubmitted(true);
            setUploading(false);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please try again.");
            setUploading(false);
        }
    };

    if (!profile) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-[#1a7935]" /></div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">

                    <div className="text-center mb-8">
                        {submitted ? (
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        ) : (
                            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
                        )}

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            {submitted ? "Submission Received" : "Account Verification Required"}
                        </h2>
                        <h3 className="text-lg font-medium text-gray-700 mb-4">
                            {submitted ? "අයදුම්පත ලැබුණි" : "ගිණුම තහවුරු කිරීම අවශ්‍යයි"}
                        </h3>

                        <p className="text-gray-600 mb-2">
                            {submitted
                                ? "Your documents have been submitted for review. Ideally this takes 24-48 hours. You will be notified once verified."
                                : "To ensure safety, we need to verify your identity. Please upload your NIC and a photo as requested below."}
                        </p>
                        <p className="text-gray-500 text-sm">
                            {submitted
                                ? "ඔබගේ ලියකියවිලි සමාලෝචනය සඳහා යොමු කර ඇත. මෙය තහවුරු වූ වහාම ඔබට දැනුම් දෙනු ලැබේ."
                                : "ඔබගේ ආරක්ෂාව සඳහා අපට ඔබගේ අනන්‍යතාවය තහවුරු කිරීමට අවශ්‍ය වේ. කරුණාකර ජාතික හැඳුනුම්පත සහ ඡායාරූපයක් පහත පරිදි ඇතුළත් කරන්න."}
                        </p>
                    </div>

                    {!submitted && (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* NIC Front */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">NIC Front Side / ජා.හැ. ඉදිරිපස</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#1a7935] transition-colors">
                                    <div className="space-y-1 text-center">
                                        {nicFront ? (
                                            <p className="text-sm text-[#1a7935] font-semibold">{nicFront.name}</p>
                                        ) : (
                                            <>
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="flex text-sm text-gray-600">
                                                    <label htmlFor="nic-front" className="relative cursor-pointer bg-white rounded-md font-medium text-[#1a7935] hover:text-[#145d29]">
                                                        <span>Upload a file</span>
                                                        <input id="nic-front" name="nic-front" type="file" className="sr-only" onChange={(e) => setNicFront(e.target.files[0])} accept="image/*" />
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* NIC Back */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">NIC Back Side / ජා.හැ. පසුපස</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#1a7935] transition-colors">
                                    <div className="space-y-1 text-center">
                                        {nicBack ? (
                                            <p className="text-sm text-[#1a7935] font-semibold">{nicBack.name}</p>
                                        ) : (
                                            <>
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="flex text-sm text-gray-600">
                                                    <label htmlFor="nic-back" className="relative cursor-pointer bg-white rounded-md font-medium text-[#1a7935] hover:text-[#145d29]">
                                                        <span>Upload a file</span>
                                                        <input id="nic-back" name="nic-back" type="file" className="sr-only" onChange={(e) => setNicBack(e.target.files[0])} accept="image/*" />
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Proof Photo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo (Selfie) / ඔබේ ඡායාරූපයක්</label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#1a7935] transition-colors">
                                    <div className="space-y-1 text-center">
                                        {proofPhoto ? (
                                            <p className="text-sm text-[#1a7935] font-semibold">{proofPhoto.name}</p>
                                        ) : (
                                            <>
                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                <div className="flex text-sm text-gray-600">
                                                    <label htmlFor="proof-photo" className="relative cursor-pointer bg-white rounded-md font-medium text-[#1a7935] hover:text-[#145d29]">
                                                        <span>Upload a file</span>
                                                        <input id="proof-photo" name="proof-photo" type="file" className="sr-only" onChange={(e) => setProofPhoto(e.target.files[0])} accept="image/*" />
                                                    </label>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Driver Specific Uploads */}
                            {profile.role === 'driver' && (
                                <>
                                    <div className="border-t border-gray-200 pt-6">
                                        <h3 className="text-sm font-medium text-gray-900 mb-4">Vehicle Verification / වාහන තහවුරු කිරීම</h3>

                                        {/* Vehicle Photo */}
                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Photo of Vehicle / වාහනයේ ඡායාරූපය</label>
                                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#1a7935] transition-colors">
                                                <div className="space-y-1 text-center">
                                                    {vehiclePhoto ? (
                                                        <p className="text-sm text-[#1a7935] font-semibold">{vehiclePhoto.name}</p>
                                                    ) : (
                                                        <>
                                                            <Truck className="mx-auto h-12 w-12 text-gray-400" />
                                                            <div className="flex text-sm text-gray-600">
                                                                <label htmlFor="vehicle-photo" className="relative cursor-pointer bg-white rounded-md font-medium text-[#1a7935] hover:text-[#145d29]">
                                                                    <span>Upload a file</span>
                                                                    <input id="vehicle-photo" name="vehicle-photo" type="file" className="sr-only" onChange={(e) => setVehiclePhoto(e.target.files[0])} accept="image/*" />
                                                                </label>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Number Plate Photo */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Number Plate Photo / අංක තහඩුවේ ඡායාරූපය</label>
                                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[#1a7935] transition-colors">
                                                <div className="space-y-1 text-center">
                                                    {vehiclePlatePhoto ? (
                                                        <p className="text-sm text-[#1a7935] font-semibold">{vehiclePlatePhoto.name}</p>
                                                    ) : (
                                                        <>
                                                            <div className="mx-auto h-12 w-16 bg-gray-200 border-2 border-gray-400 rounded flex items-center justify-center text-gray-500 font-bold">WP</div>
                                                            <div className="flex text-sm text-gray-600 mt-2">
                                                                <label htmlFor="plate-photo" className="relative cursor-pointer bg-white rounded-md font-medium text-[#1a7935] hover:text-[#145d29]">
                                                                    <span>Upload a file</span>
                                                                    <input id="plate-photo" name="plate-photo" type="file" className="sr-only" onChange={(e) => setVehiclePlatePhoto(e.target.files[0])} accept="image/*" />
                                                                </label>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1a7935] hover:bg-[#145d29] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a7935] disabled:opacity-50"
                            >
                                {uploading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Submit for Verification / තහවුරු කිරීමට යොමු කරන්න'}
                            </button>
                        </form>
                    )}

                    {submitted && (
                        <div className="mt-6">
                            <button onClick={() => navigate('/')} className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                Back to Home / මුල් පිටුවට
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
