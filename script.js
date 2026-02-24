// ================= LENIS & GSAP SYNC =================
const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  wheelMultiplier: 1,
  touchMultiplier: 2,
  infinite: false,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Robust ScrollTrigger Sync
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// Smooth anchor scrolling for nav links with Lenis.
function initSmoothNavScroll() {
  const links = document.querySelectorAll('.nav-link[href^="#"]');
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, {
        offset: -12,
        duration: 1.35,
        easing: (t) => 1 - Math.pow(1 - t, 3)
      });
      history.replaceState(null, "", href);
    });
  });
}

// ================= SPLASH =================
const introVideo = document.getElementById("introVideo");
const splash = document.getElementById("splash");
const main = document.getElementById("main");

document.body.style.overflow = "hidden";
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches || ("ontouchstart" in window);
let hasStartedMasterTimeline = false;

if (introVideo) {
  introVideo.onended = hideSplash;
  setTimeout(hideSplash, 6000);
} else {
  hideSplash();
}

function hideSplash() {
  gsap.to(splash, {
    opacity: 0, duration: 1.5,
    onComplete: () => { splash.style.display = "none"; }
  });
  gsap.to(main, { opacity: 1, duration: 1 });
  revealUI();
  if (isTouchDevice) {
    setTimeout(skipScratchIntro, 500);
  }
}

function revealUI() {
  gsap.fromTo(".nav", { scaleX: 0.65, opacity: 0, y: -20 }, { scaleX: 1, opacity: 1, y: 0, duration: 1, ease: "expo.out", onComplete: () => document.querySelector(".nav")?.classList.add("is-expanded") });
  gsap.fromTo(".nav-link", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, delay: 0.15, ease: "power3.out" });
  gsap.fromTo(".center-content", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: "power3.out" });
  gsap.fromTo(".title", { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 2, delay: 0.5, ease: "expo.out" });
  gsap.fromTo(".float-img",
    { scale: 0.5, opacity: 0, z: 0 },
    {
      scale: 1, opacity: 1, z: 0, duration: 1.5, stagger: 0.1, delay: 0.8,
      rotation: (i) => [-12, 8, 20, -10, 15][i % 5],
      ease: "back.out(1.7)",
      onComplete: () => {
        initMouseParallax();
        ScrollTrigger.refresh();
      }
    }
  );
  gsap.to(".hint", { opacity: 0.8, duration: 1, delay: 2 });
}

// ================= MOUSE PARALLAX =================
let mouseX = 0, mouseY = 0;
function initMouseParallax() {
  const hero = document.querySelector(".hero");
  if (!hero) return;
  hero.addEventListener("mousemove", (e) => {
    const { width, height } = hero.getBoundingClientRect();
    mouseX = (e.clientX - width / 2) / (width / 2);
    mouseY = (e.clientY - height / 2) / (height / 2);

    if (window.scrollY < 20) {
      document.querySelectorAll(".float-img").forEach((img, i) => {
        const depth = (i + 1) * 15;
        gsap.to(img, { xPercent: mouseX * depth, yPercent: mouseY * depth, duration: 0.8, ease: "power2.out" });
      });
    }
  });
}

// ================= SCRATCH =================
const canvas = document.getElementById("scratchCanvas");
const ctx = canvas.getContext("2d");
const heroEl = document.querySelector(".hero");

function resize() {
  if (!canvas || !heroEl) return;
  const rect = heroEl.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px'; canvas.style.height = rect.height + 'px';
  ctx.scale(dpr, dpr); ctx.fillStyle = "black"; ctx.fillRect(0, 0, rect.width, rect.height);
}
window.addEventListener("resize", resize); resize();

let drawing = false, last = null;
let checkQueued = false;
let clearedOnce = false;
const scratchMove = (e) => {
  if (!drawing || !canvas) return;
  if (e.cancelable) e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
  ctx.globalCompositeOperation = "destination-out"; ctx.beginPath();
  if (last) { ctx.moveTo(last.x, last.y); ctx.lineTo(x, y); ctx.lineWidth = 140; ctx.lineCap = "round"; ctx.stroke(); }
  else { ctx.arc(x, y, 70, 0, Math.PI * 2); ctx.fill(); }
  last = { x, y };

  // Throttle expensive pixel checks and avoid random early completion.
  if (!checkQueued) {
    checkQueued = true;
    requestAnimationFrame(() => {
      checkQueued = false;
      check();
    });
  }
};
if (canvas) {
  canvas.addEventListener("mousedown", (e) => { drawing = true; last = null; scratchMove(e); });
  window.addEventListener("mouseup", () => { drawing = false; check(); });
  canvas.addEventListener("mousemove", scratchMove);
  canvas.addEventListener("touchstart", (e) => { drawing = true; last = null; scratchMove(e); }, { passive: false });
  canvas.addEventListener("touchmove", scratchMove, { passive: false });
  window.addEventListener("touchend", () => { drawing = false; check(); });
}

function startMainScrollExperience() {
  if (hasStartedMasterTimeline) return;
  hasStartedMasterTimeline = true;
  document.body.style.overflow = "visible";
  document.documentElement.style.overflow = "visible";
  initMasterTimeline();
}

function skipScratchIntro() {
  if (!canvas || !canvas.parentNode) {
    startMainScrollExperience();
    return;
  }

  gsap.to(canvas, {
    opacity: 0,
    duration: 0.8,
    onComplete: () => {
      canvas.remove();
      startMainScrollExperience();
    }
  });

  gsap.to(".hint", { opacity: 0, duration: 0.4 });
}
function check() {
  if (!canvas || clearedOnce) return;
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let cl = 0; for (let i = 3; i < data.length; i += 4) if (data[i] === 0) cl++;
  // Require a clear majority before auto-complete.
  if ((cl / (canvas.width * canvas.height)) > 0.72) {
    clearedOnce = true;
    gsap.to(canvas, {
      opacity: 0, duration: 2, onComplete: () => {
        canvas.remove();
        startMainScrollExperience();
      }
    });
    gsap.to(".hint", { opacity: 0, y: 20 });
  }
}

// ================= GSAP ARCHITECTURE =================
gsap.registerPlugin(ScrollTrigger);

function initSection2Timeline() {
  // Check if section 2 exists
  const section2 = document.querySelector(".section2");
  if (!section2) {
    console.warn("Section 2 not found");
    return;
  }

  console.log("Section 2 element:", section2);

  // Line-by-line reveal tied to scroll progress.
  const lines = gsap.utils.toArray(".reveal-line > span");
  const accentWord = document.querySelector(".accent");
  const boldWord = document.querySelector(".highlight.bold");
  const riskRing = document.querySelector(".red-circle");
  gsap.set(lines, { yPercent: 110, opacity: 0, filter: "blur(8px)" });

  const linesTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".editorial-text",
      start: "top 72%",
      end: "bottom 18%",
      scrub: 1.1
    }
  });

  lines.forEach((line) => {
    linesTl.to(line, {
      yPercent: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.9,
      ease: "none"
    }, "+=0.12");
  });

  if (boldWord) {
    gsap.fromTo(boldWord,
      { textShadow: "0 0 0 rgba(255,255,255,0)", filter: "brightness(1)" },
      {
        textShadow: "0 0 22px rgba(255,255,255,0.45)",
        filter: "brightness(1.15)",
        ease: "none",
        scrollTrigger: {
          trigger: ".section2",
          start: "top 72%",
          end: "top 28%",
          scrub: 1
        }
      }
    );
  }

  if (accentWord) {
    gsap.fromTo(accentWord,
      { x: 0, skewX: 0, opacity: 0.75 },
      {
        x: 10,
        skewX: -6,
        opacity: 1,
        ease: "none",
        scrollTrigger: {
          trigger: ".section2",
          start: "top 70%",
          end: "top 30%",
          scrub: 1
        }
      }
    );
  }

  if (riskRing) {
    gsap.to(riskRing, {
      boxShadow: "0 0 22px rgba(255,0,0,0.45)",
      duration: 1.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }

  gsap.fromTo(".tilt-frame",
    { scale: 0.8, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration: 1.5,
      ease: "expo.out",
      scrollTrigger: {
        trigger: ".section2",
        start: "top 60%",
        end: "top 30%",
        scrub: 2,
      }
    }
  );

  gsap.fromTo(".tilt-img",
    { y: 26, scale: 0.94, rotateZ: -1.8, filter: "saturate(0.9) brightness(0.95)" },
    {
      y: -8,
      scale: 1.02,
      rotateZ: 0.6,
      filter: "saturate(1.06) brightness(1.04)",
      ease: "power2.out",
      scrollTrigger: {
        trigger: ".section2",
        start: "top 72%",
        end: "bottom 38%",
        scrub: 1.3
      }
    }
  );

  console.log("Section 2 timeline initialized with smooth scroll animation");
  ScrollTrigger.refresh();
}

function initMasterTimeline() {
  // 1. HERO TIMELINE (PINNED)
  const heroTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".hero",
      start: "top top",
      end: "+=150%",
      pin: true,
      scrub: 1,
      anticipation: 1,
      onComplete: () => {
        console.log("Hero timeline complete, refreshing ScrollTrigger");
        ScrollTrigger.refresh();
      }
    }
  });

  heroTl.to(".float-img", { z: 1500, scale: 2.0, duration: 2, ease: "power2.inOut" }, 0);
  heroTl.to(".title", { scale: 1.8, z: 600, duration: 2, ease: "power2.inOut" }, 0);

  const spots = [{ x: -6000, y: -4000 }, { x: 6000, y: -4000 }, { x: -6000, y: 4000 }, { x: 6000, y: 4000 }, { x: 0, y: 7000 }];
  gsap.utils.toArray(".float-img").forEach((img, i) => {
    const s = spots[i % spots.length];
    heroTl.to(img, {
      x: s.x, y: s.y, z: 10000, opacity: 0, filter: "blur(180px)",
      duration: 3, ease: "power3.in"
    }, 1.0);
  });

  heroTl.to(".title", {
    scale: 100, z: 10000, opacity: 0, filter: "blur(350px)",
    duration: 3, ease: "power3.in"
  }, 1.0);

  heroTl.to(".center-content", { scale: 30, opacity: 0, filter: "blur(180px)", duration: 2.5 }, 1.0);
  heroTl.to(".nav", { y: -800, opacity: 0, duration: 2 }, 1.0);
  heroTl.to("#bgVideo", { opacity: 0, filter: "blur(150px)", scale: 8.5, duration: 4 }, 1.0);
  heroTl.to(".hero-overlay", { opacity: 1, duration: 2 }, "-=1");

  // Initialize section 2 timeline after a brief delay to ensure proper positioning
  setTimeout(() => {
    initSection2Timeline();
  }, 100);

  // Initial refresh
  ScrollTrigger.refresh();
  window.addEventListener("resize", () => ScrollTrigger.refresh());
}

// 3D TILT EFFECT
function initTiltEffect() {
  const frame = document.querySelector(".tilt-frame");
  const img = document.querySelector(".tilt-img");
  if (!frame || !img) return;
  if (frame.dataset.tiltBound === "true") return;
  frame.dataset.tiltBound = "true";

  frame.addEventListener("mousemove", (e) => {
    const { left, top, width, height } = frame.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    const rotateX = (y - 0.5) * -30;
    const rotateY = (x - 0.5) * 30;
    gsap.to(img, { rotateX, rotateY, scale: 1.05, duration: 0.5, ease: "power2.out" });
  });

  frame.addEventListener("mouseleave", () => {
    gsap.to(img, { rotateX: 0, rotateY: 0, scale: 1, duration: 1, ease: "elastic.out(1, 0.3)" });
  });
}

window.addEventListener("load", initTiltEffect);
const originalCheck = check;
check = function () {
  originalCheck();
  initTiltEffect();
};

initSmoothNavScroll();
// ================= SECTION 3: IMAGE SEQUENCE ANIMATION (CANVAS + SCROLLTRIGGER) =================

class ImageSequenceAnimation {
  constructor() {
    this.canvas = document.getElementById("sequenceCanvas");
    this.ctx = this.canvas ? this.canvas.getContext("2d", { willReadFrequently: false }) : null;
    this.images = [];
    this.currentFrame = 0;
    this.totalFrames = 100; // 0001-0100 = 100 frames
    this.isLoading = true;
    this.dpr = window.devicePixelRatio || 1;
    this.renderScheduled = false;
    this.lastFrame = -1;
    this.loadedCount = 0;
    this.failedImages = [];

    if (!this.canvas || !this.ctx) {
      console.error("Canvas or context not available");
      return;
    }

    this.init();
  }

  async init() {
    console.log("🎬 Starting image sequence animation initialization...");
    
    // Preload all images concurrently
    await this.preloadImages();
    this.isLoading = false;

    console.log(`📊 Loaded ${this.loadedCount}/${this.totalFrames} images`);
    
    if (this.loadedCount === 0) {
      console.error("❌ No images loaded! Check paths and CORS.");
      return;
    }

    // Setup canvas and animation
    this.setupCanvas();
    this.setupScrollTrigger();
    this.render();

    // Handle window resize with debouncing
    window.addEventListener("resize", () => this.handleResize());
    
    console.log("✅ Image sequence ready!");
  }

  async preloadImages() {
    try {
      const imagePromises = [];
      for (let i = 1; i <= this.totalFrames; i++) {
        const frameNum = String(i).padStart(4, "0"); // 0001, 0002, ..., 0100
        imagePromises.push(
          this.loadImage(`images/${frameNum}.jpg`).catch(error => {
            this.failedImages.push(frameNum);
            console.warn(`⚠️  Failed to load: images/${frameNum}.jpg`);
            return null;
          })
        );
      }
      
      const loadedImages = await Promise.all(imagePromises);
      this.images = loadedImages.filter(img => img !== null);
      this.loadedCount = this.images.length;
      
      console.log(`✓ Preloaded ${this.loadedCount}/${this.totalFrames} images`);
      
      if (this.failedImages.length > 0) {
        console.warn(`Failed images: ${this.failedImages.join(", ")}`);
      }
    } catch (error) {
      console.error("Error in preloadImages:", error);
    }
  }

  loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        console.log(`✓ Loaded: ${src}`);
        resolve(img);
      };
      img.onerror = () => {
        reject(new Error(`Failed to load ${src}`));
      };
      img.src = src;
    });
  }

  setupCanvas() {
    if (!this.canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Set canvas with retina resolution
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";

    // Scale context for retina displays
    this.ctx.scale(this.dpr, this.dpr);

    // Render first frame immediately
    this.currentFrame = 0;
    this.lastFrame = -1;
    this.renderFrame(0);
    
    console.log(`📐 Canvas setup: ${width}x${height} (dpr: ${this.dpr})`);
  }

  handleResize() {
    this.setupCanvas();
  }

  setupScrollTrigger() {
    if (!this.canvas || this.loadedCount === 0) {
      console.error("Cannot setup ScrollTrigger - no images loaded or canvas missing");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Animation object to hold progress
    const animationObj = { progress: 0 };

    gsap.to(animationObj, {
      progress: 1,
      scrollTrigger: {
        trigger: ".section3",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2, // Smooth scrubbing
        pin: ".sequence-container", // Pin the container
        onUpdate: (self) => {
          // Map scroll progress to frame index (0-99)
          this.currentFrame = Math.round(self.progress * (this.loadedCount - 1));
          this.requestRender();
        },
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
      ease: "none",
      duration: 1, // Dummy duration for GSAP
    });

    console.log("🎯 ScrollTrigger setup complete");
    ScrollTrigger.refresh();
  }

  requestRender() {
    if (!this.renderScheduled) {
      this.renderScheduled = true;
      requestAnimationFrame(() => this.render());
    }
  }

  render() {
    this.renderScheduled = false;

    if (this.isLoading || this.images.length === 0) {
      return;
    }

    // Only render if frame changed
    if (this.currentFrame !== this.lastFrame) {
      this.renderFrame(this.currentFrame);
      this.lastFrame = this.currentFrame;
    }
  }

  renderFrame(frameIndex) {
    if (!this.ctx) {
      console.error("Context not available");
      return;
    }

    // Clamp frame index
    const safeIndex = Math.max(0, Math.min(frameIndex, this.images.length - 1));
    const img = this.images[safeIndex];

    if (!img) {
      console.error(`Image at index ${safeIndex} is not loaded`);
      this.ctx.fillStyle = "#1a1a1a";
      this.ctx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
      return;
    }

    const canvasWidth = this.canvas.width / this.dpr;
    const canvasHeight = this.canvas.height / this.dpr;

    // Clear canvas
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Calculate scaling to fit image in canvas (maintain aspect ratio)
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (imgRatio > canvasRatio) {
      // Image is wider
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      // Image is taller
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }

    // Draw image with smooth rendering
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = "high";
    this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }
}

// Initialize image sequence when document is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    console.log("📍 DOM Loaded - Initializing image sequence");
    setTimeout(() => new ImageSequenceAnimation(), 500);
  });
} else {
  console.log("📍 DOM already loaded - Initializing image sequence");
  setTimeout(() => new ImageSequenceAnimation(), 500);
}

// ================= INFINITE SCROLLER: NIKE =================
function initInfiniteScroller() {
  const scrollContent = document.querySelector(".scroll-content");
  const scrollTexts = document.querySelectorAll(".scroll-text");
  const scrollTrack = document.querySelector(".scroll-track");
  
  if (!scrollContent || scrollTexts.length === 0) return;

  // Wait for text to be fully rendered
  setTimeout(() => {
    const firstText = scrollTexts[0];
    const itemWidth = firstText.offsetWidth + 60; // Include padding

    // Create smooth infinite loop with seamless transition
    const tl = gsap.timeline({ repeat: -1 });
    
    tl.to(scrollContent, {
      x: -itemWidth * 3, // Move exactly 3 items
      duration: 20, // Smooth speed
      ease: "power1.inOut",
    }, 0);

    // Reset instantly to start for seamless loop
    tl.set(scrollContent, { x: 0 }, ">-0.01");

    // Add hover effect pause
    scrollTrack.addEventListener("mouseenter", () => {
      tl.pause();
    });

    scrollTrack.addEventListener("mouseleave", () => {
      tl.resume();
    });

    console.log("✅ Infinite scroller initialized - item width:", itemWidth);
  }, 150);
}

// Initialize scroller after delay
setTimeout(() => {
  initInfiniteScroller();
}, 1000);

// ================= SECTION 3A: MANIFESTO TEXT =================
function initManifestoSection() {
  const section = document.getElementById("manifestoSection");
  if (!section) return;

  const lines = gsap.utils.toArray(".manifesto-line");
  const copy = section.querySelector(".manifesto-copy");
  const tags = gsap.utils.toArray(".manifesto-tag");

  gsap.set(lines, { yPercent: 115, opacity: 0, filter: "blur(10px)" });
  if (copy) gsap.set(copy, { y: 30, opacity: 0 });
  gsap.set(tags, { y: 20, opacity: 0 });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 74%",
      end: "bottom 42%",
      scrub: 1
    }
  });

  lines.forEach((line) => {
    tl.to(line, {
      yPercent: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "none"
    }, "+=0.1");
  });

  if (copy) {
    tl.to(copy, { y: 0, opacity: 1, duration: 0.7, ease: "none" }, "-=0.2");
  }

  tl.to(tags, {
    y: 0,
    opacity: 1,
    stagger: 0.08,
    duration: 0.5,
    ease: "none"
  }, "-=0.15");

  tags.forEach((tag, i) => {
    gsap.to(tag, {
      y: i % 2 === 0 ? -4 : 4,
      duration: 1.6 + i * 0.12,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  });
}

setTimeout(() => {
  initManifestoSection();
}, 850);

// ================= SECTION 4: HORIZONTAL SHOE GALLERY =================
function initShoeGallery() {
  const galleryTrack = document.querySelector(".gallery-track");
  const galleryCarousel = document.querySelector(".gallery-carousel");
  const shoeItems = document.querySelectorAll(".shoe-item");
  const leftInfo = document.querySelector(".left-info");
  const rightInfo = document.querySelector(".right-info");
  const shoeNameEl = document.querySelector(".shoe-name");
  const shoeTaglineEl = document.querySelector(".shoe-tagline");
  const shoeDescEl = document.querySelector(".shoe-description");
  const shoeNumberEl = document.querySelector(".shoe-number");
  const shoePriceEl = document.querySelector(".shoe-price");

  if (!galleryTrack || !galleryCarousel || shoeItems.length === 0) return;

  gsap.registerPlugin(ScrollTrigger);

  // Velocity-based skew effect while scrolling.
  let proxy = {
      skew: 0,
      skewSetter(value) { this.skew = value; },
      skewGetter() { return this.skew; },
      onUpdate() { gsap.set(galleryTrack, { skewY: this.skew }); }
    },
    clamp = gsap.utils.clamp(-20, 20);

  // Compute exact x needed to center a target shoe in the carousel viewport.
  const getTargetX = (item) => {
    const prevX = Number(gsap.getProperty(galleryTrack, "x")) || 0;
    gsap.set(galleryTrack, { x: 0 });

    const carouselRect = galleryCarousel.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();

    const carouselCenter = carouselRect.left + carouselRect.width / 2;
    const itemCenter = itemRect.left + itemRect.width / 2;
    const targetX = carouselCenter - itemCenter;

    gsap.set(galleryTrack, { x: prevX });
    return targetX;
  };

  const shoeImgs = Array.from(shoeItems)
    .map((item) => item.querySelector("img"))
    .filter(Boolean);

  const imagesLoaded = (imgs) => Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    })
  );

  imagesLoaded(shoeImgs).then(() => {
    const setFirstShoePosition = () => {
      gsap.set(galleryTrack, { x: getTargetX(shoeItems[0]) });
    };

    // Force CR1 centered before any ScrollTrigger progress is applied.
    setFirstShoePosition();

    gsap.to(galleryTrack, {
      scrollTrigger: {
        trigger: ".section4",
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        pin: ".gallery-wrapper",
        onUpdate: (self) => {
          const skew = clamp(self.getVelocity() / -300);
          proxy.skewSetter(skew);
          gsap.to(proxy, { skewGetter: proxy.skewGetter, skew: 0, duration: 0.8, ease: "power3" });
        },
      },
      skewY: 0,
      ease: "power1.inOut",
    });

    gsap.fromTo(galleryTrack, {
      x: () => getTargetX(shoeItems[0]),
    }, {
      x: () => getTargetX(shoeItems[shoeItems.length - 1]),
      scrollTrigger: {
        trigger: ".section4",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        invalidateOnRefresh: true,
        onRefreshInit: () => setFirstShoePosition(),
        onUpdate: (self) => updateShoeInfo(self.progress),
      },
      ease: "none",
      immediateRender: true,
    });

    gsap.set([leftInfo, rightInfo], { opacity: 1 });
    updateShoeInfo(0);

    console.log("Shoe gallery initialized");
  });

  // Update shoe info based on scroll progress.
  function updateShoeInfo(progress) {
    const shoeIndex = gsap.utils.clamp(
      0,
      shoeItems.length - 1,
      Math.floor(progress * shoeItems.length)
    );

    const shoe = shoeItems[shoeIndex];
    if (!shoe) return;

    const shoeName = shoe.dataset.shoe;
    const tagline = shoe.dataset.tagline;
    const desc = shoe.dataset.desc;
    const price = (119.99 + shoeIndex * 10).toFixed(2);

    shoeNameEl.textContent = shoeName;
    shoeTaglineEl.textContent = tagline;
    shoeDescEl.textContent = desc;
    shoeNumberEl.textContent = `0${shoeIndex + 1} / 0${shoeItems.length}`;
    shoePriceEl.textContent = `$${price}`;
  }
}
// Initialize shoe gallery
setTimeout(() => {
  initShoeGallery();
}, 1500);

// ================= 3D PARALLAX EFFECT FOR SHOES =================
function init3DShoeEffects() {
  const shoeItems = document.querySelectorAll(".shoe-item");
  const galleryCarousel = document.querySelector(".gallery-carousel");

  if (!galleryCarousel || shoeItems.length === 0) return;

  galleryCarousel.addEventListener("mousemove", (e) => {
    const rect = galleryCarousel.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Calculate tilt based on mouse position
    const tiltX = (y - 0.5) * 20;
    const tiltY = (x - 0.5) * -20;

    shoeItems.forEach((item) => {
      const img = item.querySelector("img");
      if (img) {
        gsap.to(img, {
          rotateX: tiltX,
          rotateY: tiltY,
          duration: 0.6,
          ease: "power2.out",
        });
      }
    });
  });

  galleryCarousel.addEventListener("mouseleave", () => {
    shoeItems.forEach((item) => {
      const img = item.querySelector("img");
      if (img) {
        gsap.to(img, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.8,
          ease: "elastic.out(1, 0.4)",
        });
      }
    });
  });

  console.log("✅ 3D shoe effects initialized");
}

// Initialize 3D effects
setTimeout(() => {
  init3DShoeEffects();
}, 2000);






// ================= SECTION 5: DRAGGABLE INFINITE CIRCULAR GALLERY =================
function initCircularGallery() {
  const stage = document.getElementById("circularGallery");
  if (!stage) return;

  const cards = Array.from(stage.querySelectorAll(".circular-card"));
  if (cards.length < 2) return;

  let rotationDeg = 0;
  let velocity = 0;
  let isDragging = false;
  let lastX = 0;
  let lastTime = 0;

  const dragToRotate = 0.38;
  const velocityDecay = 0.95;
  const minVelocity = 0.01;
  const idleRotationSpeed = 0.12;

  const getRadius = () => Math.min(stage.clientWidth, stage.clientHeight) * 0.38;

  const render = () => {
    const radius = getRadius();
    const step = (Math.PI * 2) / cards.length;
    const baseAngle = rotationDeg * (Math.PI / 180);

    cards.forEach((card, index) => {
      const angle = baseAngle + index * step;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.42;

      // Front cards are brighter/larger, back cards recede.
      const depth = (Math.sin(angle) + 1) / 2;
      const scale = 0.72 + depth * 0.42;
      const opacity = 0.3 + depth * 0.7;
      const z = Math.round(depth * 1000);

      card.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${scale})`;
      card.style.opacity = opacity.toFixed(3);
      card.style.zIndex = String(z);
      card.style.filter = `brightness(${0.6 + depth * 0.55}) saturate(${0.65 + depth * 0.55})`;
    });
  };

  const animate = () => {
    if (!isDragging) {
      rotationDeg += idleRotationSpeed + velocity;
      velocity *= velocityDecay;
      if (Math.abs(velocity) < minVelocity) velocity = 0;
    }

    render();
    requestAnimationFrame(animate);
  };

  const onPointerMove = (event) => {
    if (!isDragging) return;

    const now = performance.now();
    const dx = event.clientX - lastX;
    const dt = Math.max(1, now - lastTime);

    rotationDeg += dx * dragToRotate;
    velocity = (dx / dt) * 7.5;

    lastX = event.clientX;
    lastTime = now;
  };

  const stopDrag = () => {
    isDragging = false;
    stage.classList.remove("is-dragging");
  };

  stage.addEventListener("pointerdown", (event) => {
    isDragging = true;
    lastX = event.clientX;
    lastTime = performance.now();
    stage.classList.add("is-dragging");
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener("pointermove", onPointerMove);

  stage.addEventListener("pointerup", stopDrag);
  stage.addEventListener("pointercancel", stopDrag);
  stage.addEventListener("pointerleave", () => {
    if (isDragging) stopDrag();
  });

  stage.addEventListener("wheel", (event) => {
    event.preventDefault();
    velocity += (event.deltaX + event.deltaY) * -0.002;
  }, { passive: false });

  window.addEventListener("resize", render);

  render();
  requestAnimationFrame(animate);
}

setTimeout(() => {
  initCircularGallery();
}, 2100);



// ================= SECTION 6: PREMIUM LIQUID FOOTER =================
function initLiquidFooter() {
  const footer = document.getElementById("liquidFooter");
  const canvas = document.getElementById("liquidFooterCanvas");
  const cta = document.getElementById("liquidCta");

  if (!footer || !canvas || typeof THREE === "undefined") return;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uRipple: { value: 0.0 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uPointer;
      uniform float uRipple;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));

        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vec2 uv = vUv;
        vec2 centered = uv - 0.5;
        centered.x *= uResolution.x / uResolution.y;

        float t = uTime * 0.12;
        float n = noise(uv * 4.6 + vec2(t, -t));
        vec2 drift = vec2(
          sin((uv.y + t) * 8.0) * 0.0016,
          sin((uv.x - t) * 7.0) * 0.0013
        );
        drift += (n - 0.5) * 0.0022;

        vec2 p = uv - uPointer;
        p.x *= uResolution.x / uResolution.y;
        float d = length(p);
        float ring = sin(26.0 * d - uTime * 4.0);
        float ripple = exp(-d * 10.0) * ring * uRipple;

        vec2 rippleOffset = normalize(p + 0.0001) * ripple * 0.007;
        vec2 warped = uv + drift + rippleOffset;

        float base = noise(warped * 5.2 + vec2(-t * 0.8, t * 0.6));
        float band = 0.5 + 0.5 * sin((warped.y + base * 0.05) * 9.0 + uTime * 0.08);

        vec3 colA = vec3(0.015, 0.015, 0.018);
        vec3 colB = vec3(0.06, 0.06, 0.065);
        vec3 color = mix(colA, colB, band * 0.34 + base * 0.12);
        color += vec3(0.018) * ripple;

        float vignette = smoothstep(1.1, 0.18, length(centered));
        color *= mix(0.62, 1.0, vignette);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);

  const pointer = new THREE.Vector2(0.5, 0.5);
  const pointerTarget = new THREE.Vector2(0.5, 0.5);
  let rippleStrength = 0.0;
  let rippleTarget = 0.0;
  let lastPointerMove = performance.now();
  let isInView = true;

  const resize = () => {
    const w = footer.clientWidth || window.innerWidth;
    const h = footer.clientHeight || Math.max(420, Math.round(window.innerHeight * 0.78));
    renderer.setSize(w, h, false);
    uniforms.uResolution.value.set(w, h);
  };

  const updatePointerFromEvent = (event) => {
    const rect = footer.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    pointerTarget.x = Math.min(1, Math.max(0, x));
    pointerTarget.y = 1 - Math.min(1, Math.max(0, y));

    rippleTarget = 1.0;
    lastPointerMove = performance.now();
  };

  footer.addEventListener("pointermove", updatePointerFromEvent, { passive: true });
  footer.addEventListener("pointerdown", (event) => {
    updatePointerFromEvent(event);
    rippleTarget = 1.2;
  }, { passive: true });

  const observer = new IntersectionObserver((entries) => {
    isInView = entries[0].isIntersecting;
  }, { threshold: 0.05 });
  observer.observe(footer);

  if (cta) {
    cta.addEventListener("pointermove", (event) => {
      const rect = cta.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(cta, {
        x: x * 16,
        y: y * 12,
        duration: 0.25,
        ease: "power3.out",
      });
    });

    cta.addEventListener("pointerleave", () => {
      gsap.to(cta, { x: 0, y: 0, duration: 0.4, ease: "power3.out" });
    });
  }

  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();

  const tick = () => {
    requestAnimationFrame(tick);
    if (!isInView) return;

    const elapsed = clock.getElapsedTime();
    uniforms.uTime.value = elapsed;

    const idleFor = performance.now() - lastPointerMove;
    if (idleFor > 900) {
      pointerTarget.lerp(new THREE.Vector2(0.5, 0.5), 0.015);
      rippleTarget *= 0.95;
    }

    pointer.lerp(pointerTarget, 0.08);
    rippleStrength += (rippleTarget - rippleStrength) * 0.08;
    rippleTarget *= 0.92;

    uniforms.uPointer.value.copy(pointer);
    uniforms.uRipple.value = Math.min(1.2, rippleStrength);

    renderer.render(scene, camera);
  };

  tick();
}

setTimeout(() => {
  initLiquidFooter();
}, 2300);

// ================= SECTION 6B: FOOTER PHYSICS PILLS =================
function initFooterPhysics() {
  const stage = document.getElementById("footerPhysicsStage");
  if (!stage) return;

  const pills = Array.from(stage.querySelectorAll(".physics-pill"));
  if (!pills.length) return;

  let stageW = 1;
  let stageH = 1;

  const gravity = 0.18;
  const airDrag = 0.992;
  const bounce = 0.62;

  const items = pills.map((el, i) => ({
    el,
    x: 0,
    y: 0,
    vx: (Math.random() - 0.5) * 0.6,
    vy: 0,
    w: el.offsetWidth,
    h: el.offsetHeight,
    r: Math.max(el.offsetWidth, el.offsetHeight) * 0.46,
    dragging: false,
    pointerId: null,
    dx: 0,
    dy: 0,
    prevX: 0,
    prevY: 0,
    angle: (Math.random() - 0.5) * 26,
    spin: (Math.random() - 0.5) * 0.02,
  }));

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    stageW = rect.width;
    stageH = rect.height;

    items.forEach((it, i) => {
      it.w = it.el.offsetWidth;
      it.h = it.el.offsetHeight;
      it.r = Math.max(it.w, it.h) * 0.46;

      if (!it.x && !it.y) {
        const row = Math.floor(i / 3);
        const col = i % 3;
        it.x = clamp(90 + col * 140 + Math.random() * 120, it.r, stageW - it.r);
        it.y = clamp(stageH - 20 - row * 70 - Math.random() * 30, it.r, stageH - it.r);
      } else {
        it.x = clamp(it.x, it.r, stageW - it.r);
        it.y = clamp(it.y, it.r, stageH - it.r);
      }
    });
  };

  const updateDOM = () => {
    items.forEach((it) => {
      it.el.style.transform = `translate(${it.x - it.w * 0.5}px, ${it.y - it.h * 0.5}px) rotate(${it.angle}deg)`;
    });
  };

  const solveCollisions = () => {
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minDist = a.r * 0.54 + b.r * 0.54;

        if (distSq > 0 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) * 0.5;

          if (!a.dragging) {
            a.x -= nx * overlap;
            a.y -= ny * overlap;
          }
          if (!b.dragging) {
            b.x += nx * overlap;
            b.y += ny * overlap;
          }

          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const impulse = (rvx * nx + rvy * ny) * 0.28;

          if (!a.dragging) {
            a.vx += impulse * nx;
            a.vy += impulse * ny;
            a.spin += impulse * 0.03;
          }
          if (!b.dragging) {
            b.vx -= impulse * nx;
            b.vy -= impulse * ny;
            b.spin -= impulse * 0.03;
          }
        }
      }
    }
  };

  const tick = () => {
    items.forEach((it) => {
      if (it.dragging) return;

      it.vy += gravity;
      it.vx *= airDrag;
      it.vy *= airDrag;

      it.x += it.vx;
      it.y += it.vy;
      it.angle += it.spin;
      it.spin *= 0.996;

      if (it.x < it.r) {
        it.x = it.r;
        it.vx *= -bounce;
      } else if (it.x > stageW - it.r) {
        it.x = stageW - it.r;
        it.vx *= -bounce;
      }

      if (it.y > stageH - it.r) {
        it.y = stageH - it.r;
        it.vy *= -bounce;
        it.vx *= 0.96;
        if (Math.abs(it.vy) < 0.12) it.vy = 0;
      } else if (it.y < it.r) {
        it.y = it.r;
        it.vy *= -bounce;
      }
    });

    for (let n = 0; n < 2; n += 1) solveCollisions();
    updateDOM();
    requestAnimationFrame(tick);
  };

  items.forEach((it) => {
    it.el.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;

      it.dragging = true;
      it.pointerId = event.pointerId;
      it.dx = px - it.x;
      it.dy = py - it.y;
      it.prevX = it.x;
      it.prevY = it.y;
      it.el.setPointerCapture(event.pointerId);
      it.el.style.zIndex = "20";
    });

    const move = (event) => {
      if (!it.dragging || event.pointerId !== it.pointerId) return;
      const rect = stage.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;

      const nx = clamp(px - it.dx, it.r, stageW - it.r);
      const ny = clamp(py - it.dy, it.r, stageH - it.r);
      it.vx = (nx - it.prevX) * 0.55;
      it.vy = (ny - it.prevY) * 0.55;
      it.spin = (nx - it.prevX) * 0.06;
      it.prevX = it.x;
      it.prevY = it.y;
      it.x = nx;
      it.y = ny;
    };

    const up = (event) => {
      if (!it.dragging || event.pointerId !== it.pointerId) return;
      it.dragging = false;
      it.pointerId = null;
      it.el.style.zIndex = "";
    };

    it.el.addEventListener("pointermove", move);
    it.el.addEventListener("pointerup", up);
    it.el.addEventListener("pointercancel", up);
  });

  resize();
  updateDOM();
  window.addEventListener("resize", resize);
  requestAnimationFrame(tick);
}

setTimeout(() => {
  initFooterPhysics();
}, 2400);

function initTeamSectionFX() {
  const section = document.getElementById("teamSection");
  const stage = document.getElementById("teamLanyardStage");
  if (!section || !stage) return;

  const title = section.querySelector(".team-title");
  const subtitle = section.querySelector(".team-subtitle");
  const lanyards = Array.from(stage.querySelectorAll(".team-lanyard"));

  if (!lanyards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  let stageW = 1;
  let stageH = 1;

  const items = lanyards.map((wrap) => {
    const pin = wrap.querySelector(".team-pin");
    const cord = wrap.querySelector(".team-cord");
    const card = wrap.querySelector(".team-card");

    return {
      wrap,
      pin,
      cord,
      card,
      anchorXPct: Number(wrap.dataset.anchorX || 50),
      anchorYPct: Number(wrap.dataset.anchorY || 8),
      restLen: Number(wrap.dataset.rest || 180),
      ax: 0,
      ay: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      rotation: 0,
      w: 0,
      h: 0,
      dragging: false,
      pointerId: null,
      dx: 0,
      dy: 0,
      prevX: 0,
      prevY: 0,
    };
  });

  const resize = () => {
    const rect = stage.getBoundingClientRect();
    stageW = rect.width;
    stageH = rect.height;

    items.forEach((it) => {
      it.ax = stageW * (it.anchorXPct / 100);
      it.ay = stageH * (it.anchorYPct / 100);
      it.w = it.card.offsetWidth;
      it.h = it.card.offsetHeight;

      if (!it.x && !it.y) {
        it.x = it.ax;
        it.y = it.ay + it.restLen;
      }

      it.x = clamp(it.x, it.w * 0.5, stageW - it.w * 0.5);
      it.y = clamp(it.y, it.h * 0.5, stageH - it.h * 0.5);
    });
  };

  const updateDom = () => {
    items.forEach((it) => {
      it.pin.style.transform = `translate(${it.ax - 6}px, ${it.ay - 6}px)`;

      const topX = it.x;
      const topY = it.y - it.h * 0.5;
      const dx = topX - it.ax;
      const dy = topY - it.ay;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

      it.cord.style.height = `${Math.max(20, len)}px`;
      it.cord.style.transform = `translate(${it.ax - 1}px, ${it.ay}px) rotate(${angle}deg)`;

      it.card.style.transform = `translate(${it.x - it.w * 0.5}px, ${it.y - it.h * 0.5}px) rotate(${it.rotation}deg)`;
    });
  };

  const tick = () => {
    items.forEach((it) => {
      if (!it.dragging) {
        const targetX = it.ax;
        const targetY = it.ay + it.restLen;

        const sx = targetX - it.x;
        const sy = targetY - it.y;

        const spring = 0.028;
        const damping = 0.92;

        it.vx += sx * spring;
        it.vy += sy * spring;
        it.vx *= damping;
        it.vy *= damping;

        it.x += it.vx;
        it.y += it.vy;
      }

      const dx = it.x - it.ax;
      it.rotation += (((dx * 0.06) + it.vx * 1.4) - it.rotation) * 0.14;

      const marginX = it.w * 0.5;
      const marginY = it.h * 0.5;
      it.x = clamp(it.x, marginX, stageW - marginX);
      it.y = clamp(it.y, marginY, stageH - marginY);
    });

    updateDom();
    requestAnimationFrame(tick);
  };

  items.forEach((it, index) => {
    it.card.style.zIndex = String(10 + index);

    it.card.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;

      it.dragging = true;
      it.pointerId = event.pointerId;
      it.dx = px - it.x;
      it.dy = py - it.y;
      it.prevX = it.x;
      it.prevY = it.y;
      it.card.setPointerCapture(event.pointerId);
      it.card.style.zIndex = "100";
      it.card.style.cursor = "grabbing";
    });

    it.card.addEventListener("pointermove", (event) => {
      if (!it.dragging || event.pointerId !== it.pointerId) return;
      const rect = stage.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;

      const nx = px - it.dx;
      const ny = py - it.dy;

      it.vx = (nx - it.prevX) * 0.35;
      it.vy = (ny - it.prevY) * 0.35;
      it.prevX = it.x;
      it.prevY = it.y;
      it.x = nx;
      it.y = ny;
    });

    const release = (event) => {
      if (!it.dragging || event.pointerId !== it.pointerId) return;
      it.dragging = false;
      it.pointerId = null;
      it.card.style.zIndex = String(10 + index);
      it.card.style.cursor = "grab";
    };

    it.card.addEventListener("pointerup", release);
    it.card.addEventListener("pointercancel", release);
  });

  gsap.fromTo(title, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, ease: "power3.out" });
  gsap.fromTo(subtitle, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, delay: 0.08, ease: "power3.out" });
  gsap.fromTo(items.map(i => i.card), { opacity: 0, scale: 0.92 }, {
    opacity: 1,
    scale: 1,
    duration: 0.8,
    stagger: 0.11,
    delay: 0.15,
    ease: "power3.out",
  });

  resize();
  updateDom();
  window.addEventListener("resize", resize);
  requestAnimationFrame(tick);
}

setTimeout(() => {
  initTeamSectionFX();
}, 1700);





// ================= CUSTOM CURSOR (DESKTOP) =================
function initCustomCursor() {
  if (window.innerWidth <= 900) return;

  const cursor = document.getElementById("customCursor");
  const trail = document.getElementById("cursorTrail");
  if (!cursor || !trail) return;

  let targetX = window.innerWidth * 0.5;
  let targetY = window.innerHeight * 0.5;
  let currentX = targetX;
  let currentY = targetY;
  let active = false;
  let enabled = false;
  let lastEmitTime = 0;
  let lastEmitX = targetX;
  let lastEmitY = targetY;

  const inkPool = [];
  const poolSize = 22;
  let inkIndex = 0;

  for (let i = 0; i < poolSize; i += 1) {
    const dot = document.createElement("span");
    dot.className = "cursor-ink";
    trail.appendChild(dot);
    inkPool.push(dot);
  }

  const emitInk = (x, y) => {
    const dot = inkPool[inkIndex];
    inkIndex = (inkIndex + 1) % poolSize;

    dot.classList.remove("is-live");
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    dot.style.setProperty("--size", `${18 + Math.random() * 20}px`);
    void dot.offsetWidth;
    dot.classList.add("is-live");
  };

  const enableCursor = () => {
    if (enabled) return;
    enabled = true;
    document.body.classList.add("custom-cursor-enabled");
  };

  const move = (event) => {
    const isMousePointer = event.pointerType ? event.pointerType === "mouse" : true;
    if (!isMousePointer) return;
    enableCursor();
    targetX = event.clientX;
    targetY = event.clientY;
    active = true;
  };

  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerdown", move, { passive: true });
  window.addEventListener("mousemove", move, { passive: true });

  const tick = () => {
    requestAnimationFrame(tick);

    if (!active) return;

    currentX += (targetX - currentX) * 0.2;
    currentY += (targetY - currentY) * 0.2;

    cursor.style.setProperty("--cx", `${currentX}px`);
    cursor.style.setProperty("--cy", `${currentY}px`);

    const now = performance.now();
    const dx = currentX - lastEmitX;
    const dy = currentY - lastEmitY;
    const dist = Math.hypot(dx, dy);

    if (dist > 14 || now - lastEmitTime > 46) {
      emitInk(currentX, currentY);
      lastEmitTime = now;
      lastEmitX = currentX;
      lastEmitY = currentY;
    }
  };

  tick();
}

setTimeout(() => {
  initCustomCursor();
}, 900);
