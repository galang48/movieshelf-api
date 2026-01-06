// public/js/auth.js
const API = "/api/v1";

// Tabs
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");

// Forms
const formLogin = document.getElementById("formLogin");
const formRegister = document.getElementById("formRegister");

// Login inputs
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");

// Register inputs
const regUsername = document.getElementById("regUsername");
const regPassword = document.getElementById("regPassword");
const regPassword2 = document.getElementById("regPassword2");
const btnFillDemo = document.getElementById("btnFillDemo");

// Message
const msgEl = document.getElementById("msg");

function setMsg(text, ok = false) {
  if (!msgEl) return;
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

function showLogin() {
  tabLogin?.classList.add("active");
  tabRegister?.classList.remove("active");
  formLogin.style.display = "block";
  formRegister.style.display = "none";
  setMsg("");
  loginUsername?.focus();
}

function showRegister() {
  tabRegister?.classList.add("active");
  tabLogin?.classList.remove("active");
  formRegister.style.display = "block";
  formLogin.style.display = "none";
  setMsg("");
  regUsername?.focus();
}

// Tab events
tabLogin?.addEventListener("click", showLogin);
tabRegister?.addEventListener("click", showRegister);

// Optional: kalau sudah punya token, langsung ke movies.html
// (kalau kamu mau tetap stay di login, hapus blok ini)
const existingToken = localStorage.getItem("token");
if (existingToken) {
  // bisa aja token expired; tapi UX lebih enak langsung coba ke movies
  window.location.href = "/movies.html";
}

// LOGIN submit
formLogin?.addEventListener("submit", async (e) => {
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

    if (!json.success) {
      return setMsg(json.error || "Login gagal", false);
    }

    // Simpan JWT
    localStorage.setItem("token", json.data.token);

    setMsg("Login sukses. Redirect...", true);
    window.location.href = "/movies.html";
  } catch (err) {
    setMsg(err.message || "Error login", false);
  }
});

// REGISTER submit
formRegister?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    setMsg("");

    const username = must(regUsername.value, "Username baru");
    const password = must(regPassword.value, "Password baru");
    const password2 = must(regPassword2.value, "Ulangi password");

    if (password.length < 4) throw new Error("Password minimal 4 karakter");
    if (password !== password2) throw new Error("Password dan konfirmasi tidak sama");

    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const json = await safeJson(res);

    if (!json.success) {
      return setMsg(json.error || "Register gagal", false);
    }

    setMsg(`Register sukses. Silakan login sebagai "${username}".`, true);

    // Auto pindah ke tab login + prefill username
    loginUsername.value = username;
    loginPassword.value = "";
    showLogin();
  } catch (err) {
    setMsg(err.message || "Error register", false);
  }
});

// Isi contoh (buat demo cepat)
btnFillDemo?.addEventListener("click", () => {
  regUsername.value = "user1";
  regPassword.value = "user123";
  regPassword2.value = "user123";
  setMsg("Contoh terisi. Klik Create Account.", true);
});

// Default tampil login tab
showLogin();
