import React, { useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['Hackathon', 'Symposium', 'Cultural', 'Workshop', 'Seminar'];

const CreateEventModal = ({ isOpen, onClose, onEventCreated }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        event_name: '',
        category: 'Hackathon',
        event_date: '',
        event_time: '',
        venue: '',
        organizer_name: '',
        total_capacity: 100,
        image_url: ''
    });

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('You must be logged in to create an event');

            // Use a random Unsplash image if none provided
            const finalImageUrl = formData.image_url || `https://source.unsplash.com/800x600/?${formData.category.toLowerCase()}`;

            const { error } = await supabase
                .from('tickets')
                .insert([
                    {
                        ...formData,
                        event_date: new Date(formData.event_date).toISOString(), // Ensure ISO format
                        organizer_id: user.id,
                        tickets_booked: 0,
                        image_url: finalImageUrl
                    }
                ]);

            if (error) throw error;

            onEventCreated();
            onClose();
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Create New Event</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form id="create-event-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Event Name</label>
                                <input
                                    type="text"
                                    name="event_name"
                                    value={formData.event_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                    placeholder="e.g. InnovateHack 2025"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Date</label>
                                <input
                                    type="date"
                                    name="event_date"
                                    value={formData.event_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Time</label>
                                <input
                                    type="time"
                                    name="event_time"
                                    value={formData.event_time}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Venue</label>
                                <input
                                    type="text"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                    placeholder="e.g. Block 34, Auditorium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Organizer Name</label>
                                <input
                                    type="text"
                                    name="organizer_name"
                                    value={formData.organizer_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                    placeholder="e.g. Coding Club"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Total Capacity</label>
                                <input
                                    type="number"
                                    name="total_capacity"
                                    value={formData.total_capacity}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Image URL (Optional)</label>
                                <input
                                    type="url"
                                    name="image_url"
                                    value={formData.image_url}
                                    onChange={handleChange}
                                    className="w-full h-10 px-4 bg-[#0A0A0A] border border-white/10 rounded-lg text-white focus:border-primary focus:outline-none"
                                    placeholder="https://images.unsplash.com/..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        form="create-event-form"
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        Create Event
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateEventModal;
