(() => {
  const frame = document.getElementById("frame");
  const logoHit = document.getElementById("logo-hit");
  const logo = document.getElementById("logo");
  const logoShadow = document.querySelector(".logo-shadow");
  const trackLeft = document.getElementById("banner-track-left");
  const trackRight = document.getElementById("banner-track-right");
  const textLeft = document.getElementById("text-left");
  const textRight = document.getElementById("text-right");
  const prijaviHit = document.getElementById("prijavi-hit");
  const spinRoot = document.getElementById("spin-root");
  const bgA = document.getElementById("bg-texture-a");
  const bgB = document.getElementById("bg-texture-b");

  const CROP_W = 1920;
  const CROP_H = 1080;
  // Extra clearance so yellow banners stop squeezing the logo.
  const BANNER_GAP_PX = 56;

  let ready = false;
  let busy = false;
  let breatheTimer = null;
  let breatheAnim = null;
  let flickerTimer = null;
  let usingA = true;
  let spinOffsetDeg = 0;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const animate = (el, keyframes, options) =>
    new Promise((resolve) => {
      const anim = el.animate(keyframes, options);
      anim.onfinish = () => resolve(anim);
      anim.oncancel = () => resolve(anim);
    });

  function fitFrame() {
    const sx = window.innerWidth / CROP_W;
    const sy = window.innerHeight / CROP_H;
    // Cover the viewport with the 1920×1080 crop.
    frame.style.setProperty("--frame-scale", String(Math.max(sx, sy)));
  }

  function setPrijaviInteractive(on) {
    if (on) {
      prijaviHit.classList.remove("is-disabled");
      prijaviHit.removeAttribute("tabindex");
    } else {
      prijaviHit.classList.add("is-disabled");
      prijaviHit.setAttribute("tabindex", "-1");
    }
  }

  async function runIntro() {
    const logoFade = animate(
      logo,
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 3000, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" }
    );
    animate(
      logoShadow,
      [{ opacity: 0 }, { opacity: 0.85 }],
      { duration: 3000, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "forwards" }
    );

    const bannerEase = "cubic-bezier(0.16, 0.84, 0.28, 1.35)";
    const gap = BANNER_GAP_PX;
    const leftIn = animate(
      trackLeft,
      [
        { transform: "translate3d(-125%, 0, 0)" },
        { transform: `translate3d(calc(3.2% - ${gap}px), 0, 0)`, offset: 0.72 },
        { transform: `translate3d(calc(-1.6% - ${gap}px), 0, 0)`, offset: 0.86 },
        { transform: `translate3d(calc(0.7% - ${gap}px), 0, 0)`, offset: 0.94 },
        { transform: `translate3d(-${gap}px, 0, 0)` },
      ],
      { duration: 1650, easing: bannerEase, fill: "forwards", delay: 280 }
    );
    const rightIn = animate(
      trackRight,
      [
        { transform: "translate3d(125%, 0, 0)" },
        { transform: `translate3d(calc(-3.2% + ${gap}px), 0, 0)`, offset: 0.72 },
        { transform: `translate3d(calc(1.6% + ${gap}px), 0, 0)`, offset: 0.86 },
        { transform: `translate3d(calc(-0.7% + ${gap}px), 0, 0)`, offset: 0.94 },
        { transform: `translate3d(${gap}px, 0, 0)` },
      ],
      { duration: 1650, easing: bannerEase, fill: "forwards", delay: 280 }
    );
    // Same slide/bounce as the right yellow banner; stays put during spins.
    const prijaviIn = animate(
      prijaviHit,
      [
        { transform: "translate3d(125%, 0, 0)" },
        { transform: `translate3d(calc(-3.2% + ${gap}px), 0, 0)`, offset: 0.72 },
        { transform: `translate3d(calc(1.6% + ${gap}px), 0, 0)`, offset: 0.86 },
        { transform: `translate3d(calc(-0.7% + ${gap}px), 0, 0)`, offset: 0.94 },
        { transform: `translate3d(${gap}px, 0, 0)` },
      ],
      { duration: 1650, easing: bannerEase, fill: "forwards", delay: 280 }
    );

    await Promise.all([leftIn, rightIn, prijaviIn]);
    await wait(1000);

    textLeft.style.transition = "opacity 700ms ease-out";
    textRight.style.transition = "opacity 700ms ease-out";
    textLeft.style.opacity = "1";
    textRight.style.opacity = "1";
    await wait(700);
    await logoFade;

    ready = true;
    logoHit.disabled = false;
    setPrijaviInteractive(true);
    startBreathing();
    scheduleFlicker();
  }

  function stopBreathing() {
    if (breatheTimer) {
      clearTimeout(breatheTimer);
      breatheTimer = null;
    }
    if (breatheAnim) {
      breatheAnim.cancel();
      breatheAnim = null;
    }
    // Keep press/idle scale on the button wrapper, not the img.
  }

  function breatheOnce() {
    if (!ready || busy) return;
    const scale = 1 + (Math.random() * 0.012 + 0.006);
    const duration = 2800 + Math.random() * 2200;
    const ease = "cubic-bezier(0.37, 0, 0.63, 1)";

    breatheAnim = logoHit.animate(
      [
        { transform: "scale(1)" },
        { transform: `scale(${scale.toFixed(4)})` },
        { transform: "scale(1)" },
      ],
      { duration, easing: ease, fill: "none" }
    );
    breatheAnim.onfinish = () => {
      breatheAnim = null;
      scheduleBreathe();
    };
  }

  function scheduleBreathe() {
    if (!ready || busy) return;
    breatheTimer = setTimeout(breatheOnce, 400 + Math.random() * 1200);
  }

  function startBreathing() {
    stopBreathing();
    scheduleBreathe();
  }

  function scheduleFlicker() {
    if (flickerTimer) clearTimeout(flickerTimer);
    flickerTimer = setTimeout(runFlicker, 9000 + Math.random() * 19000);
  }

  async function runFlicker() {
    const from = usingA ? bgA : bgB;
    const to = usingA ? bgB : bgA;
    to.classList.remove("is-hidden");
    to.style.opacity = usingA ? "0.4" : "0.45";
    from.style.opacity = "0";
    await wait(70);
    from.style.opacity = usingA ? "0.45" : "0.4";
    to.style.opacity = "0";
    await wait(60);
    from.style.opacity = "0";
    to.style.opacity = usingA ? "0.4" : "0.45";
    from.classList.add("is-hidden");
    usingA = !usingA;
    scheduleFlicker();
  }

  async function pressLogo() {
    // Button in/out: quick press, spring back.
    await animate(
      logoHit,
      [
        { transform: "scale(1)" },
        { transform: "scale(0.92)", offset: 0.35 },
        { transform: "scale(1.03)", offset: 0.7 },
        { transform: "scale(1)" },
      ],
      { duration: 420, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "none" }
    );
  }

  async function spinBanners() {
    const turns = 7;
    const total = spinOffsetDeg + turns * 360;
    const duration = 6800;

    const keyframes = [
      { transform: `rotate(${spinOffsetDeg}deg)`, offset: 0 },
      { transform: `rotate(${spinOffsetDeg + turns * 360 * 0.12}deg)`, offset: 0.18 },
      { transform: `rotate(${total - 28}deg)`, offset: 0.72 },
      { transform: `rotate(${total + 16}deg)`, offset: 0.8 },
      { transform: `rotate(${total - 10}deg)`, offset: 0.87 },
      { transform: `rotate(${total + 5}deg)`, offset: 0.92 },
      { transform: `rotate(${total - 2}deg)`, offset: 0.96 },
      { transform: `rotate(${total}deg)`, offset: 1 },
    ];

    const anim = await animate(spinRoot, keyframes, {
      duration,
      easing: "cubic-bezier(0.18, 0.02, 0.12, 1)",
      fill: "forwards",
    });

    spinOffsetDeg = total;
    if (anim && typeof anim.commitStyles === "function") anim.commitStyles();
    else spinRoot.style.transform = `rotate(${spinOffsetDeg}deg)`;
    spinRoot.getAnimations().forEach((a) => a.cancel());
  }

  async function fadePrijaviForSpin() {
    // Fade out for the spinning stretch, then ease back in.
    await animate(
      prijaviHit,
      [
        { opacity: 1 },
        { opacity: 0, offset: 0.08 },
        { opacity: 0, offset: 0.88 },
        { opacity: 1 },
      ],
      {
        duration: 6800,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      }
    );
  }

  async function onLogoActivate(event) {
    event.preventDefault();
    if (!ready || busy) return;

    busy = true;
    stopBreathing();
    logoHit.disabled = true;
    setPrijaviInteractive(false);

    // Click = button press + banner spin; prijavi fades (does not spin).
    await Promise.all([pressLogo(), spinBanners(), fadePrijaviForSpin()]);

    busy = false;
    logoHit.disabled = false;
    setPrijaviInteractive(true);
    startBreathing();
  }

  logoHit.addEventListener("click", onLogoActivate);
  window.addEventListener("resize", fitFrame);
  fitFrame();
  setPrijaviInteractive(false);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    logo.style.opacity = "1";
    logoShadow.style.opacity = "0.85";
    trackLeft.style.transform = `translate3d(-${BANNER_GAP_PX}px,0,0)`;
    trackRight.style.transform = `translate3d(${BANNER_GAP_PX}px,0,0)`;
    prijaviHit.style.transform = `translate3d(${BANNER_GAP_PX}px,0,0)`;
    textLeft.style.opacity = "1";
    textRight.style.opacity = "1";
    ready = true;
    logoHit.disabled = false;
    setPrijaviInteractive(true);
    scheduleFlicker();
    return;
  }

  requestAnimationFrame(runIntro);
})();
