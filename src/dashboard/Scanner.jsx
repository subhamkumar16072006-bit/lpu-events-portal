import React, { useState, useRef } from 'react';
import {
    QrCode, Camera, CheckCircle, XCircle, Loader2,
    ClipboardList, Hash, User, BookOpen, Clock, RotateCcw, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// ── Helpers ────────────────────────────────────────────────────────────────
const isValidUUID = (str) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());

const timeNow = () =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// ── Result Card ────────────────────────────────────────────────────────────
const ResultRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
            <Icon size={15} className="text-gray-400" />
        </div>
        <div>
            <p className="text-xs text-gray-500 mb-0.5">{label}</p>
            <p className="text-sm font-medium text-white">{value || 'N/A'}</p>
        </div>
    </div>
);

// ── Scan History Item ──────────────────────────────────────────────────────
const HistoryItem = ({ item }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${item.success
        ? 'bg-green-500/5 border-green-500/10'
        : 'bg-red-500/5 border-red-500/10'
        }`}>
        {item.success
            ? <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
            : <XCircle size={16} className="text-red-400 flex-shrink-0" />
        }
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
                {item.success ? item.studentName : 'Invalid Ticket'}
            </p>
            <p className="text-xs text-gray-500 truncate">
                {item.success ? item.eventName : item.id}
            </p>
        </div>
        <span className="text-xs text-gray-600 flex-shrink-0 flex items-center gap-1">
            <Clock size={11} /> {item.time}
        </span>
    </div>
);

// ── Main Component ─────────────────────────────────────────────────────────
const Scanner = () => {
    const [active, setActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [scannedData, setScannedData] = useState(null);
    const [status, setStatus] = useState(null); // 'success' | 'invalid' | 'already_used'
    const [manualId, setManualId] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [history, setHistory] = useState([]); // scan log
    const inputRef = useRef(null);

    // ── Core: Verify ticket against Supabase ───────────────────────────────
    const verifyTicket = async (rawId) => {
        const id = rawId.trim();
        if (!id) return;

        // Validation: 5-digit Code OR 36 char UUID OR 8 char short ID
        const is5DigitCode = /^\d{5}$/.test(id);
        const isPotentialUUID = isValidUUID(id);
        const isShortID = id.length === 8;

        if (!is5DigitCode && !isPotentialUUID && !isShortID) {
            setStatus('invalid');
            setErrorMsg('Invalid format. Please enter the 5-digit Verification Code or Ticket ID.');
            setHistory(prev => [{ id, success: false, time: timeNow() }, ...prev].slice(0, 20));
            setActive(false);
            return;
        }

        setLoading(true);
        setActive(false);

        try {
            // Use the new verify_ticket RPC helper
            const { data, error } = await supabase
                .rpc('verify_ticket', { p_search_query: id })
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                // Not found in DB
                setStatus('invalid');
                setErrorMsg('No ticket found with this code. Please check and try again.');
                setHistory(prev => [{ id, success: false, time: timeNow() }, ...prev].slice(0, 20));
            } else if (data.status === 'used') {
                // Already scanned
                setStatus('already_used');
                setScannedData({
                    id: data.id,
                    studentName: data.student_name,
                    regNo: data.registration_number,
                    course: data.course,
                    eventName: data.event_name,
                    eventDate: data.event_date,
                    status: data.status,
                    verificationCode: data.verification_code
                });
                setHistory(prev => [{
                    id: data.id, success: false,
                    studentName: data.student_name,
                    eventName: data.event_name,
                    time: timeNow()
                }, ...prev].slice(0, 20));
            } else {
                // Valid — mark as used in registrations table
                const { error: updateErr } = await supabase
                    .from('registrations')
                    .update({ status: 'used' })
                    .eq('id', data.id);

                if (updateErr) throw updateErr;

                setStatus('success');
                setScannedData({
                    id: data.id,
                    studentName: data.student_name,
                    regNo: data.registration_number,
                    course: data.course,
                    eventName: data.event_name,
                    eventDate: data.event_date,
                    verificationCode: data.verification_code
                });
                setHistory(prev => [{
                    id: data.id, success: true,
                    studentName: data.student_name,
                    eventName: data.event_name,
                    time: timeNow()
                }, ...prev].slice(0, 20));
            }
        } catch (err) {
            console.error('Scanner error:', err);
            setStatus('invalid');
            setErrorMsg('Error: ' + err.message);
            setHistory(prev => [{ id, success: false, time: timeNow() }, ...prev].slice(0, 20));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = () => verifyTicket(manualId);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleVerify();
    };

    const reset = () => {
        setStatus(null);
        setScannedData(null);
        setManualId('');
        setErrorMsg('');
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">QR Ticket Scanner</h1>
                <p className="text-gray-400 text-sm">Verify attendee tickets against live registration data</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ── Left: Scanner Panel ─────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Main viewport */}
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[340px] relative overflow-hidden">
                        {/* Loading */}
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                                    <Loader2 size={36} className="text-primary animate-spin" />
                                </div>
                                <p className="text-gray-400 font-medium">Verifying ticket…</p>
                                <p className="text-xs text-gray-600">Checking against Supabase</p>
                            </div>
                        ) : active ? (
                            /* Camera mock — a real app would use html5-qrcode or zxing */
                            <div className="relative w-full h-56 bg-black rounded-xl overflow-hidden flex items-center justify-center border-2 border-primary">
                                <div className="text-gray-500 flex flex-col items-center gap-2">
                                    <Camera size={48} />
                                    <span className="text-sm">Camera Preview</span>
                                    <span className="text-xs text-gray-600">(Use manual entry below to verify)</span>
                                </div>
                                {/* Animated scan line */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-primary/60 shadow-[0_0_20px_4px_rgba(249,115,22,0.5)] animate-[scan_2s_ease-in-out_infinite]" />
                                {/* Corner brackets */}
                                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl" />
                                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr" />
                                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl" />
                                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br" />
                                <button
                                    onClick={() => setActive(false)}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/50 hover:text-white bg-black/50 px-3 py-1 rounded-full"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : status === 'success' ? (
                            <div className="text-center w-full">
                                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-500/30">
                                    <CheckCircle size={40} className="text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Entry Authorized ✅</h2>
                                <p className="text-gray-500 text-sm mb-5">Ticket marked as used</p>
                                <div className="bg-[#1A1A1A] rounded-xl border border-white/5 text-left mb-5 divide-y divide-white/5">
                                    <ResultRow icon={Hash} label="Verification Code" value={scannedData.verificationCode} />
                                    <ResultRow icon={User} label="Student Name" value={scannedData.studentName} />
                                    <ResultRow icon={Hash} label="Registration No." value={scannedData.regNo} />
                                    <ResultRow icon={BookOpen} label="Course" value={scannedData.course} />
                                    <ResultRow icon={ClipboardList} label="Event" value={scannedData.eventName} />
                                </div>
                                <button onClick={reset} className="flex items-center gap-2 text-primary hover:text-white transition-colors text-sm font-medium mx-auto">
                                    <RotateCcw size={14} /> Scan Next Ticket
                                </button>
                            </div>
                        ) : status === 'already_used' ? (
                            <div className="text-center w-full">
                                <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-yellow-500/20">
                                    <AlertCircle size={40} className="text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Already Checked In ⚠️</h2>
                                <p className="text-gray-500 text-sm mb-5">This ticket has already been scanned and used</p>
                                <div className="bg-[#1A1A1A] rounded-xl border border-yellow-500/10 text-left mb-5 divide-y divide-white/5">
                                    <ResultRow icon={User} label="Student Name" value={scannedData.studentName} />
                                    <ResultRow icon={ClipboardList} label="Event" value={scannedData.eventName} />
                                </div>
                                <button onClick={reset} className="flex items-center gap-2 text-yellow-400 hover:text-white transition-colors text-sm font-medium mx-auto">
                                    <RotateCcw size={14} /> Try Another Ticket
                                </button>
                            </div>
                        ) : status === 'invalid' ? (
                            <div className="text-center">
                                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-red-500/30">
                                    <XCircle size={40} className="text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Invalid Ticket ❌</h2>
                                <p className="text-gray-500 text-sm mb-5 max-w-xs mx-auto">{errorMsg || 'This ticket ID does not exist in the database.'}</p>
                                <button onClick={reset} className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors gap-2 mx-auto text-sm">
                                    <RotateCcw size={14} /> Try Again
                                </button>
                            </div>
                        ) : (
                            /* Idle state */
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-44 h-44 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-white/10 hover:border-primary/40 transition-colors cursor-pointer"
                                    onClick={() => setActive(true)}
                                >
                                    <QrCode size={60} className="text-gray-600" />
                                </div>
                                <button
                                    onClick={() => setActive(true)}
                                    className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-full font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
                                >
                                    <Camera size={18} /> Activate Camera
                                </button>
                                <p className="text-xs text-gray-600 mt-3">or use manual entry below</p>
                            </div>
                        )}
                    </div>

                    {/* Manual Entry */}
                    <div className="bg-[#111] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex-1 w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Enter 5-digit Code or Ticket ID..."
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={loading}
                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-primary/50 font-mono placeholder:text-gray-600 disabled:opacity-50"
                            />
                        </div>
                        <button
                            onClick={handleVerify}
                            disabled={loading || !manualId.trim()}
                            className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            Verify
                        </button>
                    </div>
                </div>

                {/* ── Right: Scan History ───────────────────────────────── */}
                <div className="lg:col-span-2">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-5 h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <ClipboardList size={16} className="text-primary" />
                                Scan History
                            </h3>
                            {history.length > 0 && (
                                <span className="text-xs text-gray-500">{history.length} scan{history.length !== 1 ? 's' : ''}</span>
                            )}
                        </div>

                        {history.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-600">
                                <ClipboardList size={32} className="mb-2 opacity-30" />
                                <p className="text-sm">No scans yet</p>
                                <p className="text-xs mt-1">Verified tickets appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                                {history.map((item, i) => (
                                    <HistoryItem key={i} item={item} />
                                ))}
                            </div>
                        )}

                        {history.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
                                <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-green-400">{history.filter(h => h.success).length}</p>
                                    <p className="text-xs text-gray-500">Authorized</p>
                                </div>
                                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-red-400">{history.filter(h => !h.success).length}</p>
                                    <p className="text-xs text-gray-500">Rejected</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scanner;
