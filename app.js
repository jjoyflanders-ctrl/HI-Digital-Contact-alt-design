/* HI | Connect - SVG template build (CSV-driven) */

const SHOPIFY_BASE_URL = "https://highlightindustries.net/pages/connect-v2";
const DEFAULT_BUILDING = "assets/building.jpg";

const els = {
  // desktop
  deskPhoto: document.getElementById("deskPhoto"),
  deskName: document.getElementById("deskName"),
  deskTitle: document.getElementById("deskTitle"),
  deskPhone: document.getElementById("deskPhone"),
  deskEmail: document.getElementById("deskEmail"),
  deskWeb: document.getElementById("deskWeb"),
  deskSearchBtn: document.getElementById("deskSearchBtn"),
  deskVcardBtn: document.getElementById("deskVcardBtn"),
  deskShareBtn: document.getElementById("deskShareBtn"),

  // mobile
  mobiQR: document.getElementById("mobiQR"),
  mobiName: document.getElementById("mobiName"),
  mobiTitle: document.getElementById("mobiTitle"),
  mobiCall: document.getElementById("mobiCall"),
  mobiEmail: document.getElementById("mobiEmail"),
  mobiWeb: document.getElementById("mobiWeb"),
  mobiShareBtn: document.getElementById("mobiShareBtn"),
  mobiSearchBtn: document.getElementById("mobiSearchBtn"),
  mobiVcardBtn: document.getElementById("mobiVcardBtn"),

  // modals
  backdrop: document.getElementById("modalBackdrop"),
  searchModal: document.getElementById("searchModal"),
  closeSearch: document.getElementById("closeSearch"),
  searchInput: document.getElementById("searchInput"),
  searchResults: document.getElementById("searchResults"),

  qrModal: document.getElementById("qrModal"),
  closeQR: document.getElementById("closeQR"),
  deskQR: document.getElementById("deskQR"),
  shareUrlText: document.getElementById("shareUrlText"),
  copyLinkBtn: document.getElementById("copyLinkBtn"),
  nativeShareBtn: document.getElementById("nativeShareBtn"),

  toast: document.getElementById("toast"),
};

let EMPLOYEES = [];
let current = null;

function toast(msg){
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>els.toast.classList.remove("show"), 1600);
}

function getSlugFromUrl(){
  const u = new URL(window.location.href);
  return (u.searchParams.get("u") || "").trim();
}
function setSlugInUrl(slug){
  const u = new URL(window.location.href);
  u.searchParams.set("u", slug);
  window.history.replaceState({}, "", u.toString());
}
function shareUrlFor(slug){
  return `${SHOPIFY_BASE_URL}?u=${encodeURIComponent(slug)}`;
}
function qrSrcFor(url, size=260){
  const t = encodeURIComponent(url);
  return `https://quickchart.io/qr?text=${t}&size=${size}&margin=1`;
}
function telHref(phone){
  const digits = (phone || "").replace(/[^\d+]/g,"");
  return digits ? `tel:${digits}` : "#";
}
function ensureImg(imgEl, src, fallback){
  imgEl.onerror = () => { imgEl.onerror = null; imgEl.src = fallback; };
  imgEl.src = src || fallback;
}

/* vCard */
function escapeV(s){
  return String(s)
    .replace(/\/g, "\\")
    .replace(/\n/g, "\n")
    .replace(/;/g, "\;")
    .replace(/,/g, "\,");
}
function buildVCard(emp){
  const fn = `${emp.first_name} ${emp.last_name}`.trim();
  const org = "Highlight Industries";
  const title = emp.title || "";
  const phone = (emp.phone || "").replace(/[^\d+]/g,"");
  const ext = (emp.ext || "").trim();
  const email = emp.email || "";
  const url = emp.website || "https://www.highlightindustries.com";

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeV(fn)}`,
    `N:${escapeV(emp.last_name||"")};${escapeV(emp.first_name||"")};;;`,
    `ORG:${escapeV(org)}`,
    title ? `TITLE:${escapeV(title)}` : null,
    phone ? `TEL;TYPE=WORK,VOICE:${phone}${ext ? "x"+ext : ""}` : null,
    email ? `EMAIL;TYPE=INTERNET,WORK:${escapeV(email)}` : null,
    url ? `URL:${escapeV(url)}` : null,
    "END:VCARD"
  ].filter(Boolean);

  return lines.join("\r\n");
}
function downloadText(filename, text, mime="text/plain"){
  const blob = new Blob([text], {type: mime});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1500);
}

/* modals */
function openModal(dlg){
  if (!dlg?.showModal) return;
  els.backdrop.hidden = false;
  dlg.showModal();
}
function closeModal(dlg){
  if (!dlg?.open) return;
  dlg.close();
  els.backdrop.hidden = true;
}

/* CSV */
async function loadEmployees(){
  const res = await fetch("./employees.csv", {cache:"no-store"});
  if (!res.ok) throw new Error("Could not load employees.csv");
  const text = await res.text();
  return parseCSV(text);
}
function parseCSV(text){
  const rows = [];
  let i=0, field="", row=[], inQ=false;
  const pushField = ()=>{ row.push(field); field=""; };
  const pushRow = ()=>{ if(!(row.length===1 && row[0].trim()==="")) rows.push(row); row=[]; };

  while(i<text.length){
    const c=text[i];
    if(inQ){
      if(c === '"'){
        if(text[i+1] === '"'){ field+='"'; i+=2; continue; }
        inQ=false; i++; continue;
      }
      field+=c; i++; continue;
    }else{
      if(c === '"'){ inQ=true; i++; continue; }
      if(c === ','){ pushField(); i++; continue; }
      if(c === '\r'){ if(text[i+1] === '\n'){ pushField(); pushRow(); i+=2; continue; } pushField(); pushRow(); i++; continue; }
      if(c === '\n'){ pushField(); pushRow(); i++; continue; }
      field+=c; i++; continue;
    }
  }
  pushField(); pushRow();
  if(!rows.length) return [];
  const header=rows.shift().map(h=>h.trim());
  return rows.map(r=>{
    const obj={};
    header.forEach((h,idx)=> obj[h]=(r[idx]??"").trim());
    return obj;
  }).filter(e=>e.slug);
}

/* render */
function render(emp){
  current = emp;

  const fullName = `${emp.first_name} ${emp.last_name}`.trim();
  const title = emp.title || "";
  const phoneDisplay = emp.phone ? `${emp.phone}${emp.ext ? " x " + emp.ext : ""}` : "—";
  const email = emp.email || "—";
  const website = emp.website || "https://www.highlightindustries.com";
  const photo = emp.photo || DEFAULT_BUILDING;

  ensureImg(els.deskPhoto, photo, DEFAULT_BUILDING);

  els.deskName.textContent = fullName || "—";
  els.deskTitle.textContent = title;

  els.deskPhone.textContent = phoneDisplay;
  els.deskPhone.href = telHref(emp.phone);

  els.deskEmail.textContent = email;
  els.deskEmail.href = emp.email ? `mailto:${emp.email}` : "#";

  els.deskWeb.textContent = website.replace(/^https?:\/\//,"");
  els.deskWeb.href = website;

  // Share/QR always uses Shopify URL
  const sUrl = shareUrlFor(emp.slug);

  // mobile QR
  els.mobiQR.src = qrSrcFor(sUrl, 260);
  els.mobiName.textContent = fullName || "—";
  els.mobiTitle.textContent = title;

  els.mobiCall.href = telHref(emp.phone);
  els.mobiEmail.href = emp.email ? `mailto:${emp.email}` : "#";
  els.mobiWeb.href = website;

  // desktop QR modal
  els.deskQR.src = qrSrcFor(sUrl, 360);
  els.shareUrlText.textContent = sUrl;

  setSlugInUrl(emp.slug);
}

/* search */
function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, m => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}
function updateResults(q){
  const query=(q||"").toLowerCase().trim();
  const hits=!query?EMPLOYEES:EMPLOYEES.filter(e=>{
    const s=`${e.first_name} ${e.last_name} ${e.slug} ${e.title}`.toLowerCase();
    return s.includes(query);
  });

  els.searchResults.innerHTML="";
  hits.slice(0,50).forEach(e=>{
    const btn=document.createElement("button");
    btn.type="button";
    btn.className="resultBtn";
    btn.innerHTML = `
      <div class="resultName">${escapeHTML(`${e.first_name} ${e.last_name}`.trim())}</div>
      <div class="resultTitle">${escapeHTML(e.title||"")}</div>
    `;
    btn.addEventListener("click", ()=>{ render(e); closeModal(els.searchModal); toast("Loaded employee"); });
    els.searchResults.appendChild(btn);
  });

  if(!hits.length){
    const div=document.createElement("div");
    div.style.opacity=".7";
    div.textContent="No matches.";
    els.searchResults.appendChild(div);
  }
}
function openSearch(){
  els.searchInput.value="";
  updateResults("");
  openModal(els.searchModal);
  setTimeout(()=>els.searchInput.focus(), 50);
}

/* sharing */
async function nativeShare(emp){
  const url=shareUrlFor(emp.slug);
  const fullName=`${emp.first_name} ${emp.last_name}`.trim();
  if(navigator.share){
    try{
      await navigator.share({
        title:`HI | Connect - ${fullName}`,
        text:`Contact: ${fullName}`,
        url
      });
      return true;
    }catch(_e){ return false; }
  }
  return false;
}

function wire(){
  // open search
  els.deskSearchBtn.addEventListener("click", openSearch);
  els.mobiSearchBtn.addEventListener("click", openSearch);

  // modal close
  els.closeSearch.addEventListener("click", ()=>closeModal(els.searchModal));
  els.closeQR.addEventListener("click", ()=>closeModal(els.qrModal));
  els.backdrop.addEventListener("click", ()=>{
    closeModal(els.searchModal);
    closeModal(els.qrModal);
  });
  els.searchInput.addEventListener("input", (e)=>updateResults(e.target.value));

  // vCard download ONLY on Save to Contacts
  const vcardHandler=()=>{
    if(!current) return;
    const vcf=buildVCard(current);
    const fn=`${current.first_name||"contact"}-${current.last_name||""}`.toLowerCase().replace(/\s+/g,"-");
    downloadText(`${fn}.vcf`, vcf, "text/vcard");
    toast("vCard downloaded");
  };
  els.deskVcardBtn.addEventListener("click", vcardHandler);
  els.mobiVcardBtn.addEventListener("click", vcardHandler);

  // Desktop: open QR modal
  els.deskShareBtn.addEventListener("click", ()=>{
    if(!current) return;
    openModal(els.qrModal);
  });

  // Mobile share: native share sheet (AirDrop/Text/Email/Notes/etc.)
  els.mobiShareBtn.addEventListener("click", async ()=>{
    if(!current) return;
    const ok = await nativeShare(current);
    if(!ok){
      try{
        await navigator.clipboard.writeText(shareUrlFor(current.slug));
        toast("Link copied");
      }catch(_e){
        toast("Copy failed");
      }
    }
  });

  // QR modal buttons
  els.copyLinkBtn.addEventListener("click", async ()=>{
    if(!current) return;
    try{ await navigator.clipboard.writeText(shareUrlFor(current.slug)); toast("Copied!"); }
    catch(_e){ toast("Copy failed"); }
  });
  els.nativeShareBtn.addEventListener("click", async ()=>{
    if(!current) return;
    const ok = await nativeShare(current);
    if(!ok) toast("Sharing not supported here");
  });

  // ensure backdrop hides on ESC close
  [els.searchModal, els.qrModal].forEach(dlg=>{
    dlg.addEventListener("close", ()=>{ els.backdrop.hidden = true; });
  });
}

(async function init(){
  wire();
  try{
    EMPLOYEES = await loadEmployees();
    if(!EMPLOYEES.length) throw new Error("No employees");
    const slug = getSlugFromUrl();
    const hit = slug ? EMPLOYEES.find(e=>e.slug===slug) : null;
    render(hit || EMPLOYEES[0]);
  }catch(e){
    console.error(e);
    toast("Couldn’t load employees.csv");
  }
})();
