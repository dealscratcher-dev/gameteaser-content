/**
 * Season Rush — CODM & PUBG Mobile countdown timers
 * Update DEFAULT_SEASONS when new seasons launch in-game.
 */

const DEFAULT_SEASONS = {
  codm: {
    name: "Season 5 — Revenge",
    subtitle: "The Boys collab · Armored Royale · BAL-27",
    start: "2026-05-27T12:00:00",
    end: "2026-06-24T12:00:00", // ~4 weeks after launch (estimate)
    rewards: [
      { tier: "mythic", text: "Mythic Kui Ji Operator Draw" },
      { tier: "legendary", text: "The Boys themed skins & weapons" },
      { tier: "epic", text: "Battle Pass legendary tier outfits" },
      { tier: "epic", text: "Armored Royale exclusive rewards" },
      { tier: "rare", text: "Weekly event tokens & crates" },
    ],
  },
  pubg: {
    name: "Royale Pass A19 — Olympian Academy",
    subtitle: "S30 Ranked · Scorpion 3D rewards · May 16 launch",
    start: "2026-05-16T00:00:00",
    end: "2026-07-15T23:59:59",
    rewards: [
      { tier: "mythic", text: "Level 100 Mythic outfit set" },
      { tier: "legendary", text: "Scorpion & Olympian Academy skins" },
      { tier: "epic", text: "3D lobby & weapon finishes" },
      { tier: "epic", text: "Elite Pass UC rebate at max level" },
      { tier: "rare", text: "Weekly mission RP boost items" },
    ],
  },
};

const STORAGE_KEY = "seasonRushConfig";
const STREAK_KEY = "seasonRushStreaks";
function loadSeasons() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.codm && saved?.pubg) return { ...DEFAULT_SEASONS, ...saved };
  } catch (_) {}
  return structuredClone(DEFAULT_SEASONS);
}

function saveSeasons(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let seasons = loadSeasons();

function parseDate(iso) {
  return new Date(iso).getTime();
}

function getTimeLeft(endIso) {
  const diff = parseDate(endIso) - Date.now();
  return Math.max(0, diff);
}

function splitTime(ms) {
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function seasonProgress(startIso, endIso) {
  const start = parseDate(startIso);
  const end = parseDate(endIso);
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function renderRewards(listEl, rewards) {
  listEl.innerHTML = rewards
    .map(
      (r) =>
        `<li><span class="tier ${r.tier}">${r.tier}</span><span>${r.text}</span></li>`
    )
    .join("");
}

function updateCountdown(prefix, endIso, startIso) {
  const root = document.getElementById(`${prefix}-countdown`);
  const left = getTimeLeft(endIso);
  const parts = splitTime(left);

  ["days", "hours", "minutes", "seconds"].forEach((unit) => {
    const el = root.querySelector(`[data-unit="${unit}"]`);
    const val = pad(parts[unit]);
    if (el.textContent !== val) {
      el.textContent = val;
      el.closest(".time-block")?.classList.add("tick");
      setTimeout(() => el.closest(".time-block")?.classList.remove("tick"), 200);
    }
  });

  const pct = seasonProgress(startIso, endIso);
  document.getElementById(`${prefix}-progress`).style.width = `${pct}%`;
  document.getElementById(`${prefix}-progress-pct`).textContent = `${pct}%`;

  const urgency = document.getElementById(`${prefix}-urgency`);
  const days = parts.days;
  const isCodm = prefix === "codm";
  if (left === 0) {
    urgency.textContent = isCodm
      ? "Season's over. Go touch grass — then check what dropped in the app."
      : "Pass reset. Whatever you didn't claim is gone.";
    urgency.classList.add("hot");
  } else if (days <= 1) {
    urgency.textContent = isCodm
      ? "Tomorrow it might be gone. Finish those last BP tiers tonight."
      : "Last day vibes. RP level 100 isn't gonna grind itself.";
    urgency.classList.add("hot");
  } else if (days <= 3) {
    urgency.textContent = `${days} days left — no more 'I'll do it later.'`;
    urgency.classList.add("hot");
  } else if (days <= 7) {
    urgency.textContent = isCodm
      ? "Final week. Weeklies expire — do those before another ranked match."
      : "One week out. Knock out weeklies before the weekend.";
    urgency.classList.remove("hot");
  } else {
    urgency.textContent = isCodm
      ? `${days} days still on the clock. Steady wins the mythic.`
      : `${days} days for A19 — chill pace, but don't sleep on weeklies.`;
    urgency.classList.remove("hot");
  }

  return left;
}

function refreshUI() {
  const c = seasons.codm;
  const p = seasons.pubg;

  document.getElementById("codm-season-name").textContent = c.name;
  document.getElementById("codm-season-dates").textContent = c.subtitle;
  document.getElementById("pubg-season-name").textContent = p.name;
  document.getElementById("pubg-season-dates").textContent = p.subtitle;

  renderRewards(document.getElementById("codm-rewards"), c.rewards);
  renderRewards(document.getElementById("pubg-rewards"), p.rewards);

  updateCountdown("codm", c.end, c.start);
  updateCountdown("pubg", p.end, p.start);
}

/* Tabs */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");

    const game = tab.dataset.game;
    const codm = document.getElementById("panel-codm");
    const pubg = document.getElementById("panel-pubg");

    if (game === "codm") {
      codm.classList.add("visible");
      pubg.classList.remove("visible");
    } else if (game === "pubg") {
      pubg.classList.add("visible");
      codm.classList.remove("visible");
    } else {
      codm.classList.add("visible");
      pubg.classList.add("visible");
    }
  });
});

/* Daily grind streak (local gratification) */
function loadStreaks() {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY)) || { codm: 0, pubg: 0, codmLast: "", pubgLast: "" };
  } catch (_) {
    return { codm: 0, pubg: 0, codmLast: "", pubgLast: "" };
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function updateStreakDisplay() {
  const s = loadStreaks();
  document.getElementById("codm-streak").textContent =
    s.codm ? `${s.codm}-day streak — respect` : "no streak yet (tap when you play)";
  document.getElementById("pubg-streak").textContent =
    s.pubg ? `${s.pubg}-day streak — respect` : "no streak yet (tap when you play)";
}

function markGrind(game) {
  const s = loadStreaks();
  const key = todayKey();
  const lastKey = game === "codm" ? "codmLast" : "pubgLast";
  const countKey = game;

  if (s[lastKey] === key) {
    showToast("you already checked in today");
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().slice(0, 10);

  if (s[lastKey] === yKey) {
    s[countKey] += 1;
  } else {
    s[countKey] = 1;
  }
  s[lastKey] = key;
  localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  updateStreakDisplay();
  showToast("logged. see you tomorrow.");
  burstConfetti(game === "codm" ? "#e85d24" : "#d4a017");
}

document.querySelectorAll(".btn-grind").forEach((btn) => {
  btn.addEventListener("click", () => markGrind(btn.dataset.game));
});

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2800);
}
window.showToast = showToast;

function burstConfetti(color) {
  const layer = document.getElementById("confetti");
  const colors = [color, "#f2ebe3", "#5cb87a", "#a89f92"];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement("div");
    el.className = "confetti-piece";
    el.style.left = `${Math.random() * 100}%`;
    el.style.background = colors[i % colors.length];
    el.style.animationDelay = `${Math.random() * 0.4}s`;
    el.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    layer.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }
}
window.burstConfetti = burstConfetti;

/* Config dialog */
const dialog = document.getElementById("config-dialog");

function toLocalInput(iso) {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function openConfig() {
  document.getElementById("cfg-codm-start").value = toLocalInput(seasons.codm.start);
  document.getElementById("cfg-codm-end").value = toLocalInput(seasons.codm.end);
  document.getElementById("cfg-pubg-start").value = toLocalInput(seasons.pubg.start);
  document.getElementById("cfg-pubg-end").value = toLocalInput(seasons.pubg.end);
  dialog.showModal();
}

document.querySelectorAll("#edit-dates, #edit-dates-footer").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    openConfig();
  });
});

dialog.querySelector("form").addEventListener("submit", (e) => {
  const sub = e.submitter?.value;
  if (sub === "cancel") return;
  if (sub === "save") {
    seasons.codm.start = new Date(document.getElementById("cfg-codm-start").value).toISOString();
    seasons.codm.end = new Date(document.getElementById("cfg-codm-end").value).toISOString();
    seasons.pubg.start = new Date(document.getElementById("cfg-pubg-start").value).toISOString();
    seasons.pubg.end = new Date(document.getElementById("cfg-pubg-end").value).toISOString();
    saveSeasons(seasons);
    refreshUI();
    showToast("dates saved — timer's synced");
  }
});

document.getElementById("cfg-reset").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  seasons = loadSeasons();
  refreshUI();
  showToast("back to default dates");
});

refreshUI();
updateStreakDisplay();
setInterval(refreshUI, 1000);

document.getElementById("btn-copy")?.addEventListener("click", () => {
  const input = document.getElementById("share-url");
  navigator.clipboard.writeText(input.value).then(() => showToast("link copied — send it to the squad"));
});
