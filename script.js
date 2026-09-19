import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase.js";

const configured = !SUPABASE_URL.includes("TU-PROYECTO") && !SUPABASE_ANON_KEY.includes("TU_CLAVE");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = id => document.getElementById(id);
function configWarning(){return "Primero configura supabase.js con la URL y la clave PUBLICABLE de tu proyecto."}

async function loadPosts(){
  const box=$("posts"); if(!box) return;
  if(!supabase){box.innerHTML=`<div class="card"><p>${configWarning()}</p></div>`;return}
  const {data,error}=await supabase.from("posts").select("*").order("created_at",{ascending:false}).limit(50);
  if(error){box.innerHTML=`<p>Error cargando publicaciones: ${error.message}</p>`;return}
  const isMemes=location.pathname.endsWith("memes.html");
  const filtered=isMemes ? data.filter(p=>p.category==="meme") : data;
  box.innerHTML=filtered.length ? filtered.map(postCard).join("") : "<p>No hay publicaciones todavía.</p>";
}
function postCard(p){
  return `<article class="post"><h3>${esc(p.title)}</h3><p>${esc(p.content).replace(/\n/g,"<br>")}</p>${p.image_url?`<img src="${esc(p.image_url)}" alt="Imagen de la publicación" loading="lazy">`:""}<p class="muted">${esc(p.category)} · ${new Date(p.created_at).toLocaleString("es-ES")}</p></article>`;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function setupAuth(){
  if(!supabase) return;
  const {data:{session}}=await supabase.auth.getSession();
  const lo=$("loggedOut"), li=$("loggedIn");
  if(lo&&li){lo.hidden=!!session;li.hidden=!session}
  const status=$("userStatus"); if(status) status.textContent=session?"Sesión iniciada.":"Necesitas iniciar sesión para publicar.";
  const link=$("authLink"); if(link&&session){link.textContent="👤 Mi cuenta";link.href="perfil.html"}
  if($("profileInfo")) $("profileInfo").textContent=session?`Cuenta: ${session.user.email}`:"No has iniciado sesión.";
}

$("loginForm")?.addEventListener("submit",async e=>{
 e.preventDefault(); if(!supabase){$("authMessage").textContent=configWarning();return}
 const {error}=await supabase.auth.signInWithPassword({email:$("email").value,password:$("password").value});
 $("authMessage").textContent=error?error.message:"¡Sesión iniciada!"; if(!error)setTimeout(()=>location.href="index.html",700);
});
$("signupForm")?.addEventListener("submit",async e=>{
 e.preventDefault(); if(!supabase){$("authMessage").textContent=configWarning();return}
 const {error}=await supabase.auth.signUp({email:$("signupEmail").value,password:$("signupPassword").value});
 $("authMessage").textContent=error?error.message:"Cuenta creada. Revisa tu correo si Supabase solicita confirmación.";
});
$("logout")?.addEventListener("click",async()=>{await supabase?.auth.signOut();location.href="index.html"});
$("postForm")?.addEventListener("submit",async e=>{
 e.preventDefault(); const msg=$("message");
 if(!supabase){msg.textContent=configWarning();return}
 const {data:{user}}=await supabase.auth.getUser();
 if(!user){msg.textContent="Debes iniciar sesión primero.";return}
 const {error}=await supabase.from("posts").insert({user_id:user.id,title:$("title").value.trim(),content:$("content").value.trim(),category:$("category").value,image_url:$("imageUrl").value.trim()||null});
 if(error)msg.textContent=error.message; else {msg.textContent="¡Publicado!";e.target.reset()}
});
loadPosts(); setupAuth();
