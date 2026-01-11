const API = "/api/v1";

function getToken() {
  return localStorage.getItem("token");
}
function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}
function requireLogin() {
  if (!getToken()) window.location.href = "/login.html";
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
function setMsg(text, ok = false) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = text || "";
  el.className = "msg " + (text ? (ok ? "ok" : "err") : "");
}

// refresh token support
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

async function loadMe() {
  const res = await fetchWithAuth(`${API}/auth/me`);
  const json = await safeJson(res);
  if (!json.success) return;

  const me = document.getElementById("me");
  if (me) me.textContent = `(${json.data.username} - ${json.data.role})`;

  // Display User API Key
  const userApiKeyBox = document.getElementById("userApiKeyBox");
  if (userApiKeyBox) {
    if (json.data.apiKey) {
      userApiKeyBox.textContent = json.data.apiKey;
    } else {
      userApiKeyBox.textContent = "API Key belum digenerate. Silakan relogin.";
    }
  }
}

async function loadStatus() {
  const res = await fetchWithAuth(`${API}/user/api-key`);
  const json = await safeJson(res);

  const status = document.getElementById("status");
  if (!json.success) {
    status.textContent = "Gagal ambil status API key.";
    return;
  }

  if (json.data.hasApiKey) {
    status.textContent = `API key tersimpan: ${json.data.masked}`;
  } else {
    status.textContent = "API key belum diset (akan pakai key dari .env).";
  }
}

document.getElementById("btnSave").onclick = async () => {
  requireLogin();
  setMsg("");

  const tmdbApiKey = document.getElementById("tmdbApiKey").value.trim();

  const res = await fetchWithAuth(`${API}/user/api-key`, {
    method: "PUT",
    body: JSON.stringify({ tmdbApiKey }),
  });
  const json = await safeJson(res);

  if (!json.success) return setMsg(json.error || "Gagal menyimpan", false);

  setMsg("✅ Tersimpan", true);
  document.getElementById("tmdbApiKey").value = "";
  loadStatus();
};

document.getElementById("btnClear").onclick = async () => {
  requireLogin();
  setMsg("");

  const res = await fetchWithAuth(`${API}/user/api-key`, {
    method: "PUT",
    body: JSON.stringify({ tmdbApiKey: "" }),
  });
  const json = await safeJson(res);

  if (!json.success) return setMsg(json.error || "Gagal clear", false);

  setMsg("✅ Dihapus", true);
  document.getElementById("tmdbApiKey").value = "";
  loadStatus();
};

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
    } catch { }
  }

  window.location.href = "/login.html";
};

// init
requireLogin();
loadMe();
loadStatus();
