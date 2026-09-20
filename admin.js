import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase.js";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

const ADMIN_EMAIL = "uxip78@gmail.com";

async function iniciarAdmin() {

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) return;

  if (
    session.user.email?.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {
    return;
  }

  console.log("🛡️ Admin activado");

  añadirBotones();
}


// ==========================================
// BOTONES
// ==========================================

async function añadirBotones() {

  const postsBox =
    document.getElementById("posts");

  if (!postsBox) return;

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
    console.error(error);
    return;
  }

  const articles =
    postsBox.querySelectorAll("article.post");

  articles.forEach((article, index) => {

    if (
      article.querySelector(".admin-delete")
    ) {
      return;
    }

    const post = posts[index];

    if (!post) return;

    const button =
      document.createElement("button");

    button.className = "admin-delete";

    button.textContent = "🗑️ Borrar";

    button.addEventListener(
      "click",
      () => borrarPost(post.id, article)
    );

    article.appendChild(button);
  });
}


// ==========================================
// BORRAR
// ==========================================

async function borrarPost(
  postId,
  article
) {

  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) return;

  if (
    session.user.email?.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {
    alert("No tienes permisos.");
    return;
  }

  if (
    !confirm(
      "¿Seguro que quieres borrar esta publicación?"
    )
  ) {
    return;
  }

  const { error } =
    await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

  if (error) {

    alert(
      "Error al borrar: " +
      error.message
    );

    console.error(error);

    return;
  }

  article.remove();
}


// ==========================================
// ESPERAR A QUE SCRIPT.JS CARGUE LOS POSTS
// ==========================================

const observer =
  new MutationObserver(() => {
    iniciarAdmin();
  });

const postsBox =
  document.getElementById("posts");

if (postsBox) {

  observer.observe(postsBox, {
    childList: true,
    subtree: true
  });
}

iniciarAdmin();
