/**
 * Hologram player cards, event grid, likes & shares
 */
(function () {
  const SITE = window.GT_CONTENT?.site?.url || "https://gameteaser.netlify.app";
  const LIKES_KEY = "gtCardLikes";

  function getEvent(id) {
    return window.GT_CONTENT.events.find((e) => e.id === id);
  }

  function loadLikes() {
    try {
      return JSON.parse(localStorage.getItem(LIKES_KEY)) || {};
    } catch (_) {
      return {};
    }
  }

  function saveLikes(map) {
    localStorage.setItem(LIKES_KEY, JSON.stringify(map));
  }

  function timeLeft(endIso) {
    const ms = Math.max(0, new Date(endIso) - Date.now());
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    return { ms, label: ms === 0 ? "Ended" : `${d}d ${h}h left` };
  }

  function shareUrl(playerId) {
    return `${SITE}/#player-${playerId}`;
  }

  function sharePlayer(player) {
    const event = getEvent(player.eventId);
    const text = `${player.name} · ${event?.title || "GameTeaser"} — ${timeLeft(event?.end || "").label}`;
    const url = shareUrl(player.id);

    if (navigator.share) {
      navigator.share({ title: player.name, text, url }).catch(() => copyShare(url, text));
    } else {
      copyShare(url, text);
    }
  }

  function copyShare(url, text) {
    const full = `${text}\n${url}`;
    navigator.clipboard.writeText(full).then(() => {
      window.showToast?.("card link copied — send to squad");
    });
  }

  function toggleLike(playerId, btn) {
    const likes = loadLikes();
    likes[playerId] = !likes[playerId];
    saveLikes(likes);
    updateLikeButton(btn, likes[playerId]);
    if (likes[playerId]) window.burstConfetti?.("#a855f7");
  }

  function updateLikeButton(btn, liked) {
    const count = Object.values(loadLikes()).filter(Boolean).length;
    btn.classList.toggle("liked", liked);
    btn.setAttribute("aria-pressed", liked ? "true" : "false");
    btn.querySelector(".like-label").textContent = liked ? "Liked" : "Like";
    const badge = document.getElementById("total-likes");
    if (badge) badge.textContent = String(count);
  }

  function holoStyle(player) {
    const [a, b, c] = player.holo || ["#a855f7", "#6ee7ff", "#f59e0b"];
    return `--holo-a:${a};--holo-b:${b};--holo-c:${c}`;
  }

  function renderPlayerCard(player) {
    const event = getEvent(player.eventId);
    const liked = loadLikes()[player.id];
    const left = event ? timeLeft(event.end) : { label: "—" };

    return `
      <article class="holo-card" id="player-${player.id}" data-vertical="${player.vertical}" style="${holoStyle(player)}">
        <div class="holo-card-inner">
          <div class="holo-shine" aria-hidden="true"></div>
          <div class="holo-scanlines" aria-hidden="true"></div>
          <header class="holo-head">
            <span class="holo-glyph">${player.glyph}</span>
            <span class="holo-franchise">${player.franchise}</span>
          </header>
          <h3 class="holo-name">${player.name}</h3>
          <p class="holo-role">${player.role}</p>
          <p class="holo-tagline">${player.tagline}</p>
          <p class="holo-event">${event?.title || ""}</p>
          <p class="holo-countdown" data-event-end="${event?.end || ""}">${left.label}</p>
          <div class="holo-actions">
            <button type="button" class="holo-btn holo-like ${liked ? "liked" : ""}" data-player="${player.id}" aria-pressed="${liked}">
              <span class="like-icon">♥</span>
              <span class="like-label">${liked ? "Liked" : "Like"}</span>
            </button>
            <button type="button" class="holo-btn holo-share" data-player="${player.id}">Share</button>
          </div>
        </div>
      </article>
    `;
  }

  function renderEventChip(event) {
    const left = timeLeft(event.end);
    return `
      <a href="#event-${event.id}" class="event-chip" data-vertical="${event.vertical}" id="event-${event.id}">
        <span class="event-chip-vert">${event.vertical}</span>
        <strong>${event.title}</strong>
        <span class="event-chip-time" data-end="${event.end}">${left.label}</span>
      </a>
    `;
  }

  function renderTaxonomy() {
    const el = document.getElementById("taxonomy-list");
    if (!el || !window.GT_CONTENT) return;
    el.innerHTML = window.GT_CONTENT.taxonomy.verticals
      .map(
        (v) => `
        <div class="tax-card" data-vertical="${v.id}">
          <span class="tax-emoji">${v.emoji}</span>
          <h3>${v.label}</h3>
          <p>${v.description}</p>
          <ul class="tax-tags">${v.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
        </div>
      `
      )
      .join("");
  }

  function renderEvents() {
    const el = document.getElementById("events-track");
    if (!el) return;
    el.innerHTML = window.GT_CONTENT.events.map(renderEventChip).join("");
  }

  function renderPlayers(filter = "all") {
    const grid = document.getElementById("holo-grid");
    if (!grid) return;
    let list = window.GT_CONTENT.players;
    if (filter !== "all") list = list.filter((p) => p.vertical === filter);
    grid.innerHTML = list.map(renderPlayerCard).join("");

    grid.querySelectorAll(".holo-like").forEach((btn) => {
      btn.addEventListener("click", () => toggleLike(btn.dataset.player, btn));
    });
    grid.querySelectorAll(".holo-share").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = window.GT_CONTENT.players.find((x) => x.id === btn.dataset.player);
        if (p) sharePlayer(p);
      });
    });
  }

  function tickCardCountdowns() {
    document.querySelectorAll(".holo-countdown[data-event-end]").forEach((el) => {
      const end = el.getAttribute("data-event-end");
      if (!end) return;
      el.textContent = timeLeft(end).label;
    });
    document.querySelectorAll(".event-chip-time[data-end]").forEach((el) => {
      el.textContent = timeLeft(el.getAttribute("data-end")).label;
    });
  }

  function initFilters() {
    document.querySelectorAll(".vert-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".vert-filter").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderPlayers(btn.dataset.filter);
        document.querySelectorAll(".event-chip").forEach((chip) => {
          const v = btn.dataset.filter;
          chip.style.display = v === "all" || chip.dataset.vertical === v ? "" : "none";
        });
      });
    });
  }

  function scrollToHash() {
    const hash = location.hash;
    if (!hash) return;
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function init() {
    if (!window.GT_CONTENT) return;
    renderTaxonomy();
    renderEvents();
    renderPlayers("all");
    initFilters();
    const likes = loadLikes();
    const badge = document.getElementById("total-likes");
    if (badge) badge.textContent = String(Object.values(likes).filter(Boolean).length);
    tickCardCountdowns();
    setInterval(tickCardCountdowns, 60000);
    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.GT_renderPlayers = renderPlayers;
})();
