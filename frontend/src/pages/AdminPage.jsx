// Admin start page: create a new game and pick a game to manage.
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminPage() {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [newGameName, setNewGameName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function loadGames() {
    const { data, error } = await supabase
      .from('games')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMessage('Kunde inte hämta spel: ' + error.message);
      return;
    }
    setGames(data);
  }

  useEffect(() => {
    loadGames();
  }, []);

  async function handleCreateGame(event) {
    event.preventDefault();
    setErrorMessage('');

    const name = newGameName.trim();
    if (name === '') {
      setErrorMessage('Skriv ett namn på spelet.');
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .from('games')
      .insert({ name: name, status: 'active' })
      .select()
      .single();
    setIsSaving(false);

    if (error) {
      setErrorMessage('Kunde inte skapa spel: ' + error.message);
      return;
    }

    setNewGameName('');
    // Go straight to the new game to add cards
    navigate('/admin/game/' + data.id);
  }

  return (
    <div className="page">
      <h1>Admin</h1>

      <div className="section">
        <h2>Skapa nytt spel</h2>
        <form onSubmit={handleCreateGame} className="form">
          <input
            type="text"
            placeholder="Namn på spelet"
            value={newGameName}
            onChange={(event) => setNewGameName(event.target.value)}
          />
          <button type="submit" className="button-primary" disabled={isSaving}>
            {isSaving ? 'Skapar...' : 'Skapa spel'}
          </button>
        </form>
      </div>

      {errorMessage && <p className="error">{errorMessage}</p>}

      <div className="section">
        <h2>Hantera spel</h2>
        {games.length === 0 && <p className="center-text">Inga spel ännu.</p>}
        <ul className="game-list">
          {games.map(function (game) {
            return (
              <li key={game.id}>
                <Link to={'/admin/game/' + game.id} className="game-list-item">
                  <span>{game.name}</span>
                  {game.status === 'active' ? (
                    <span className="badge badge-active">Pågår</span>
                  ) : (
                    <span className="badge badge-finished">Avslutat</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default AdminPage;
