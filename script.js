/* =============================================
   HOLI 2026 — SCRIPT.JS

   DATE LOGIC:
   • 2 March 2026  → Holika Dahan screen (fire)
   • 3 March 2026  → Countdown screen (waiting)
   • 4 March 2026+ → Full Holi website unlocks

   NOTE: Dates are checked in IST (India Standard Time, UTC+5:30)
   ============================================= */

// ============================================================
// CONFIGURATION — change these dates to adjust behaviour
// ============================================================
const HOLIKA_DATE = { year: 2026, month: 3, day: 2 };   // 2 March
const COUNTDOWN_DATE = { year: 2026, month: 3, day: 3 }; // 3 March
const HOLI_DATE = { year: 2026, month: 3, day: 4 };      // 4 March (unlock)

// ============================================================
// UTILITIES
// ============================================================

/**
 * Returns the current date in IST as { year, month, day }.
 * IST = UTC + 5h 30m
 */
function getTodayIST() {
  const now = new Date();
  // Offset to IST: UTC+5:30 = 330 minutes
  const istOffset = 330 * 60 * 1000;
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const ist = new Date(utc + istOffset);
  return {
    year:  ist.getFullYear(),
    month: ist.getMonth() + 1, // 1-indexed
    day:   ist.getDate()
  };
}

/**
 * Compares two date objects { year, month, day }.
 * Returns -1, 0, or 1 (like compareTo).
 */
function compareDates(a, b) {
  if (a.year !== b.year)   return a.year  < b.year  ? -1 : 1;
  if (a.month !== b.month) return a.month < b.month ? -1 : 1;
  if (a.day !== b.day)     return a.day   < b.day   ? -1 : 1;
  return 0;
}

// ============================================================
// SCREEN ROUTER — decide which screen to show
// ============================================================
function routeToScreen() {
  const today = getTodayIST();

  if (compareDates(today, HOLIKA_DATE) === 0) {
    // Exactly 2 March → Holika Dahan
    showScreen('holika-screen');
    startHolikaCountdown();

  } else if (compareDates(today, COUNTDOWN_DATE) === 0) {
    // Exactly 3 March → Countdown
    showScreen('countdown-screen');
    startCountdown();

  } else if (compareDates(today, HOLI_DATE) >= 0) {
    // 4 March or later → Full Holi website
    showScreen('holi-screen');
    generateStars(); // add background stars (reused cosmetically)

  } else {
    // Before 2 March — show countdown to Holika Dahan
    showScreen('countdown-screen');
    startCountdown(true); // countdown to Holika Dahan instead
    document.querySelector('.countdown-title').textContent = '🔥 Holika Dahan Aane Wali Hai! 🔥';
    document.querySelector('.countdown-sub').textContent = 'Holika Dahan ki tayaariyan shuru karo!';
    document.querySelector('.unlock-note').textContent = '🔥 2 March 2026 ko Holika Dahan hogi!';
  }
}

/** Show a screen by ID, hide all others */
function showScreen(id) {
  ['holika-screen', 'countdown-screen', 'holi-screen'].forEach(sid => {
    document.getElementById(sid).classList.toggle('hidden', sid !== id);
  });
}

// ============================================================
// SCREEN 1: HOLIKA DAHAN — countdown to Holi start
// ============================================================

/** Countdown clock inside Holika Dahan screen (time until 4 March 00:00 IST) */
function startHolikaCountdown() {
  generateStars();

  function update() {
    const now = new Date();
    // Target: 4 March 2026 00:00:00 IST = 3 March 2026 18:30:00 UTC
    const holiStart = new Date(Date.UTC(2026, 2, 3, 18, 30, 0)); // month is 0-indexed
    const diff = holiStart - now;

    if (diff <= 0) {
      // Holi has started — reload to show Holi screen
      location.reload();
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    const pad = n => String(n).padStart(2, '0');
    document.getElementById('holi-time-left').textContent =
      `${pad(h)}h ${pad(m)}m ${pad(s)}s`;
  }

  update();
  setInterval(update, 1000);
}

// ============================================================
// SCREEN 2: COUNTDOWN — live timer until target date
// ============================================================

/**
 * @param {boolean} toHolika - if true, count to 2 March; else to 4 March
 */
function startCountdown(toHolika = false) {
  // Target in IST (convert to UTC for calculation)
  // 4 March 2026 00:00 IST = 3 March 2026 18:30 UTC
  // 2 March 2026 00:00 IST = 1 March 2026 18:30 UTC
  const targetUTC = toHolika
    ? new Date(Date.UTC(2026, 1, 1, 18, 30, 0))   // 2 March IST
    : new Date(Date.UTC(2026, 2, 3, 18, 30, 0));   // 4 March IST

  function update() {
    const now  = new Date();
    const diff = targetUTC - now;

    if (diff <= 0) {
      // Target reached — reload
      location.reload();
      return;
    }

    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins  = Math.floor((diff % 3600000)  / 60000);
    const secs  = Math.floor((diff % 60000)    / 1000);

    const pad = n => String(n).padStart(2, '0');

    // Animate number change (quick scale bump)
    setCounterValue('cd-days',  pad(days));
    setCounterValue('cd-hours', pad(hours));
    setCounterValue('cd-mins',  pad(mins));
    setCounterValue('cd-secs',  pad(secs));
  }

  update();
  setInterval(update, 1000);
}

/** Update a counter span with a tiny pop animation on value change */
function setCounterValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.textContent !== value) {
    el.textContent = value;
    el.style.transform = 'scale(1.25)';
    setTimeout(() => { el.style.transform = ''; }, 200);
  }
}

// ============================================================
// SCREEN 3: HOLI WEBSITE — all interactive features
// ============================================================

let score        = 0;
let totalCircles = 5;
let popupTimer   = null;

const brightColors = [
  '#FF4DA6','#FF6B35','#FFD700','#00C878',
  '#00B4FF','#A855F7','#FF3B5C','#F59E0B',
  '#10B981','#6366F1'
];

const circleColors = ['#FF4DA6','#FFD700','#00C878','#00B4FF','#A855F7'];

/* ---- Start Holi ---- */
function startHoli() {
  const nameInput = document.getElementById('name-input');
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.focus();
    nameInput.style.borderColor = '#FF3B5C';
    nameInput.placeholder = 'Pehle naam likho! 😊';
    setTimeout(() => {
      nameInput.style.borderColor = '';
      nameInput.placeholder = 'Tumhara naam...';
    }, 2000);
    return;
  }

  // Show personalized message
  document.getElementById('personal-message').textContent =
    `🌸 Happy Holi, ${name}! 🌸\nMay your life be as colorful as Holi!`;

  const msgSection = document.getElementById('message-section');
  msgSection.classList.remove('hidden');
  // Replay animation
  msgSection.style.animationName = 'none';
  void msgSection.offsetHeight;
  msgSection.style.animationName = '';

  // Show mini-game & score
  initGame();
  document.getElementById('game-section').classList.remove('hidden');
  document.getElementById('score-board').classList.remove('hidden');

  setTimeout(() => msgSection.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
}

// Enter key support
document.addEventListener('DOMContentLoaded', () => {
  const nameInput = document.getElementById('name-input');
  if (nameInput) {
    nameInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') startHoli();
    });
  }
});

/* ---- Throw Color ---- */
function throwColor() {
  const randomColor = brightColors[Math.floor(Math.random() * brightColors.length)];
  const holiScreen = document.getElementById('holi-screen');

  // Flash background
  holiScreen.style.backgroundColor = randomColor;
  holiScreen.style.backgroundImage = 'none';
  setTimeout(() => {
    holiScreen.style.backgroundColor = '';
    holiScreen.style.backgroundImage = '';
  }, 1500);

  launchConfetti();
  showToast();
}

/* ---- Confetti ---- */
function launchConfetti() {
  confetti({
    particleCount: 160,
    spread: 100,
    origin: { y: 0.55 },
    colors: brightColors,
    scalar: 1.1,
  });
  setTimeout(() => {
    confetti({ particleCount: 80, angle: 60,  spread: 70, origin: { x: 0, y: 0.6 }, colors: brightColors });
    confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors: brightColors });
  }, 250);
}

/* ---- Toast Popup ---- */
function showToast() {
  const toast = document.getElementById('popup-toast');
  if (popupTimer) clearTimeout(popupTimer);

  toast.classList.remove('hidden');
  requestAnimationFrame(() => toast.classList.add('show'));

  popupTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 450);
  }, 2500);
}

/* ---- Mini Game ---- */
function initGame() {
  score = 0;
  updateScore();

  const container = document.getElementById('circles-container');
  document.getElementById('game-result').classList.add('hidden');
  container.innerHTML = '';

  circleColors.forEach((color, index) => {
    const circle = document.createElement('div');
    circle.classList.add('color-circle');
    circle.style.background = color;
    circle.style.animationDelay = `${index * 0.1}s`;
    circle.addEventListener('click', () => handleCircleClick(circle));
    container.appendChild(circle);
  });
}

function handleCircleClick(circle) {
  if (circle.classList.contains('circle-pop')) return;
  circle.classList.add('circle-pop');
  circle.addEventListener('animationend', () => {
    circle.remove();
    score++;
    updateScore();
    checkWin();
  }, { once: true });
}

function updateScore() {
  const el = document.getElementById('score-value');
  if (el) el.textContent = score;
}

function checkWin() {
  if (score >= totalCircles) {
    document.getElementById('game-result').classList.remove('hidden');
    setTimeout(() => {
      confetti({
        particleCount: 200, spread: 120,
        origin: { y: 0.6 }, colors: brightColors,
      });
    }, 200);
  }
}

function resetGame() {
  initGame();
}

/* ---- Generate decorative stars (for Holika screen) ---- */
function generateStars() {
  // Stars are handled purely via CSS background on #stars-bg
  // This function is a no-op placeholder — extend if needed
}

// ============================================================
// BOOT — run router on page load
// ============================================================
window.addEventListener('DOMContentLoaded', routeToScreen);
