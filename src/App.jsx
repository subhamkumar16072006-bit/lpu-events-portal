import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './auth/Login';
import OTP from './auth/OTP';
import Layout from './components/Layout';
import Dashboard from './dashboard/Dashboard';
import StudentLayout from './student/StudentLayout';
import StudentHome from './student/StudentHome';
import MyTickets from './student/MyTickets';
import StudentProfile from './student/StudentProfile';
import Attendees from './dashboard/Attendees';
import Scanner from './dashboard/Scanner';
import TicketManagement from './dashboard/TicketManagement';

function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'login', 'signup', 'otp'
  const [email, setEmail] = useState('');

  const [userRole, setUserRole] = useState('organizer'); // 'organizer' | 'student'
  const [studentView, setStudentView] = useState('discover'); // 'discover' | 'my-tickets' | 'profile'
  const [organizerView, setOrganizerView] = useState('dashboard'); // 'dashboard', 'my-events', 'tickets', 'attendees', 'scanner'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentView('login');
    setUserRole('organizer');
  };

  // STUDENT PORTAL
  if (userRole === 'student') {
    return (
      <StudentLayout
        onLogout={() => {
          // For now, logging out or switching role just goes back to organizer view/login
          setUserRole('organizer');
        }}
        activeTab={studentView}
        onTabChange={setStudentView}
      >
        {studentView === 'discover' && <StudentHome />}
        {studentView === 'my-tickets' && <MyTickets />}
        {studentView === 'profile' && <StudentProfile />}
      </StudentLayout>
    );
  }

  // ORGANIZER PORTAL (Default)

  // 1. Auth Flow
  if (currentView === 'login') {
    if (session) {
      // If logged in, go to dashboard
      // We can just fall through to the main return, 
      // but we need to ensure currentView is set to dashboard if session exists
      setCurrentView('dashboard');
    } else {
      return (
        <div className="relative">
          <Login onLogin={(email) => { setEmail(email); setCurrentView('otp'); }} isSignup={false} />
          <button
            onClick={() => setUserRole('student')}
            className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2 rounded-full font-bold shadow-2xl hover:bg-gray-200 transition-colors"
          >
            Switch to Student View 🎓
          </button>
        </div>
      );
    }
  }

  if (currentView === 'signup') {
    if (session) {
      setCurrentView('dashboard');
    } else {
      return <Login onLogin={(email) => { setEmail(email); setCurrentView('otp'); }} isSignup={true} onSwitchToLogin={() => setCurrentView('login')} />;
    }
  }

  if (currentView === 'otp') {
    return <OTP email={email} onVerify={() => setCurrentView('dashboard')} onBack={() => setCurrentView('login')} />;
  }

  // 2. Main Dashboard (Organizer)
  return (
    <Layout
      session={session}
      onLogin={() => setCurrentView('login')}
      onSignup={() => setCurrentView('signup')}
      onLogout={handleLogout}
      activeTab={organizerView}
      onTabChange={setOrganizerView}
    >
      {organizerView === 'dashboard' && <Dashboard />}
      {organizerView === 'my-events' && <Dashboard />}
      {organizerView === 'tickets' && <TicketManagement />}
      {organizerView === 'attendees' && <Attendees />}
      {organizerView === 'scanner' && <Scanner />}

      <button
        onClick={() => setUserRole('student')}
        className="fixed bottom-6 right-6 z-50 bg-white text-black px-4 py-2 rounded-full font-bold shadow-2xl hover:bg-gray-200 transition-colors border border-black/10"
        title="Switch to Student View"
      >
        🎓 Student View
      </button>
    </Layout>
  );
}

export default App;
