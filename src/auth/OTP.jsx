import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const OTP = ({ email, onVerify, onBack }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const token = otp.join('');
        if (token.length !== 6) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email',
            });
            if (error) throw error;
            onVerify();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text').slice(0, 6).split('');
        const newOtp = [...otp];
        data.forEach((val, i) => {
            if (i < 6) newOtp[i] = val;
        });
        setOtp(newOtp);
        if (data.length > 0 && inputRefs.current[Math.min(data.length, 5)]) {
            inputRefs.current[Math.min(data.length, 5)].focus();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10 flex flex-col items-center text-center">
                <button
                    onClick={onBack}
                    className="absolute top-6 left-6 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>

                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                    <span className="text-3xl">🔐</span>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">Verify OTP</h2>
                <p className="text-gray-400 mb-8 max-w-xs mx-auto">Enter the 6-digit code sent to {email}</p>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm w-full">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 mb-8">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={el => inputRefs.current[index] = el}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={index === 0 ? handlePaste : undefined}
                            className="w-12 h-14 bg-[#111] border border-white/10 rounded-lg text-center text-xl text-white font-bold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all caret-primary"
                            disabled={loading}
                        />
                    ))}
                </div>

                <button
                    onClick={handleVerify}
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all mb-4 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Verify & Continue"}
                </button>

                <p className="text-sm text-gray-500">
                    Didn't receive code? <button className="text-primary hover:text-primary/80 font-medium">Resend</button>
                </p>
            </div>
        </div>
    );
};

export default OTP;
