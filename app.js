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

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const animate = (el, keyframes, options) =>
    new Promise((resolve) => {
      const anim = el.animate(keyframes, options);
      anim.onfinish = () => resolve(anim);
      anim.oncancel = () => resolve(anim);
    });

  async function runIntro() {
    // Logo fade in over 3s; banners jump in from the sides with bounce.
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

    // Ramped arrival + bounce against the invisible clearance circle.
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

    // Mirror resting banners into the alt scene once intro finishes.
    await Promise.all([leftIn, rightIn]);
    altBanners.forEach((b, i) => {
      b.style.transform = "translate3d(0, 0, 0)";
    });

    await wait(1000);

    await Promise.all([
      animate(
        textLeft,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 700, easing: "ease-out", fill: "forwards" }
      ),
      animate(
        textRight,
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 700, easing: "ease-out", fill: "forwards" }
      ),
    ]);
    altTexts.forEach((t) => {
      t.style.opacity = "1";
    });

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
    const scale = 1 + (Math.random() * 0.012 + 0.006); // 0.6%–1.8%
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
    // Infrequent flickers: 9–28s between events.
    const delay = 9000 + Math.random() * 19000;
    flickerTimer = setTimeout(runFlicker, delay);
  }

  async function runFlicker() {
    const from = usingA ? bgA : bgB;
    const to = usingA ? bgB : bgA;
    to.classList.remove("is-hidden");
    // Quick double-flash, then settle on the other texture.
    to.style.opacity = "0.55";
    from.style.opacity = "0";
    await wait(70);
    from.style.opacity = "0.55";
    to.style.opacity = "0";
    await wait(60);
    from.style.opacity = "0";
    to.style.opacity = "0.55";
    from.classList.add("is-hidden");
    usingA = !usingA;
    scheduleFlicker();
  }

  async function spinBanners() {
    busy = true;
    stopBreathing();
    logoHit.disabled = true;

    // 7 full turns with propeller ease-in and terminal sway.
    const turns = 7;
    const total = turns * 360;
    const duration = 5200;

    const keyframes = [
      { transform: "rotate(0deg)", offset: 0, easing: "cubic-bezier(0.2, 0.05, 0.2, 1)" },
      { transform: `rotate(${total - 18}deg)`, offset: 0.82, easing: "cubic-bezier(0.15, 0.7, 0.2, 1)" },
      { transform: `rotate(${total + 10}deg)`, offset: 0.9 },
      { transform: `rotate(${total - 5}deg)`, offset: 0.95 },
      { transform: `rotate(${total}deg)`, offset: 1 },
    ];

    await Promise.all([
      animate(spinRoot, keyframes, { duration, fill: "forwards" }),
      altSpin
        ? animate(altSpin, keyframes, { duration, fill: "forwards" })
        : Promise.resolve(),
    ]);

    // Reset rotation matrix without a visible jump.
    spinRoot.style.transform = "rotate(0deg)";
    if (altSpin) altSpin.style.transform = "rotate(0deg)";
    // Clear WAAPI fill so CSS transform is authoritative again.
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

    // Sync alt scene logo scale with current resting state.
    if (altLogo) altLogo.style.opacity = "1";

    // Swift pop-out to full page coverage.
    await animate(
      colorMask,
      [
        { clipPath: "circle(0% at 50% 50%)" },
        { clipPath: "circle(18% at 50% 50%)", offset: 0.35 },
        { clipPath: "circle(85% at 50% 50%)", offset: 0.78 },
        { clipPath: "circle(140% at 50% 50%)" },
      ],
      {
        duration: 780,
        easing: "cubic-bezier(0.12, 0.75, 0.2, 1.05)",
        fill: "forwards",
      }
    );

    await wait(4000);

    // Fast shrink back.
    await animate(
      colorMask,
      [
        { clipPath: "circle(140% at 50% 50%)" },
        { clipPath: "circle(20% at 50% 50%)", offset: 0.55 },
        { clipPath: "circle(0% at 50% 50%)" },
      ],
      {
        duration: 520,
        easing: "cubic-bezier(0.55, 0.05, 0.85, 0.35)",
        fill: "forwards",
      }
    );

    colorMask.getAnimations().forEach((a) => a.cancel());
    colorMask.style.clipPath = "circle(0% at 50% 50%)";

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
  logoHit.addEventListener(
    "pointerup",
    (e) => {
      // Prefer click; this helps stubborn mobile taps without double-firing much.
      if (e.pointerType === "touch" && ready && !busy) {
        // let click handle it
      }
    },
    { passive: true }
  );

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

  // Start once fonts/images have a moment to settle.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(runIntro));
  } else {
    requestAnimationFrame(runIntro);
  }
})();
