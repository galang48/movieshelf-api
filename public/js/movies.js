const API = "/api/v1";

function getToken() {
  return localStorage.getItem("token");
}

function headers() {
  const token = getToken();
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

function setMsg(text, ok = false) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = text || "";
  el.className = "msg " + (text ? (ok ? "ok" : "err") : "");
}

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text();
  return { success: false, error: txt || `HTTP ${res.status}` };
}

function posterUrl(posterPath) {
  if (!posterPath) return "";
  return `https://image.tmdb.org/t/p/w342${posterPath}`;
}

function requireLogin() {
  if (!getToken()) window.location.href = "/login.html";
}

async function loadMe() {
  requireLogin();

  const res = await fetch(`${API}/auth/me`, { headers: headers() });
  const json = await safeJson(res);

  if (!json.success) {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return;
  }

  const me = document.getElementById("me");
  if (me) me.textContent = `(${json.data.username} - ${json.data.role})`;

  const btnSync = document.getElementById("btnSync");
  if (btnSync && json.data.role !== "admin") btnSync.style.display = "none";
}

function render(list) {
  const el = document.getElementById("list");
  el.innerHTML = "";

  (list || []).forEach(m => {
    const card = document.createElement("div");
    card.className = "movie";

    const poster = document.createElement("div");
    poster.className = "poster";
    const p = posterUrl(m.posterPath);
    if (p) poster.style.backgroundImage = `url("${p}")`;

    const meta = document.createElement("div");
    meta.className = "meta";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = m.title || "-";

    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = `TMDB ID: ${m.tmdbId}${m.releaseDate ? ` • ${m.releaseDate}` : ""}`;

    const btn = document.createElement("button");
    btn.className = "secondary";
    btn.textContent = "Add to Watchlist";
    btn.onclick = async () => {
      setMsg("");
      const r = await fetch(`${API}/watchlist`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ tmdbId: m.tmdbId })
      });
      const j = await safeJson(r);
      if (!j.success) return setMsg(j.error || "Gagal tambah watchlist", false);
      setMsg("Berhasil ditambahkan ke watchlist", true);
    };

    meta.appendChild(title);
    meta.appendChild(sub);
    meta.appendChild(btn);

    card.appendChild(poster);
    card.appendChild(meta);
    el.appendChild(card);
  });
}

async function loadMovies() {
  requireLogin();
  setMsg("");

  const res = await fetch(`${API}/movies`, { headers: headers() });
  const json = await safeJson(res);

  if (!json.success) return setMsg(json.error || "Gagal load movies", false);
  render(json.data || []);
}

async function searchMovies() {
  requireLogin();
  setMsg("");

  const q = document.getElementById("q").value.trim();
  if (!q) return loadMovies();

  // Jika backend ada endpoint search:
  const res = await fetch(`${API}/movies/search?q=${encodeURIComponent(q)}`, { headers: headers() });

  // Kalau endpoint search tidak ada, fallback filter client-side
  if (!res.ok) {
    const allRes = await fetch(`${API}/movies`, { headers: headers() });
    const allJson = await safeJson(allRes);
    if (!allJson.success) return setMsg(allJson.error || "Gagal search", false);

    const items = (allJson.data || []).filter(m =>
      (m.title || "").toLowerCase().includes(q.toLowerCase())
    );
    render(items);
    return;
  }

  const json = await safeJson(res);
  if (!json.success) return setMsg(json.error || "Gagal search", false);
  render(json.data || []);
}

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
});

document.getElementById("btnReload").addEventListener("click", loadMovies);
document.getElementById("btnSearch").addEventListener("click", searchMovies);

document.getElementById("btnSync").addEventListener("click", async () => {
  requireLogin();

  const btn = document.getElementById("btnSync");
  const oldText = btn.textContent;

  try {
    btn.disabled = true;
    btn.textContent = "Syncing...";
    setMsg("Sync trending... tunggu sebentar", true);

    const res = await fetch(`${API}/admin/sync/trending`, {
      method: "POST",
      headers: headers()
    });

    const json = await safeJson(res);

    if (!json.success) {
      return setMsg(json.error || "Sync gagal", false);
    }

    const count = json.data?.count ?? json.data?.inserted ?? json.data?.synced ?? 0;
    setMsg(`Sync sukses: ${count} film tersimpan/terupdate`, true);

    await loadMovies();
  } catch (e) {
    setMsg(e.message || "Sync error", false);
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
});

loadMe();
loadMovies();
