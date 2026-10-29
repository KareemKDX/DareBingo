// Signup form with username, email and password.
// The username is sent as metadata and the database trigger creates the profile.
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import Logo from '../components/Logo';

function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Already logged in? Go to the games list.
  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    const cleanUsername = username.trim();

    if (cleanUsername.length < 2) {
      setErrorMessage('Användarnamnet måste vara minst 2 tecken.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Lösenordet måste vara minst 6 tecken.');
      return;
    }

    setIsSubmitting(true);

    // Check that the username is free
    const availableResult = await supabase.rpc('username_available', {
      wanted_username: cleanUsername,
    });

    if (availableResult.error) {
      setIsSubmitting(false);
      setErrorMessage('Något gick fel. Försök igen.');
      return;
    }

    if (availableResult.data === false) {
      setIsSubmitting(false);
      setErrorMessage('Användarnamnet är upptaget. Välj ett annat.');
      return;
    }

    // Create the account
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password,
      options: {
        data: { username: cleanUsername },
      },
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage('Kunde inte skapa konto: ' + error.message);
      return;
    }

    // If email confirmation is on in Supabase there is no session yet
    if (!data.session) {
      setInfoMessage('Kontot är skapat! Kolla din e-post och bekräfta, logga sedan in.');
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
        <h2>Skapa konto</h2>
        <label>
          Användarnamn
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            maxLength={30}
            required
          />
        </label>

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
          Lösenord (minst 6 tecken)
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        {errorMessage && <p className="error">{errorMessage}</p>}
        {infoMessage && <p className="info">{infoMessage}</p>}

        <button type="submit" className="button-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Skapar konto...' : 'Skapa konto'}
        </button>
      </form>

      <p className="center-text">
        Har du redan ett konto? <Link to="/login">Logga in</Link>
      </p>
    </div>
  );
}

export default SignupPage;
