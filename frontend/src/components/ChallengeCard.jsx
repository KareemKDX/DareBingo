// One challenge card. The look depends on the points:
// 1 p = simple, 2 p = blue star, 3+ p = big fiery "jackpot" card.
// Completed cards turn green with a "KLAR" stamp.
// Locked (can't be tapped) when the game is finished.
function ChallengeCard({ challenge, number, isDone, isLocked, isBusy, onToggle }) {
  // Pick the points level
  let pointsLevel = 'low';
  if (challenge.points === 2) {
    pointsLevel = 'mid';
  }
  if (challenge.points >= 3) {
    pointsLevel = 'high';
  }

  let pointsIcon = '';
  if (pointsLevel === 'mid') {
    pointsIcon = '⭐';
  }
  if (pointsLevel === 'high') {
    pointsIcon = '🔥';
  }

  let className = 'challenge-card card-' + pointsLevel;
  if (isDone) {
    className = className + ' done';
  }
  if (isLocked) {
    className = className + ' locked';
  }

  function handleClick() {
    if (isLocked || isBusy) {
      return;
    }
    onToggle(challenge);
  }

  return (
    <button className={className} onClick={handleClick} disabled={isLocked}>
      <span className="card-number">{number}</span>

      <span className="challenge-text">{challenge.text}</span>

      <span className={'challenge-points points-' + pointsLevel}>
        {pointsIcon && <span className="points-icon">{pointsIcon}</span>}
        <span className="points-number">{challenge.points}</span>
        <span className="points-word">poäng</span>
      </span>

      {isDone && <span className="done-stamp">KLAR ✓</span>}
    </button>
  );
}

export default ChallengeCard;
