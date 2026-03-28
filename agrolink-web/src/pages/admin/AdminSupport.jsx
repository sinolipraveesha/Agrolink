import React, { useState } from 'react';
import SupportTicketSystem from '../../components/common/SupportTicketSystem';
import AdminKnowledgeBase from '../../components/admin/AdminKnowledgeBase';
import { Ticket, BookOpen } from 'lucide-react';

const TABS = [
    { id: 'tickets', label: 'Support Tickets', icon: Ticket },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
];

const AdminSupport = () => {
    const [activeTab, setActiveTab] = useState('tickets');

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-800">Support</h1>
                <p className="text-gray-500">Manage tickets and the AI knowledge base.</p>
            </header>

            {/* Tab Bar */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                            activeTab === id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'tickets' && <SupportTicketSystem isAdmin={true} />}
            {activeTab === 'knowledge' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <AdminKnowledgeBase />
                </div>
            )}
        </div>
    );
};

export default AdminSupport;
