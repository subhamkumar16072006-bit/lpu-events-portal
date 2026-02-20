import React, { useState, useEffect } from 'react';
import { Plus, Loader2, X, Calendar, MapPin, Users, Clock, Check, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { supabase } from '../lib/supabase';
import CategoryTabs from '../components/CategoryTabs';
import EventCard from '../components/EventCard';
import CreateEventModal from '../components/CreateEventModal';

const CATEGORIES = ['Hackathon', 'Symposium', 'Cultural', 'Workshop', 'Seminar'];

// ── View Details Drawer ────────────────────────────────────────────────────
const ViewDetailsDrawer = ({ event, onClose }) => {
    if (!event) return null;
    const progress = event.total_capacity > 0
        ? (event.tickets_booked / event.total_capacity) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-end z-50">
            <div className="bg-[#0F0F0F] border-l border-white/10 h-full w-full max-w-md overflow-y-auto">
                <div className="sticky top-0 bg-[#0F0F0F]/95 backdrop-blur-md border-b border-white/10 p-5 flex items-center justify-between">
                    <h2 className="font-bold text-white text-lg">Event Details</h2>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                        <X size={16} />
                    </button>
                </div>

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

                <div className="p-5 space-y-5">
                    <h3 className="text-xl font-bold text-white">{event.event_name}</h3>

                    <div className="space-y-0 divide-y divide-white/5">
                        {[
                            { icon: Calendar, label: 'Date', value: new Date(event.event_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
                            { icon: Clock, label: 'Time', value: event.event_time || 'TBD' },
                            { icon: MapPin, label: 'Venue', value: event.venue },
                            { icon: Users, label: 'Organizer', value: event.organizer_name },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-3 py-3">
                                <Icon size={15} className="text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                                    <p className="text-sm text-white font-medium">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Ticket Sales</span>
                            <span className="font-mono text-white font-bold">
                                {event.tickets_booked} <span className="text-gray-500 font-normal">/ {event.total_capacity}</span>
                            </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${progress > 80 ? 'bg-red-500' : 'bg-primary'}`}
                                style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                            {event.total_capacity - event.tickets_booked} spots remaining ({Math.round(progress)}% sold)
                        </p>
                    </div>

                    <div className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-2 ${event.sales_paused
                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/10 border-green-500/20 text-green-400'
                        }`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        Sales are currently {event.sales_paused ? 'PAUSED' : 'ACTIVE'}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Edit Event Modal ───────────────────────────────────────────────────────
const EditEventModal = ({ event, onClose, onSaved }) => {
    const [formData, setFormData] = useState({
        event_name: event.event_name || '',
        category: event.category || 'Hackathon',
        event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 10) : '',
        event_time: event.event_time || '',
        venue: event.venue || '',
        organizer_name: event.organizer_name || '',
        total_capacity: event.total_capacity || 100,
        image_url: event.image_url || '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const cap = parseInt(formData.total_capacity, 10);
        if (cap < event.tickets_booked) {
            setError(`Capacity can't be less than already booked tickets (${event.tickets_booked}).`);
            return;
        }
        setSaving(true);
        setError('');
        try {
            const { error: updateErr } = await supabase
                .from('tickets')
                .update({
                    ...formData,
                    total_capacity: cap,
                    event_date: new Date(formData.event_date).toISOString(),
                })
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

    const inputClass = "w-full h-10 px-4 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none text-sm";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Edit size={16} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Edit Event</h2>
                            <p className="text-xs text-gray-500 truncate max-w-[280px]">{event.event_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto p-5">
                    <form id="edit-event-form" onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'Event Name', name: 'event_name', type: 'text', required: true, colSpan: true },
                            { label: 'Venue', name: 'venue', type: 'text', required: true, colSpan: true },
                            { label: 'Date', name: 'event_date', type: 'date', required: true },
                            { label: 'Time', name: 'event_time', type: 'time', required: true },
                            { label: 'Organizer Name', name: 'organizer_name', type: 'text', required: true },
                            { label: 'Total Capacity', name: 'total_capacity', type: 'number', required: true },
                            { label: 'Image URL (optional)', name: 'image_url', type: 'url', colSpan: true },
                        ].map(({ label, name, type, required, colSpan }) => (
                            <div key={name} className={`space-y-1.5 ${colSpan ? 'md:col-span-2' : ''}`}>
                                <label className="text-xs font-medium text-gray-400">{label}</label>
                                <input
                                    type={type}
                                    name={name}
                                    value={formData[name]}
                                    onChange={handleChange}
                                    required={required}
                                    min={name === 'total_capacity' ? event.tickets_booked : undefined}
                                    className={inputClass}
                                />
                            </div>
                        ))}

                        {/* Category */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400">Category</label>
                            <select name="category" value={formData.category} onChange={handleChange}
                                className={inputClass}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </form>

                    {error && (
                        <p className="mt-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}
                </div>

                <div className="p-5 border-t border-white/10 flex justify-end gap-3">
                    <button onClick={onClose} disabled={saving}
                        className="px-5 py-2 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors text-sm disabled:opacity-50">
                        Cancel
                    </button>
                    <button form="edit-event-form" type="submit" disabled={saving}
                        className="px-5 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-50">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Delete Confirmation Modal ──────────────────────────────────────────────
const DeleteModal = ({ event, onConfirm, onCancel, loading }) => (
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
                Delete <span className="font-semibold text-white">"{event?.event_name}"</span>?
                All associated registrations will also be removed.
            </p>
            <div className="flex gap-3">
                <button onClick={onCancel} disabled={loading}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-sm disabled:opacity-50">
                    Cancel
                </button>
                <button onClick={onConfirm} disabled={loading}
                    className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    {loading ? 'Deleting…' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

// ── Main Dashboard ─────────────────────────────────────────────────────────
const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewEvent, setViewEvent] = useState(null);
    const [editEvent, setEditEvent] = useState(null);
    const [deleteEvent, setDeleteEvent] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            let query = supabase.from('tickets').select('*').order('created_at', { ascending: false });

            if (activeTab !== 'all') {
                const categoryMap = {
                    hackathons: 'Hackathon',
                    symposiums: 'Symposium',
                    cultural: 'Cultural',
                    workshops: 'Workshop',
                    seminars: 'Seminar'
                };
                if (categoryMap[activeTab]) {
                    query = query.eq('category', categoryMap[activeTab]);
                }
            }

            const { data, error } = await query;
            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, [activeTab]);

    const handleDeleteConfirm = async () => {
        if (!deleteEvent) return;
        setDeleting(true);
        try {
            const { error } = await supabase.from('tickets').delete().eq('id', deleteEvent.id);
            if (error) throw error;
            setDeleteEvent(null);
            fetchEvents();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">All Events</h1>
                    <p className="text-gray-400 text-sm">Manage all posted events and tickets</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
                >
                    <Plus size={20} />
                    <span>Create Event</span>
                </button>
            </div>

            {/* Tabs */}
            <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-white/5 rounded-2xl bg-white/5">
                    <p className="mb-2 text-lg">No events found</p>
                    <p className="text-sm">Create your first event to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {events.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            onView={setViewEvent}
                            onEdit={setEditEvent}
                            onDelete={setDeleteEvent}
                        />
                    ))}
                </div>
            )}

            {/* ── Modals ── */}
            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onEventCreated={fetchEvents}
            />

            {viewEvent && (
                <ViewDetailsDrawer event={viewEvent} onClose={() => setViewEvent(null)} />
            )}

            {editEvent && (
                <EditEventModal
                    event={editEvent}
                    onClose={() => setEditEvent(null)}
                    onSaved={fetchEvents}
                />
            )}

            {deleteEvent && (
                <DeleteModal
                    event={deleteEvent}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteEvent(null)}
                    loading={deleting}
                />
            )}
        </div>
    );
};

export default Dashboard;
