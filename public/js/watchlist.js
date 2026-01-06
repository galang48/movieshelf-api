const API = "/api/v1";
const token = localStorage.getItem("token");
if (!token) window.location.href = "/login.html";

function headers() {
  return { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
}

function setMsg(text, ok = false) {
  const el = document.getElementById("msg");
  el.textContent = text || "";
  el.className = "msg " + (ok ? "ok" : "err");
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

function render(items) {
  const el = document.getElementById("list");
  el.innerHTML = "";

  (items || []).forEach(w => {
    const m = w.Movie;

    const card = document.createElement("div");
    card.className = "movie";

    const poster = document.createElement("div");
    poster.className = "poster";
    const p = posterUrl(m?.posterPath);
    if (p) poster.style.backgroundImage = `url("${p}")`;

    const meta = document.createElement("div");
    meta.className = "meta";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = m?.title || "-";

    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = `TMDB ID: ${m?.tmdbId || "-"}`;

    const btn = document.createElement("button");
    btn.className = "danger";
    btn.textContent = "Remove";
    btn.onclick = async () => {
      if (!m?.tmdbId) return;

      setMsg("");
      const res = await fetch(`${API}/watchlist/${m.tmdbId}`, { method: "DELETE", headers: headers() });
      const json = await safeJson(res);

      if (!json.success) {
        // kalau backend belum punya endpoint delete, tampilkan pesan jelas
        return setMsg(
          "Gagal remove. Pastikan backend punya endpoint DELETE /api/v1/watchlist/:tmdbId",
          false
        );
      }

      setMsg("Berhasil dihapus dari watchlist", true);
      load();
    };

    meta.appendChild(title);
    meta.appendChild(sub);
    meta.appendChild(btn);

    card.appendChild(poster);
    card.appendChild(meta);

    el.appendChild(card);
  });
}

async function load() {
  setMsg("");
  const res = await fetch(`${API}/watchlist`, { headers: headers() });
  const json = await safeJson(res);
  if (!json.success) return setMsg(json.error || "Gagal load watchlist");
  render(json.data || []);
}

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/login.html";
});

load();
