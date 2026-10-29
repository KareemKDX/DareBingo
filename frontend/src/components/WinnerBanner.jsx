// Big banner that shows who won when the game is finished.
// "winner" is the first row of the sorted leaderboard (or undefined).
function WinnerBanner({ winner, currentUserId }) {
  if (!winner) {
    return (
      <div className="winner-banner">
        <div className="winner-trophy">🏁</div>
        <div className="winner-label">Spelet är slut</div>
        <div className="winner-points">Ingen fick några poäng.</div>
      </div>
    );
  }

  const iWon = winner.user_id === currentUserId;

  return (
    <div className="winner-banner">
      <div className="winner-trophy">🏆</div>
      <div className="winner-label">Spelet är slut – vinnaren är</div>
      <div className="winner-name">{winner.username}</div>
      <div className="winner-points">med {winner.total_points} poäng!</div>
      {iWon && <div className="winner-points">🎉 Grattis, det är du! 🎉</div>}
    </div>
  );
}

export default WinnerBanner;
