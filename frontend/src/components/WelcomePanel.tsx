import { createSignal } from 'solid-js';

export default function WelcomePanel() {
  const [count, setCount] = createSignal(0);

  return (
    <section class="welcome-panel">
      <p class="eyebrow">Astro + Solid</p>
      <h1>Moview</h1>
      <p class="lede">
        The frontend is now running Astro with an interactive Solid component.
      </p>
      <button type="button" onClick={() => setCount(count() + 1)}>
        Watched {count()} {count() === 1 ? 'scene' : 'scenes'}
      </button>
    </section>
  );
}
