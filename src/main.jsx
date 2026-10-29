import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowUpRight, Award, BookOpen, CalendarDays, ChevronDown, ChevronRight, ChevronUp, Clock, Lock, MapPin, Menu, Music, Scroll, ShieldAlert, Sparkles, Trophy, Users, Volume2, VolumeX, X, Zap } from 'lucide-react';
import EnchantedAtmosphere from './EnchantedAtmosphere';
import './styles.css';

const HOUSE_TRACKS = [
  {
    house: 'Gryffindor',
    track: 'AI / ML',
    mark: '01',
    tone: 'crimson',
    gem: 'Ruby',
    trait: 'Bravery & Audacity',
    banner: '/assets/v2/house-banner-gryffindor.webp',
    desc: 'Channel the courage of Godric Gryffindor to build intelligent agents, neural systems, and frontier AI/ML solutions.',
  },
  {
    house: 'Ravenclaw',
    track: 'Healthcare',
    mark: '02',
    tone: 'blue',
    gem: 'Sapphire',
    trait: 'Wisdom & Intellect',
    banner: '/assets/v2/house-banner-ravenclaw.webp',
    desc: 'Apply profound wisdom and analytical ingenuity to heal the world with transformative healthcare technology.',
  },
  {
    house: 'Hufflepuff',
    track: 'Sustainable Development Goals',
    mark: '03',
    tone: 'gold',
    gem: 'Topaz',
    trait: 'Loyalty & Dedication',
    banner: '/assets/v2/house-banner-hufflepuff.webp',
    desc: 'Champion sustainable earth initiatives, clean energy, and ethical solutions with steadfast devotion.',
  },
  {
    house: 'Slytherin',
    track: 'Open Innovation',
    mark: '04',
    tone: 'green',
    gem: 'Emerald',
    trait: 'Ambition & Cunning',
    banner: '/assets/v2/house-banner-slytherin.webp',
    desc: 'Wield raw ambition and boundless creativity to redefine possibilities across uncharted domains.',
  },
];

const UNSTOP_URL = 'https://unstop.com/hackathons/hexwartz-sharda-university-agra-1778042';
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeU1ffu-uS2pBMyXtaqqbC_gtS7Eo_JN3EWyOn6dtXTU1gSmA/viewform?usp=publish-editor';
const GUIDELINES_URL = 'https://drive.google.com/file/d/1X1ZfZNC9EDlyI_O8IfjhlmZapnJ4y-pw/view?usp=sharing';

const FAQ_DATA = [
  {
    q: 'WHO CAN ENTER THE GATES OF HEXWARTZ?',
    a: 'HexWartz is open to undergraduate and postgraduate collegiate wizards across all recognized institutions globally. Cross-college and cross-specialization alliances are strongly championed. Bring your official student guild credentials for on-campus verification.'
  },
  {
    q: 'WHAT ARE THE EXACT FELLOWSHIP REQUIREMENTS?',
    a: 'Each fellowship must assemble 2 to 4 collegiate builders. Cross-college and cross-specialization teams are allowed and welcomed. Solo participants can be paired during discord sorting. Each wizard may commit allegiance to exactly one fellowship.'
  },
  {
    q: 'HOW DO THE TWO TOURNAMENT PHASES OPERATE?',
    a: 'Phase 1 is a 100% free online PPT & architecture deck submission hosted on Unstop. The Ministry reviews all scrolls and shortlists the top fellowships. Shortlisted squads advance to Phase 2: the 36-hour offline crucible at Sharda University, Agra on 13–14 November 2026.'
  },
  {
    q: 'IS THERE A REGISTRATION FEE FOR PARTICIPANTS?',
    a: 'Phase 1 (The Online Owl Post) is completely FREE with zero galleons required. A nominal commitment fee of ₹250 per squad member is payable ONLY upon official shortlisting for the final offline crucible to guarantee your on-campus accommodations, dorms, and 24/7 feasts.'
  },
  {
    q: 'WHAT ARE THE LAWS OF CODE ORIGINALITY?',
    a: 'All prototype source code must be authored during the 36-hour physical hackathon. Open-source libraries, frameworks, public APIs, and declared generative AI assistants are permitted. Unattributed plagiarism triggers instant tribunal disqualification.'
  }
];

const GUIDE_STOPS = [
  { id: 'venue', label: 'Visit the venue' },
  { id: 'houses', label: 'Explore the houses' },
  { id: 'journey', label: 'Tournament codex' },
  { id: 'prizes', label: 'Triwizard treasures' },
  { id: 'registration', label: 'The Daily Prophet' },
  { id: 'faq', label: 'Restricted FAQ' },
];

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNightCampus, setShowNightCampus] = useState(false);
  const [activeGuideIndex, setActiveGuideIndex] = useState(0);
  const [prophetPlaying, setProphetPlaying] = useState(false);
  const [wardResonating, setWardResonating] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(0);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  // Starting Screen & Video Sequence State
  const [introState, setIntroState] = useState('initial'); // 'initial' | 'playing' | 'exiting' | 'entered'
  const [introFading, setIntroFading] = useState(false);
  const audioRef = useRef(null);
  const introVideoRef = useRef(null);
  const envelopeRef = useRef(null);
  const soundContextRef = useRef(null);
  const introFrameRef = useRef(0);
  const revealTimerRef = useRef(0);
  const wardTimerRef = useRef(0);
  const prophetTimerRef = useRef(0);
  const siteVisible = introState === 'exiting' || introState === 'entered';

  useEffect(() => () => {
    cancelAnimationFrame(introFrameRef.current);
    clearTimeout(revealTimerRef.current);
    clearTimeout(wardTimerRef.current);
    clearTimeout(prophetTimerRef.current);
    soundContextRef.current?.close();
  }, []);

  const getSoundContext = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    const ctx = soundContextRef.current || (soundContextRef.current = new AudioCtx());
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };

  // Background Theme Music Setup
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.45;
      audio.loop = true;
    }
  }, []);

  const handleEnterCastle = () => {
    // 1. Play background music
    const audio = audioRef.current;
    if (audio) {
      audio.play().then(() => setIsMusicPlaying(true)).catch((e) => console.log('Audio autoplay prevented:', e));
    }

    // 2. Play Web Audio wand chime
    playParchmentSound();

    // 3. Start Video zooming sequence
    setIntroState('playing');
    const video = introVideoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => triggerSiteReveal());

      // As requested: the video zooms into nothingness around ~5.5s to 6.2s.
      // The remaining part is long so we trigger a smooth fade-out and load the website
      // exactly at the golden nexus / vortex burst (~5.8s) before the video finishes!
      const checkTime = () => {
        if (!video) return;
        if (video.currentTime >= 5.8) {
          triggerSiteReveal();
        } else {
          introFrameRef.current = requestAnimationFrame(checkTime);
        }
      };
      introFrameRef.current = requestAnimationFrame(checkTime);
    }
  };

  const triggerSiteReveal = () => {
    if (revealTimerRef.current) return;
    cancelAnimationFrame(introFrameRef.current);
    setIntroFading(true);
    setIntroState('exiting');
    revealTimerRef.current = setTimeout(() => {
      introVideoRef.current?.pause();
      setIntroState('entered');
    }, 1200); // 1.2s luxurious cinematic crossfade
  };

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setIsMusicPlaying(true)).catch(() => {});
    } else {
      audio.pause();
      setIsMusicPlaying(false);
    }
  };

  const playParchmentSound = () => {
    try {
      const ctx = getSoundContext();
      if (ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      }
    } catch (e) {
      // Audio fallback
    }
  };

  const probeVaultWards = () => {
    try {
      const ctx = getSoundContext();
      if (ctx) {
        const now = ctx.currentTime;
        // Deep resonant ward rumble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.7);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };

        // Arcane celestial harmonics
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const chimeOsc = ctx.createOscillator();
          const chimeGain = ctx.createGain();
          chimeOsc.type = 'sine';
          chimeOsc.frequency.setValueAtTime(freq, now + 0.12 + idx * 0.08);
          chimeGain.gain.setValueAtTime(0, now + 0.12 + idx * 0.08);
          chimeGain.gain.linearRampToValueAtTime(0.05, now + 0.15 + idx * 0.08);
          chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1 + idx * 0.08);
          chimeOsc.connect(chimeGain);
          chimeGain.connect(ctx.destination);
          chimeOsc.start(now + 0.12 + idx * 0.08);
          chimeOsc.stop(now + 1.15 + idx * 0.08);
          chimeOsc.onended = () => { chimeOsc.disconnect(); chimeGain.disconnect(); };
        });
      }
    } catch (e) {
      console.warn('Ward audio error:', e);
    }
    setWardResonating(true);
    clearTimeout(wardTimerRef.current);
    wardTimerRef.current = setTimeout(() => setWardResonating(false), 2400);
  };

  const toggleProphetAudio = () => {
    try {
      const ctx = getSoundContext();
      if (ctx) {
        const now = ctx.currentTime;
        // Enchanted Patronus chime (A-major 9th harmonic arpeggio)
        const notes = [440, 554.37, 659.25, 830.61, 1108.73, 1318.51];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.08 + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.8);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 1.85);
          osc.onended = () => { osc.disconnect(); gain.disconnect(); };
        });
      }
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
    setProphetPlaying(true);
    clearTimeout(prophetTimerRef.current);
    prophetTimerRef.current = setTimeout(() => setProphetPlaying(false), 2400);
  };

  const handleCardTilt = (e) => {
    const card = e.currentTarget;
    if (!card._cardRect) {
      card._cardRect = card.getBoundingClientRect();
    }
    const rect = card._cardRect;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
  };

  const handleCardTiltReset = (e) => {
    const card = e.currentTarget;
    card.style.transform = '';
    card._cardRect = null;
  };

  useEffect(() => {
    const sections = document.querySelectorAll('.landing-hero, .landing-section');
    // Offscreen SVG stroke and glow animations were still causing layout and paint every frame.
    if (!siteVisible) {
      sections.forEach(section => section.classList.add('animations-paused'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => entry.target.classList.toggle('animations-paused', !entry.isIntersecting));
    }, { rootMargin: '200px 0px' });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [siteVisible]);

  useEffect(() => {
    const envelope = envelopeRef.current;
    if (!envelope || !siteVisible) return undefined;

    const hero = document.querySelector('.landing-hero');
    const showcase = document.querySelector('.campus-showcase');
    const heroArt = document.querySelector('.landing-hero-art');
    const challenge = document.querySelector('.challenge-section');
    const journey = document.querySelector('.journey-section');
    const prizes = document.querySelector('.prizes-section');
    const registration = document.querySelector('.registration-section');
    const faq = document.querySelector('.faq-section');
    const footer = document.querySelector('.landing-footer');
    const sections = [hero, showcase, challenge, journey, prizes, registration, faq, footer];
    const sectionTops = new Map();
    let envelopeWidth = envelope.offsetWidth;
    let scrollDirty = true;

    let frameId = 0;
    let lastFrameTime = 0;
    let currentPose = null;
    let targetPose = null;
    let attachedToOwl = true;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const getAttachedPose = () => {
      if (!heroArt) return null;

      const rect = heroArt.getBoundingClientRect();
      const scale = Math.max(0.14, Math.min(0.42, rect.width * 0.26 / Math.max(1, envelopeWidth)));
      const visibleSizeRatio = envelopeWidth * scale / Math.max(1, rect.width);
      // The envelope's top fold (about 27% across, 23% down its square image)
      // sits on the beak; this keeps the owl's face clear as the art floats.
      return {
        x: ((rect.left + rect.width * (0.325 + (0.5 - 0.274) * visibleSizeRatio)) / window.innerWidth) * 100,
        y: ((rect.top + rect.height * (0.275 + (0.5 - 0.23) * visibleSizeRatio)) / window.innerHeight) * 100,
        scale,
        rotate: -5,
      };
    };

    const updateScrollTransition = () => {
      if (!hero || !showcase || !heroArt || !envelope) return;

      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const absoluteTop = (element) => {
        if (!sectionTops.has(element)) sectionTops.set(element, element.getBoundingClientRect().top + scrollY);
        return sectionTops.get(element);
      };
      const heroTop = absoluteTop(hero);
      const venueTop = absoluteTop(showcase);
      const heroBottom = absoluteTop(hero) + hero.offsetHeight;
      const isNarrow = window.innerWidth <= 640;
      const guideRightX = isNarrow ? 60 : 88;
      const guideLeftX = isNarrow ? 40 : 12;
      const guideTopY = isNarrow ? 22 : 24;
      const guideBottomY = isNarrow ? 76 : 77;
      const guideScale = isNarrow ? 0.46 : Math.min(0.48, Math.max(0.39, 300 / envelopeWidth));
      const startAt = heroTop + viewportHeight * 0.18;
      const attachedPose = getAttachedPose();
      const releasePose = attachedPose
        ? { ...attachedPose, y: (attachedPose.y * viewportHeight / 100 + scrollY - startAt) / viewportHeight * 100 }
        : { x: 50, y: 50, scale: 0.2, rotate: -5 };
      const stops = [
        { at: startAt, ...releasePose },
        { at: heroBottom - viewportHeight * 0.18, x: guideRightX, y: guideTopY, scale: guideScale, rotate: 16 },
        { at: venueTop + viewportHeight * 0.18, x: guideRightX - (isNarrow ? 3 : 5), y: guideTopY + 4, scale: guideScale, rotate: -7 },
        { at: venueTop + viewportHeight * 0.8, x: guideRightX, y: 52, scale: guideScale, rotate: 8 },
        { at: venueTop + viewportHeight * 1.55, x: guideRightX - 8, y: guideBottomY, scale: guideScale, rotate: -8 },
        { at: venueTop + showcase.offsetHeight - viewportHeight * 0.18, x: guideRightX, y: guideTopY, scale: guideScale, rotate: 16 },
        { at: absoluteTop(challenge) + viewportHeight * 0.28, x: guideRightX, y: guideTopY, scale: guideScale, rotate: -7 },
        { at: absoluteTop(challenge) + viewportHeight * 0.82, x: guideRightX, y: guideBottomY, scale: guideScale, rotate: 8 },
        { at: absoluteTop(journey) + viewportHeight * 0.2, x: guideLeftX, y: guideBottomY, scale: guideScale, rotate: -12 },
        { at: absoluteTop(journey) + viewportHeight * 0.78, x: guideLeftX, y: guideTopY, scale: guideScale, rotate: 9 },
        ...(prizes ? [
          { at: absoluteTop(prizes) + viewportHeight * 0.2, x: guideRightX, y: guideTopY, scale: guideScale, rotate: -8 },
          { at: absoluteTop(prizes) + viewportHeight * 0.8, x: guideRightX - 6, y: guideBottomY, scale: guideScale, rotate: 10 },
        ] : []),
        { at: absoluteTop(registration) + viewportHeight * 0.2, x: guideLeftX + (isNarrow ? 12 : 10), y: guideBottomY, scale: guideScale, rotate: -10 },
        ...(faq ? [
          { at: absoluteTop(faq) + viewportHeight * 0.2, x: guideRightX, y: guideTopY, scale: guideScale, rotate: -7 },
          { at: absoluteTop(faq) + viewportHeight * 0.7, x: guideRightX - 4, y: guideBottomY, scale: guideScale, rotate: 8 },
        ] : []),
        { at: absoluteTop(footer) + viewportHeight * 0.25, x: guideLeftX, y: guideTopY, scale: guideScale, rotate: 8 },
      ];
      const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
      let pose;
      attachedToOwl = scrollY < startAt;
      if (attachedToOwl) {
        pose = attachedPose || releasePose;
      } else {
        const segmentIndex = stops.findIndex((stop, index) => index < stops.length - 1 && scrollY <= stops[index + 1].at);
        const segment = Math.max(0, segmentIndex < 0 ? stops.length - 2 : segmentIndex);
        const from = stops[segment];
        const to = stops[segment + 1];
        const local = clamp((scrollY - from.at) / Math.max(1, to.at - from.at), 0, 1);
        const eased = local * local * (3 - 2 * local);
        const point = (a, b) => a + (b - a) * eased;
        pose = {
          x: point(from.x, to.x),
          y: point(from.y, to.y),
          scale: point(from.scale, to.scale),
          rotate: point(from.rotate, to.rotate),
        };
      }

      if (!attachedToOwl) {
        pose.x = clamp(pose.x, isNarrow ? 38 : 8, isNarrow ? 62 : 92);
        pose.y = clamp(pose.y, 12, 84);
      }
      targetPose = pose;
      if (!currentPose) currentPose = { ...pose };
      envelope.style.opacity = '1';

      const guideSections = [showcase, challenge, journey, prizes, registration].filter(Boolean);
      let guideIndex = 0;
      guideSections.forEach((section, index) => {
        if (absoluteTop(section) <= scrollY + viewportHeight * 0.56) guideIndex = index;
      });
      const guiding = scrollY > heroTop + viewportHeight * 0.48;
      envelope.classList.toggle('is-guiding', guiding);
      envelope.style.pointerEvents = guiding ? 'auto' : 'none';
      setActiveGuideIndex((current) => current === guideIndex ? current : guideIndex);
      setShowNightCampus(scrollY >= venueTop + viewportHeight * 0.72);
    };

    function animateEnvelope(time) {
      frameId = 0;
      if (document.hidden) return;
      if (scrollDirty) {
        scrollDirty = false;
        updateScrollTransition();
      }
      if (!targetPose || !currentPose) {
        frameId = 0;
        return;
      }
      if (attachedToOwl) {
        const pose = getAttachedPose();
        if (pose) {
          currentPose = pose;
          targetPose = { ...currentPose };
          envelope.style.transform = `translate3d(${currentPose.x}vw, ${currentPose.y}vh, 0) translate(-50%, -50%) scale(${currentPose.scale}) rotate(${currentPose.rotate}deg)`;
        }
        if (reduceMotion) {
          frameId = 0;
          return;
        }
        frameId = window.requestAnimationFrame(animateEnvelope);
        return;
      }
      const delta = lastFrameTime ? Math.min(48, time - lastFrameTime) : 16;
      lastFrameTime = time;
      const ease = reduceMotion ? 1 : 1 - Math.exp(-delta / 90);
      let remaining = 0;
      ['x', 'y', 'scale', 'rotate'].forEach((key) => {
        const difference = targetPose[key] - currentPose[key];
        currentPose[key] += difference * ease;
        remaining = Math.max(remaining, Math.abs(difference));
      });
      envelope.style.transform = `translate3d(${currentPose.x}vw, ${currentPose.y}vh, 0) translate(-50%, -50%) scale(${currentPose.scale}) rotate(${currentPose.rotate}deg)`;
      if (remaining > 0.015) frameId = window.requestAnimationFrame(animateEnvelope);
      else {
        currentPose = { ...targetPose };
        lastFrameTime = 0;
        frameId = 0;
      }
    }

    const scheduleUpdate = () => {
      scrollDirty = true;
      if (!frameId && !document.hidden) frameId = window.requestAnimationFrame(animateEnvelope);
    };
    const refreshLayout = () => {
      sectionTops.clear();
      envelopeWidth = envelope.offsetWidth;
      scheduleUpdate();
    };
    // Layout changes (fonts, images, FAQ, menu) invalidate the cached document positions.
    const observer = new ResizeObserver(refreshLayout);
    sections.filter(Boolean).forEach(section => observer.observe(section));
    observer.observe(document.querySelector('.landing-header'));
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', refreshLayout);
    document.addEventListener('visibilitychange', scheduleUpdate);
    scheduleUpdate();
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', refreshLayout);
      document.removeEventListener('visibilitychange', scheduleUpdate);
      if (frameId) window.cancelAnimationFrame(frameId);
    };
  }, [siteVisible]);

  return (
    <div className={`site-wrapper landing-page ${introState !== 'entered' ? 'intro-active' : ''}`}>
      
      {/* =========================================================================
          CINEMATIC INTRO STARTING SCREEN (VIDEO & PARCHMENT ENTER BUTTON)
          ========================================================================= */}
      {introState !== 'entered' && (
        <div className={`cinematic-intro-overlay ${introFading ? 'intro-fade-out' : ''}`}>
          
          {/* Background Video */}
          <video
            ref={introVideoRef}
            className="intro-video-element"
            src="/video/gemini_generated_video_f933aace.mp4"
            preload="auto"
            muted
            playsInline
            webkit-playsinline="true"
            x5-playsinline="true"
            onEnded={triggerSiteReveal}
          />

          {/* Vignette & Ambient Shimmer */}
          <div className="intro-ambient-vignette" />

          {/* Starting Screen UI with ENTER Button positioned right under the Title */}
          {introState === 'initial' && (
            <div className="intro-ui-container">
              
              {/* Skip / Direct Entry quick badge */}
              <button 
                type="button" 
                className="intro-skip-btn font-arcane" 
                onClick={triggerSiteReveal}
                aria-label="Skip cinematic prologue"
              >
                <span>SKIP INTRO</span>
                <ChevronRight size={13} />
              </button>

              {/* Centered Button Anchor aligned below the video's HexWartz Hackathon title */}
              <div className="intro-enter-slot">
                
                {/* Ornate Wizarding Parchment Plaque Button */}
                <button
                  type="button"
                  className="intro-parchment-enter-btn"
                  onClick={handleEnterCastle}
                  aria-label="Enter HexWartz Hackathon"
                >
                  {/* Glowing Flourish Aura */}
                  <div className="parchment-btn-glow" aria-hidden="true" />
                  
                  {/* Authentic Golden Parchment Plaque */}
                  <div className="parchment-plaque-shell">
                    <img 
                      src="/assets/intro/enter_button_clean.webp"
                      alt="ENTER" 
                      className="parchment-plaque-img"
                    />
                    <div className="parchment-spark-dot" aria-hidden="true" />
                  </div>
                </button>

                {/* Subtitle prompt */}
                <p className="intro-prompt-sub font-arcane">
                  TAP TO AWAKEN THE WARDS & ENTER PLATFORM 9¾
                </p>

              </div>

            </div>
          )}

          {/* Transition Starlight Flash when zooming into the portal */}
          {introState === 'playing' && (
            <div className="intro-zoom-active-indicator">
              <button 
                type="button" 
                className="intro-skip-btn font-arcane" 
                onClick={triggerSiteReveal}
                aria-label="Skip to castle"
              >
                <span>ENTER NOW</span>
                <ChevronRight size={13} />
              </button>
            </div>
          )}

        </div>
      )}

      <EnchantedAtmosphere enabled={siteVisible} />
      <a
        ref={envelopeRef}
        className="scrolling-seal-guide"
        href={`#${GUIDE_STOPS[activeGuideIndex].id}`}
        aria-label={GUIDE_STOPS[activeGuideIndex].label}
      >
        <img
          className="scrolling-seal-envelope"
          src="/assets/v2/Gemini_Generated_Image_5hr7u45hr7u45hr7-clean.webp"
          alt=""
          aria-hidden="true"
        />
        <span className="letter-guide-label"><span>THE OWL POST</span>{GUIDE_STOPS[activeGuideIndex].label}<ArrowUpRight size={14} /></span>
      </a>

      <header className="landing-header">
        <a className="landing-brand" href="#home" aria-label="HexWartz home">
          <img
            src="/assets/branding/hexwartz_crest_nav.webp"
            alt="HexWartz Crest"
            className="landing-brand-crest"
            width="42"
            height="42"
            loading="eager"
            decoding="async"
          />
          <div className="landing-brand-text">
            <span className="landing-brand-name">HexWartz</span>
            <span className="landing-brand-sub">Sharda University · Agra</span>
          </div>
        </a>
        <button
          className="landing-menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <nav className={`landing-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#venue" onClick={() => setMenuOpen(false)}>Venue</a>
          <a href="#houses" onClick={() => setMenuOpen(false)}>Houses & tracks</a>
          <a href="#journey" onClick={() => setMenuOpen(false)}>Tournament codex</a>
          <a href="#prizes" onClick={() => setMenuOpen(false)}>Prizes</a>
          <a href="#registration" onClick={() => setMenuOpen(false)}>The Daily Prophet</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          <button 
            type="button" 
            className={`nav-music-toggle ${isMusicPlaying ? 'is-playing' : ''}`}
            onClick={toggleMusic}
            aria-label={isMusicPlaying ? 'Pause background music' : 'Play background music'}
            title={isMusicPlaying ? 'Pause Hedwig\'s Theme' : 'Play Hedwig\'s Theme'}
          >
            {isMusicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{isMusicPlaying ? 'Music Playing' : 'Music Paused'}</span>
          </button>
          <a className="landing-nav-cta" href={UNSTOP_URL} target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Register on Unstop <ArrowUpRight size={16} /></a>
        </nav>
      </header>

      <main id="home">
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-glow" aria-hidden="true" />
          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <div className="hero-brand-lockup">
                <img
                  className="hero-character-art"
                  src="/assets/v2/harry-hero.webp"
                  alt="Harry Potter with Hedwig"
                  fetchPriority="high"
                />
                <div className="hero-titles-wrap">
                  <div className="hero-title-main">HEXWARTZ</div>
                  <div className="hero-title-sub">
                    <span className="hero-title-hack">HACK</span>
                    <div className="hero-title-year">
                      <span>20</span>
                      <span>26</span>
                    </div>
                  </div>
                </div>
              </div>

              <h1 className="hero-tagline-arcane" id="hero-title">
                <span className="sr-only">EMBRACING ARCANE CODE</span>
                <img
                  className="hero-tagline-svg"
                  src="/assets/v2/embracing-arcane-code.svg"
                  alt="EMBRACING ARCANE CODE"
                  fetchPriority="high"
                />
              </h1>

              <p className="hero-arcane-desc">
                A two-day Harry Potter–themed hackathon for students who want to build real solutions to real-world problems.
              </p>

              <div className="hero-date-badge">
                <Clock size={18} className="hero-badge-icon" />
                <span>13-14 NOVEMBER 2026 • AGRA</span>
              </div>

              <div className="hero-feature-pills">
                <div className="hero-pill">
                  <Award size={15} className="hero-pill-icon" />
                  <span>₹50,000+ PRIZE POOL</span>
                </div>
                <div className="hero-pill">
                  <Zap size={15} className="hero-pill-icon" />
                  <span>2-DAY FINALE</span>
                </div>
                <div className="hero-pill">
                  <BookOpen size={15} className="hero-pill-icon" />
                  <span>OPEN TO ALL COLLEGES</span>
                </div>
              </div>

              <div className="hero-action-row">
                <a
                  className="hero-btn-primary"
                  href={UNSTOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Register on Unstop"
                >
                  <span>REGISTER ON UNSTOP</span>
                  <ArrowUpRight size={18} strokeWidth={2.8} />
                </a>
                <a
                  className="hero-btn-form"
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Direct Google Form Registration"
                >
                  <Scroll size={15} />
                  <span>GOOGLE FORM</span>
                  <ArrowUpRight size={14} />
                </a>
                <a
                  className="hero-btn-secondary"
                  href={GUIDELINES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Official Tournament Guidelines PDF"
                >
                  <BookOpen size={16} />
                  <span>GUIDELINE BOOK (PDF)</span>
                </a>
              </div>
            </div>

            <div className="landing-hero-art-wrap">
              <img
                className="hero-floating-candles"
                src="/assets/v2/great-hall-candles.webp"
                alt=""
                aria-hidden="true"
                width="256"
                height="384"
                decoding="async"
              />
              <div className="landing-art-frame">
                <img
                  className="landing-hero-art"
                  src="/assets/v2/Gemini_Generated_Image_qshw3cqshw3cqshw-clean%20%281%29.webp"
                  alt="HexWartz crest with a moonlit castle, owl, and spellbook"
                  fetchPriority="high"
                />
              </div>
              <div className="prize-callout">
                <div className="prize-callout-label">PRIZE POOL</div>
                <div className="prize-callout-val">
                  <Trophy size={28} className="prize-trophy-icon" />
                  <strong>₹50,000+</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="landing-hero-bottomline"><span>HEXWARTZ 2026</span><span>FOUR HOUSES · ONE GRAND CHALLENGE</span><span>SCROLL TO EXPLORE ↓</span></div>
        </section>

        <section className="campus-showcase" id="venue" aria-label="Sharda University Agra by day and night">
          <div className="campus-showcase-sticky">
            <img
              className={`campus-showcase-image ${showNightCampus ? 'is-hidden' : 'is-visible'}`}
              src="/assets/v2/sharda%20agra.jpg"
              alt="Sharda University Agra campus in daylight"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
            <img
              className={`campus-showcase-image ${showNightCampus ? 'is-visible' : 'is-hidden'}`}
              src="/assets/v2/Gemini_Generated_Image_msm9x2msm9x2msm9-clean.webp"
              alt="Sharda University Agra campus at night"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
            <div className="campus-showcase-shade" />
            <div className="campus-showcase-caption">
              <span>OFFICIAL VENUE</span>
              <strong>SHARDA UNIVERSITY, AGRA</strong>
              <small>Anand School of Engineering and Technology</small>
            </div>
            <span className="campus-showcase-scroll-hint" aria-hidden="true">SCROLL TO EXPLORE ↓</span>
          </div>
        </section>

        <section className="landing-section challenge-section" id="challenge" aria-labelledby="challenge-title">
          <div className="landing-section-head">
            <p className="section-kicker section-kicker-sparkles">
              <Sparkles size={15} className="kicker-sparkle" />
              <span>GREAT HALL ENCHANTMENT · LIVE HOUSE STANDINGS</span>
              <Sparkles size={15} className="kicker-sparkle" />
            </p>
            <h2 id="challenge-title" className="section-title-3d">
              <span className="title-3d-gold">THE HOUSE CUP</span>{' '}
              <span className="title-3d-white">HOURGLASSES</span>
            </h2>
            <p className="section-desc-3d">
              Four towering glass hourglasses stand in the Great Hall. Shimmering rubies, sapphires, topaz, and emeralds record every fellowship commit, architectural victory, and tribunal point. Choose your House and add to its tally.
            </p>
            <div className="house-section-subbar">
              <span className="house-subbar-pill">CHOOSE YOUR FRONTIER · FOUR CHALLENGE TRACKS</span>
            </div>
          </div>
          <div className="house-track-grid" id="houses">
            {HOUSE_TRACKS.map(({ house, track, mark, tone, gem, trait, banner, desc }) => (
              <article className={`house-track-card tone-${tone}`} key={house}>
                <div className="house-banner-wrap">
                  <img
                    src={banner}
                    alt={`${house} house banner`}
                    className="house-banner-img"
                    loading="lazy"
                  />
                </div>
                <div className="house-card-body">
                  <div className="house-card-header">
                    <span className="track-number">{mark}</span>
                    <div className="house-name-group">
                      <span className="track-house">{house}</span>
                      <span className="house-gem-badge">{gem}</span>
                    </div>
                  </div>
                  <h3 className="track-title">{track}</h3>
                  <span className="track-rule" />
                  <p className="track-desc">{desc}</p>
                  <div className="house-card-footer">
                    <span className="house-trait">{trait}</span>
                    <span className="house-action-pill">
                      Track {mark} <ArrowUpRight size={13} />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section tournament-codex-section journey-section" id="journey" aria-labelledby="codex-title">
          <div className="landing-section-head">
            <div className="section-kicker-sparkles">
              <Sparkles size={14} className="kicker-sparkle" />
              <span>MINISTRY DECREE NO. 36 · OFFICIAL PROTOCOLS</span>
              <Sparkles size={14} className="kicker-sparkle" />
            </div>
            <h2 id="codex-title" className="section-title-3d">
              <span className="title-3d-gold">TOURNAMENT</span>{' '}
              <span className="title-3d-white">CODEX</span>
            </h2>
            <p className="section-desc-3d">
              Clear directives and essential logistics for witches, wizards, and collegiate builders before entering the Great Hall at Sharda University, Agra.
            </p>
          </div>

          <div className="codex-container">
            {/* 4 Sleek Telemetry Capsules */}
            <div className="codex-pills-bar">
              <div className="codex-pill-item">
                <div className="codex-pill-icon">
                  <Users size={18} />
                </div>
                <div className="codex-pill-info">
                  <span className="codex-pill-label">THE FELLOWSHIP</span>
                  <span className="codex-pill-val">4–6 WIZARDS</span>
                  <span className="codex-pill-sub">Inter-college squads welcome</span>
                </div>
              </div>

              <div className="codex-pill-item">
                <div className="codex-pill-icon">
                  <CalendarDays size={18} />
                </div>
                <div className="codex-pill-info">
                  <span className="codex-pill-label">CRUCIBLE DATES</span>
                  <span className="codex-pill-val">13–14 NOV 2026</span>
                  <span className="codex-pill-sub">36-Hour on-campus build</span>
                </div>
              </div>

              <div className="codex-pill-item">
                <div className="codex-pill-icon">
                  <MapPin size={18} />
                </div>
                <div className="codex-pill-info">
                  <span className="codex-pill-label">SANCTUARY VENUE</span>
                  <span className="codex-pill-val">SHARDA UNIV, AGRA</span>
                  <span className="codex-pill-sub">Full campus accommodation</span>
                </div>
              </div>

              <div className="codex-pill-item">
                <div className="codex-pill-icon">
                  <Award size={18} />
                </div>
                <div className="codex-pill-info">
                  <span className="codex-pill-label">REGISTRATION</span>
                  <span className="codex-pill-val">100% FREE ENTRY</span>
                  <span className="codex-pill-sub">Zero galleons required</span>
                </div>
              </div>
            </div>

            {/* 3 Master Directives Panels */}
            <div className="codex-grid">
              {/* Panel 1: Eligibility & Fellowship */}
              <div 
                className="codex-card"
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardTiltReset}
              >
                <div className="codex-card-corner-tl" aria-hidden="true" />
                <div className="codex-card-corner-br" aria-hidden="true" />
                
                <div className="codex-card-header">
                  <div className="codex-card-meta">
                    <span className="codex-directive-badge">DIRECTIVE 01</span>
                    <span className="codex-num">§ 01</span>
                  </div>
                  <h3 className="codex-card-title">ADMISSION & ELIGIBILITY</h3>
                  <p className="codex-card-tagline">The law governing fellowship formation and campus admittance.</p>
                </div>

                <ul className="codex-list">
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>Squad Composition (2–4 Members):</strong> Solo wizards can be paired during discord sorting. Official squads assemble 2 to 4 collegiate builders.
                    </div>
                  </li>
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>Cross-Guild Synergy:</strong> Teammates can be from different colleges, graduation years, and disciplines (Tech, Design, Business).
                    </div>
                  </li>
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>Eligible Scholars:</strong> Open to all enrolled undergraduate & postgraduate students from any recognized university.
                    </div>
                  </li>
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>Photo Identification:</strong> Every wizard must present their physical student ID card during campus gate clearance.
                    </div>
                  </li>
                </ul>

                <div className="codex-card-footer">
                  <span className="codex-footer-badge">✓ Zero Entry Cost</span>
                  <span className="codex-footer-note">Beginners & Veterans</span>
                </div>
              </div>

              {/* Panel 2: The Two Trials */}
              <div 
                className="codex-card"
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardTiltReset}
              >
                <div className="codex-card-corner-tl" aria-hidden="true" />
                <div className="codex-card-corner-br" aria-hidden="true" />

                <div className="codex-card-header">
                  <div className="codex-card-meta">
                    <span className="codex-directive-badge">DIRECTIVE 02</span>
                    <span className="codex-num">§ 02</span>
                  </div>
                  <h3 className="codex-card-title">THE TWO TRIALS</h3>
                  <p className="codex-card-tagline">From online proposal to on-campus 36-hour prototype build.</p>
                </div>

                <ul className="codex-list">
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>Round 1 (Virtual PPT Screening):</strong> Submit a 5–8 slide PPT on Unstop detailing your chosen House problem, tech stack, and impact.
                    </div>
                  </li>
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>No Upfront Code:</strong> Round 1 tests vision, feasibility, and originality. No working code submission required for Round 1.
                    </div>
                  </li>
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>Round 2 (36H Offline Finale):</strong> Shortlisted squads assemble at Sharda University, Agra on 13–14 Nov to build functional software.
                    </div>
                  </li>
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>Final Stage Demonstration:</strong> 3-minute live prototype demo + 2-minute Q&A in front of industry judges and mentors.
                    </div>
                  </li>
                </ul>

                <div className="codex-card-footer">
                  <span className="codex-footer-badge">✓ 13–14 Nov 2026</span>
                  <span className="codex-footer-note">Unstop Evaluation</span>
                </div>
              </div>

              {/* Panel 3: Castle Hospitality & Spoils */}
              <div 
                className="codex-card"
                onMouseMove={handleCardTilt}
                onMouseLeave={handleCardTiltReset}
              >
                <div className="codex-card-corner-tl" aria-hidden="true" />
                <div className="codex-card-corner-br" aria-hidden="true" />

                <div className="codex-card-header">
                  <div className="codex-card-meta">
                    <span className="codex-directive-badge">DIRECTIVE 03</span>
                    <span className="codex-num">§ 03</span>
                  </div>
                  <h3 className="codex-card-title">PROVISIONS & SPOILS</h3>
                  <p className="codex-card-tagline">Complimentary campus hospitality and bounty distribution.</p>
                </div>

                <ul className="codex-list">
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>24/7 Great Hall Feasts:</strong> Complimentary hot meals (breakfast, lunch, dinner), midnight snacks, and unlimited tea & coffee.
                    </div>
                  </li>
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>High-Speed Leylines:</strong> Dedicated gigabit Wi-Fi, Ethernet lanes, and power strips provided at every squad desk.
                    </div>
                  </li>
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>Resting Sanctuaries:</strong> Safe, separated sleeping and quiet resting dorms for male and female hackers with campus security.
                    </div>
                  </li>
                  <li className="codex-list-item">
                    <span className="codex-bullet-pip">✦</span>
                    <div>
                      <strong>₹50,000+ Prize Treasury:</strong> Direct cash bounties for House champions, official House Cup trophies, merch kits & certificates.
                    </div>
                  </li>
                </ul>

                <div className="codex-card-footer">
                  <span className="codex-footer-badge">✓ Meals & Stay Free</span>
                  <span className="codex-footer-note">Cash + Perks</span>
                </div>
              </div>
            </div>

            {/* Bottom Action Ribbon */}
            <div className="codex-action-strip">
              <div className="codex-strip-left">
                <div className="codex-strip-icon-box">
                  <Sparkles size={20} className="kicker-sparkle" />
                </div>
                <div className="codex-strip-text">
                  <span className="codex-strip-heading">THE SORTING HAT AWAITS YOUR FELLOWSHIP</span>
                  <span className="codex-strip-sub">Round 1 idea submissions are 100% free on Unstop. No entry fees at any stage.</span>
                </div>
              </div>

              <div className="codex-strip-actions">
                <a 
                  href={UNSTOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="codex-btn-primary"
                  aria-label="Register on Unstop"
                >
                  <span>REGISTER ON UNSTOP</span>
                  <ArrowUpRight size={16} />
                </a>
                <a 
                  href={GOOGLE_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="codex-btn-tertiary"
                  aria-label="Direct Google Form Entry"
                >
                  <Scroll size={15} />
                  <span>GOOGLE FORM</span>
                  <ArrowUpRight size={14} />
                </a>
                <a 
                  href={GUIDELINES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="codex-btn-secondary"
                  aria-label="Download Official Guidelines PDF"
                >
                  <BookOpen size={15} />
                  <span>GUIDELINE BOOK (PDF)</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION: THE TRIWIZARD TREASURES · VAULT SEAL (CLEAN & MINIMALIST)
            ========================================================================= */}
        <section className="landing-section prizes-section" id="prizes" aria-labelledby="prizes-title">
          <div className="prizes-container">
            
            {/* Clean Section Head */}
            <div className="landing-section-head">
              <div className="section-kicker-sparkles">
                <Sparkles size={14} className="kicker-sparkle" />
                <span>MINISTRY OF MAGIC · HIGH-SECURITY ARCHIVES</span>
                <Sparkles size={14} className="kicker-sparkle" />
              </div>
              <h2 id="prizes-title" className="section-title-3d">
                <span className="title-3d-gold">TRIWIZARD</span>{' '}
                <span className="title-3d-white">TREASURES</span>
              </h2>
              <p className="section-desc-3d">
                The official tournament rewards and championship bounties remain sealed under an ancient Unbreakable Vow.
              </p>
            </div>

            {/* Clean, Majestic Vault Safe with Proper Lock */}
            <div className={`clean-vault-card ${wardResonating ? 'wards-pulsing' : ''}`}>
              
              {/* Subtle Ambient Radial Leylines */}
              <div className="clean-vault-radial-glow" aria-hidden="true" />

              {/* The Proper Master Lock (Clean, Bold, SVG & CSS Crafted) */}
              <div 
                className="proper-master-lock-container"
                onClick={probeVaultWards}
                role="button"
                tabIndex={0}
                aria-label="Probe the enchanted vault seal"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') probeVaultWards(); }}
              >
                {/* Runic Arc Ring Halo */}
                <div className="proper-lock-ring" aria-hidden="true">
                  <svg viewBox="0 0 200 200" className="proper-lock-ring-svg">
                    <circle cx="100" cy="100" r="90" className="ring-track" />
                    <circle cx="100" cy="100" r="90" className="ring-pulse" />
                  </svg>
                </div>

                {/* Big, Crisp, Beautiful Padlock */}
                <div className="proper-padlock-graphic">
                  <div className="proper-shackle" />
                  <div className="proper-padlock-body">
                    <div className="proper-padlock-face">
                      <Lock size={44} strokeWidth={2.4} className="proper-lock-svg-icon" />
                      <div className="proper-keyhole-notch" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Coming Soon Tag */}
              <div className="proper-coming-soon-badge">
                <Sparkles size={13} />
                <span>BOUNTY VAULT SEALED · COMING SOON</span>
                <Sparkles size={13} />
              </div>

              <h3 className="proper-vault-status-title">
                REWARD STRUCTURE REVEALING SOON
              </h3>

              <p className="proper-vault-status-desc">
                Honors for the Grand Champions, Order of Merlin Laurels, and House Track Bounties will be officially unveiled as the November 2026 Hackathon approaches.
              </p>

              {/* Clean 3-Item Teaser Bar */}
              <div className="proper-teaser-bar">
                <div className="proper-teaser-pill">
                  <Trophy size={15} className="teaser-pill-icon" />
                  <span>Grand Champion Trophy</span>
                </div>
                <div className="proper-teaser-pill">
                  <Award size={15} className="teaser-pill-icon" />
                  <span>Order of Merlin Laurels</span>
                </div>
                <div className="proper-teaser-pill">
                  <Zap size={15} className="teaser-pill-icon" />
                  <span>4 House Track Bounties</span>
                </div>
              </div>

              {/* Interactive Probe Button */}
              <button 
                type="button" 
                className={`proper-probe-btn ${wardResonating ? 'is-resonating' : ''}`}
                onClick={probeVaultWards}
                aria-label="Tap to probe the enchanted vault lock"
              >
                <ShieldAlert size={16} />
                <span>{wardResonating ? '⚡ UNBREAKABLE VOW ACTIVE · ACCESS RESTRICTED' : 'TAP TO PROBE VAULT WARDS'}</span>
              </button>

            </div>

          </div>
        </section>

        <section className="landing-section daily-prophet-section registration-section" id="registration" aria-labelledby="prophet-title">
          <div id="prophet" style={{ position: 'relative', top: '-80px', visibility: 'hidden' }} />
          <div className="daily-prophet-container">
            <div className="daily-prophet-broadsheet">
              
              {/* Ornate Newspaper Masthead */}
              <div className="prophet-masthead">
                <div className="prophet-issue-row">
                  <span>SPECIAL TOURNAMENT EDITION</span>
                  <span>PRICE: 1 KNUT</span>
                  <span>ISSUE NO. 777</span>
                  <span>SHARDA UNIVERSITY AGRA</span>
                </div>
                <h2 id="prophet-title" className="prophet-logo-text">THE DAILY PROPHET</h2>
                <div className="prophet-sub-bar">
                  <span>MINISTRY GAZETTE</span>
                  <span>WEATHER: 24°C · HIGH CREATIVITY WINDS</span>
                  <span>HOUSE ODDS: GRYFFINDOR 2-1 · SLYTHERIN 5-2</span>
                  <span>CIRCULATION: 50,000</span>
                </div>
              </div>

              {/* Newspaper Content Layout */}
              <div className="daily-prophet-layout">
                
                {/* Left: Bewitched Moving Picture Frame */}
                <div className="prophet-moving-photo-frame">
                  <div className="prophet-photo-badge">
                    <Sparkles size={12} />
                    <span>LIVING PHOTOGRAPH</span>
                  </div>
                  <div className="moving-photo-inner">
                    <img 
                      src="/assets/sprites/harry_hedwig.webp"
                      alt="Bewitched moving photograph of Harry Potter and Hedwig" 
                      className="prophet-moving-photo"
                      loading="lazy"
                    />
                    <div className="moving-photo-halftone" aria-hidden="true" />
                    <div className="moving-photo-scanline" aria-hidden="true" />
                  </div>
                  <div className="prophet-photo-caption">
                    ▲ A student fellowship dispatching their architecture scroll via owl post ahead of the 36-hour physical hackathon.
                  </div>
                </div>

                {/* Right: Lead Article & Interactive Audio Quote */}
                <div className="prophet-article-body">
                  <div className="prophet-dispatch-badge">
                    <Scroll size={14} />
                    <span>OFFICIAL MINISTRY DISPATCH · NOVEMBER 2026</span>
                  </div>

                  <h3 className="prophet-headline">
                    FOUR HOUSES ASSEMBLE: 36-HOUR PHYSICAL CRUCIBLE SANCTIONED AT SHARDA UNIVERSITY
                  </h3>

                  <div className="prophet-columns-dual">
                    <p className="prophet-para">
                      The Ministry of Magical Innovation has formally authorized the 2026 HexWartz Hackathon at Sharda University, Agra. Over 450 collegiate builders across India will converge for 36 non-stop hours to solve foundational challenges across Artificial Intelligence, Healthcare, Sustainable Development, and Open Innovation.
                    </p>
                    <p className="prophet-para">
                      "This is not a theoretical symposium," declared the Grand Tribunal. "Every fellowship must deploy functional production code, interface with live leylines, and defend their working artifact during a 5-minute live tribunal interrogation."
                    </p>
                  </div>

                  {/* Official Proclamation Quote */}
                  <blockquote className="prophet-quote-box">
                    <p className="prophet-quote-text">
                      “Choose your House. Form your fellowship. Build your working prototype before the final sand falls.”
                    </p>
                    <cite className="prophet-quote-author">
                      — The Official HexWartz Proclamation
                    </cite>
                  </blockquote>

                  {/* Admissions & Logistics Gazette Ticker */}
                  <div className="prophet-admissions-ticker">
                    <div className="admissions-pill">
                      <span className="admissions-pill-tag">ROUND 1</span>
                      <strong className="admissions-pill-val">100% FREE</strong>
                      <span className="admissions-pill-note">PPT Screening on Unstop</span>
                    </div>
                    <div className="admissions-pill">
                      <span className="admissions-pill-tag">ROUND 2 · FINALE</span>
                      <strong className="admissions-pill-val">₹250 <small>/ member</small></strong>
                      <span className="admissions-pill-note">36H Stay, Meals & Kit Included</span>
                    </div>
                    <div className="admissions-pill">
                      <span className="admissions-pill-tag">PRIZE POOL</span>
                      <strong className="admissions-pill-val">₹50,000+</strong>
                      <span className="admissions-pill-note">Cash & House Cup Glory</span>
                    </div>
                  </div>

                  {/* Interactive Action Strip */}
                  <div className="prophet-action-strip">
                    <a 
                      href={UNSTOP_URL}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="prophet-btn-gold"
                    >
                      <span>REGISTER ON UNSTOP</span>
                      <ArrowUpRight size={15} />
                    </a>

                    <a 
                      href={GOOGLE_FORM_URL}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="prophet-btn-form"
                    >
                      <Scroll size={15} />
                      <span>GOOGLE FORM ENTRY</span>
                      <ArrowUpRight size={15} />
                    </a>

                    <a 
                      href={GUIDELINES_URL}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="prophet-btn-secondary"
                    >
                      <BookOpen size={15} />
                      <span>OFFICIAL GUIDELINES (PDF)</span>
                      <ArrowUpRight size={15} />
                    </a>

                    <button 
                      type="button"
                      className={`prophet-btn-audio ${prophetPlaying ? 'is-playing' : ''}`}
                      onClick={toggleProphetAudio}
                      aria-label="Play enchanted invitation chime"
                    >
                      <Volume2 size={16} className={prophetPlaying ? 'pulse-audio' : ''} />
                      <span>{prophetPlaying ? 'OWL CALL CHIME RESONATING...' : 'HEAR THE INVITATION CHIME'}</span>
                    </button>
                  </div>

                </div>

              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION: THE RESTRICTED SECTION · ENCHANTED FAQ
            ========================================================================= */}
        <section className="landing-section faq-section" id="faq" aria-labelledby="faq-title">
          <div className="faq-container">
            
            {/* Unified Section Head */}
            <div className="landing-section-head">
              <div className="section-kicker-sparkles">
                <BookOpen size={14} className="kicker-sparkle" />
                <span>HOGWARTS LIBRARY ARCHIVES · RESTRICTED REPOSITORIES</span>
                <BookOpen size={14} className="kicker-sparkle" />
              </div>
              <h2 id="faq-title" className="section-title-3d">
                <span className="title-3d-gold">RESTRICTED SECTION</span>{' '}
                <span className="title-3d-white">FAQ</span>
              </h2>
              <p className="section-desc-3d">
                Essential knowledge for every collegiate fellowship preparing to cross the threshold of HexWartz. Click any question parchment to unroll its answers.
              </p>
            </div>

            {/* Accordion List */}
            <div className="faq-list">
              {FAQ_DATA.map((faq, idx) => {
                const isOpen = expandedFaq === idx;

                return (
                  <div 
                    key={idx} 
                    className={`faq-card ${isOpen ? 'open' : ''}`}
                  >
                    <button 
                      type="button"
                      className="faq-question-btn"
                      onClick={() => {
                        playParchmentSound();
                        setExpandedFaq(isOpen ? null : idx);
                      }}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-question-left">
                        <Scroll size={19} className="faq-scroll-icon" />
                        <span className="faq-question-text">{faq.q}</span>
                      </span>
                      <span className="faq-chevron-wrap">
                        {isOpen ? (
                          <ChevronUp size={20} className="faq-chevron" />
                        ) : (
                          <ChevronDown size={20} className="faq-chevron" />
                        )}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="faq-answer-pane">
                        <p>{faq.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <a className="landing-brand" href="#home" aria-label="HexWartz home">
          <img
            src="/assets/branding/hexwartz_crest_nav.webp"
            alt="HexWartz Crest"
            className="landing-brand-crest"
            width="42"
            height="42"
            loading="lazy"
            decoding="async"
          />
          <div className="landing-brand-text">
            <span className="landing-brand-name">HexWartz</span>
            <span className="landing-brand-sub">Sharda University · Agra</span>
          </div>
        </a>
        
        <div className="footer-links-row">
          <a href={UNSTOP_URL} target="_blank" rel="noopener noreferrer">Unstop Portal <ArrowUpRight size={13} /></a>
          <span className="footer-links-divider">·</span>
          <a href={GOOGLE_FORM_URL} target="_blank" rel="noopener noreferrer">Google Form Portal <ArrowUpRight size={13} /></a>
          <span className="footer-links-divider">·</span>
          <a href={GUIDELINES_URL} target="_blank" rel="noopener noreferrer">Official Guidelines (PDF) <ArrowUpRight size={13} /></a>
        </div>

        <p>13–14 November 2026 <span>·</span> Anand School of Engineering and Technology</p>
        <a href="#home" className="back-to-top">Back to top ↑</a>
      </footer>

      {/* Background Audio Element */}
      <audio 
        ref={audioRef}
        src="/music/theme.mp3"
        preload="none"
        loop
      />

      {/* Floating Magic Music Orb Controller */}
      <div className="floating-music-orb-wrap">
        <button
          type="button"
          className={`floating-music-orb ${isMusicPlaying ? 'is-playing' : 'is-muted'}`}
          onClick={toggleMusic}
          aria-label={isMusicPlaying ? 'Pause Hedwig\'s Theme' : 'Play Hedwig\'s Theme'}
          title={isMusicPlaying ? 'Hedwig\'s Theme Playing · Tap to Mute' : 'Music Paused · Tap to Play'}
        >
          <div className="music-orb-inner">
            {isMusicPlaying ? (
              <>
                <Volume2 size={19} className="music-orb-icon" />
                <span className="music-orb-waves">
                  <span className="wave-bar bar-1" />
                  <span className="wave-bar bar-2" />
                  <span className="wave-bar bar-3" />
                </span>
              </>
            ) : (
              <VolumeX size={19} className="music-orb-icon" />
            )}
          </div>
          <span className="music-orb-label font-arcane">
            {isMusicPlaying ? 'HEDWIG\'S THEME' : 'PLAY THEME'}
          </span>
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
