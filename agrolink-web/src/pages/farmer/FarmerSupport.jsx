import React from 'react';
import SupportTicketSystem from '../../components/common/SupportTicketSystem';

const FarmerSupport = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">Support Center</h1>
                <p className="text-gray-500">Need help? Chat with our support team.</p>
            </header>
            <SupportTicketSystem />
        </div>
    );
};

export default FarmerSupport;
