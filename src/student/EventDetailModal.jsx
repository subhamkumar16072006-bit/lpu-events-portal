import React, { useState } from 'react';
import { X, Calendar, MapPin, Clock, Users, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';

const EventDetailModal = ({ event, onClose, onBookingComplete }) => {
    const [loading, setLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(''); // 'booking' | 'email'
    const [status, setStatus] = useState(null); // 'success' | 'error' | null
    const [message, setMessage] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        student_name: '',
        registration_number: '',
        course: ''
    });

    const {
        id,
        event_name,
        description,
        event_date,
        event_time,
        venue,
        category,
        image_url,
        tickets_booked,
        total_capacity,
    } = event;

    const remaining = total_capacity - tickets_booked;
    const isSoldOut = remaining <= 0;
    const isFormValid = formData.student_name && formData.registration_number && formData.course;

    const handleBookTicket = async () => {
        setLoading(true);
        setLoadingStep('booking');
        setStatus(null);
        setMessage('');
        setEmailSent(false);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('You must be logged in to book a ticket.');
            }

            // ── Step 1: Supabase booking ──────────────────────────────────
            const { data, error } = await supabase.rpc('book_ticket', {
                p_event_id: id,
                p_student_id: user.id,
                p_student_name: formData.student_name,
                p_registration_number: formData.registration_number,
                p_course: formData.course
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            // Safely extract ticket ID from RPC response
            // RPC returns: { success: true, registration_id: uuid }
            const ticketId =
                data?.registration_id ??
                data?.id ??
                `TKT-${Date.now()}`;

            // ── Step 2: Send confirmation email via Nodemailer API ────────
            setLoadingStep('email');
            try {
                const emailRes = await fetch('/api/send-ticket', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        student_name: formData.student_name,
                        event_name: event_name,
                        ticket_id: String(ticketId),
                        student_reg_no: formData.registration_number || '12522325',
                        student_email: user.email, // from Supabase auth session
                    }),
                });

                if (emailRes.ok) {
                    setEmailSent(true);
                } else {
                    const errBody = await emailRes.json().catch(() => ({}));
                    console.error('[Email API] Server returned error:', errBody.error || emailRes.statusText);
                    setEmailSent(false);
                }
            } catch (emailErr) {
                // Non-blocking — booking succeeded; likely means api/server.js is not running
                console.error(
                    '\n🔴 [Email API] Could not reach /api/send-ticket.\n' +
                    '   → Make sure the local email server is running:\n' +
                    '     node api/server.js\n',
                    emailErr.message
                );
                setEmailSent(false);
            }

            // ── Step 3: Celebrate ─────────────────────────────────────────
            setStatus('success');
            setMessage(String(ticketId));
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF5722', '#F59E0B', '#10B981', '#3B82F6']
            });

            setTimeout(() => {
                if (onBookingComplete) onBookingComplete();
            }, 3000);

        } catch (err) {
            console.error('[Booking] Failed:', err);
            setStatus('error');
            setMessage(err.message || 'Failed to book ticket. Please try again.');
        } finally {
            setLoading(false);
            setLoadingStep('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            <div className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Left: Image */}
                <div className="w-full md:w-2/5 h-48 md:h-auto relative hidden md:block">
                    <img
                        src={image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                        alt={event_name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4">
                        <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            {category}
                        </span>
                    </div>
                </div>

                {/* Right: Content */}
                <div className="flex-1 p-6 md:p-8 flex flex-col overflow-y-auto">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">{event_name}</h2>
                    <div className="flex flex-wrap gap-4 text-gray-400 text-sm mb-6">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-primary" />
                            <span>{new Date(event_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-primary" />
                            <span>{event_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin size={16} className="text-primary" />
                            <span>{venue}</span>
                        </div>
                    </div>

                    <div className="prose prose-invert max-w-none mb-6 flex-1">
                        <h3 className="text-white text-lg font-semibold mb-2">About Event</h3>
                        <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4 hover:line-clamp-none transition-all">
                            {description || 'No description provided.'}
                        </p>
                    </div>

                    {/* Booking Form */}
                    <div className="mt-auto border-t border-white/10 pt-6">
                        {status === 'success' ? (
                            <div className="w-full p-4 bg-[#FF5722]/10 border border-[#FF5722]/30 rounded-xl space-y-2 animate-in fade-in zoom-in duration-300">
                                <div className="flex items-center gap-3 text-[#FF5722] font-bold">
                                    <CheckCircle size={22} />
                                    <span>Ticket Booked!</span>
                                </div>
                                <p className="text-xs text-gray-400 pl-8">
                                    Ticket ID: <span className="font-mono text-white font-semibold">{message}</span>
                                </p>
                                {emailSent ? (
                                    <p className="text-xs text-green-400 pl-8 flex items-center gap-1">
                                        <Mail size={11} /> Confirmation email sent to your inbox
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 pl-8 flex items-center gap-1">
                                        <Mail size={11} /> Email could not be sent (booking is confirmed)
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold flex items-center gap-2">
                                    <Users size={18} className="text-primary" />
                                    Student Details
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={formData.student_name}
                                            onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-white/5 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-400">Registration No.</label>
                                        <input
                                            type="text"
                                            placeholder="12345678"
                                            value={formData.registration_number}
                                            onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-white/5 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-xs text-gray-400">Course / Program</label>
                                        <input
                                            type="text"
                                            placeholder="B.Tech Computer Science"
                                            value={formData.course}
                                            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                            className="w-full bg-[#1A1A1A] border border-white/5 disabled:opacity-50 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                {status === 'error' && (
                                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                                        <AlertCircle size={16} />
                                        {message}
                                    </div>
                                )}

                                <button
                                    onClick={handleBookTicket}
                                    disabled={loading || isSoldOut || !isFormValid}
                                    className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isSoldOut
                                            ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                            : !isFormValid
                                                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                                : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-orange-500/20 hover:scale-[1.02]'
                                        }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 size={20} className="animate-spin text-[#FF5722]" />
                                            <span className="text-sm text-white/80">
                                                {loadingStep === 'email' ? 'Sending confirmation…' : 'Booking ticket…'}
                                            </span>
                                        </span>
                                    ) : isSoldOut ? (
                                        'Sold Out'
                                    ) : (
                                        'Confirm Booking'
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetailModal;
