import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Loader2, AlertTriangle, PauseCircle, PlayCircle,
    Edit, Check, X, Users, TrendingUp
} from 'lucide-react';

// ── Edit Capacity Modal ────────────────────────────────────────────────────
const EditCapacityModal = ({ event, onClose, onSaved }) => {
    const [newCapacity, setNewCapacity] = useState(event.total_capacity);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        const val = parseInt(newCapacity, 10);
        if (isNaN(val) || val < event.tickets_booked) {
            setError(`Capacity cannot be less than tickets already booked (${event.tickets_booked}).`);
            return;
        }

        setSaving(true);
        setError('');
        try {
            const { error: updateErr } = await supabase
                .from('tickets')
                .update({ total_capacity: val })
                .eq('id', event.id);

            if (updateErr) throw updateErr;
            onSaved();
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Edit size={18} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Update Capacity</h3>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{event.event_name}</p>
                    </div>
                </div>

                <div className="mb-2">
                    <label className="text-xs text-gray-400 mb-1.5 block">New Total Capacity</label>
                    <input
                        type="number"
                        min={event.tickets_booked}
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(e.target.value)}
                        className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white text-center text-xl font-bold focus:outline-none focus:border-primary/50"
                    />
                    <p className="text-xs text-gray-600 mt-1.5">
                        Currently booked: <span className="text-white font-mono">{event.tickets_booked}</span> · Min allowed: <span className="text-white font-mono">{event.tickets_booked}</span>
                    </p>
                </div>

                {error && (
                    <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                        {error}
                    </p>
                )}

                <div className="flex gap-3 mt-5">
                    <button onClick={onClose} disabled={saving}
                        className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors text-sm disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex-1 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        {saving ? 'Saving…' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────
const TicketManagement = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editTarget, setEditTarget] = useState(null); // event object
    const [togglingId, setTogglingId] = useState(null); // id being paused/resumed

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .order('event_date', { ascending: true });
            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, []);

    // ── Toggle sales_paused ───────────────────────────────────────────────
    const handleToggleSales = async (event) => {
        setTogglingId(event.id);
        try {
            const newValue = !event.sales_paused;
            const { error } = await supabase
                .from('tickets')
                .update({ sales_paused: newValue })
                .eq('id', event.id);

            if (error) throw error;

            // Optimistic update
            setEvents(prev =>
                prev.map(e => e.id === event.id ? { ...e, sales_paused: newValue } : e)
            );
        } catch (err) {
            alert('Failed to update sales status: ' + err.message);
        } finally {
            setTogglingId(null);
        }
    };

    if (error) return (
        <div className="text-red-500 p-8 text-center bg-red-500/10 rounded-xl border border-red-500/20">
            <AlertTriangle className="mx-auto mb-2" size={28} />
            <p className="font-bold mb-1">Error loading events</p>
            <p className="text-sm">{error}</p>
            <button onClick={fetchEvents} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">Retry</button>
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Ticket Management</h1>
                <p className="text-gray-400 text-sm">Control sales and capacity for your events</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    <TrendingUp size={40} className="mb-3 text-gray-700" />
                    <p className="text-gray-400">No events to manage yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {events.map(event => {
                        const remaining = event.total_capacity - event.tickets_booked;
                        const percentage = event.total_capacity > 0
                            ? (event.tickets_booked / event.total_capacity) * 100 : 0;
                        const isToggling = togglingId === event.id;

                        return (
                            <div key={event.id} className="bg-[#111] border border-white/10 rounded-xl p-6 flex flex-col gap-4">
                                {/* Event Header */}
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white text-base line-clamp-1 mb-1">{event.event_name}</h3>
                                        <p className="text-gray-500 text-xs">
                                            {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {event.event_time && ` · ${event.event_time}`}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${remaining <= 0
                                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                : 'bg-green-500/10 border-green-500/20 text-green-400'
                                            }`}>
                                            {remaining <= 0 ? 'SOLD OUT' : 'SELLING'}
                                        </span>
                                        {event.sales_paused && (
                                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                                                PAUSED
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Capacity Progress */}
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400 flex items-center gap-1.5"><Users size={13} /> Capacity</span>
                                        <span className="text-white font-mono font-bold">{event.tickets_booked}<span className="text-gray-500 font-normal"> / {event.total_capacity}</span></span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${percentage > 90 ? 'bg-red-500' :
                                                    percentage > 70 ? 'bg-yellow-500' : 'bg-primary'
                                                }`}
                                            style={{ width: `${Math.min(percentage, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-600 mt-1.5">
                                        <span>{remaining > 0 ? `${remaining} spots left` : 'No spots left'}</span>
                                        <span>{Math.round(percentage)}% filled</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    {/* Edit Capacity */}
                                    <button
                                        onClick={() => setEditTarget(event)}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-[#1A1A1A] border border-white/10 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                                    >
                                        <Edit size={15} /> Edit Capacity
                                    </button>

                                    {/* Pause / Resume Sales */}
                                    <button
                                        onClick={() => handleToggleSales(event)}
                                        disabled={isToggling}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-colors text-sm font-medium disabled:opacity-50 ${event.sales_paused
                                                ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                                                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20'
                                            }`}
                                    >
                                        {isToggling ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : event.sales_paused ? (
                                            <><PlayCircle size={15} /> Resume Sales</>
                                        ) : (
                                            <><PauseCircle size={15} /> Pause Sales</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Capacity Modal */}
            {editTarget && (
                <EditCapacityModal
                    event={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSaved={fetchEvents}
                />
            )}
        </div>
    );
};

export default TicketManagement;
