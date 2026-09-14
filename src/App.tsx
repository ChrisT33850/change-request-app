import React, { useState } from 'react';
import './App.css';
import Dashboard from './Dashboard';

interface LoginData {
  username: string;
  password: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('user')
  );
  const [currentUser, setCurrentUser] = useState<string>(
    localStorage.getItem('user') || ''
  );
  const [loginData, setLoginData] = useState<LoginData>({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string>('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validUsers: { [key: string]: string } = {
      christophe: 'password123',
      manager: 'manager123',
      itteam: 'it123',
    };

    if (validUsers[loginData.username] === loginData.password) {
      localStorage.setItem('user', loginData.username);
      setCurrentUser(loginData.username);
      setIsAuthenticated(true);
    } else {
      setError('Identifiants incorrects');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser('');
    setLoginData({ username: '', password: '' });
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>🔒 Change Request Dashboard</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Identifiant</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) =>
                  setLoginData({ ...loginData, username: e.target.value })
                }
                placeholder="christophe"
                required
              />
            </div>
            <div className="form-group">
              <label>Mot de passe</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) =>
                  setLoginData({ ...loginData, password: e.target.value })
                }
                placeholder="••••••"
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="login-btn">
              Connexion
            </button>
          </form>
          <p className="hint">Demo: christophe / password123</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 Change Request Dashboard</h1>
        <div className="user-info">
          <span>Connecté en tant que: <strong>{currentUser}</strong></span>
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        </div>
      </header>
      <Dashboard currentUser={currentUser} />
    </div>
  );
};

export default App;
