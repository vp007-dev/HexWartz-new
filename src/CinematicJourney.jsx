import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUpRight } from 'lucide-react';

const SCENES = [
  { name: 'The destination', kicker: 'YOUR REAL-WORLD GREAT HALL', title: 'A little magic. A real place to make it happen.', description: 'Sharda University, Agra. Two days of ideas, new friendships, and building something that matters.', image: '/assets/v2/sharda%20agra.jpg', alt: 'Sharda University Agra campus in daylight', origin: '50% 56%' },
  { name: 'The possibility', kicker: '13–14 NOVEMBER 2026 · SHARDA UNIVERSITY, AGRA', title: 'The lights stay on. So does your imagination.', description: 'Four houses. One shared ambition. Your next chapter begins with what you create.', image: '/assets/scenes/campus-night.webp', alt: 'An artistic nighttime view of the Sharda University Agra campus', origin: '50% 52%' },
];

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

export default function CinematicJourney({ enabled }) {
  const root = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    const section = root.current;
    const stage = section.querySelector('.cinematic-stage');
    const scenes = [...section.querySelectorAll('.journey-scene')];
    const chapters = [...section.querySelectorAll('.journey-chapter')];
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let start = 0;
    let distance = 1;
    let active = false;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (document.hidden) return;
      const progress = clamp((window.scrollY - start) / distance);
      section.toggleAttribute('data-pinned', window.scrollY >= start && window.scrollY <= start + distance);
      const chapter = Math.min(SCENES.length - 1, Math.floor(progress * SCENES.length));
      const fade = smooth((progress - 0.44) / 0.12);
      const fades = [1 - fade, fade];
      scenes.forEach((scene, index) => {
        const local = clamp((progress - index / SCENES.length) * SCENES.length);
        scene.style.opacity = preference.matches ? Number(index === chapter) : fades[index];
        scene.querySelector('img').style.transform = preference.matches ? 'none' : `scale(${1.02 + local * 0.22})`;
        scene.setAttribute('aria-hidden', String(index !== chapter));
        chapters[index].setAttribute('aria-pressed', String(index === chapter));
      });
      section.style.setProperty('--journey-progress', progress);
    };
    const schedule = () => { if (active && !frame) frame = requestAnimationFrame(update); };
    const measure = () => {
      const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
      start = section.getBoundingClientRect().top + window.scrollY - stickyTop;
      distance = Math.max(1, section.offsetHeight - stage.offsetHeight);
      schedule();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(section);
    resize.observe(document.querySelector('.landing-hero'));
    resize.observe(document.querySelector('.landing-header'));
    const visibility = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) { measure(); schedule(); }
      else section.removeAttribute('data-pinned');
    }, { rootMargin: '200px 0px' });
    visibility.observe(section);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', measure);
    document.addEventListener('visibilitychange', schedule);
    preference.addEventListener('change', schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', measure);
      document.removeEventListener('visibilitychange', schedule);
      preference.removeEventListener('change', schedule);
    };
  }, [enabled]);

  const goToChapter = index => {
    const section = root.current;
    const stage = section.querySelector('.cinematic-stage');
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const start = section.getBoundingClientRect().top + window.scrollY - stickyTop;
    const distance = section.offsetHeight - stage.offsetHeight;
    window.scrollTo({ top: start + distance * (index + 0.35) / SCENES.length, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return (
    <section ref={root} className="campus-showcase cinematic-journey" id="venue" aria-label="A journey into HexWartz and Sharda University Agra">
      <div className="cinematic-stage">
        <div className="journey-masthead"><span>THE HEXWARTZ JOURNEY</span><span>IMAGINE · ARRIVE · CREATE</span></div>
        {SCENES.map((scene, index) => (
          <article className="journey-scene" key={scene.name} aria-hidden={index !== 0} style={{ opacity: index === 0 ? 1 : 0 }}>
            <img src={scene.image} alt={scene.alt} loading="lazy" decoding="async" style={{ transformOrigin: scene.origin }} />
            <div className="journey-scene-shade" />
            <div className="journey-scene-copy">
              <p className="journey-scene-kicker"><span>0{index + 1}</span>{scene.kicker}</p>
              <h2>{scene.title}</h2>
              <p className="journey-scene-description">{scene.description}</p>
              {index === SCENES.length - 1 && <span className="journey-scene-note">A 36-hour on-campus hackathon</span>}
            </div>
          </article>
        ))}
        <div className="journey-bottom-bar">
          <nav className="journey-chapters" aria-label="Journey chapters">
            {SCENES.map((scene, index) => <button type="button" className="journey-chapter" key={scene.name} aria-pressed={index === 0} onClick={() => goToChapter(index)}><span>0{index + 1}</span>{scene.name}<ArrowUpRight size={13} /></button>)}
          </nav>
          <a href="#houses" className="journey-next">Choose your house <ArrowDown size={15} /></a>
        </div>
        <div className="journey-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
