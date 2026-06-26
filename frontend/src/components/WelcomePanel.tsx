import { useState } from 'preact/hooks';

export default function WelcomePanel() {
  const [count, setCount] = useState(0);

  return (
    <section className="welcome-panel">
      <p className="eyebrow">Astro + Preact</p>
      <h1>Moview</h1>
      <p className="lede">
        The frontend is now running Astro with an interactive Preact component.
      </p>
      <button type="button" onClick={() => setCount((current) => current + 1)}>
        Watched {count} {count === 1 ? 'scene' : 'scenes'}
      </button>
    </section>
  );
}
