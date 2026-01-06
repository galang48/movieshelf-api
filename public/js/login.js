// public/js/login.js
const API = "/api/v1";

const formLogin = document.getElementById("formLogin");
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const msgEl = document.getElementById("msg");

function setMsg(text, ok = false) {
  msgEl.textContent = text || "";
  msgEl.className = "msg " + (text ? (ok ? "ok" : "err") : "");
}

function must(v, name) {
  const val = (v || "").trim();
  if (!val) throw new Error(`${name} wajib diisi`);
  return val;
}

async function safeJson(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  const txt = await res.text();
  return { success: false, error: txt || `HTTP ${res.status}` };
}

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    setMsg("");

    const username = must(loginUsername.value, "Username");
    const password = must(loginPassword.value, "Password");

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const json = await safeJson(res);

    if (!json.success) return setMsg(json.error || "Login gagal", false);

    localStorage.setItem("token", json.data.token);
    setMsg("Login sukses. Redirect...", true);
    window.location.href = "/movies.html";
  } catch (err) {
    setMsg(err.message || "Error login", false);
  }
});
