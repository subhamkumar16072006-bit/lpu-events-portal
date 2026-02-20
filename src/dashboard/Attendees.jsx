import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import {
    Search, Download, Loader2, AlertTriangle, Users,
    Calendar, MapPin, ChevronRight, ArrowLeft, X,
    CheckCircle, Clock, TicketIcon, Hash, BookOpen
} from 'lucide-react';

// ── PDF Export (registration numbers only) ────────────────────────────────
const exportToPDF = (students, eventName) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 20;
    let y = margin;

    // Header bar
    doc.setFillColor(255, 87, 34); // LPU Orange
    doc.rect(0, 0, pageW, 14, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('LPU EVENTS PORTAL', margin, 9);
    doc.text('ATTENDANCE RECORD', pageW - margin, 9, { align: 'right' });

    y = 26;
    // Event title
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(eventName, margin, y);
    y += 7;

    // Sub info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}  ·  Total: ${students.length} student(s)`, margin, y);
    y += 4;

    // Divider
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // Column header
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y - 4, pageW - margin * 2, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 80);
    doc.text('#', margin + 2, y + 1);
    doc.text('Registration Number', margin + 14, y + 1);
    doc.text('Status', pageW - margin - 2, y + 1, { align: 'right' });
    y += 10;

    // Rows
    doc.setFont('helvetica', 'normal');
    students.forEach((s, i) => {
        if (y > pageH - 20) {
            doc.addPage();
            y = margin;
        }
        if (i % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, y - 4, pageW - margin * 2, 7, 'F');
        }
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        doc.text(String(i + 1), margin + 2, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text(s.registration_number || 'N/A', margin + 14, y);
        doc.setFont('helvetica', 'normal');
        const status = s.status === 'used' ? 'Checked In' : 'Not Attended';
        doc.setTextColor(s.status === 'used' ? 34 : 180, s.status === 'used' ? 139 : 120, 34);
        doc.text(status, pageW - margin - 2, y, { align: 'right' });
        y += 7;
    });

    // Footer
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.setFont('helvetica', 'normal');
    doc.text('LPU Events Portal — Confidential', margin, pageH - 6);
    doc.text(`Page 1`, pageW - margin, pageH - 6, { align: 'right' });

    doc.save(`attendance_${eventName.replace(/\s+/g, '_')}.pdf`);
};

// ── Event Card (event list view) ───────────────────────────────────────────
const EventAttendeeCard = ({ event, onClick }) => {
    const booked = event.tickets_booked || 0;
    const capacity = event.total_capacity || 0;
    const attended = event.attended_count || 0;
    const fillPct = capacity > 0 ? (booked / capacity) * 100 : 0;
    const attendedPct = booked > 0 ? (attended / booked) * 100 : 0;

    const categoryIcons = {
        'Hackathon': '👨‍💻', 'Symposium': '📊', 'Cultural': '🎭',
        'Workshop': '📝', 'Seminar': '🎓'
    };

    return (
        <button
            onClick={onClick}
            className="w-full bg-[#111] border border-white/10 rounded-xl p-5 text-left hover:border-white/25 hover:bg-[#161616] transition-all duration-200 group"
        >
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{categoryIcons[event.category] || '📅'}</span>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{event.category}</span>
                    </div>
                    <h3 className="font-bold text-white text-base line-clamp-2">{event.event_name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[160px]">
                            <MapPin size={11} /> {event.venue}
                        </span>
                    </div>
                </div>
                <ChevronRight size={18} className="text-gray-600 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-white">{booked}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Tickets Sold</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-400">{attended}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Attended</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-gray-300">{capacity - booked}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Remaining</p>
                </div>
            </div>

            {/* Dual progress bars */}
            <div className="space-y-2">
                <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>Tickets sold</span>
                        <span>{Math.round(fillPct)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${fillPct > 90 ? 'bg-red-500' : fillPct > 70 ? 'bg-yellow-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(fillPct, 100)}%` }} />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                        <span>Attendance rate</span>
                        <span>{Math.round(attendedPct)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-500"
                            style={{ width: `${Math.min(attendedPct, 100)}%` }} />
                    </div>
                </div>
            </div>
        </button>
    );
};

// ── Student Table (drill-down view) ────────────────────────────────────────
const StudentDrillDown = ({ event, onBack }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from('registrations')
                    .select('id, student_name, registration_number, course, status, created_at')
                    .eq('event_id', event.id)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setStudents(data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [event.id]);

    const [attendanceFilter, setAttendanceFilter] = useState('all'); // 'all' | 'used' | 'confirmed'

    const filtered = students.filter(s => {
        const matchesSearch = (
            s.student_name?.toLowerCase().includes(search.toLowerCase()) ||
            s.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
            s.course?.toLowerCase().includes(search.toLowerCase())
        );
        const matchesAttendance = attendanceFilter === 'all' || s.status === attendanceFilter;
        return matchesSearch && matchesAttendance;
    });

    const checkedIn = students.filter(s => s.status === 'used').length;

    const handleExport = () => {
        setExporting(true);
        try {
            exportToPDF(filtered, event.event_name);
        } finally {
            setTimeout(() => setExporting(false), 800);
        }
    };

    return (
        <div className="space-y-6">
            {/* Back + Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft size={16} /> All Events
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white line-clamp-1">{event.event_name}</h1>
                        <p className="text-gray-500 text-xs">
                            {new Date(event.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {event.venue && ` · ${event.venue}`}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleExport}
                    disabled={exporting || loading || filtered.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40"
                >
                    {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    Export PDF {filtered.length > 0 && `(${filtered.length})`}
                </button>
            </div>

            {/* Summary stats */}
            {!loading && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Tickets Sold', value: students.length, icon: TicketIcon, color: 'text-primary' },
                        { label: 'Checked In', value: checkedIn, icon: CheckCircle, color: 'text-green-400' },
                        { label: 'Not Yet Attended', value: students.length - checkedIn, icon: Clock, color: 'text-yellow-400' },
                        { label: 'Attendance Rate', value: students.length > 0 ? `${Math.round((checkedIn / students.length) * 100)}%` : '0%', icon: Users, color: 'text-sky-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-[#111] border border-white/10 rounded-xl p-4 flex items-center gap-3">
                            <Icon size={18} className={`${color} flex-shrink-0`} />
                            <div>
                                <p className="text-lg font-bold text-white">{value}</p>
                                <p className="text-[11px] text-gray-500">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Attendance Filters */}
            <div className="flex bg-[#222] p-1 rounded-xl w-fit border border-white/5 mb-2">
                {[
                    { id: 'all', label: `All (${students.length})` },
                    { id: 'used', label: `Checked In (${checkedIn})` },
                    { id: 'confirmed', label: `Not Attended (${students.length - checkedIn})` }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setAttendanceFilter(tab.id)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${attendanceFilter === tab.id
                            ? 'bg-primary text-white shadow-lg shadow-orange-500/20'
                            : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                    type="text"
                    placeholder="Search by name, reg no, or course…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Student Table */}
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Reg No</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Course</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Registered On</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="p-12 text-center text-gray-500">
                                    <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />
                                    Loading students…
                                </td></tr>
                            ) : error ? (
                                <tr><td colSpan="5" className="p-8 text-center text-red-400">{error}</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" className="p-12 text-center text-gray-500">
                                    <Users size={32} className="mx-auto mb-2 opacity-20" />
                                    {search ? 'No students match your search.' : 'No registrations for this event yet.'}
                                </td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                                {s.student_name?.[0]?.toUpperCase() || 'S'}
                                            </div>
                                            <span className="font-medium text-white text-sm">{s.student_name || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-300 font-mono text-sm">{s.registration_number || 'N/A'}</td>
                                    <td className="p-4 text-gray-400 text-sm">{s.course || 'N/A'}</td>
                                    <td className="p-4 text-gray-400 text-sm">
                                        {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${s.status === 'used'
                                            ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {s.status === 'used' ? '✓ Checked In' : '⏳ Not Attended'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && filtered.length > 0 && (
                    <div className="border-t border-white/5 px-4 py-2.5 flex justify-between text-xs text-gray-600">
                        <span>{filtered.length} student{filtered.length !== 1 ? 's' : ''}</span>
                        <button onClick={handleExport} disabled={exporting} className="text-primary hover:text-white transition-colors flex items-center gap-1">
                            <Download size={11} /> Download PDF
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Main Attendees Component ───────────────────────────────────────────────
const Attendees = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null); // drill-down

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            setError(null);
            try {
                // Get all events
                const { data: ticketsData, error: ticketsErr } = await supabase
                    .from('tickets')
                    .select('id, event_name, category, event_date, venue, tickets_booked, total_capacity')
                    .order('event_date', { ascending: false });
                if (ticketsErr) throw ticketsErr;

                // For each event, count how many registrations have status='used'
                const eventsWithAttendance = await Promise.all(
                    (ticketsData || []).map(async (ev) => {
                        const { count } = await supabase
                            .from('registrations')
                            .select('id', { count: 'exact', head: true })
                            .eq('event_id', ev.id)
                            .eq('status', 'used');
                        return { ...ev, attended_count: count || 0 };
                    })
                );
                setEvents(eventsWithAttendance);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // If an event is selected, show drill-down
    if (selectedEvent) {
        return <StudentDrillDown event={selectedEvent} onBack={() => setSelectedEvent(null)} />;
    }

    const totalSold = events.reduce((s, e) => s + (e.tickets_booked || 0), 0);
    const totalAttended = events.reduce((s, e) => s + (e.attended_count || 0), 0);

    const filteredEvents = events.filter(e =>
        e.event_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.toLowerCase().includes(search.toLowerCase()) ||
        e.venue?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Attendees</h1>
                    <p className="text-gray-400 text-sm">Click an event to view its registered students</p>
                </div>
            </div>

            {/* Summary stats */}
            {!loading && events.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Total Events', value: events.length, icon: Calendar, color: 'text-primary' },
                        { label: 'Tickets Sold', value: totalSold, icon: TicketIcon, color: 'text-sky-400' },
                        { label: 'Total Attended', value: totalAttended, icon: CheckCircle, color: 'text-green-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-[#111] border border-white/10 rounded-xl p-5 flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 ${color}`}>
                                <Icon size={20} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{value}</p>
                                <p className="text-gray-500 text-sm">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input
                    type="text"
                    placeholder="Search events by name, category or venue…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-[#111] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Event list */}
            {loading ? (
                <div className="flex justify-center h-64 items-center">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : error ? (
                <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertTriangle size={28} className="mx-auto mb-2" />
                    <p className="font-semibold">{error}</p>
                </div>
            ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                    <Calendar size={36} className="mb-2 opacity-20" />
                    <p className="text-sm">{search ? 'No events match your search.' : 'No events found.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredEvents.map(event => (
                        <EventAttendeeCard
                            key={event.id}
                            event={event}
                            onClick={() => setSelectedEvent(event)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Attendees;
