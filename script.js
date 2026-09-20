import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase.js";

window.addEventListener("error", (e) => {
  alert("ERROR JS: " + e.message);
});

window.addEventListener("unhandledrejection", (e) => {
  alert("ERROR PROMESA: " + e.reason);
});

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const $ = (id) => document.getElementById(id);

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

/* =========================
   PUBLICACIONES
========================= */

async function loadPosts() {
  const box = $("posts");
  if (!box) return;

  box.innerHTML = "<p>Cargando publicaciones...</p>";

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    box.innerHTML =
      `<p>Error cargando publicaciones: ${esc(error.message)}</p>`;
    return;
  }

  const isMemes = location.pathname.endsWith("memes.html");

  const filtered = isMemes
    ? data.filter((p) => p.category === "meme")
    : data;

  if (!filtered.length) {
    box.innerHTML = "<p>No hay publicaciones todavía.</p>";
    return;
  }

  box.innerHTML = filtered.map(postCard).join("");
}

function postCard(p) {
  return `
    <article class="post">
      <h3>${esc(p.title)}</h3>

      <p>${esc(p.content).replace(/\n/g, "<br>")}</p>

      ${
        p.image_url
          ? `<img src="${esc(p.image_url)}"
                  alt="Imagen de la publicación"
                  loading="lazy">`
          : ""
      }

      <p class="muted">
        ${esc(p.category)} ·
        ${new Date(p.created_at).toLocaleString("es-ES")}
      </p>
    </article>
  `;
}

/* =========================
   AUTENTICACIÓN
========================= */

async function setupAuth() {
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
      ? `Sesión iniciada como ${session.user.email}`
      : "Necesitas iniciar sesión para publicar.";
  }

  const authLink = $("authLink");

  if (authLink && session) {
    authLink.textContent = "👤 Mi cuenta";
    authLink.href = "login.html";
  }

  const profileInfo = $("profileInfo");

  if (profileInfo) {
    profileInfo.textContent = session
      ? `Cuenta: ${session.user.email}`
      : "No has iniciado sesión.";
  }
}

/* =========================
   LOGIN
========================= */

$("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = $("authMessage");
  const email = $("email")?.value.trim();
  const password = $("password")?.value;

  if (message) message.textContent = "Iniciando sesión...";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    if (message) {
      message.textContent = "Error: " + error.message;
    }
    return;
  }

  if (message) {
    message.textContent = "¡Sesión iniciada correctamente!";
  }

  await setupAuth();
});

/* =========================
   REGISTRO
========================= */

$("signupForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = $("authMessage");
  const email = $("signupEmail")?.value.trim();
  const password = $("signupPassword")?.value;

  if (message) message.textContent = "Creando cuenta...";

  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    if (message) {
      message.textContent = "Error: " + error.message;
    }
    return;
  }

  if (data.session) {
    if (message) {
      message.textContent = "¡Cuenta creada correctamente!";
    }
  } else {
    if (message) {
      message.textContent =
        "Cuenta creada. Revisa tu correo para confirmar la cuenta.";
    }
  }

  await setupAuth();
});

/* =========================
   CERRAR SESIÓN
========================= */

$("logout")?.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();

  const message = $("authMessage");

  if (error) {
    if (message) {
      message.textContent = "Error: " + error.message;
    }
    return;
  }

  if (message) {
    message.textContent = "Sesión cerrada.";
  }

  await setupAuth();
});

/* =========================
   PUBLICAR
========================= */

$("postForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = $("message");

  if (message) {
    message.textContent = "Publicando...";
  }

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    if (message) {
      message.textContent =
        "Debes iniciar sesión antes de publicar.";
    }
    return;
  }

  const title = $("title")?.value.trim();
  const category = $("category")?.value;
  const content = $("content")?.value.trim();
  const imageUrl = $("imageUrl")?.value.trim();

  if (!title || !content) {
    if (message) {
      message.textContent =
        "Completa el título y el contenido.";
    }
    return;
  }

  const { error } = await supabase
    .from("posts")
    .insert({
      title: title,
      category: category,
      content: content,
      image_url: imageUrl || null,
      user_id: session.user.id
    });

  if (error) {
    if (message) {
      message.textContent =
        "Error al publicar: " + error.message;
    }
    return;
  }

  if (message) {
    message.textContent =
      "¡Publicación creada correctamente!";
  }

  $("postForm").reset();

  setTimeout(() => {
    window.location.href = "index.html";
  }, 800);
});

/* =========================
   CAMBIOS DE SESIÓN
========================= */

supabase.auth.onAuthStateChange(() => {
  setupAuth();
});

/* =========================
   INICIO
========================= */

setupAuth();
loadPosts();
