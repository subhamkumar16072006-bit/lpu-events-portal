import React, { useState, useEffect } from 'react';
import {
    Plus, Loader2, Calendar, Users, Ticket,
    Edit, Trash2, Eye, AlertTriangle, RotateCcw,
    MapPin, Hash, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import CreateEventModal from '../components/CreateEventModal';

// ── Stat Card ──────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color = 'text-primary' }) => (
    <div className="bg-[#111] border border-white/10 rounded-xl p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white/5 ${color}`}>
            <Icon size={22} />
        </div>
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-gray-500 text-sm">{label}</p>
            {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
        </div>
    </div>
);

// ── Delete Confirmation Modal ───────────────────────────────────────────────
const DeleteModal = ({ eventName, onConfirm, onCancel, loading }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                    <h3 className="font-bold text-white">Delete Event</h3>
                    <p className="text-xs text-gray-500">This cannot be undone</p>
                </div>
            </div>
            <p className="text-sm text-gray-300 mb-6">
                Are you sure you want to delete <span className="font-semibold text-white">"{eventName}"</span>?
                All registrations will also be removed.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} disabled={loading}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 transition-colors text-sm font-medium disabled:opacity-50">
                    Cancel
                </button>
                <button onClick={onConfirm} disabled={loading}
                    className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    {loading ? 'Deleting…' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

// ── View Details Drawer ────────────────────────────────────────────────────
const ViewDetailsDrawer = ({ event, onClose }) => {
    if (!event) return null;
    const progress = event.total_capacity > 0
        ? (event.tickets_booked / event.total_capacity) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-end z-50">
            <div className="bg-[#0F0F0F] border-l border-white/10 h-full w-full max-w-md overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-white/10 p-5 flex items-center justify-between">
                    <h2 className="font-bold text-white text-lg">Event Details</h2>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        ✕
                    </button>
                </div>

                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                    <img
                        src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                        alt={event.event_name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F] via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-5">
                        <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-bold">
                            {event.category}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-5">
                    <h3 className="text-xl font-bold text-white">{event.event_name}</h3>

                    <div className="space-y-3">
                        {[
                            { icon: Calendar, label: 'Date', value: new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                            { icon: Clock, label: 'Time', value: event.event_time || 'TBD' },
                            { icon: MapPin, label: 'Venue', value: event.venue },
                            { icon: Users, label: 'Organizer', value: event.organizer_name },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-3 py-3 border-b border-white/5">
                                <Icon size={16} className="text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                                    <p className="text-sm text-white font-medium">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Capacity */}
                    <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Ticket Sales</span>
                            <span className="font-mono text-white font-bold">
                                {event.tickets_booked} <span className="text-gray-500 font-normal">/ {event.total_capacity}</span>
                            </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${progress > 80 ? 'bg-red-500' : 'bg-primary'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            {event.total_capacity - event.tickets_booked} spots remaining ({Math.round(progress)}% sold)
                        </p>
                    </div>

                    <div className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${event.sales_paused
                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/10 border-green-500/20 text-green-400'
                        }`}>
                        <span className={`w-2 h-2 rounded-full bg-current`} />
                        Sales are currently {event.sales_paused ? 'PAUSED' : 'ACTIVE'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Event Row Card ─────────────────────────────────────────────────────────
const MyEventCard = ({ event, onDelete, onView }) => {
    const { id, event_name, category, event_date, event_time, venue,
        tickets_booked, total_capacity, image_url, sales_paused } = event;
    const progress = total_capacity > 0 ? (tickets_booked / total_capacity) * 100 : 0;
    const remaining = total_capacity - tickets_booked;

    const categoryIcons = {
        'Hackathon': '👨‍💻', 'Symposium': '📊', 'Cultural': '🎭',
        'Workshop': '📝', 'Seminar': '🎓'
    };

    return (
        <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden flex flex-col md:flex-row group hover:border-white/20 transition-all duration-200">
            {/* Thumbnail */}
            <div className="relative w-full md:w-48 h-36 md:h-auto flex-shrink-0 overflow-hidden">
                <img
                    src={image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                    alt={event_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111]" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-xs text-gray-300 font-medium">
                    {categoryIcons[category] || '📅'} {category}
                </div>
            </div>

            {/* Info */}
            <div className="flex-1 p-5 flex flex-col justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{event_name}</h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-primary" />
                                {new Date(event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {event_time && ` · ${event_time}`}
                            </span>
                            <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                                <MapPin size={13} className="text-primary" />
                                {venue}
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        {sales_paused && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 border border-yellow-500/20 text-yellow-400">
                                PAUSED
                            </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${remaining <= 0
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : 'bg-green-500/10 border-green-500/20 text-green-400'
                            }`}>
                            {remaining <= 0 ? 'SOLD OUT' : 'ACTIVE'}
                        </span>
                    </div>
                </div>

                {/* Capacity */}
                <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>Ticket Sales</span>
                        <span className="font-mono text-white">{tickets_booked} <span className="text-gray-500">/ {total_capacity}</span></span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${progress > 80 ? 'bg-red-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button onClick={() => onView(event)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 hover:text-white transition-colors text-xs font-medium">
                        <Eye size={14} /> View Details
                    </button>
                    <button
                        onClick={() => onDelete(id, event_name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 text-red-500/70 hover:text-red-400 transition-colors text-xs font-medium">
                        <Trash2 size={14} /> Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Component ─────────────────────────────────────────────────────────
const MyEvents = ({ session }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [viewEvent, setViewEvent] = useState(null);

    const fetchMyEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase.from('tickets').select('*').order('event_date', { ascending: true });

            // Filter by logged-in organizer's UUID (confirmed column: organizer_id)
            if (session?.user?.id) {
                query = query.eq('organizer_id', session.user.id);
            }

            const { data, error } = await query;
            if (error) throw error;
            setEvents(data || []);
        } catch (err) {
            setError(err.message || 'Failed to load your events.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMyEvents(); }, [session]);

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('tickets').delete().eq('id', deleteTarget.id);
            if (error) throw error;
            setDeleteTarget(null);
            await fetchMyEvents();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    const totalAttendees = events.reduce((s, e) => s + (e.tickets_booked || 0), 0);
    const totalCapacity = events.reduce((s, e) => s + (e.total_capacity || 0), 0);
    const soldOutCount = events.filter(e => e.tickets_booked >= e.total_capacity).length;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">My Events</h1>
                    <p className="text-gray-400 text-sm">
                        {session ? `Showing events created by ${session.user.email}` : 'All events'}
                    </p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20">
                    <Plus size={20} /> Create Event
                </button>
            </div>

            {/* Stats */}
            {!loading && events.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard icon={Calendar} label="My Events" value={events.length} color="text-primary" />
                    <StatCard icon={Users} label="Total Attendees" value={totalAttendees} sub={`of ${totalCapacity} capacity`} color="text-sky-400" />
                    <StatCard icon={Ticket} label="Sold Out" value={soldOutCount} color="text-red-400" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-6 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertTriangle size={28} className="mx-auto mb-2" />
                    <p className="font-semibold mb-1">Failed to Load</p>
                    <p className="text-sm text-red-500/70 mb-4">{error}</p>
                    <button onClick={fetchMyEvents} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm">Retry</button>
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex justify-center h-64 items-center">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            )}

            {/* Empty */}
            {!loading && !error && events.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                    <Calendar size={40} className="mb-3 text-gray-700" />
                    <p className="text-lg font-medium text-gray-400 mb-1">No events yet</p>
                    <p className="text-sm mb-5">You haven't created any events.</p>
                    <button onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium flex items-center gap-2">
                        <Plus size={18} /> Create First Event
                    </button>
                </div>
            )}

            {/* List */}
            {!loading && !error && events.length > 0 && (
                <div className="space-y-4">
                    {events.map(event => (
                        <MyEventCard
                            key={event.id}
                            event={event}
                            onDelete={(id, name) => setDeleteTarget({ id, name })}
                            onView={setViewEvent}
                        />
                    ))}
                </div>
            )}

            {/* Modals */}
            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onEventCreated={fetchMyEvents}
            />
            {deleteTarget && (
                <DeleteModal
                    eventName={deleteTarget.name}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                    loading={deleting}
                />
            )}
            {viewEvent && (
                <ViewDetailsDrawer event={viewEvent} onClose={() => setViewEvent(null)} />
            )}
        </div>
    );
};

export default MyEvents;
