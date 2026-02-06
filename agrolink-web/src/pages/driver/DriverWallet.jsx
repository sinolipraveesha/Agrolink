import React from 'react';
import { Wallet, TrendingUp, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function DriverWallet() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">My Earnings</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1a7935] text-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Total Balance</p>
                            <h2 className="text-3xl font-bold mt-1">Rs. 45,250</h2>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Wallet className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-100">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        <span>+12% from last month</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Today's Earnings</p>
                            <h2 className="text-3xl font-bold mt-1 text-gray-800">Rs. 8,500</h2>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        2 Trips Completed
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Pending Payouts</p>
                            <h2 className="text-3xl font-bold mt-1 text-gray-800">Rs. 0</h2>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
                        All clear
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Recent Transactions</h3>
                </div>
                <div className="divide-y divide-gray-100">
                    {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-[#1a7935]">
                                    <ArrowDownLeft className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">Delivery Payment</p>
                                    <p className="text-xs text-gray-500">Trip #1023 • Dambulla to Colombo</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-[#1a7935]">+ Rs. 5,000.00</p>
                                <p className="text-xs text-gray-400">Today, 2:30 PM</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
