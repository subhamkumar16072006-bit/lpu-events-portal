import React from 'react';
import { Calendar, MapPin, Users, Edit, Trash2, Eye } from 'lucide-react';

const EventCard = ({ event, onView, onEdit, onDelete }) => {
    const {
        id,
        event_name,
        category,
        event_date,
        event_time,
        venue,
        organizer_name,
        tickets_booked,
        total_capacity,
        image_url,
        sales_paused,
    } = event;

    const progress = total_capacity > 0 ? (tickets_booked / total_capacity) * 100 : 0;

    const dateObj = new Date(event_date);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    }) + (event_time ? ` at ${event_time}` : '');

    const categoryIcons = {
        'Hackathon': '👨‍💻',
        'Symposium': '📊',
        'Cultural': '🎭',
        'Workshop': '📝',
        'Seminar': '🎓'
    };
    const icon = categoryIcons[category] || '📅';

    return (
        <div className="glass-card overflow-hidden group hover:border-white/10 transition-colors flex flex-col">
            {/* Image Section */}
            <div className="relative h-48 w-full overflow-hidden">
                <img
                    src={image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                    alt={event_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent opacity-60" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex justify-between w-[calc(100%-2rem)]">
                    <div className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                        <span className="text-xs text-gray-300 font-medium">{icon}</span>
                        <span className="text-xs text-gray-300 font-medium">{category}</span>
                    </div>

                    <div className={`px-3 py-1 rounded-full border backdrop-blur-md flex items-center gap-1.5 ${sales_paused
                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/10 border-green-500/20 text-green-500'
                        }`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span className="text-xs font-medium">{sales_paused ? 'Paused' : 'Active'}</span>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-white mb-4 line-clamp-2 min-h-[3.5rem]">{event_name}</h3>

                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                        <Calendar size={16} className="text-primary flex-shrink-0" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                        <MapPin size={16} className="text-primary flex-shrink-0" />
                        <span className="truncate">{venue}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-400 text-sm">
                        <Users size={16} className="text-primary flex-shrink-0" />
                        <span className="truncate">{organizer_name}</span>
                    </div>
                </div>

                {/* Tickets Progress */}
                <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm text-gray-400">Tickets Booked</span>
                        <span className="text-sm font-bold text-white">
                            {tickets_booked}<span className="text-gray-500 font-normal">/{total_capacity}</span>
                        </span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full relative transition-all duration-500 ${progress > 90 ? 'bg-red-500' : progress > 70 ? 'bg-yellow-500' : 'bg-primary'
                                }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                        </div>
                    </div>
                </div>

                {/* Actions — real onClick handlers */}
                <div className="flex items-center gap-2 mt-auto">
                    <button
                        onClick={() => onView && onView(event)}
                        className="flex-1 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                    >
                        <Eye size={16} />
                        <span>View</span>
                    </button>
                    <button
                        onClick={() => onEdit && onEdit(event)}
                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-primary/10 hover:border-primary/20 border border-white/5 flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
                        title="Edit Event"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => onDelete && onDelete(event)}
                        className="w-9 h-9 rounded-lg bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 border border-white/5 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete Event"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
