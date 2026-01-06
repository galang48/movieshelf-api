// public/js/register.js
const API = "/api/v1";

const formRegister = document.getElementById("formRegister");
const regUsername = document.getElementById("regUsername");
const regPassword = document.getElementById("regPassword");
const regPassword2 = document.getElementById("regPassword2");
const btnFillDemo = document.getElementById("btnFillDemo");
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

btnFillDemo.addEventListener("click", () => {
  regUsername.value = "user1";
  regPassword.value = "user123";
  regPassword2.value = "user123";
  setMsg("Contoh terisi. Klik Create Account.", true);
});

formRegister.addEventListener("submit", async (e) => {
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
    if (!json.success) return setMsg(json.error || "Register gagal", false);

    setMsg(`Register sukses untuk "${username}". Redirect ke login...`, true);

    // Balik ke login setelah 700ms biar pesan kebaca
    setTimeout(() => {
      window.location.href = "/";
    }, 700);
  } catch (err) {
    setMsg(err.message || "Error register", false);
  }
});
