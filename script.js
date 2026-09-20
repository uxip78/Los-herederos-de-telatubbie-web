import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase.js";

const configured =
  !SUPABASE_URL.includes("TU-PROYECTO") &&
  !SUPABASE_ANON_KEY.includes("TU_CLAVE");

const supabase = configured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = (id) => document.getElementById(id);

function configWarning() {
  return "Primero configura supabase.js con la URL y la clave pública de tu proyecto.";
}

async function loadPosts() {
  const box = $("posts");
  if (!box) return;

  if (!supabase) {
    box.innerHTML = `<div class="card"><p>${configWarning()}</p></div>`;
    return;
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    box.innerHTML = `<p>Error cargando publicaciones: ${esc(error.message)}</p>`;
    return;
  }

  const isMemes = location.pathname.endsWith("memes.html");
  const filtered = isMemes
    ? data.filter((p) => p.category === "meme")
    : data;

  box.innerHTML = filtered.length
    ? filtered.map(postCard).join("")
    : "<p>No hay publicaciones todavía.</p>";
}

function postCard(p) {
  return `
    <article class="post">
      <h3>${esc(p.title)}</h3>
      <p>${esc(p.content).replace(/\n/g, "<br>")}</p>
      ${
        p.image_url
          ? `<img src="${esc(p.image_url)}" alt="Imagen de la publicación" loading="lazy">`
          : ""
      }
      <p class="muted">
        ${esc(p.category)} · ${new Date(p.created_at).toLocaleString("es-ES")}
      </p>
    </article>
  `;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

async function setupAuth() {
  if (!supabase) return;

  const {
    data: { session }
  } = await supabase.auth.getSession();

  const loggedOut = $("loggedOut");
  const loggedIn = $("loggedIn");

  if (loggedOut && loggedIn) {
    loggedOut.hidden = !!session;
    loggedIn.hidden = !session;
  }

  const status = $("userStatus");

  if (status) {
    status.textContent = session
      ? "Sesión iniciada."
      : "Necesitas iniciar sesión para publicar.";
  }

  const authLink = $("authLink");

  if (authLink && session) {
    authLink.textContent = "👤 Mi cuenta";
    authLink.href = "perfil.html";
  }

  const profileInfo = $("profileInfo");

  if (profileInfo) {
    profileInfo.textContent = session
      ? `Cuenta: ${session.user.email}`
      : "No has iniciado sesión.";
  }
}

$("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!supabase) {
    $("authMessage").textContent = configWarning();
    return;
  }

  const { error } = await
