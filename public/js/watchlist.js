const API = "/api/v1";

/* ================== AUTH & UTILS ================== */
function getToken() {
  return localStorage.getItem("token");
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

function headers() {
  return {
    "Authorization": `Bearer ${getToken()}`,
    "Content-Type": "application/json",
  };
}

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

function requireLogin() {
  if (!getToken()) window.location.href = "/login.html";
}

function setMsg(text, ok = false) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = text || "";
  el.className = "msg " + (text ? (ok ? "ok" : "err") : "");
}

/* ================== REFRESH TOKEN (SAMA KAYA MOVIES) ================== */
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const json = await safeJson(res);
    if (!json.success) return false;

    localStorage.setItem("token", json.data.token);
    localStorage.setItem("refreshToken", json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function fetchWithAuth(url, options = {}, retry = true) {
  const opts = { ...options };
  opts.headers = { ...headers(), ...(options.headers || {}) };

  const res = await fetch(url, opts);

  if (res.status === 401 && retry) {
    const ok = await refreshAccessToken();
    if (ok) return fetchWithAuth(url, options, false);

    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login.html";
  }

  return res;
}

/* ================== CARD WATCHLIST (MATCH CSS) ================== */
function cardMovie(m) {
  const card = document.createElement("div");
  card.className = "movie";

  const poster = document.createElement("div");
  poster.className = "poster";
  poster.style.backgroundImage = m.posterPath
    ? `url(https://image.tmdb.org/t/p/w500${m.posterPath})`
    : "url(https://placehold.co/500x750?text=No+Poster)";
  card.appendChild(poster);

  const meta = document.createElement("div");
  meta.className = "meta";

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = m.title || "-";
  meta.appendChild(title);

  const sub = document.createElement("div");
  sub.className = "sub";
  sub.textContent = `TMDB ID: ${m.tmdbId || "-"}`;
  meta.appendChild(sub);

  const btn = document.createElement("button");
  btn.className = "danger";
  btn.textContent = "Remove";
  btn.onclick = async () => {
    requireLogin();
    try {
      btn.disabled = true;

      const res = await fetchWithAuth(`${API}/watchlist/${m.tmdbId}`, {
        method: "DELETE",
      });

      const json = await safeJson(res);
      if (!json.success) {
        setMsg(json.error || "Gagal hapus", false);
        return;
      }

      setMsg("✅ Dihapus dari watchlist", true);
      load();
    } finally {
      btn.disabled = false;
    }
  };

  meta.appendChild(btn);
  card.appendChild(meta);

  return card;
}

/* ================== LOAD WATCHLIST ================== */
async function load() {
  requireLogin();
  setMsg("");

  const res = await fetchWithAuth(`${API}/watchlist`);
  const json = await safeJson(res);

  const list = document.getElementById("list");
  list.innerHTML = "";

  if (!json.success || !json.data.length) {
    list.innerHTML = `<p class="muted">Watchlist kosong.</p>`;
    return;
  }

  json.data.forEach((m) => list.appendChild(cardMovie(m)));
}

/* ================== LOGOUT ================== */
document.getElementById("btnLogout").onclick = async () => {
  const rt = getRefreshToken();
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");

  if (rt) {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
    } catch {}
  }

  window.location.href = "/login.html";
};

/* ================== INIT ================== */
load();
