// Login form with email and password.
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Logo from '../components/Logo';

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already logged in? Go to the games list.
  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password,
    });

    setIsSubmitting(false);

    if (error) {
      if (error.message === 'Email not confirmed') {
        setErrorMessage('Du måste bekräfta din e-post först.');
      } else {
        setErrorMessage('Fel e-post eller lösenord.');
      }
      return;
    }

    navigate('/');
  }

  return (
    <div className="page auth-page">
      <div className="auth-logo">
        <Logo size="big" />
      </div>

      <form onSubmit={handleSubmit} className="form section">
        <h2>Logga in</h2>
        <label>
          E-post
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label>
          Lösenord
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {errorMessage && <p className="error">{errorMessage}</p>}

        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Loggar in...' : 'Logga in'}
        </button>
      </form>

      <p className="center-text">
        Inget konto? <Link to="/signup">Registrera dig</Link>
      </p>
    </div>
  );
}

export default LoginPage;
