// Admin page for one game: add, edit and delete challenge cards,
// finish the game, reset the game or delete it.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AdminGamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Form for a new card
  const [newText, setNewText] = useState('');
  const [newPoints, setNewPoints] = useState(1);

  // Which card is being edited right now (and its values)
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPoints, setEditPoints] = useState(1);

  async function loadGame() {
    const { data, error } = await supabase
      .from('games')
      .select('id, name, status')
      .eq('id', gameId)
      .maybeSingle();

    if (error) {
      setErrorMessage('Kunde inte hämta spelet: ' + error.message);
      return;
    }
    setGame(data);
  }

  async function loadChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select('id, text, points')
      .eq('game_id', gameId)
      .order('created_at', { ascending: true });

    if (error) {
      setErrorMessage('Kunde inte hämta korten: ' + error.message);
      return;
    }
    setChallenges(data);
  }

  useEffect(() => {
    async function loadEverything() {
      setLoading(true);
      await loadGame();
      await loadChallenges();
      setLoading(false);
    }

    loadEverything();
  }, [gameId]);

  function clearMessages() {
    setErrorMessage('');
    setInfoMessage('');
  }

  // ---------- Cards ----------

  async function handleAddChallenge(event) {
    event.preventDefault();
    clearMessages();

    const text = newText.trim();
    const points = parseInt(newPoints, 10);

    if (text === '') {
      setErrorMessage('Skriv en text för kortet.');
      return;
    }
    if (isNaN(points) || points < 0) {
      setErrorMessage('Poängen måste vara 0 eller mer.');
      return;
    }

    const { error } = await supabase.from('challenges').insert({
      game_id: gameId,
      text: text,
      points: points,
    });

    if (error) {
      setErrorMessage('Kunde inte lägga till kort: ' + error.message);
      return;
    }

    setNewText('');
    setNewPoints(1);
    loadChallenges();
  }

  function startEditing(challenge) {
    setEditingId(challenge.id);
    setEditText(challenge.text);
    setEditPoints(challenge.points);
  }

  function cancelEditing() {
    setEditingId(null);
  }

  async function handleSaveEdit(challengeId) {
    clearMessages();

    const text = editText.trim();
    const points = parseInt(editPoints, 10);

    if (text === '') {
      setErrorMessage('Texten får inte vara tom.');
      return;
    }
    if (isNaN(points) || points < 0) {
      setErrorMessage('Poängen måste vara 0 eller mer.');
      return;
    }

    const { error } = await supabase
      .from('challenges')
      .update({ text: text, points: points })
      .eq('id', challengeId);

    if (error) {
      setErrorMessage('Kunde inte spara: ' + error.message);
      return;
    }

    setEditingId(null);
    loadChallenges();
  }

  async function handleDeleteChallenge(challenge) {
    clearMessages();

    const sure = window.confirm('Ta bort kortet "' + challenge.text + '"? Spelarnas poäng för kortet försvinner.');
    if (!sure) {
      return;
    }

    const { error } = await supabase.from('challenges').delete().eq('id', challenge.id);

    if (error) {
      setErrorMessage('Kunde inte ta bort: ' + error.message);
      return;
    }

    loadChallenges();
  }

  // ---------- Game actions ----------

  async function handleFinishGame() {
    clearMessages();

    const sure = window.confirm('Avsluta spelet? Korten låses och vinnaren visas.');
    if (!sure) {
      return;
    }

    const { error } = await supabase.from('games').update({ status: 'finished' }).eq('id', gameId);

    if (error) {
      setErrorMessage('Kunde inte avsluta: ' + error.message);
      return;
    }

    setInfoMessage('Spelet är avslutat.');
    loadGame();
  }

  async function handleResetGame() {
    clearMessages();

    const sure = window.confirm('Resetta spelet? ALLA spelares poäng raderas och spelet startar om.');
    if (!sure) {
      return;
    }

    // 1. Delete all completions for this game
    const deleteResult = await supabase.from('completions').delete().eq('game_id', gameId);

    if (deleteResult.error) {
      setErrorMessage('Kunde inte radera poängen: ' + deleteResult.error.message);
      return;
    }

    // 2. Set the game to active again
    const updateResult = await supabase.from('games').update({ status: 'active' }).eq('id', gameId);

    if (updateResult.error) {
      setErrorMessage('Kunde inte starta om spelet: ' + updateResult.error.message);
      return;
    }

    setInfoMessage('Spelet är resettat och igång igen.');
    loadGame();
  }

  async function handleDeleteGame() {
    clearMessages();

    const sure = window.confirm('Ta bort hela spelet "' + game.name + '" med alla kort och poäng? Detta går inte att ångra.');
    if (!sure) {
      return;
    }

    const { error } = await supabase.from('games').delete().eq('id', gameId);

    if (error) {
      setErrorMessage('Kunde inte ta bort spelet: ' + error.message);
      return;
    }

    navigate('/admin');
  }

  // ---------- Render ----------

  if (loading) {
    return <p className="center-text">Laddar...</p>;
  }

  if (!game) {
    return (
      <div className="page">
        <p className="center-text">Spelet finns inte.</p>
        <p className="center-text">
          <Link to="/admin">Tillbaka till admin</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <p>
        <Link to="/admin">← Tillbaka till admin</Link>
      </p>

      <div className="game-header">
        <h1>{game.name}</h1>
        {game.status === 'active' ? (
          <span className="badge badge-active">Pågår</span>
        ) : (
          <span className="badge badge-finished">Avslutat</span>
        )}
      </div>

      {errorMessage && <p className="error">{errorMessage}</p>}
      {infoMessage && <p className="info">{infoMessage}</p>}

      <div className="section">
        <h2>Spelet</h2>
        <div className="admin-buttons">
          <button className="button-secondary" onClick={() => navigate('/game/' + gameId)}>
            Visa som spelare
          </button>
          {game.status === 'active' && (
            <button className="button-primary" onClick={handleFinishGame}>
              Avsluta spel
            </button>
          )}
          <button className="button-danger" onClick={handleResetGame}>
            Resetta spel
          </button>
          <button className="button-danger" onClick={handleDeleteGame}>
            Ta bort spel
          </button>
        </div>
      </div>

      <div className="section">
        <h2>Lägg till kort</h2>
        <form onSubmit={handleAddChallenge} className="form">
          <input
            type="text"
            placeholder='T.ex. "Ta ett foto med kaptenen"'
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
          />
          <div className="admin-challenge-row">
            <input
              type="number"
              className="points-input"
              min="0"
              value={newPoints}
              onChange={(event) => setNewPoints(event.target.value)}
            />
            <button type="submit" className="button-primary">
              Lägg till
            </button>
          </div>
        </form>
      </div>

      <div className="section">
        <h2>Kort ({challenges.length})</h2>
        {challenges.length === 0 && <p className="center-text">Inga kort ännu.</p>}

        {challenges.map(function (challenge) {
          // Edit mode for this card
          if (editingId === challenge.id) {
            return (
              <div key={challenge.id} className="admin-challenge">
                <input
                  type="text"
                  value={editText}
                  onChange={(event) => setEditText(event.target.value)}
                />
                <div className="admin-challenge-row">
                  <input
                    type="number"
                    className="points-input"
                    min="0"
                    value={editPoints}
                    onChange={(event) => setEditPoints(event.target.value)}
                  />
                  <button className="button-primary" onClick={() => handleSaveEdit(challenge.id)}>
                    Spara
                  </button>
                  <button className="button-secondary" onClick={cancelEditing}>
                    Avbryt
                  </button>
                </div>
              </div>
            );
          }

          // Normal view
          return (
            <div key={challenge.id} className="admin-challenge">
              <div>
                <strong>{challenge.text}</strong> – {challenge.points} p
              </div>
              <div className="admin-challenge-row">
                <button className="button-secondary" onClick={() => startEditing(challenge)}>
                  Redigera
                </button>
                <button className="button-danger" onClick={() => handleDeleteChallenge(challenge)}>
                  Ta bort
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminGamePage;
