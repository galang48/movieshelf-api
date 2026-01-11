const API = "/api/v1";

/* ================== AUTH & UTILS ================== */
function getToken() {
  return localStorage.getItem("token");
}

function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

function headers() {
  const token = getToken();
  return {
    "Authorization": `Bearer ${token}`,
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

/* ================== REFRESH TOKEN ================== */
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

/* ================== USER INFO ================== */
async function loadMe() {
  const res = await fetchWithAuth(`${API}/auth/me`);
  const json = await safeJson(res);

  if (!json.success) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login.html";
    return;
  }

  const me = document.getElementById("me");
  if (me) me.textContent = `(${json.data.username} - ${json.data.role})`;

  const btnSync = document.getElementById("btnSync");
  if (btnSync && json.data.role !== "admin") {
    btnSync.style.display = "none";
  }
}

/* ================== MOVIE CARD (MATCH CSS) ================== */
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
  sub.textContent = `Release: ${m.releaseDate || "-"} | TMDB: ${m.tmdbId || "-"}`;
  meta.appendChild(sub);

  const btn = document.createElement("button");
  btn.className = "secondary";
  btn.textContent = "Add to Watchlist";
  btn.onclick = async () => {
    requireLogin();
    try {
      btn.disabled = true;
      btn.textContent = "Adding...";

      const r = await fetchWithAuth(`${API}/watchlist`, {
        method: "POST",
        body: JSON.stringify({ tmdbId: m.tmdbId }),
      });

      const j = await safeJson(r);
      if (!j.success) return setMsg(j.error || "Gagal tambah watchlist");

      setMsg("✅ Ditambahkan ke watchlist", true);
    } finally {
      btn.disabled = false;
      btn.textContent = "Add to Watchlist";
    }
  };

  meta.appendChild(btn);
  card.appendChild(meta);

  return card;
}

/* ================== RENDER ================== */
function render(list) {
  const el = document.getElementById("list");
  el.innerHTML = "";

  if (!list || !list.length) {
    el.innerHTML = `<p class="muted">Tidak ada data. Admin klik "Sync Trending" dulu.</p>`;
    return;
  }

  list.forEach((m) => el.appendChild(cardMovie(m)));
}

/* ================== LOAD & SEARCH ================== */
async function loadMovies() {
  requireLogin();
  setMsg("");

  const res = await fetchWithAuth(`${API}/movies`);
  const json = await safeJson(res);

  if (!json.success) return setMsg(json.error || "Gagal load movies");
  render(json.data || []);
}

async function searchMovies() {
  requireLogin();
  setMsg("");

  const q = document.getElementById("q").value.trim();
  const url = q
    ? `${API}/movies/search?q=${encodeURIComponent(q)}`
    : `${API}/movies`;

  const res = await fetchWithAuth(url);
  const json = await safeJson(res);

  if (!json.success) return setMsg(json.error || "Gagal search");
  render(json.data || []);
}

/* ================== BUTTONS ================== */
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

document.getElementById("btnReload").onclick = loadMovies;
document.getElementById("btnSearch").onclick = searchMovies;

document.getElementById("btnSync").onclick = async () => {
  requireLogin();
  const btn = document.getElementById("btnSync");
  const old = btn.textContent;

  try {
    btn.disabled = true;
    btn.textContent = "Syncing...";
    setMsg("Sync trending...", true);

    const res = await fetchWithAuth(`${API}/admin/sync/trending`, {
      method: "POST",
    });

    const json = await safeJson(res);
    if (!json.success) return setMsg(json.error || "Sync gagal");

    const count = json.data?.count ?? 0;
    setMsg(`✅ Sync sukses. ${count} movie tersimpan/terupdate.`, true);
    await loadMovies();
  } finally {
    btn.disabled = false;
    btn.textContent = old;
  }
};

/* ================== INIT ================== */
loadMe();
loadMovies();
