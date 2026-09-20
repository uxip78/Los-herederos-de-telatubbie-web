import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const ADMIN_EMAIL = "uxip78@gmail.com";

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


// ==========================================
// COMPROBAR SI ES ADMIN
// ==========================================

async function checkAdmin() {

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return;
  }

  const email =
    session.user.email?.toLowerCase();

  if (email !== ADMIN_EMAIL.toLowerCase()) {
    return;
  }

  console.log("🛡️ Administrador conectado");

  addAdminButtons();
}


// ==========================================
// AÑADIR BOTONES DE BORRAR
// ==========================================

async function addAdminButtons() {

  const box = $("posts");

  if (!box) {
    return;
  }

  const {
    data: posts,
    error
  } = await supabase
    .from("posts")
    .select("id")
    .order("created_at", {
      ascending: false
    })
    .limit(50);

  if (error) {
    console.error(
      "Error obteniendo publicaciones:",
      error
    );
    return;
  }

  const articles =
    box.querySelectorAll("article.post");

  articles.forEach((article, index) => {

    if (article.querySelector(".admin-delete")) {
      return;
    }

    const post = posts[index];

    if (!post) {
      return;
    }

    const button =
      document.createElement("button");

    button.className = "admin-delete";

    button.textContent =
      "🗑️ Borrar";

    button.style.marginTop = "10px";
    button.style.cursor = "pointer";

    button.addEventListener(
      "click",
      () => deletePost(post.id, article)
    );

    article.appendChild(button);
  });
}


// ==========================================
// BORRAR PUBLICACIÓN
// ==========================================

async function deletePost(
  postId,
  article
) {

  // Volver a comprobar la cuenta
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    alert("Debes iniciar sesión.");
    return;
  }

  if (
    session.user.email?.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {
    alert("No tienes permisos.");
    return;
  }

  const confirmed =
    confirm(
      "¿Seguro que quieres borrar esta publicación?"
    );

  if (!confirmed) {
    return;
  }

  const {
    error
  } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId);

  if (error) {

    console.error(
      "Error borrando publicación:",
      error
    );

    alert(
      "No se pudo borrar:\n" +
      error.message
    );

    return;
  }

  // Eliminarla visualmente
  if (article) {
    article.remove();
  }

  console.log(
    "🗑️ Publicación eliminada:",
    postId
  );
}


// ==========================================
// ESPERAR A QUE SCRIPT.JS CARGUE LOS POSTS
// ==========================================

function startAdmin() {

  checkAdmin();

  const observer =
    new MutationObserver(() => {
      checkAdmin();
    });

  const box = $("posts");

  if (box) {
    observer.observe(box, {
      childList: true,
      subtree: true
    });
  }
}


// ==========================================
// INICIO
// ==========================================

startAdmin();
