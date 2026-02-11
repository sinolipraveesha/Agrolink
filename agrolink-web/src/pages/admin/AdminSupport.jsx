import React from 'react';
import SupportTicketSystem from '../../components/common/SupportTicketSystem';

const AdminSupport = () => {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">Support Tickets</h1>
                <p className="text-gray-500">Manage and resolve user issues.</p>
            </header>
            <SupportTicketSystem isAdmin={true} />
        </div>
    );
};

export default AdminSupport;
