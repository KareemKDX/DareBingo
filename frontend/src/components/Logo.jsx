// The app logo: a bingo ball + "BINGOSPEL" text.
// size="big" is used on the login/signup pages and also shows a tagline.
function Logo({ size }) {
  let className = 'logo';
  if (size === 'big') {
    className = className + ' logo-big';
  }

  return (
    <span className={className}>
      <span className="logo-ball">
        <span className="logo-ball-inner">B</span>
      </span>
      <span className="logo-words">
        <span className="logo-text">
          BINGO<span className="logo-text-accent">SPEL</span>
        </span>
        {size === 'big' && <span className="logo-tagline">🍻 Svensexa-edition 🍻</span>}
      </span>
    </span>
  );
}

export default Logo;
