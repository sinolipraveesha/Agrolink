import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    BookOpen, Plus, Pencil, Trash2, X, CheckCircle, AlertCircle,
    Shield, ChevronDown, ChevronUp, ExternalLink, Save, RefreshCw
} from 'lucide-react';

const CATEGORIES = ['Orders', 'Payments', 'Products', 'Account', 'Delivery', 'Other'];

const VerifiedBadge = () => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
        <Shield className="h-3 w-3" /> Admin Verified
    </span>
);

const EmptyModal = { open: false, mode: 'create', entry: null };

export default function AdminKnowledgeBase() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(EmptyModal);
    const [expandedOriginal, setExpandedOriginal] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Form state
    const [form, setForm] = useState({ question: '', answer: '', category: 'Orders', keywords: '', sourceTicketId: '' });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchEntries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/knowledge/all');
            setEntries(res.data);
        } catch {
            showToast('Failed to load knowledge base', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchEntries(); }, [fetchEntries]);

    const openCreate = () => {
        setForm({ question: '', answer: '', category: 'Orders', keywords: '', sourceTicketId: '' });
        setModal({ open: true, mode: 'create', entry: null });
    };

    const openEdit = (entry) => {
        setForm({
            question: entry.question || '',
            answer: entry.answer || '',
            category: entry.category || 'Other',
            keywords: entry.keywords || '',
            sourceTicketId: entry.sourceTicketId || '',
        });
        setModal({ open: true, mode: 'edit', entry });
    };

    const closeModal = () => setModal(EmptyModal);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                question: form.question,
                answer: form.answer,
                category: form.category,
                keywords: form.keywords,
                sourceTicketId: form.sourceTicketId || null,
            };
            if (modal.mode === 'create') {
                await axios.post('/api/knowledge', payload);
                showToast('Entry added to knowledge base');
            } else {
                await axios.put(`/api/knowledge/${modal.entry.id}/override`, payload);
                showToast('Entry overridden & marked as admin verified');
            }
            closeModal();
            await fetchEntries();
        } catch {
            showToast('Failed to save entry', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/knowledge/${id}`);
            setDeleteConfirm(null);
            showToast('Entry deleted');
            await fetchEntries();
        } catch {
            showToast('Failed to delete entry', 'error');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-gray-800">Knowledge Base</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{entries.length} entries</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchEntries} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Refresh">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={openCreate} className="flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-green-700 transition-colors shadow-sm shadow-green-600/20">
                        <Plus className="h-4 w-4" /> Add Entry
                    </button>
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border ${
                    toast.type === 'error'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                    {toast.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>No knowledge entries yet</p>
                </div>
            ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                    {entries.map(entry => (
                        <div key={entry.id} className={`p-4 bg-white hover:bg-gray-50 transition-colors ${entry.adminVerified ? 'border-l-4 border-l-emerald-400' : ''}`}>
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-medium text-gray-800 text-sm leading-snug">{entry.question}</span>
                                        {entry.adminVerified && <VerifiedBadge />}
                                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">{entry.category}</span>
                                        {entry.sourceTicketId && (
                                            <span className="text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <ExternalLink className="h-2.5 w-2.5" />
                                                From Ticket
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-2">{entry.answer}</p>

                                    {/* Audit trail — show original answer if overridden */}
                                    {entry.originalAnswer && (
                                        <div className="mt-2">
                                            <button
                                                onClick={() => setExpandedOriginal(expandedOriginal === entry.id ? null : entry.id)}
                                                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700"
                                            >
                                                {expandedOriginal === entry.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                                View original AI answer
                                            </button>
                                            {expandedOriginal === entry.id && (
                                                <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 italic">
                                                    <span className="font-semibold not-italic">Original: </span>
                                                    {entry.originalAnswer}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {entry.correctedAt && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Overridden {new Date(entry.correctedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => openEdit(entry)}
                                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                        title="Override answer"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(entry.id)}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete entry"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Delete confirm inline */}
                            {deleteConfirm === entry.id && (
                                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                    <span className="text-xs text-red-700 flex-1">Delete this entry permanently?</span>
                                    <button onClick={() => handleDelete(entry.id)} className="text-xs font-semibold text-red-700 hover:text-red-900">Yes, delete</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {modal.open && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {modal.mode === 'create' ? <Plus className="h-4 w-4 text-green-600" /> : <Shield className="h-4 w-4 text-emerald-600" />}
                                <h3 className="font-bold text-gray-800">
                                    {modal.mode === 'create' ? 'Add Knowledge Entry' : 'Override Answer'}
                                </h3>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
                        </div>
                        {modal.mode === 'edit' && modal.entry?.originalAnswer == null && (
                            <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                                Saving will preserve the current answer as audit trail and mark this entry as admin-verified.
                            </div>
                        )}
                        <form onSubmit={handleSave} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Question / Trigger phrase</label>
                                <input
                                    required
                                    value={form.question}
                                    onChange={e => setForm(p => ({ ...p, question: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    placeholder="e.g. How do I track my order?"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    {modal.mode === 'edit' ? 'Corrected Answer (authoritative)' : 'Answer'}
                                </label>
                                <textarea
                                    required
                                    rows={5}
                                    value={form.answer}
                                    onChange={e => setForm(p => ({ ...p, answer: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none"
                                    placeholder="Step-by-step answer..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                                    <select
                                        value={form.category}
                                        onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                    >
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Keywords (space-separated)</label>
                                    <input
                                        value={form.keywords}
                                        onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                                        placeholder="track order status"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Source Ticket ID <span className="font-normal text-gray-400">(optional)</span></label>
                                <input
                                    value={form.sourceTicketId}
                                    onChange={e => setForm(p => ({ ...p, sourceTicketId: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-mono"
                                    placeholder="UUID of ticket that prompted this correction"
                                />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-colors disabled:opacity-60"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? 'Saving...' : modal.mode === 'create' ? 'Add to KB' : 'Save Override'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
