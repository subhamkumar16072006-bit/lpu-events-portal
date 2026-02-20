import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { QrCode, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';

const TicketCard = ({ registration }) => {
    // registration.tickets contains the joined event data
    const event = registration.tickets;
    if (!event) return null;

    const dateObj = new Date(event.event_date);

    return (
        <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-primary/30 transition-all duration-300 group">
            {/* Left: Event Visuals */}
            <div className="w-full md:w-48 h-48 relative">
                <img
                    src={event.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                    alt={event.event_name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                <div className="absolute top-3 left-3 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10">
                    <div className="text-center">
                        <span className="block text-xs text-gray-300 uppercase font-bold">{dateObj.toLocaleString('en-US', { month: 'short' })}</span>
                        <span className="block text-xl text-white font-bold leading-none">{dateObj.getDate()}</span>
                    </div>
                </div>
            </div>

            {/* Middle: Info */}
            <div className="flex-1 p-6 flex flex-col justify-center border-b md:border-b-0 md:border-r border-white/10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {event.category}
                    </span>
                    <span className="text-xs text-green-500 flex items-center gap-1">
                        ● Confirmed
                    </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{event.event_name}</h3>

                <div className="space-y-2 text-gray-400 text-sm">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-500" />
                        <span>{event.event_time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        <span>{event.venue}</span>
                    </div>
                </div>
            </div>

            {/* Right: QR Code / Actions */}
            <div className="p-6 w-full md:w-64 flex flex-col items-center justify-center bg-[#0F0F0F] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>

                {/* Mock QR Code */}
                <div className="bg-white p-2 rounded-xl mb-3 shadow-lg group-hover:scale-105 transition-transform">
                    <QrCode size={80} className="text-black" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-[10px] text-gray-500 font-mono">ID: {registration.id.slice(0, 8)}</p>
                    <p className="text-[10px] text-primary font-bold">REG: {registration.registration_number}</p>
                </div>

                <button className="text-sm font-medium text-primary hover:text-white transition-colors flex items-center gap-1">
                    Download Ticket <ExternalLink size={14} />
                </button>
            </div>
        </div>
    );
};

const MyTickets = () => {
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Fetch registrations AND joined ticket data
                const { data, error } = await supabase
                    .from('registrations')
                    .select('*, tickets(*)')
                    .eq('student_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setRegistrations(data || []);
            } catch (error) {
                console.error('Error fetching tickets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold text-white mb-2">My Tickets</h1>
            <p className="text-gray-400 mb-8">Access all your upcoming events and passes</p>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading your tickets...</div>
            ) : registrations.length === 0 ? (
                <div className="text-center py-20 bg-[#111] rounded-2xl border border-white/5">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode size={32} className="text-gray-500" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">No tickets yet</h3>
                    <p className="text-gray-500 mb-6">You haven't booked any events yet.</p>
                    <button className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors">
                        Browse Events
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {registrations.map(reg => (
                        <TicketCard key={reg.id} registration={reg} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTickets;
