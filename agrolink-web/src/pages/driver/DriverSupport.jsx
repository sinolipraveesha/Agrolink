import React from 'react';
import SupportTicketSystem from '../../components/common/SupportTicketSystem';

const DriverSupport = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">Driver Support</h1>
                <p className="text-gray-500">Report issues or contact support.</p>
            </header>
            <SupportTicketSystem />
        </div>
    );
};

export default DriverSupport;
