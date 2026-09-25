import React, { useState } from 'react';
import './App.css';
import Dashboard from './Dashboard';
import { APP_USERS } from './utils/users';
import { hasPasswordSet, setInitialPassword, verifyLogin, changePassword } from './utils/authService';

type Step = 'select' | 'password' | 'setup';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('user')
  );
  const [currentUser, setCurrentUser] = useState<string>(
    localStorage.getItem('user') || ''
  );

  // --- Login wizard state ---
  const [step, setStep] = useState<Step>('select');
  const [selectedUsername, setSelectedUsername] = useState<string>(APP_USERS[0]?.username || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Change password modal (once logged in) ---
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState('');
  const [changePasswordMessage, setChangePasswordMessage] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');

  const selectedDisplayName = APP_USERS.find((u) => u.username === selectedUsername)?.displayName || selectedUsername;
  const currentUserDisplayName = APP_USERS.find((u) => u.username === currentUser)?.displayName || currentUser;

  const resetLoginForm = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const alreadyHasPassword = await hasPasswordSet(selectedUsername);
      setStep(alreadyHasPassword ? 'password' : 'setup');
    } catch (err) {
      setError("Une erreur est survenue, réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Merci de saisir ton mot de passe.');
      return;
    }

    setLoading(true);
    try {
      const ok = await verifyLogin(selectedUsername, password);
      if (ok) {
        localStorage.setItem('user', selectedUsername);
        setCurrentUser(selectedUsername);
        setIsAuthenticated(true);
      } else {
        setError('Identifiant ou mot de passe incorrect.');
      }
    } catch (err) {
      setError("Une erreur est survenue, réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const ok = await setInitialPassword(selectedUsername, password);
      if (ok) {
        localStorage.setItem('user', selectedUsername);
        setCurrentUser(selectedUsername);
        setIsAuthenticated(true);
      } else {
        setError("Impossible de créer le mot de passe (il a peut-être déjà été défini par quelqu'un d'autre — réessaie en te connectant normalement).");
      }
    } catch (err) {
      setError("Une erreur est survenue, réessaie.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('select');
    resetLoginForm();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser('');
    setStep('select');
    resetLoginForm();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordMessage('');

    if (newPasswordInput.length < 8) {
      setChangePasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      setChangePasswordError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    const ok = await changePassword(currentUser, oldPasswordInput, newPasswordInput);
    if (ok) {
      setChangePasswordMessage('✅ Mot de passe mis à jour !');
      setOldPasswordInput('');
      setNewPasswordInput('');
      setConfirmNewPasswordInput('');
      setTimeout(() => {
        setShowChangePassword(false);
        setChangePasswordMessage('');
      }, 1500);
    } else {
      setChangePasswordError('Mot de passe actuel incorrect.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>🔒 Change Request Dashboard</h1>

          {step === 'select' && (
            <form onSubmit={handleContinue}>
              <div className="form-group">
                <label>Qui es-tu ?</label>
                <select
                  value={selectedUsername}
                  onChange={(e) => setSelectedUsername(e.target.value)}
                >
                  {APP_USERS.map((u) => (
                    <option key={u.username} value={u.username}>
                      {u.displayName}
                    </option>
                  ))}
                </select>
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Vérification...' : 'Continuer'}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleLogin}>
              <p className="hint" style={{ marginBottom: '15px', marginTop: 0 }}>
                Connexion en tant que <strong>{selectedDisplayName}</strong>
              </p>
              <div className="form-group">
                <label>Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoFocus
                  required
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              <button type="button" className="link-btn" onClick={handleBack}>
                ← Ce n'est pas moi
              </button>
            </form>
          )}

          {step === 'setup' && (
            <form onSubmit={handleSetupPassword}>
              <p className="hint" style={{ marginBottom: '15px', marginTop: 0 }}>
                Bienvenue <strong>{selectedDisplayName}</strong> — première connexion, choisis ton mot de passe.
              </p>
              <div className="form-group">
                <label>Nouveau mot de passe (8 caractères min.)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirme le mot de passe</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Création...' : 'Créer mon mot de passe'}
              </button>
              <button type="button" className="link-btn" onClick={handleBack}>
                ← Ce n'est pas moi
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📋 Change Request Dashboard</h1>
        <div className="user-info">
          <span>Connecté en tant que: <strong>{currentUserDisplayName}</strong></span>
          <button onClick={() => setShowChangePassword(true)} className="logout-btn">
            🔑 Mot de passe
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Déconnexion
          </button>
        </div>
      </header>
      <Dashboard currentUser={currentUser} />

      {showChangePassword && (
        <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '400px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Changer mon mot de passe</h2>
              <button className="btn-close" onClick={() => setShowChangePassword(false)}>✕</button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Mot de passe actuel</label>
                  <input
                    type="password"
                    value={oldPasswordInput}
                    onChange={(e) => setOldPasswordInput(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nouveau mot de passe (8 caractères min.)</label>
                  <input
                    type="password"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Confirme le nouveau mot de passe</label>
                  <input
                    type="password"
                    value={confirmNewPasswordInput}
                    onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                    required
                  />
                </div>
                {changePasswordError && <div className="error-message">{changePasswordError}</div>}
                {changePasswordMessage && (
                  <div style={{ color: '#065f46', background: '#d1fae5', padding: '12px', borderRadius: '5px', fontSize: '14px' }}>
                    {changePasswordMessage}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowChangePassword(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-submit">
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
