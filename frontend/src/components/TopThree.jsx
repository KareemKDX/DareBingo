// "Top 3 right now" podium shown at the top of the game page.
// rows = the sorted leaderboard. Order on screen: 2nd, 1st, 3rd (like a real podium).
function TopThree({ rows }) {
  if (rows.length === 0) {
    return (
      <div className="top-three">
        <h2 className="top-three-title">Topp 3 just nu</h2>
        <p className="top-three-empty">Ingen har poäng än – bli först! 🚀</p>
      </div>
    );
  }

  return (
    <div className="top-three">
      <h2 className="top-three-title">Topp 3 just nu</h2>
      <div className="podium">
        <PodiumSpot player={rows[1]} place={2} medal="🥈" />
        <PodiumSpot player={rows[0]} place={1} medal="🥇" />
        <PodiumSpot player={rows[2]} place={3} medal="🥉" />
      </div>
    </div>
  );
}

// One spot on the podium. Shows a dash if nobody has that place yet.
function PodiumSpot({ player, place, medal }) {
  const className = 'podium-spot podium-' + place;

  if (!player) {
    return (
      <div className={className + ' podium-empty'}>
        <div className="podium-medal">{medal}</div>
        <div className="podium-name">–</div>
        <div className="podium-block">{place}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {place === 1 && <div className="podium-crown">👑</div>}
      <div className="podium-medal">{medal}</div>
      <div className="podium-name">{player.username}</div>
      <div className="podium-points">{player.total_points} p</div>
      <div className="podium-block">{place}</div>
    </div>
  );
}

export default TopThree;
