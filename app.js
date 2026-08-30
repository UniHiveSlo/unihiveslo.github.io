(() => {
  const logoHit = document.getElementById("logo-hit");
  const logo = document.getElementById("logo");
  const logoShadow = document.querySelector("#scene-normal .logo-shadow");
  const bannerLeft = document.querySelector("#scene-normal .banner-left");
  const bannerRight = document.querySelector("#scene-normal .banner-right");
  const textLeft = document.getElementById("text-left");
  const textRight = document.getElementById("text-right");
  const spinRoot = document.getElementById("spin-root");
  const colorMask = document.getElementById("color-mask");
  const bgA = document.getElementById("bg-texture-a");
  const bgB = document.getElementById("bg-texture-b");
  const altSpin = document.querySelector("#scene-alt .spin-root");
  const altLogo = document.querySelector("#scene-alt .logo");
  const altTexts = document.querySelectorAll("#scene-alt .banner-text");
  const altBanners = document.querySelectorAll("#scene-alt .banner");

  let ready = false;
  let busy = false;
  let clickPhase = 0; // 0 = next is spin, 1 = next is color mask
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

  function coverRadiusPx() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Diagonal half + margin so the circle fully covers the viewport.
    return Math.ceil(Math.hypot(w, h) / 2) + 24;
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
    const leftIn = animate(
      bannerLeft,
      [
        { transform: "translate3d(-125%, 0, 0)" },
        { transform: "translate3d(3.2%, 0, 0)", offset: 0.72 },
        { transform: "translate3d(-1.6%, 0, 0)", offset: 0.86 },
        { transform: "translate3d(0.7%, 0, 0)", offset: 0.94 },
        { transform: "translate3d(0, 0, 0)" },
      ],
      { duration: 1650, easing: bannerEase, fill: "forwards", delay: 280 }
    );
    const rightIn = animate(
      bannerRight,
      [
        { transform: "translate3d(125%, 0, 0)" },
        { transform: "translate3d(-3.2%, 0, 0)", offset: 0.72 },
        { transform: "translate3d(1.6%, 0, 0)", offset: 0.86 },
        { transform: "translate3d(-0.7%, 0, 0)", offset: 0.94 },
        { transform: "translate3d(0, 0, 0)" },
      ],
      { duration: 1650, easing: bannerEase, fill: "forwards", delay: 280 }
    );

    await Promise.all([leftIn, rightIn]);
    altBanners.forEach((b) => {
      b.style.transform = "translate3d(0, 0, 0)";
    });

    await wait(1000);

    textLeft.style.transition = "opacity 700ms ease-out";
    textRight.style.transition = "opacity 700ms ease-out";
    textLeft.style.opacity = "1";
    textRight.style.opacity = "1";
    altTexts.forEach((t) => {
      t.style.opacity = "1";
    });
    await wait(700);
    await logoFade;
    if (altLogo) altLogo.style.opacity = "1";

    ready = true;
    logoHit.disabled = false;
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
    logo.style.transform = "scale(1)";
    if (altLogo) altLogo.style.transform = "scale(1)";
  }

  function breatheOnce() {
    if (!ready || busy) return;
    const scale = 1 + (Math.random() * 0.012 + 0.006);
    const up = 1400 + Math.random() * 1600;
    const down = 1600 + Math.random() * 1800;
    const ease = "cubic-bezier(0.37, 0, 0.63, 1)";

    breatheAnim = logo.animate(
      [
        { transform: "scale(1)" },
        { transform: `scale(${scale.toFixed(4)})` },
        { transform: "scale(1)" },
      ],
      { duration: up + down, easing: ease, fill: "none" }
    );
    if (altLogo) {
      altLogo.animate(
        [
          { transform: "scale(1)" },
          { transform: `scale(${scale.toFixed(4)})` },
          { transform: "scale(1)" },
        ],
        { duration: up + down, easing: ease, fill: "none" }
      );
    }
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
    const delay = 9000 + Math.random() * 19000;
    flickerTimer = setTimeout(runFlicker, delay);
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

  async function spinBanners() {
    busy = true;
    stopBreathing();
    logoHit.disabled = true;

    const turns = 7;
    const total = spinOffsetDeg + turns * 360;
    const duration = 6800;

    // Soft acceleration, then a rubbery multi-bounce settle (no hard stop).
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

    const opts = {
      duration,
      easing: "cubic-bezier(0.18, 0.02, 0.12, 1)",
      fill: "forwards",
    };

    const [mainAnim] = await Promise.all([
      animate(spinRoot, keyframes, opts),
      altSpin ? animate(altSpin, keyframes, opts) : Promise.resolve(),
    ]);

    spinOffsetDeg = total;
    // Keep the settled angle in inline styles so canceling WAAPI doesn't jerk.
    if (mainAnim && typeof mainAnim.commitStyles === "function") {
      mainAnim.commitStyles();
    } else {
      spinRoot.style.transform = `rotate(${spinOffsetDeg}deg)`;
    }
    if (altSpin) {
      const altAnims = altSpin.getAnimations();
      const last = altAnims[altAnims.length - 1];
      if (last && typeof last.commitStyles === "function") last.commitStyles();
      else altSpin.style.transform = `rotate(${spinOffsetDeg}deg)`;
    }

    spinRoot.getAnimations().forEach((a) => a.cancel());
    if (altSpin) altSpin.getAnimations().forEach((a) => a.cancel());

    busy = false;
    logoHit.disabled = false;
    startBreathing();
  }

  async function colorMaskPulse() {
    busy = true;
    stopBreathing();
    logoHit.disabled = true;

    if (altLogo) altLogo.style.opacity = "1";

    const full = coverRadiusPx();

    // Pond-ripple expand: slow start, organic growth to full cover.
    await animate(
      colorMask,
      [
        { clipPath: `circle(0px at 50% 50%)` },
        { clipPath: `circle(${Math.round(full * 0.06)}px at 50% 50%)`, offset: 0.12 },
        { clipPath: `circle(${Math.round(full * 0.22)}px at 50% 50%)`, offset: 0.32 },
        { clipPath: `circle(${Math.round(full * 0.55)}px at 50% 50%)`, offset: 0.62 },
        { clipPath: `circle(${Math.round(full * 0.88)}px at 50% 50%)`, offset: 0.86 },
        { clipPath: `circle(${full}px at 50% 50%)` },
      ],
      {
        duration: 2600,
        easing: "cubic-bezier(0.22, 0.08, 0.2, 1)",
        fill: "forwards",
      }
    );

    await wait(2800);

    // Soft collapse back into the logo center.
    await animate(
      colorMask,
      [
        { clipPath: `circle(${full}px at 50% 50%)` },
        { clipPath: `circle(${Math.round(full * 0.72)}px at 50% 50%)`, offset: 0.22 },
        { clipPath: `circle(${Math.round(full * 0.38)}px at 50% 50%)`, offset: 0.55 },
        { clipPath: `circle(${Math.round(full * 0.12)}px at 50% 50%)`, offset: 0.82 },
        { clipPath: `circle(0px at 50% 50%)` },
      ],
      {
        duration: 2200,
        easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
        fill: "forwards",
      }
    );

    colorMask.getAnimations().forEach((a) => a.cancel());
    colorMask.style.clipPath = "circle(0px at 50% 50%)";

    busy = false;
    logoHit.disabled = false;
    startBreathing();
  }

  async function onLogoActivate(event) {
    event.preventDefault();
    if (!ready || busy) return;

    if (clickPhase === 0) {
      clickPhase = 1;
      await spinBanners();
    } else {
      clickPhase = 0;
      await colorMaskPulse();
    }
  }

  logoHit.addEventListener("click", onLogoActivate);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    logo.style.opacity = "1";
    logoShadow.style.opacity = "0.85";
    bannerLeft.style.transform = "translate3d(0,0,0)";
    bannerRight.style.transform = "translate3d(0,0,0)";
    textLeft.style.opacity = "1";
    textRight.style.opacity = "1";
    altBanners.forEach((b) => {
      b.style.transform = "translate3d(0,0,0)";
    });
    altTexts.forEach((t) => {
      t.style.opacity = "1";
    });
    if (altLogo) altLogo.style.opacity = "1";
    ready = true;
    logoHit.disabled = false;
    scheduleFlicker();
    return;
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(runIntro));
  } else {
    requestAnimationFrame(runIntro);
  }
})();
