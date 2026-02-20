import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Book, Hash, Mail } from 'lucide-react';

const StudentProfile = () => {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({
        total_tickets: 0,
        last_registration: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    // Fetch registration stats
                    const { data: regs, error } = await supabase
                        .from('registrations')
                        .select('student_name, registration_number, course, created_at')
                        .eq('student_id', user.id)
                        .order('created_at', { ascending: false });

                    if (!error && regs.length > 0) {
                        setStats({
                            total_tickets: regs.length,
                            last_registration: regs[0] // Contains the most recent student details entered
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading profile...</div>;

    const studentData = stats.last_registration || {};

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold text-white mb-8">Student Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>

                        <div className="flex items-center gap-6 mb-8 relative z-10">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-[#111] shadow-xl">
                                {user?.email ? user.email[0].toUpperCase() : 'S'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {studentData.student_name || 'Student'}
                                </h2>
                                <p className="text-gray-400">{user?.email}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm">
                                    <Hash size={16} /> Registration No
                                </div>
                                <div className="text-white font-mono text-lg">
                                    {studentData.registration_number || 'N/A'}
                                </div>
                            </div>
                            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm">
                                    <Book size={16} /> Course / Program
                                </div>
                                <div className="text-white font-medium">
                                    {studentData.course || 'N/A'}
                                </div>
                            </div>
                            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors sm:col-span-2">
                                <div className="flex items-center gap-2 text-gray-500 mb-1 text-sm">
                                    <Mail size={16} /> Email Address
                                </div>
                                <div className="text-white font-medium">
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Card */}
                <div className="space-y-6">
                    <div className="bg-[#111] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-4">Your Activity</h3>
                        <div className="text-center py-8">
                            <div className="text-5xl font-bold text-primary mb-2">
                                {stats.total_tickets}
                            </div>
                            <p className="text-gray-400 text-sm">Events Registered</p>
                        </div>
                        <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition-colors">
                            View Ticket History
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-primary/20 to-orange-600/10 border border-primary/20 rounded-2xl p-6">
                        <h3 className="text-white font-bold mb-2">LPU Events Pass</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Your digital identity for campus events.
                        </p>
                        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                            <div className="h-full w-full bg-primary rounded-full"></div>
                        </div>
                        <p className="text-right text-xs text-primary font-bold">ACTIVE</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProfile;
