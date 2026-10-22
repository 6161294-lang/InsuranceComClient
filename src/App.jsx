import { useEffect, useState } from 'react';
import { clearSession, loadSession } from './api.js';
import { ROLE_LABELS } from './components/format.js';
import { LogoutIcon, ShieldIcon } from './components/icons.jsx';
import { Button } from './components/ui.jsx';
import AppraiserPage from './pages/AppraiserPage.jsx';
import ClientPage from './pages/ClientPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ManagerPage from './pages/ManagerPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

const HOME_BY_ROLE = {
  Client: ClientPage,
  Manager: ManagerPage,
  Appraiser: AppraiserPage,
};

export default function App() {
  const [session, setSession] = useState(loadSession);
  const [screen, setScreen] = useState('login'); // 'login' | 'register' (when logged out)
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const onExpired = () => {
      setSession(null);
      setScreen('login');
      setNotice('פג תוקף ההתחברות. יש להתחבר מחדש.');
    };
    window.addEventListener('session-expired', onExpired);
    return () => window.removeEventListener('session-expired', onExpired);
  }, []);

  const logout = () => {
    clearSession();
    window.location.hash = '';
    setSession(null);
    setScreen('login');
    setNotice('');
  };

  if (session) {
    const Home = HOME_BY_ROLE[session.user.role];
    return (
      <>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <span className="brand-mark">
                <ShieldIcon size={20} />
              </span>
              ביטוח-קום
            </div>
            <div className="user-box">
              <span className="user-name">{session.user.fullName}</span>
              <span className="badge badge-primary">{ROLE_LABELS[session.user.role]}</span>
              <Button variant="ghost" size="sm" onClick={logout} aria-label="התנתקות">
                <LogoutIcon size={18} />
                <span>התנתקות</span>
              </Button>
            </div>
          </div>
        </header>
        <Home user={session.user} />
      </>
    );
  }

  if (screen === 'register') {
    return (
      <RegisterPage
        onRegistered={() => {
          setNotice('ההרשמה הצליחה. אפשר להתחבר.');
          setScreen('login');
        }}
        onGoToLogin={() => setScreen('login')}
      />
    );
  }

  return (
    <LoginPage
      notice={notice}
      onLoggedIn={(newSession) => {
        setNotice('');
        window.location.hash = '';
        setSession(newSession);
      }}
      onGoToRegister={() => {
        setNotice('');
        setScreen('register');
      }}
    />
  );
}
