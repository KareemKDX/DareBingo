// The game page: shows all challenge cards for one game and the highscore.
// Tap a card to complete it, tap again to undo (with a confirm).
// Listens to Supabase Realtime so the highscore updates live.
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import ChallengeCard from '../components/ChallengeCard';
import Leaderboard from '../components/Leaderboard';
import WinnerBanner from '../components/WinnerBanner';
import TopThree from '../components/TopThree';

function GamePage() {
  const { gameId } = useParams();
  const { user } = useAuth();

  const [game, setGame] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [myCompletedIds, setMyCompletedIds] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [busyChallengeId, setBusyChallengeId] = useState(null);

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

  async function loadMyCompletions() {
    const { data, error } = await supabase
      .from('completions')
      .select('challenge_id')
      .eq('game_id', gameId)
      .eq('user_id', user.id);

    if (error) {
      setErrorMessage('Kunde inte hämta dina klara kort: ' + error.message);
      return;
    }

    const ids = [];
    for (const row of data) {
      ids.push(row.challenge_id);
    }
    setMyCompletedIds(ids);
  }

  // Most points first. On a tie: the one who reached the score first wins.
  async function loadLeaderboard() {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('user_id, username, total_points, reached_at')
      .eq('game_id', gameId)
      .order('total_points', { ascending: false })
      .order('reached_at', { ascending: true });

    if (error) {
      setErrorMessage('Kunde inte hämta highscore: ' + error.message);
      return;
    }
    setLeaderboard(data);
  }

  // Load everything when the page opens
  useEffect(() => {
    async function loadEverything() {
      setLoading(true);
      await loadGame();
      await loadChallenges();
      await loadMyCompletions();
      await loadLeaderboard();
      setLoading(false);
    }

    loadEverything();
  }, [gameId]);

  // Realtime: when someone completes/undoes a card, or the game
  // is finished/reset, reload the data.
  // (Supabase can't filter delete events, so we listen to all
  // completions and simply reload.)
  useEffect(() => {
    // A unique channel name, so a re-mount never reuses an old channel
    const channelName = 'game-' + gameId + '-' + Math.random();

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completions' }, function () {
        loadLeaderboard();
        loadMyCompletions();
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: 'id=eq.' + gameId },
        function () {
          loadGame();
        }
      )
      .subscribe();

    return function () {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  // Complete or undo a challenge
  async function handleToggle(challenge) {
    const isDone = myCompletedIds.includes(challenge.id);
    setErrorMessage('');

    if (isDone) {
      const wantsToUndo = window.confirm('Ångra "' + challenge.text + '"? Du förlorar ' + challenge.points + ' poäng.');
      if (!wantsToUndo) {
        return;
      }

      setBusyChallengeId(challenge.id);
      const { error } = await supabase
        .from('completions')
        .delete()
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id);

      if (error) {
        setErrorMessage('Kunde inte ångra: ' + error.message);
      } else {
        const newIds = myCompletedIds.filter(function (id) {
          return id !== challenge.id;
        });
        setMyCompletedIds(newIds);
      }
    } else {
      setBusyChallengeId(challenge.id);
      const { error } = await supabase.from('completions').insert({
        user_id: user.id,
        challenge_id: challenge.id,
        game_id: gameId,
      });

      if (error) {
        setErrorMessage('Kunde inte markera som klar: ' + error.message);
      } else {
        setMyCompletedIds([...myCompletedIds, challenge.id]);
      }
    }

    setBusyChallengeId(null);
    // Update the highscore right away (realtime will also do it)
    loadLeaderboard();
  }

  if (loading) {
    return <p className="center-text">Laddar spelet...</p>;
  }

  if (!game) {
    return (
      <div className="page">
        <p className="center-text">Spelet finns inte.</p>
        <p className="center-text">
          <Link to="/">Tillbaka till spelen</Link>
        </p>
      </div>
    );
  }

  const isFinished = game.status === 'finished';

  // Add up my points
  let myPoints = 0;
  for (const challenge of challenges) {
    if (myCompletedIds.includes(challenge.id)) {
      myPoints = myPoints + challenge.points;
    }
  }

  return (
    <div className="page">
      <div className="game-header">
        <h1>{game.name}</h1>
        {isFinished ? (
          <span className="badge badge-finished">Avslutat</span>
        ) : (
          <span className="badge badge-active">Pågår</span>
        )}
      </div>

      {isFinished && <WinnerBanner winner={leaderboard[0]} currentUserId={user.id} />}

      {isFinished && <p className="center-text">🔒 Korten är låsta.</p>}

      <TopThree rows={leaderboard} />

      <div className="my-points">
        <span className="my-points-label">Dina poäng</span>
        <span className="my-points-number">{myPoints}</span>
        <span className="my-points-cards">
          {myCompletedIds.length} av {challenges.length} kort klara
        </span>
      </div>

      {errorMessage && <p className="error">{errorMessage}</p>}

      {challenges.length === 0 && <p className="center-text">Inga kort i det här spelet än.</p>}

      <div className="card-grid">
        {challenges.map(function (challenge, index) {
          return (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              number={index + 1}
              isDone={myCompletedIds.includes(challenge.id)}
              isLocked={isFinished}
              isBusy={busyChallengeId === challenge.id}
              onToggle={handleToggle}
            />
          );
        })}
      </div>

      <Leaderboard rows={leaderboard} currentUserId={user.id} />
    </div>
  );
}

export default GamePage;
