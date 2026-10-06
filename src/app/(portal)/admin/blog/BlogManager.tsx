"use client";
import { useEffect, useRef, useState } from "react";
import type { BlogPost, BlogCategory } from "@/types/blog";

const blank: BlogPost = { slug:"",title:"",description:"",content:"<h2>Tussenkop</h2>\n<p>Schrijf hier de tekst.</p>",category:"Schoonmaak",image:"",author:"More Clean",date:new Date().toISOString().slice(0,10),readTime:4,published:false,keywords:[],faq:[],related:[] };
const input="w-full rounded-xl border border-[#101536]/10 bg-[#F8F9FB] px-3 py-2.5 text-sm outline-none focus:border-[#4D7EBA]";
export default function BlogManager(){
 const savingRef=useRef(false),deletingRef=useRef(false);
 const [posts,setPosts]=useState<BlogPost[]>([]),[post,setPost]=useState<BlogPost>({...blank}),[msg,setMsg]=useState("");
 const load=()=>fetch("/api/admin/blog").then(r=>r.json()).then(setPosts);
 useEffect(()=>{load()},[]);
 const set=<K extends keyof BlogPost>(k:K,v:BlogPost[K])=>setPost(p=>({...p,[k]:v}));
 async function save(){
  if(savingRef.current)return;
  savingRef.current=true;
  setMsg("");
  try {
   const r=await fetch("/api/admin/blog",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(post)});
   const d=await r.json().catch(()=>({}));
   if(!r.ok){setMsg(d.error??"Opslaan mislukt. Probeer opnieuw.");return}
   setMsg("Opgeslagen");
   load();
  } catch {setMsg("Opslaan mislukt. Controleer uw verbinding en probeer opnieuw.")}
  finally {savingRef.current=false}
 }
 async function upload(file:File){const f=new FormData();f.set("file",file);const r=await fetch("/api/admin/blog/image",{method:"POST",body:f});const d=await r.json();if(r.ok)set("image",d.url);else setMsg(d.error)}
 async function remove(){
  if(deletingRef.current)return;
  if(!confirm("Artikel verwijderen?"))return;
  deletingRef.current=true;
  setMsg("");
  try {
   const response=await fetch(`/api/admin/blog?slug=${encodeURIComponent(post.slug)}`,{method:"DELETE"});
   if(!response.ok){const result=await response.json().catch(()=>({}));setMsg(result.error??"Verwijderen mislukt.");return}
   setPost({...blank});
   load();
  } catch {setMsg("Verwijderen mislukt. Probeer opnieuw.")}
  finally {deletingRef.current=false}
 }
 return <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
  <aside className="rounded-2xl bg-white p-4 shadow-sm"><button onClick={()=>setPost({...blank})} className="mb-4 w-full rounded-xl bg-[#101536] px-4 py-3 text-sm font-semibold text-white">Nieuw artikel</button><div className="space-y-2">{posts.map(p=><button key={p.slug} onClick={()=>setPost({...p})} className="w-full rounded-xl border p-3 text-left"><span className="block font-semibold text-[#101536]">{p.title}</span><span className="text-xs text-[#606774]">{p.published===false?"Concept":"Gepubliceerd"}</span></button>)}</div></aside>
  <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6"><h1 className="text-2xl font-bold">Blogbeheer</h1><p className="mb-6 mt-1 text-sm text-[#606774]">Alle velden en de foto zijn per artikel aanpasbaar.</p>
   <div className="grid gap-4 sm:grid-cols-2"><Field label="Titel"><input className={input} value={post.title} onChange={e=>{set("title",e.target.value);if(!post.slug)set("slug",e.target.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""))}}/></Field><Field label="URL-slug"><input className={input} value={post.slug} onChange={e=>set("slug",e.target.value)}/></Field></div>
   <Field label="Samenvatting"><textarea className={input} rows={3} value={post.description} onChange={e=>set("description",e.target.value)}/></Field>
   <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Categorie"><select className={input} value={post.category} onChange={e=>set("category",e.target.value as BlogCategory)}>{["Glasbewassing","Zonnepanelen","Schoonmaak","Bedrijven"].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Auteur"><input className={input} value={post.author} onChange={e=>set("author",e.target.value)}/></Field><Field label="Datum"><input className={input} type="date" value={post.date} onChange={e=>set("date",e.target.value)}/></Field><Field label="Leestijd"><input className={input} type="number" min="1" value={post.readTime} onChange={e=>set("readTime",Number(e.target.value))}/></Field></div>
   <Field label="Artikeltekst (HTML: gebruik <h2> en <p>)"><textarea className={`${input} font-mono`} rows={16} value={post.content} onChange={e=>set("content",e.target.value)}/></Field>
   <Field label="Artikelafbeelding"><input className={input} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>e.target.files?.[0]&&upload(e.target.files[0])}/><input className={`${input} mt-2`} value={post.image} onChange={e=>set("image",e.target.value)} placeholder="Afbeeldings-URL"/></Field>
   <div className="grid gap-4 sm:grid-cols-2"><Field label="SEO-titel"><input className={input} value={post.seoTitle??""} onChange={e=>set("seoTitle",e.target.value)}/></Field><Field label="SEO-beschrijving"><input className={input} value={post.seoDescription??""} onChange={e=>set("seoDescription",e.target.value)}/></Field></div>
   <Field label="Zoekwoorden (komma’s)"><input className={input} value={(post.keywords??[]).join(", ")} onChange={e=>set("keywords",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))}/></Field>
   <Field label="Gerelateerde artikelen (URL-slugs, komma’s)"><input className={input} value={(post.related??[]).join(", ")} onChange={e=>set("related",e.target.value.split(",").map(x=>x.trim()).filter(Boolean))}/></Field>
   <Field label="Veelgestelde vragen (één per regel: vraag | antwoord)"><textarea className={input} rows={5} value={(post.faq??[]).map(x=>`${x.question} | ${x.answer}`).join("\n")} onChange={e=>set("faq",e.target.value.split("\n").map(line=>{const [question,...answer]=line.split("|");return {question:question.trim(),answer:answer.join("|").trim()}}).filter(x=>x.question&&x.answer))}/></Field>
   <div className="flex flex-wrap items-center gap-4"><label><input type="checkbox" checked={post.published!==false} onChange={e=>set("published",e.target.checked)}/> Publiceren</label><label><input type="checkbox" checked={!!post.featured} onChange={e=>set("featured",e.target.checked)}/> Uitgelicht</label><button onClick={save} className="rounded-xl bg-[#4D7EBA] px-5 py-2.5 font-semibold text-white">Opslaan</button>{post.slug&&<button onClick={remove} className="text-red-600">Verwijderen</button>}<span className="text-sm">{msg}</span></div>
  </section></div>
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="mb-4 block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#606774]">{label}</span>{children}</label>}
