import React, { useState } from 'react';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login = ({ onLogin, isSignup, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const options = { email };
      if (!isSignup) {
        options.shouldCreateUser = false; // Only allow login for existing users
      }
      // If logging in, generally we might want to check if user exists (though Supabase OTP handles both mostly).
      // If signing up, we might want to ensure user DOESN'T exist or just send magic link regardless.
      // For simplicity/robustness with OTP, they are often the same, but we can differentiate messages.

      const { error } = await supabase.auth.signInWithOtp(options);

      if (error) throw error;
      onLogin(email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
          <span className="text-3xl">🎓</span>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">
          {isSignup ? "Create Account" : "Welcome Back"}
        </h2>
        <p className="text-gray-400 mb-8">
          {isSignup ? "Enter your email to start creating events" : "Enter your email to access the organizer portal"}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="w-full space-y-4"
        >
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full h-12 pl-12 pr-4 bg-[#111] border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                <span>{isSignup ? "Sign Up" : "Login"}</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-sm text-gray-500">
          {isSignup ? (
            <>Already have an account? <button onClick={onSwitchToLogin} className="text-white hover:underline">Login</button></>
          ) : (
            <>By logging in, you agree to our <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a> & <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
