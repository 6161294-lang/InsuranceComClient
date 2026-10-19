import { useEffect, useState } from 'react';
import { clearSession, loadSession } from './api.js';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ClaimsPage from './pages/ClaimsPage.jsx';

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
    setSession(null);
    setScreen('login');
    setNotice('');
  };

  if (session) {
    return <ClaimsPage employee={session.employee} onLogout={logout} />;
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
        setSession(newSession);
      }}
      onGoToRegister={() => {
        setNotice('');
        setScreen('register');
      }}
    />
  );
}
