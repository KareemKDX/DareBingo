// Shows a list of all games. Tap a game to open it.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function GamesPage() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadGames() {
      const { data, error } = await supabase
        .from('games')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        setErrorMessage('Kunde inte hämta spel: ' + error.message);
      } else {
        setGames(data);
      }
      setLoading(false);
    }

    loadGames();
  }, []);

  if (loading) {
    return <p className="center-text">Laddar spel...</p>;
  }

  return (
    <div className="page">
      <h1>Välj spel</h1>

      {errorMessage && <p className="error">{errorMessage}</p>}

      {games.length === 0 && !errorMessage && (
        <p className="center-text">Inga spel ännu. Be en admin skapa ett!</p>
      )}

      <ul className="game-list">
        {games.map(function (game) {
          return (
            <li key={game.id}>
              <Link to={'/game/' + game.id} className="game-list-item">
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
  );
}

export default GamesPage;
