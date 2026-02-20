import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, MapPin, Calendar, ArrowRight } from 'lucide-react';
import CategoryTabs from '../components/CategoryTabs';
import EventDetailModal from './EventDetailModal';

// Reusing EventCard logic but styling it for "Booking" context
const StudentEventCard = ({ event, onClick }) => {
    const {
        event_name,
        category,
        event_date,
        event_time,
        venue,
        tickets_booked,
        total_capacity,
        image_url
    } = event;

    const remaining = total_capacity - tickets_booked;
    const dateObj = new Date(event_date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div
            onClick={onClick}
            className="group relative h-[320px] rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,123,45,0.15)]"
        >
            {/* Image Background */}
            <div className="absolute inset-0">
                <img
                    src={image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                    alt={event_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <div className="flex justify-between items-start mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <span className="bg-primary text-white text-xs font-bold px-2 py-1 rounded">
                        {category}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                        {remaining} Left
                    </span>
                </div>

                <div className="transform transition-transform duration-300 group-hover:-translate-y-2">
                    <p className="text-primary text-sm font-medium mb-1 flex items-center gap-2">
                        <Calendar size={14} /> {formattedDate} • {event_time}
                    </p>
                    <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{event_name}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-1">
                        <MapPin size={14} /> {venue}
                    </p>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <button className="w-full py-2 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                        View Details <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentHome = () => {
    const [activeTab, setActiveTab] = useState('all');
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                let query = supabase.from('tickets').select('*').order('event_date', { ascending: true });

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
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [activeTab]);

    return (
        <div className="pb-20">
            {/* Hero Section */}
            <div className="relative h-[400px] w-full bg-[#111] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-transparent to-[#0A0A0A] z-10"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>

                <div className="relative z-20 h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
                    <span className="text-primary font-bold tracking-wider mb-2 text-sm uppercase">LPU Events 2026</span>
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
                        Discover Campus <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-600">
                            Experiences
                        </span>
                    </h1>
                    <p className="text-gray-400 max-w-xl text-lg mb-8">
                        Join hackathons, cultural fests, and workshops happening right now at Lovely Professional University.
                    </p>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => document.getElementById('events-grid').scrollIntoView({ behavior: 'smooth' })}
                            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(255,123,45,0.3)]"
                        >
                            Explore Events
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="px-6 -mt-8 relative z-30">
                <div className="max-w-7xl mx-auto bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                    <CategoryTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
            </div>

            {/* Event Grid */}
            <div id="events-grid" className="max-w-7xl mx-auto px-6 mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Upcoming Events</h2>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Loading events...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {events.map(event => (
                            <StudentEventCard
                                key={event.id}
                                event={event}
                                onClick={() => setSelectedEvent(event)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <EventDetailModal
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onBookingComplete={() => {
                        // For now just close, user can check My Tickets
                        setSelectedEvent(null);
                    }}
                />
            )}
        </div>
    );
};

export default StudentHome;
