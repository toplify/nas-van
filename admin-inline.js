
const STORAGE_KEY="zeroKmSharedState",SESSION_KEY="zeroKmTomikUnlocked",ADMIN_PASSWORD="VAN2026";
const initialState={fund:0,day:1,distance:0,priorities:[],candidates:[],lessons:[],unlocks:{van:false,build:false,home:false,road:false},revealed:{van:false,build:false,home:false,road:false},revealQueue:[],vanName:"",vanPhoto:"",vanIdentityRevealed:false,buildChoices:{},buildPhotos:{},requireBuildPhotos:false,homeAnswers:{},homePhotos:{},homeCompleted:false,trip:{day:1,location:"",journal:[],memories:[null,null,null]}};
const $=id=>document.getElementById(id),money=n=>new Intl.NumberFormat("cs-CZ").format(Number(n||0))+" Kč";
let state=load();
function load(){try{const r=JSON.parse(localStorage.getItem(STORAGE_KEY))||{};return {...structuredClone(initialState),...r,unlocks:{...initialState.unlocks,...(r.unlocks||{})},revealed:{...initialState.revealed,...(r.revealed||{})},revealQueue:Array.isArray(r.revealQueue)?r.revealQueue:[]}}catch{return structuredClone(initialState)}}
function persist(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render()}
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function login(){if($("passwordInput").value===ADMIN_PASSWORD){sessionStorage.setItem(SESSION_KEY,"1");$("loginGate").classList.add("hidden");$("adminApp").classList.remove("hidden");render()}else $("loginError").classList.remove("hidden")}
$("loginBtn")?.addEventListener("click",login);$("passwordInput")?.addEventListener("keydown",e=>{if(e.key==="Enter")login()});
$("logoutAdminBtn")?.addEventListener("click",()=>{sessionStorage.removeItem(SESSION_KEY);$("adminApp").classList.add("hidden");$("loginGate").classList.remove("hidden")});
$("previewPublicBtn")?.addEventListener("click",()=>window.open("index.html","_blank"));
if(sessionStorage.getItem(SESSION_KEY)==="1"){$("loginGate").classList.add("hidden");$("adminApp").classList.remove("hidden")}
function cand(c,i){return `<article class="candidate"><div class="candidate-thumb">🚐</div><div><h4>${esc(c.name||"Van")}</h4><p>${esc(c.year||"—")} · ${esc(c.km||"—")}</p><strong>${esc(c.price||"—")}</strong><span class="candidate-note">${esc(c.note||"čeká na prověření")}</span><div class="edit-controls"><button data-edit="${i}">Upravit</button><button data-toggle="${i}">${c.status==="active"?"Odmítnout":"Vrátit"}</button><button class="delete" data-delete="${i}">Smazat</button></div></div></article>`}
function stage(a,b,on){const e=$(a),j=$(b);e.classList.toggle("locked",!on);e.classList.toggle("unlocked",!!on);e.querySelector(".lock").textContent=on?"✓ KAPITOLA ODEMČENA":"🔒 Zamčeno";j.classList.toggle("active",!!on)}
function render(){
 $("heroDay").textContent="DEN "+(state.day||1);$("heroFund").textContent=money(state.fund);$("heroDistance").textContent=(state.distance||0)+" km";$("fundBadge").textContent=money(state.fund);$("fundNumber").textContent=money(state.fund);
 const t=[20000,50000,100000,150000],n=t.find(x=>x>state.fund),p=Math.min(100,state.fund/150000*100);$("fundTarget").textContent=n?`z cíle ${money(n)}`:"připraveno na velký krok";$("fundProgress").style.width=p+"%";$("vanMarker").style.left=`calc(${p}% - 14px)`;$("milestones").innerHTML=t.map(x=>`<div class="milestone ${state.fund>=x?"done":""}">${money(x)}</div>`).join("");
 $("priorities").innerHTML=state.priorities.length?state.priorities.map(x=>"• "+esc(x)).join("<br>"):"Zatím nevyplněno.";
 $("editFund").value=state.fund;$("editDay").value=state.day;$("editDistance").value=state.distance;$("editPriority1").value=state.priorities[0]||"";$("editPriority2").value=state.priorities[1]||"";
 const a=state.candidates.map((c,i)=>({c,i})).filter(x=>x.c.status==="active"),r=state.candidates.map((c,i)=>({c,i})).filter(x=>x.c.status==="rejected");
 $("activeCount").textContent=a.length;$("rejectedCount").textContent=r.length;$("activeCandidates").innerHTML=a.length?a.map(x=>cand(x.c,x.i)).join(""):'<div class="empty">Zatím žádný kandidát.</div>';$("rejectedCandidates").innerHTML=r.length?r.map(x=>cand(x.c,x.i)).join(""):'<div class="empty">Zatím nic.</div>';
 $("lessons").innerHTML=state.lessons.length?state.lessons.map((x,i)=>`<div class="lesson">${esc(x)}<div class="edit-controls"><button data-editlesson="${i}">Upravit</button><button class="delete" data-deletelesson="${i}">Smazat</button></div></div>`).join(""):'<div class="empty">První lekce teprve přijde.</div>';
 stage("stageVan","journeyVan",state.unlocks.van);stage("stageBuild","journeyBuild",state.unlocks.build);stage("stageHome","journeyHome",state.unlocks.home);stage("stageRoad","journeyRoad",state.unlocks.road);
 const vanTitle=$("stageVan")?.querySelector("h3"); if(vanTitle) vanTitle.textContent=state.vanName?.trim() || "Náš van";
 const journeyVanTitle=$("journeyVan")?.querySelector("b"); if(journeyVanTitle) journeyVanTitle.textContent=state.vanName?.trim() || "Náš van";
 $("adminVanName") && ($("adminVanName").value=state.vanName||"");
 if($("adminVanPhotoPreviewWrap") && $("adminVanPhotoPreview")){
   if(state.vanPhoto){
     $("adminVanPhotoPreview").src=state.vanPhoto;
     $("adminVanPhotoPreviewWrap").classList.remove("hidden");
   }else{
     $("adminVanPhotoPreviewWrap").classList.add("hidden");
   }
 }
 $("toggleVan").checked=state.unlocks.van;$("toggleBuild").checked=state.unlocks.build;$("toggleHome").checked=state.unlocks.home;$("toggleRoad").checked=state.unlocks.road;wire();
}
function wire(){
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>{state.candidates.splice(+b.dataset.delete,1);persist()});
 document.querySelectorAll("[data-toggle]").forEach(b=>b.onclick=()=>{const c=state.candidates[+b.dataset.toggle];c.status=c.status==="active"?"rejected":"active";persist()});
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const c=state.candidates[+b.dataset.edit];const name=prompt("Název",c.name);if(name===null)return;const year=prompt("Rok",c.year);if(year===null)return;const km=prompt("Kilometry",c.km);if(km===null)return;const price=prompt("Cena",c.price);if(price===null)return;const note=prompt("Poznámka",c.note);if(note===null)return;Object.assign(c,{name,year,km,price,note});persist()});
 document.querySelectorAll("[data-deletelesson]").forEach(b=>b.onclick=()=>{state.lessons.splice(+b.dataset.deletelesson,1);persist()});
 document.querySelectorAll("[data-editlesson]").forEach(b=>b.onclick=()=>{const i=+b.dataset.editlesson,x=prompt("Upravit lekci",state.lessons[i]);if(x!==null){state.lessons[i]=x;persist()}});
}
$("saveBasicInline")?.addEventListener("click",()=>{state.fund=+$("editFund").value||0;state.day=+$("editDay").value||1;state.distance=+$("editDistance").value||0;persist()});
$("savePrioritiesInline")?.addEventListener("click",()=>{state.priorities=[$("editPriority1").value.trim(),$("editPriority2").value.trim()].filter(Boolean);persist()});
$("addCandidateInline")?.addEventListener("click",()=>{state.candidates.push({name:$("newCandidateName").value.trim(),year:$("newCandidateYear").value.trim(),km:$("newCandidateKm").value.trim(),price:$("newCandidatePrice").value.trim(),note:$("newCandidateNote").value.trim(),status:$("newCandidateStatus").value});persist()});
$("addLessonInline")?.addEventListener("click",()=>{const x=$("newLesson").value.trim();if(x){state.lessons.push(x);$("newLesson").value="";persist()}});
$("saveStageInline")?.addEventListener("click",()=>{const next={van:$("toggleVan").checked,build:$("toggleBuild").checked,home:$("toggleHome").checked,road:$("toggleRoad").checked};["van","build","home","road"].forEach(k=>{if(next[k]&&!state.unlocks[k]){state.revealed[k]=false;if(!state.revealQueue.includes(k))state.revealQueue.push(k)}if(!next[k]){state.revealed[k]=false;state.revealQueue=state.revealQueue.filter(x=>x!==k)}});state.unlocks=next;persist()});

$("saveVanIdentityAdmin")?.addEventListener("click",()=>{
  const name=$("adminVanName").value.trim();
  if(name) state.vanName=name;
  persist();
});

$("adminVanPhotoFile")?.addEventListener("change",e=>{
  const file=e.target.files?.[0];
  if(!file) return;
  if(file.size > 5 * 1024 * 1024){
    alert("Fotografie je moc velká. Použij prosím obrázek do 5 MB.");
    e.target.value="";
    return;
  }
  const reader=new FileReader();
  reader.onload=()=>{
    state.vanPhoto=reader.result;
    state.vanIdentityRevealed=false;
    persist();
  };
  reader.readAsDataURL(file);
});

$("clearVanPhotoAdmin")?.addEventListener("click",()=>{
  state.vanPhoto="";
  $("adminVanPhotoFile").value="";
  persist();
});


$("fullResetBtn")?.addEventListener("click",()=>{
  const first = confirm(
    "Opravdu chceš resetovat celý projekt 0 KM?\n\n" +
    "Smaže se fond, den, kilometry, priority, kandidáti, lekce, jméno a fotografie vanu a všechny kapitoly se znovu zamknou."
  );
  if(!first) return;

  const second = confirm("Poslední kontrola: vrátit hru úplně na začátek?");
  if(!second) return;

  state = structuredClone(initialState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();

  // visual confirmation on admin page
  const btn=$("fullResetBtn");
  if(btn){
    const old=btn.textContent;
    btn.textContent="✓ Projekt resetován";
    btn.disabled=true;
    setTimeout(()=>{
      btn.textContent=old;
      btn.disabled=false;
    },1600);
  }

  window.scrollTo({top:0,behavior:"smooth"});
});




function ensureTripAdmin(){state.trip=state.trip||{day:1,location:"",journal:[],memories:[null,null,null]};state.trip.journal=state.trip.journal||[];state.trip.memories=state.trip.memories||[null,null,null];return state.trip}
const tripAdmin=ensureTripAdmin();
if($("tripDayAdmin"))$("tripDayAdmin").value=tripAdmin.day||1;if($("tripLocationAdmin"))$("tripLocationAdmin").value=tripAdmin.location||"";if($("tripKmAdmin"))$("tripKmAdmin").value=state.distance||0;
$("saveTripStatusAdmin")?.addEventListener("click",()=>{const t=ensureTripAdmin();t.day=Math.max(1,Math.min(3,Number($("tripDayAdmin").value)||1));t.location=$("tripLocationAdmin").value.trim();state.distance=Math.max(0,Number($("tripKmAdmin").value)||0);persist();render()});
$("addTripLogAdmin")?.addEventListener("click",()=>{const title=$("tripLogTitleAdmin").value.trim(),text=$("tripLogTextAdmin").value.trim();if(!title||!text){alert("Vyplň název i text zápisu.");return}ensureTripAdmin().journal.push({km:Math.max(0,Number(state.distance)||0),title,text});$("tripLogTitleAdmin").value="";$("tripLogTextAdmin").value="";persist();render()});

const notifyModal=$("notifyTinkaModal");
const notifyText=$("notifyTinkaText");
const notifyStatus=$("notifyTinkaStatus");

$("notifyTinkaBtn")?.addEventListener("click",()=>{
  notifyStatus.textContent="";
  notifyModal.classList.remove("hidden");
});

$("closeNotifyTinka")?.addEventListener("click",()=>{
  notifyModal.classList.add("hidden");
});

notifyModal?.addEventListener("click",e=>{
  if(e.target===notifyModal) notifyModal.classList.add("hidden");
});

document.querySelectorAll("[data-notify-text]").forEach(btn=>{
  btn.addEventListener("click",()=>{
    notifyText.value=btn.dataset.notifyText;
    document.querySelectorAll("[data-notify-text]").forEach(x=>x.classList.toggle("selected",x===btn));
  });
});

$("sendNotifyTinkaBtn")?.addEventListener("click",async()=>{
  const text=notifyText.value.trim();
  if(!text){
    notifyStatus.textContent="Nejdřív napiš text upozornění.";
    return;
  }

  let secret=sessionStorage.getItem("zeroKmPushAdminSecret")||"";
  if(!secret){
    secret=prompt("Jednorázově pro tuto relaci zadej PUSH_ADMIN_SECRET z Netlify:")||"";
    if(!secret){
      notifyStatus.textContent="Odeslání zrušeno.";
      return;
    }
    sessionStorage.setItem("zeroKmPushAdminSecret",secret);
  }

  const btn=$("sendNotifyTinkaBtn");
  btn.disabled=true;
  notifyStatus.textContent="Odesílám…";

  try{
    const response=await fetch("/.netlify/functions/push-send",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({text,secret})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok || !data.ok){
      if(response.status===401) sessionStorage.removeItem("zeroKmPushAdminSecret");
      throw new Error(data.error||"Odeslání selhalo.");
    }
    notifyStatus.textContent=`✓ Upozornění odesláno (${data.sent} zařízení).`;
    setTimeout(()=>notifyModal.classList.add("hidden"),1400);
  }catch(error){
    notifyStatus.textContent=error.message||"Upozornění se nepodařilo odeslat.";
  }finally{
    btn.disabled=false;
  }
});

render();
