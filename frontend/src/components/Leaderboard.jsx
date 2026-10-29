// Full highscore list. The rows are already sorted (most points first,
// and on a tie the one who reached the score first).
// Top 3 get medals. (The leader is also shown in the TopThree podium.)
function Leaderboard({ rows, currentUserId }) {
  const medals = ['🥇', '🥈', '🥉'];

  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="section">
      <h2>🏆 Hela listan</h2>

      <ol className="leaderboard-list">
        {rows.map(function (row, index) {
          const position = index + 1;

          let rankText = String(position);
          if (index < 3) {
            rankText = medals[index];
          }

          let className = 'leaderboard-row';
          if (position <= 3) {
            className = className + ' rank-' + position;
          }
          if (row.user_id === currentUserId) {
            className = className + ' is-me';
          }

          return (
            <li key={row.user_id} className={className}>
              <span className="leaderboard-rank">{rankText}</span>
              <span className="leaderboard-name">{row.username}</span>
              <span className="leaderboard-score">{row.total_points} p</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default Leaderboard;
