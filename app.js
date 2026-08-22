
const STORAGE_KEY="zeroKmSharedState";
const VAN_IDENTITY_BACKUP_KEY="zeroKmVanIdentity";
const initialState={fund:0,day:1,distance:0,priorities:[],candidates:[],lessons:[],
unlocks:{van:false,build:false,home:false,road:false},revealed:{van:false,build:false,home:false,road:false},revealQueue:[],vanName:"",vanPhoto:"",vanIdentityRevealed:false,buildChoices:{},buildPhotos:{},requireBuildPhotos:false,homeAnswers:{},homePhotos:{},homeCompleted:false,trip:{day:1,location:"",journal:[],memories:[null,null,null]}};
const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat("cs-CZ").format(Number(n||0))+" Kč";
let state=load(),pendingReveal=null,pendingSealedLetter=null;
function load(){
  let r={};
  try{ r=JSON.parse(localStorage.getItem(STORAGE_KEY))||{}; }catch{}
  let out={
    ...structuredClone(initialState),
    ...r,
    unlocks:{...initialState.unlocks,...(r.unlocks||{})},
    revealed:{...initialState.revealed,...(r.revealed||{})},
    revealQueue:Array.isArray(r.revealQueue)?r.revealQueue:[],
    buildChoices:{...(r.buildChoices||{})},
    buildPhotos:{...(r.buildPhotos||{})},
    homeAnswers:{...(r.homeAnswers||{})},
    homePhotos:{...(r.homePhotos||{})}
  };

  // Identity backup: prevents the van from ever asking for a name again
  // just because a later large image write failed.
  try{
    const identity=JSON.parse(localStorage.getItem(VAN_IDENTITY_BACKUP_KEY)||"{}");
    if(!out.vanName && identity.vanName) out.vanName=identity.vanName;
    if(!out.vanPhoto && identity.vanPhoto) out.vanPhoto=identity.vanPhoto;
    if(identity.vanIdentityRevealed===true) out.vanIdentityRevealed=true;
  }catch{}
  return out;
}
function backupVanIdentity(){
  try{
    localStorage.setItem(VAN_IDENTITY_BACKUP_KEY,JSON.stringify({
      vanName:state.vanName||"",
      vanPhoto:state.vanPhoto||"",
      vanIdentityRevealed:!!state.vanIdentityRevealed
    }));
  }catch{}
}
function save(){
  backupVanIdentity();
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    return true;
  }catch(err){
    console.error("VanLife Tínky a Tomíka save failed",err);
    alert("Tuhle změnu se nepodařilo uložit. Zkus menší obrázek.");
    return false;
  }
}
function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function candidate(c){return `<article class="candidate"><div class="candidate-thumb">${c.photo?`<img src="${c.photo}" alt="${esc(c.name||"Van")}">`:"🚐"}</div><div><h4>${esc(c.name||"Van")}</h4><p>${esc(c.year||"—")} · ${esc(c.km||"—")}</p><strong>${esc(c.price||"—")}</strong><span class="candidate-note">${esc(c.note||"čeká na prověření")}</span></div></article>`}
function stage(a,b,on){const e=$(a),j=$(b);if(!e||!j)return;e.classList.toggle("locked",!on);e.classList.toggle("unlocked",!!on);e.querySelector(".lock").textContent=on?"✓ KAPITOLA ODEMČENA":"🔒 Zamčeno";j.classList.toggle("active",!!on)}
function renderJourney(){
 const van=$("journeyVan"),build=$("journeyBuild"),home=$("journeyHome"),road=$("journeyRoad"),note=$("journeyNote");
 if(!van||!build||!home||!road)return;
 const buildDone=(typeof buildParts!=="undefined")?completedBuildCount():0;
 const homeDoneCount=(typeof homeParts!=="undefined")?homeParts.filter(p=>state.homeAnswers?.[p.id]?.trim()).length:0;
 const km=Math.max(0,Number(state.distance)||0);
 const vanUnlocked=!!state.unlocks?.van, buildUnlocked=!!state.unlocks?.build, homeUnlocked=!!state.unlocks?.home, roadUnlocked=!!state.unlocks?.road;

 const setStep=(el,unlocked,done,status)=>{
   el.classList.toggle("unlocked",unlocked);el.classList.toggle("done",done);el.classList.toggle("locked-step",!unlocked);
   const em=el.querySelector("em");if(em)em.textContent=status||"";
 };
 const start=$("journeyStart"); if(start){start.classList.add("done");const e=start.querySelector("em");if(e)e.textContent="✓";}
 van.querySelector("b").textContent=state.vanName?.trim()||"Náš van";
 setStep(van,vanUnlocked,vanUnlocked&&!!state.vanName,vanUnlocked?(state.vanName?"✓":"odemčeno"):"🔒");
 setStep(build,buildUnlocked,buildDone>=buildParts.length,buildUnlocked?(buildDone>=buildParts.length?"✓":`${buildDone}/${buildParts.length}`):"🔒");
 setStep(home,homeUnlocked,!!state.homeCompleted,homeUnlocked?(state.homeCompleted?"✓":`${homeDoneCount}/${homeParts.length}`):"🔒");
 setStep(road,roadUnlocked,roadUnlocked&&km>=600,roadUnlocked?(km>=600?"600 km ✓":`${km}/600 km`):"🔒");

 const link=(id,on)=>{const x=$(id);if(x)x.classList.toggle("progress",on)};
 link("linkStartVan",vanUnlocked);link("linkVanBuild",buildUnlocked);link("linkBuildHome",homeUnlocked);link("linkHomeRoad",roadUnlocked);

 if(note){
   let text="malé kroky,<br>velké sny ♡";
   if(roadUnlocked) text=km>=600?"první cesta<br>za námi ♡":`${km} km za námi,<br>${Math.max(0,600-km)} před námi`;
   else if(homeUnlocked) text=state.homeCompleted?"už je to<br>náš domov ♡":"dáváme vanu<br>kousek nás";
   else if(buildUnlocked) text=buildDone>=buildParts.length?"náš van<br>je navržený ♡":`přestavba:<br>${buildDone} z 5 hotovo`;
   else if(vanUnlocked) text=state.vanName?`${esc(state.vanName)}<br>je náš ♡`:"náš van<br>čeká na jméno";
   note.innerHTML=`dnes:<br><b>${text}</b>`;
 }
}
function render(){
 renderJourney();

 const globalRule=$("globalHomeRule");
 if(globalRule){
   const rule=state.homeAnswers?.rule?.trim();
   globalRule.classList.toggle("hidden",!rule);
   globalRule.innerHTML=rule?`<span>PRAVIDLO NAŠEHO DOMOVA ♡</span><p>„Ať budeme kdekoliv, v našem vanu vždycky <b>${esc(rule)}</b>.“</p>`:"";
 }

 $("heroKm")&&($("heroKm").textContent=state.distance||0); $("heroDay").textContent="DEN "+(state.day||1);$("heroFund").textContent=money(state.fund);$("heroDistance").textContent=(state.distance||0)+" km";
 $("fundBadge").textContent=money(state.fund);$("fundNumber").textContent=money(state.fund);
 const targets=[20000,50000,100000,150000],next=targets.find(x=>x>state.fund),pct=Math.min(100,state.fund/150000*100);
 $("fundTarget").textContent=next?`z cíle ${money(next)}`:"připraveno na velký krok";$("fundProgress").style.width=pct+"%";$("vanMarker").style.left=`calc(${pct}% - 14px)`;
 $("milestones").innerHTML=targets.map(x=>`<div class="milestone ${state.fund>=x?"done":""}">${money(x)}</div>`).join("")+`<div class="milestone ${state.unlocks.van?"done":""}">Náš van</div>`;
 $("priorities").innerHTML=state.priorities.length?state.priorities.map(x=>"• "+esc(x)).join("<br>"):"Zatím nevyplněno.";
 const a=state.candidates.filter(x=>x.status==="active"),r=state.candidates.filter(x=>x.status==="rejected");
 $("activeCount").textContent=a.length;$("rejectedCount").textContent=r.length;$("activeCandidates").innerHTML=a.length?a.map(candidate).join(""):'<div class="empty">Zatím žádný kandidát.</div>';$("rejectedCandidates").innerHTML=r.length?r.map(candidate).join(""):'<div class="empty">Zatím nic.</div>';
 $("lessons").innerHTML=state.lessons.length?state.lessons.map(x=>`<div class="lesson">${esc(x)}</div>`).join(""):'<div class="empty">První lekce teprve přijde.</div>';
 stage("stageVan","journeyVan",state.unlocks.van);stage("stageBuild","journeyBuild",state.unlocks.build);stage("stageHome","journeyHome",state.unlocks.home);stage("stageRoad","journeyRoad",state.unlocks.road);
 const vanTitle=$("stageVan")?.querySelector("h3");
 if(vanTitle) vanTitle.textContent=state.vanName?.trim() || "Náš van";
 const journeyVanTitle=$("journeyVan")?.querySelector("b");
 if(journeyVanTitle) journeyVanTitle.textContent=state.vanName?.trim() || "Náš van";
}
const chapters={van:["🚐","MÁME VAN.","Některé sny přestanou být sny úplně nenápadně."],build:["🛠","JDEME STAVĚT.","Prázdný prostor. Spousta nápadů. A poprvé už nejde jen o sen."],home:["🪴","JE TO NÁŠ DOMOV.","Už to není jen auto. Je to malé místo na světě, které patří nám."],road:["🗺","VanLife Tínky a Tomíka.","Všechno předtím byla příprava. Teď začíná skutečná cesta."]};
function showReveal(k){
  if(!$("unlockModal")||!chapters[k]) return;
  pendingReveal=k;
  const d=chapters[k];
  $("unlockArt").textContent=d[0];
  $("unlockTitle").textContent=d[1];
  $("unlockText").textContent=d[2];
  $("unlockModal").classList.remove("hidden");
  $("unlockModal").style.display="grid";
}
function closeReveal(){
  const modal=$("unlockModal");
  if(modal){ modal.classList.add("hidden"); modal.style.display="none"; }
  pendingReveal=null;
}
function revealAndOpen(){
  const k=pendingReveal;
  if(!k) return;
  state.revealed[k]=true;
  state.revealQueue=(state.revealQueue||[]).filter(x=>x!==k);
  save();
  const modal=$("unlockModal");
  if(modal){ modal.classList.add("hidden"); modal.style.display="none"; }
  pendingReveal=null;
  render();
  requestAnimationFrame(()=>openChapter(k));
}
$("revealChapterBtn")?.addEventListener("click",(e)=>{
  e.preventDefault();
  e.stopPropagation();
  revealAndOpen();
});
$("closeUnlockBtn")?.addEventListener("click",(e)=>{
  e.preventDefault();
  e.stopPropagation();
  closeReveal();
});
$("unlockModal")?.addEventListener("click",e=>{
  if(e.target===$("unlockModal")) closeReveal();
});
document.querySelectorAll(".stage-card").forEach(b=>b.addEventListener("click",()=>{
  const k=b.dataset.stage;
  if(!state.unlocks[k]) return;
  if(!state.revealed[k]) showReveal(k);
  else openChapter(k);
}));
let openChapterKey=null;
function openChapter(k){
  const chapterBox=$("chapterContent");

  // Same chapter clicked while open -> only hide it.
  // IMPORTANT: do not erase its inner HTML, otherwise reopening produces an empty strip.
  if(openChapterKey===k && chapterBox && !chapterBox.classList.contains("hidden")){
    chapterBox.classList.add("hidden");
    openChapterKey=null;
    document.querySelectorAll(".stage-card").forEach(card=>card.classList.remove("chapter-open"));
    return;
  }

  openChapterKey=k;
  document.querySelectorAll(".stage-card").forEach(card=>{
    card.classList.toggle("chapter-open", card.dataset.stage===k || card.dataset.chapter===k);
  });

  const box=$("chapterContent"),inner=$("chapterInner");
  if(!box||!inner||!chapters[k]) return;
  const d=chapters[k];
  let extra="";

  if(k==="van"){
    if(state.vanName?.trim()){
      const buildDone=completedBuildCount(),homeDone=completedHomeCount(),km=Math.max(0,Number(state.distance)||0);
      const buildRows=buildParts.filter(p=>state.buildChoices?.[p.id]).map(p=>`<div class="van-dossier-row">${state.buildPhotos?.[p.id]?`<img src="${state.buildPhotos[p.id]}" alt="">`:`<span>${p.icon}</span>`}<div><small>${p.name}</small><b>${esc(buildChoiceLabel(p))}</b></div></div>`).join("");
      const homeIds=["hers","his","ours","useless","morning"];
      const homeRows=homeIds.filter(id=>state.homeAnswers?.[id]).map(id=>{const p=homePartById(id);return `<div class="van-dossier-row">${state.homePhotos?.[id]?`<img src="${state.homePhotos[id]}" alt="">`:`<span>${p.icon}</span>`}<div><small>${p.title}</small><b>${esc(state.homeAnswers[id])}</b></div></div>`}).join("");
      extra=`<div class="van-profile">
       ${state.vanPhoto?.trim()&&state.vanIdentityRevealed?`<div class="chapter-van-photo"><img src="${state.vanPhoto}" alt="${esc(state.vanName)}"><div class="chapter-van-photo-caption"><span>NÁŠ VAN</span><b>${esc(state.vanName)}</b></div></div>`:""}
       <div class="van-profile-stats"><div><b>${km}</b><small>KM</small></div><div><b>${buildDone}/${buildParts.length}</b><small>PŘESTAVBA</small></div><div><b>${homeDone}/${homeParts.length}</b><small>DOMOV</small></div><div><b>${state.trip?.souvenir?1:0}</b><small>SUVENÝR</small></div></div>
       <p class="van-profile-intro">Začal jako obyčejný van. Tohle z něj postupně děláme my.</p>
       <div class="van-dossier-section"><span>🛠 JAK HO STAVÍME</span>${buildRows||`<p>Zatím tu čeká první rozhodnutí z Přestavby.</p>`}</div>
       <div class="van-dossier-section"><span>🏡 JAK Z NĚJ DĚLÁME DOMOV</span>${homeRows||`<p>Tohle místo se začne plnit v kapitole Náš domov.</p>`}${state.homeAnswers?.rule?`<div class="van-rule">♡ „Ať budeme kdekoliv, v našem vanu vždycky <b>${esc(state.homeAnswers.rule)}</b>.“</div>`:""}${state.homeAnswers?.letter?`<div class="van-letter">💌 <b>PRO JEDNOU</b><small>Vzkaz je zalepený. Otevřeme ho, až to bude skutečné.</small></div>`:""}</div>
       <div class="van-dossier-section"><span>🛣 ŽIVOT NAŠEHO VANU</span><div class="van-life-line"><b>${km} km</b><small>${km>=600?"První zkušební cesta dokončena ✓":state.unlocks?.road?"Naše první cesta právě vzniká.":"První cesta nás teprve čeká."}</small></div></div>
      </div>`;
    }else{
      extra=`<div class="van-name-block"><div class="van-name-label">JMÉNO NAŠEHO VANU</div><p class="van-name-question">Jak se bude jmenovat?</p><p class="van-name-warning">Vyber dobře. Tohle jméno už potom z hráčské stránky nezměníš.</p><div class="van-name-form"><input id="vanNameInput" maxlength="30" placeholder="Napiš jméno vanu…" autocomplete="off"><button id="saveVanNameBtn">Pojmenovat van ♡</button></div></div>`;
    }
  }else if(k==="build"){
    extra=renderBuildGame();
  }else if(k==="home"){
    extra=renderHomeGame();
  }else if(k==="road"){
    extra=renderRoadTrip();
  }

  inner.innerHTML=`<div class="chapter-hero"><div class="chapter-big-art">${d[0]}</div><div><div class="chapter-label">ODEMČENÁ KAPITOLA</div><h2>${k==="van" && state.vanName ? esc(state.vanName) : d[1]}</h2><p>${d[2]}</p></div></div>${extra}`;
  box.classList.remove("hidden");

  if(k==="van") wireVanNameControls();
  if(k==="build") wireBuildGame();
  if(k==="home") wireHomeGame();
  if(k==="road") wireRoadTrip();
  box.classList.remove("hidden");
  setTimeout(()=>box.scrollIntoView({behavior:"smooth",block:"start"}),40);
}


const buildParts=[
 {id:"bed",icon:"🛏️",name:"Postel",prompt:"Jak chceme ve vanu spát?",options:[["fixed","Pevná postel vzadu","Nejvíc pohodlí, ale zabere víc místa."],["fold","Rozkládací postel","Přes den získáme víc prostoru."],["raised","Vyvýšená postel","Pod ní vznikne velký úložný prostor."]]},
 {id:"kitchen",icon:"🍳",name:"Kuchyňka",prompt:"Jak moc chceme vařit na cestách?",options:[["mini","Malá a jednoduchá","Dřez, vařič a jen to nejnutnější."],["classic","Útulná klasika","Pracovní deska, dřez a místo na vaření."],["outside","Výsuvná ven","Více místa uvnitř a vaření pod širým nebem."]]},
 {id:"shower",icon:"🚿",name:"Sprcha",prompt:"Kde se chceme po dlouhém dni osprchovat?",options:[["inside","Uvnitř vanu","Soukromí a pohodlí za každého počasí."],["outside","Venkovní sprcha","Jednoduché řešení a víc místa uvnitř."],["combo","Kombinace","Podle místa a počasí použijeme obě možnosti."]]},
 {id:"toilet",icon:"🚽",name:"WC",prompt:"Jak chceme vyřešit jednu z méně romantických částí vanlife?",options:[["hidden","Schované WC","Nenápadně ukryté pod lavicí nebo skříňkou."],["bath","Součást koupelny","Vlastní malý koupelnový kout."],["portable","Přenosné řešení","Nejméně zabraného prostoru."]]},
 {id:"storage",icon:"📦",name:"Úložný prostor",prompt:"Kam schováme náš život na rok?",options:[["underbed","Hlavně pod postel","Velký prostor pro věci, které nepotřebujeme pořád."],["walls","Skříňky kolem stěn","Všechno po ruce a přehledně rozdělené."],["mixed","Chytrá kombinace","Trochu pod postelí, trochu ve skříňkách a lavicích."]]},
 {id:"style",icon:"🪵",name:"Styl interiéru",prompt:"Jakou atmosféru má náš van mít?",options:[["cream","Krémový cozy","Světlé dřevo, teplé textilie a klid."],["rustic","Rustikální","Přírodní materiály a trochu dobrodružství."],["minimal","Čistý minimalismus","Vzdušný, jednoduchý a praktický interiér."]]},
 {id:"detail",icon:"♡",name:"Náš detail",prompt:"Co je jedna věc, podle které by každý poznal, že tenhle van patří nám?",custom:true}
];


function compressGameImage(file,maxSide=760,quality=.68){
  return new Promise((resolve,reject)=>{
    if(!file){resolve("");return}
    const reader=new FileReader();
    reader.onerror=reject;
    reader.onload=()=>{
      const img=new Image();
      img.onerror=reject;
      img.onload=()=>{
        let w=img.width,h=img.height;
        const scale=Math.min(1,maxSide/Math.max(w,h));
        w=Math.max(1,Math.round(w*scale));
        h=Math.max(1,Math.round(h*scale));
        const canvas=document.createElement("canvas");
        canvas.width=w;canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL("image/jpeg",quality));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}
function buildPartById(id){return buildParts.find(x=>x.id===id)}
function buildChoiceLabel(part){
 const id=state.buildChoices?.[part.id];
 if(part.custom)return id||"";
 return part.options?.find(o=>o[0]===id)?.[1]||"";
}
function buildPartDone(part){ return !!state.buildChoices?.[part.id]; }
function completedBuildCount(){let n=0;for(const p of buildParts){if(buildPartDone(p))n++;else break}return n}
function renderBuildGame(){
 state.buildChoices=state.buildChoices||{};state.buildPhotos=state.buildPhotos||{};
 const done=completedBuildCount();
 const cards=buildParts.map((part,i)=>{
   const complete=buildPartDone(part),available=i<=done,label=buildChoiceLabel(part),photo=state.buildPhotos[part.id];
   return `<button class="build-game-card ${complete?"complete":""} ${available?"":"step-locked"}" ${available?`data-build-open="${part.id}"`:"disabled"}>
    <div class="build-step-number">${String(i+1).padStart(2,"0")}</div>
    <div class="build-game-icon">${available?part.icon:"🔒"}</div>
    <div class="build-game-copy"><small>${complete?"HOTOVO ✓":available?"TEĎ JE NA ŘADĚ":"ODEMKNE SE POZDĚJI"}</small><h3>${part.name}</h3><p>${complete?esc(label):available?esc(part.prompt):`Nejdřív dokončíme ${buildParts[i-1]?.name||"předchozí krok"}.`}</p></div>
    ${photo?`<img class="build-card-thumb" src="${photo}" alt="Inspirace – ${esc(part.name)}">`:""}
   </button>`;
 }).join("");
 return `<div class="build-game">
  <div class="build-progress-head"><div><span>PŘESTAVBA</span><b>${done} / ${buildParts.length} hotovo</b></div><div class="build-progress-mini"><i style="width:${done/buildParts.length*100}%"></i></div></div>
  <p class="build-intro">Náš van vzniká krok po kroku. Dokud jednu část nedokončíme, další zůstane zamčená.</p>
  <div class="build-game-grid">${cards}</div>
  ${done===buildParts.length?renderBuildSummary():""}
  <div id="buildChoiceModal" class="build-choice-modal hidden"></div>
 </div>`;
}
function renderBuildSummary(){
 const rows=buildParts.map(p=>`<div class="build-summary-item">${state.buildPhotos?.[p.id]?`<img src="${state.buildPhotos[p.id]}" alt="">`:`<div class="build-summary-placeholder">${p.icon}</div>`}<div><small>${p.name}</small><b>${esc(buildChoiceLabel(p))}</b></div></div>`).join("");
 return `<div class="build-finished"><div class="build-finished-stars">✦ ♡ ✦</div><span>NÁŠ VAN JE NAVRŽENÝ</span><h3>${esc(state.vanName||"Náš budoucí domov")}</h3><div class="build-summary-grid">${rows}</div></div>`;
}
function openBuildPart(id){
  const part=buildPartById(id),modal=$("buildChoiceModal");
  if(!part||!modal)return;

  const idx=buildParts.indexOf(part);
  if(idx>completedBuildCount())return;

  const selected=state.buildChoices?.[id]||"";
  let pendingChoice=selected;
  let pendingPhoto=state.buildPhotos?.[id]||"";

  modal.innerHTML=`<div class="build-choice-sheet">
    <button class="build-sheet-close" id="buildSheetClose">×</button>
    <div class="build-sheet-icon">${part.icon}</div>
    <small>PŘESTAVBA • KROK ${idx+1}/${buildParts.length}</small>
    <h3>${part.prompt}</h3>

    ${part.custom
      ? `<textarea id="buildCustomAnswer" class="build-custom-answer" maxlength="160" placeholder="Napiš náš detail…">${esc(selected)}</textarea>`
      : `<div class="build-options">${part.options.map(o=>`
          <button class="build-option ${selected===o[0]?"selected":""}" data-build-choice="${o[0]}">
            <b>${o[1]}</b><span>${o[2]}</span>
          </button>`).join("")}</div>`}

    <div class="build-inspiration">
      <div>
        <b>Naše inspirace ♡</b>
        <span>Fotka je dobrovolná. Když chceš, přidej obrázek, který se ti k tomu hodí.</span>
      </div>
      <div id="buildPhotoPreviewWrap">
        ${pendingPhoto?`<img src="${pendingPhoto}" class="build-upload-preview" alt="Inspirace">`:""}
      </div>
      <label class="build-photo-button">
        📷 ${pendingPhoto?"Změnit fotku":"Přidat fotku"}
        <input id="buildPhotoInput" type="file" accept="image/*">
      </label>
      <button id="removeBuildPhoto" class="build-photo-remove ${pendingPhoto?"":"hidden"}">Odstranit fotku</button>
    </div>

    <div id="buildChoiceRequired" class="build-choice-required ${pendingChoice?"hidden":""}">
      Vyber jednu možnost${part.custom?" nebo napiš vlastní odpověď":""}, abychom mohli pokračovat.
    </div>

    <button id="saveBuildPart" class="build-save" ${pendingChoice?"":"disabled"}>
      Potvrdit a odemknout další ♡
    </button>
  </div>`;

  modal.classList.remove("hidden");

  const saveBtn=$("saveBuildPart");
  const required=$("buildChoiceRequired");

  const refreshSaveState=()=>{
    const valid=!!String(pendingChoice||"").trim();
    saveBtn.disabled=!valid;
    required.classList.toggle("hidden",valid);
  };

  if(part.custom){
    $("buildCustomAnswer").addEventListener("input",e=>{
      pendingChoice=e.target.value.trim();
      refreshSaveState();
    });
  }else{
    modal.querySelectorAll("[data-build-choice]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        pendingChoice=btn.dataset.buildChoice;
        modal.querySelectorAll("[data-build-choice]").forEach(x=>x.classList.toggle("selected",x===btn));
        refreshSaveState();
      });
    });
  }

  $("buildSheetClose").onclick=()=>modal.classList.add("hidden");

  $("buildPhotoInput").addEventListener("change",async e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    try{
      pendingPhoto=await compressGameImage(file);
      $("buildPhotoPreviewWrap").innerHTML=`<img src="${pendingPhoto}" class="build-upload-preview" alt="Inspirace">`;
      $("removeBuildPhoto").classList.remove("hidden");
      const label=e.target.closest("label");
      if(label) label.childNodes[0].textContent="📷 Změnit fotku ";
      // IMPORTANT: no save(), no openChapter(), no modal close here.
    }catch{
      alert("Fotku se nepodařilo načíst. Zkus prosím jinou.");
    }
  });

  $("removeBuildPhoto").onclick=()=>{
    pendingPhoto="";
    $("buildPhotoPreviewWrap").innerHTML="";
    $("removeBuildPhoto").classList.add("hidden");
  };

  saveBtn.onclick=()=>{
    pendingChoice=String(pendingChoice||"").trim();
    if(!pendingChoice){
      refreshSaveState();
      return;
    }

    state.buildChoices[id]=pendingChoice;

    if(pendingPhoto) state.buildPhotos[id]=pendingPhoto;
    else delete state.buildPhotos[id];

    if(!save()) return;

    // Re-render chapter directly instead of toggling it closed.
    openChapterKey=null;
    openChapter("build");
  };

  refreshSaveState();
}
function wireBuildGame(){document.querySelectorAll("[data-build-open]").forEach(b=>b.addEventListener("click",()=>openBuildPart(b.dataset.buildOpen)))}

const homeParts=[
 {id:"hers",icon:"♡",title:"Něco mojeho",prompt:"Co je jedna věc, kterou by sis do našeho vanu určitě vzala?",placeholder:"Napiš, co jede s tebou…",photo:true},
 {id:"his",icon:"☺",title:"Něco Tomíkova",prompt:"Co myslíš, že by ve vanu nesmělo chybět mně?",placeholder:"Rozhodni za Tomíka…",photo:true},
 {id:"ours",icon:"♥",title:"Něco našeho",prompt:"Jedna společná věc, která musí jet s námi. Co to bude?",placeholder:"Něco, co je prostě naše…",photo:true},
 {id:"useless",icon:"✦",title:"Naprosto zbytečné",prompt:"Máme málo místa. Přesto máš právo na jednu úplně zbytečnou věc. Co odmítáš nechat doma?",placeholder:"Ano, i tohle s námi pojede…",photo:true},
 {id:"rule",icon:"⌂",title:"Pravidlo našeho domova",prompt:"Dokonči naši větu:",placeholder:"…"},
 {id:"morning",icon:"☀",title:"Naše první ráno",prompt:"Je první ráno v našem vanu. Venku nemusíme vůbec nic. Jak podle tebe vypadá naše ideální ráno?",placeholder:"Naše první ráno vypadá…"},
 {id:"letter",icon:"💌",title:"Vzkaz pro nás",prompt:"Napiš jednu krátkou větu pro nás dva, kterou si máme přečíst v den, kdy skutečně poprvé usneme ve vlastním vanu.",placeholder:"Pro nás, až to jednou bude skutečné…",sealed:true}
];
function homePartById(id){return homeParts.find(p=>p.id===id)}
function homeDone(p){return !!state.homeAnswers?.[p.id]?.trim()}
function completedHomeCount(){let n=0;for(const p of homeParts){if(homeDone(p))n++;else break}return n}
function renderHomeGame(){
 state.homeAnswers=state.homeAnswers||{};state.homePhotos=state.homePhotos||{};
 const done=completedHomeCount();
 if(state.homeCompleted||done===homeParts.length){if(!state.homeCompleted){state.homeCompleted=true;save()}return renderHomeScrapbook()}
 const cards=homeParts.map((p,i)=>{const answer=state.homeAnswers[p.id],photo=state.homePhotos[p.id],available=i<=done;
   return `<button class="home-memory-card ${answer?"complete":""} ${available?"":"step-locked"}" ${available?`data-home-open="${p.id}"`:"disabled"}>
    ${photo?`<img src="${photo}" alt="">`:`<div class="home-memory-icon">${available?p.icon:"🔒"}</div>`}
    <div class="home-memory-copy"><small>${answer?"ULOŽENO ✓":available?"TEĎ JE NA ŘADĚ":"ODEMKNE SE POZDĚJI"}</small><h3>${String(i+1).padStart(2,"0")} · ${p.title}</h3><p>${answer?(p.sealed?"💌 Vzkaz je bezpečně zalepený.":esc(answer)):available?esc(p.prompt):`Nejdřív dokončíme ${homeParts[i-1]?.title||"předchozí krok"}.`}</p></div>
   </button>`}).join("");
 return `<div class="home-game">${state.vanPhoto&&state.vanIdentityRevealed?`<div class="home-van-banner"><img src="${state.vanPhoto}" alt="${esc(state.vanName||"Náš van")}"><div><small>UŽ TO NENÍ JEN DODÁVKA</small><b>${esc(state.vanName||"Náš van")}</b></div></div>`:""}
 <div class="home-opening"><span>NÁŠ DOMOV</span><h3>Kdy se z auta stane domov?</h3><p>Van máme. Navrhli jsme ho. Teď do něj krok po kroku dáváme nás.</p><div class="home-progress"><i style="width:${done/homeParts.length*100}%"></i></div><small>${done} / ${homeParts.length} částí našeho domova</small></div>
 <div class="home-memory-grid">${cards}</div><div id="homeModal" class="home-modal hidden"></div></div>`;
}
function renderHomeScrapbook(){
 const labels={hers:"TÍNKA BERE",his:"TOMÍK PODLE TÍNKY BERE",ours:"NAŠE VĚC",useless:"NAPROSTO ZBYTEČNÉ, ALE JEDE TO S NÁMI",morning:"NAŠE PRVNÍ RÁNO"};
 const ids=["hers","his","ours","useless","morning"];
 const items=ids.map((id,i)=>{const p=homePartById(id),photo=state.homePhotos?.[id],ans=state.homeAnswers?.[id]||"";return `<div class="scrap-item scrap-${i+1}"><div class="scrap-photo">${photo?`<img src="${photo}" alt="">`:`<div>${p.icon}</div>`}</div><small>${labels[id]}</small><b>${esc(ans)}</b></div>`}).join("");
 return `<div class="home-scrapbook"><div class="scrap-kicker">✦ TOHLE UŽ JE NÁŠ DOMOV ✦</div><h3>${esc(state.vanName||"Náš van")}</h3><p class="scrap-sub">Náš domov na čtyřech kolech.</p>${state.vanPhoto?`<div class="scrap-van"><img src="${state.vanPhoto}" alt=""></div>`:""}<div class="scrap-grid">${items}</div>
 <div class="home-rule-paper"><span>PRAVIDLO NAŠEHO DOMOVA</span><p>„Ať budeme kdekoliv, v našem vanu vždycky <b>${esc(state.homeAnswers?.rule||"")}</b>.“</p></div>
 <div class="sealed-letter"><div>💌</div><small>PRO JEDNOU</small><b>Vzkaz pro nás je zalepený.</b><p>Otevřeme ho, až to bude skutečné.</p></div>
 <div class="home-next"><span>Máme van. Udělali jsme z něj domov.</span><b>Zbývá už jen jedna otázka.</b><h4>Kam pojedeme jako první?</h4></div></div>`;
}

function refreshHomeChapter(){
  // Internal refresh after saving a home step.
  // Do not let the chapter toggle interpret this as a second click.
  openChapterKey=null;
  openChapter("home");
}

function showLetterSealReveal(text){
  const modal=$("letterSealModal");
  if(!modal)return;
  pendingSealedLetter=text;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  requestAnimationFrame(()=>{
    modal.classList.add("playing");
  });
}
function finishLetterSealReveal(){
  const modal=$("letterSealModal");
  if(modal){
    modal.classList.remove("playing");
    modal.classList.add("hidden");
  }
  document.body.classList.remove("modal-open");
  pendingSealedLetter=null;
  refreshHomeChapter();
}
$("finishLetterSealBtn")?.addEventListener("click",finishLetterSealReveal);

function openHomePart(id){
 const part=homePartById(id),modal=$("homeModal");if(!part||!modal)return;
 const idx=homeParts.indexOf(part);if(idx>completedHomeCount())return;
 const answer=state.homeAnswers?.[id]||"",photo=state.homePhotos?.[id];
 if(part.sealed&&answer){alert("Tenhle vzkaz už je zalepený ♡");return}
 modal.innerHTML=`<div class="home-sheet"><button id="homeSheetClose" class="home-sheet-close">×</button><div class="home-sheet-icon">${part.icon}</div><small>NÁŠ DOMOV • KROK ${idx+1}/${homeParts.length}</small><h3>${part.prompt}</h3>${id==="rule"?`<div class="home-rule-prefix">Ať budeme kdekoliv, v našem vanu vždycky…</div>`:""}${part.sealed?`<div class="sealed-warning">Po potvrzení se obálka zalepí a na hráčské stránce už text nepůjde znovu otevřít.</div>`:""}<textarea id="homeAnswerInput" maxlength="220" placeholder="${part.placeholder}">${esc(answer)}</textarea>
 ${part.photo?`<div class="home-photo-area"><b>Fotka ♡</b><span>Jestli chceš, přidej k tomu i obrázek.</span>${photo?`<img src="${photo}" class="home-photo-preview" alt="">`:""}<label class="home-photo-button">📷 ${photo?"Změnit fotku":"Přidat fotku"}<input id="homePhotoInput" type="file" accept="image/*"></label>${photo?`<button id="homeRemovePhoto" class="home-photo-remove">Odstranit fotku</button>`:""}</div>`:""}
 <button id="saveHomePart" class="home-save" ${answer.trim()?"":"disabled"}>${part.sealed?"Zalepit obálku 💌":"Uložit a odemknout další ♡"}</button></div>`;
 modal.classList.remove("hidden");const input=$("homeAnswerInput");input.oninput=()=>$("saveHomePart").disabled=!input.value.trim();$("homeSheetClose").onclick=()=>modal.classList.add("hidden");
 $("saveHomePart").onclick=()=>{
   const val=input.value.trim();
   if(!val)return;

   state.homeAnswers[id]=val;

   if(part.sealed){
     if(completedHomeCount()===homeParts.length) state.homeCompleted=true;
     if(!save())return;

     // Hide the form first so the message itself is never shown again.
     modal.classList.add("hidden");
     showLetterSealReveal(val);
     return;
   }

   if(completedHomeCount()===homeParts.length) state.homeCompleted=true;
   if(!save())return;
   refreshHomeChapter();
 };
 if(part.photo){
   $("homePhotoInput").onchange=async e=>{
     const f=e.target.files?.[0];
     if(!f)return;
     try{
       state.homePhotos[id]=await compressGameImage(f,760,.68);
       if(!save())return;
       refreshHomeChapter();
       setTimeout(()=>openHomePart(id),30);
     }catch{alert("Fotku se nepodařilo načíst. Zkus prosím jinou.");}
   };
   if($("homeRemovePhoto"))$("homeRemovePhoto").onclick=()=>{
     delete state.homePhotos[id];
     if(!save())return;
     refreshHomeChapter();
     setTimeout(()=>openHomePart(id),30);
   };
 }
}
function wireHomeGame(){document.querySelectorAll("[data-home-open]").forEach(b=>b.addEventListener("click",()=>openHomePart(b.dataset.homeOpen)))}

function tripState(){
 state.trip=state.trip||{day:1,location:"",journal:[],memories:[null,null,null]};
 state.trip.journal=state.trip.journal||[];state.trip.memories=state.trip.memories||[null,null,null];return state.trip;
}
function renderRoadTrip(){
 const t=tripState(),km=Math.max(0,Number(state.distance)||0),pct=Math.min(100,km/600*100),left=Math.max(0,600-km);
 const logs=t.journal.length?t.journal.slice().reverse().map(x=>`<div class="road-log"><div><b>${esc(String(x.km))} KM</b><small>${esc(x.title)}</small></div><p>${esc(x.text)}</p></div>`).join(""):`<div class="road-log-empty">Zatím je před námi celých 600 km. První zápis se tu objeví, až se nám něco stane.</div>`;
 return `<div class="road-trip">
 <div class="road-mission"><span>NAŠE PRVNÍ MISE</span><h3>Zkušební cesta</h3><p>Než jednou opravdu vyrazíme, čeká nás první zkouška. <b>600 kilometrů. Jeden víkend. My dva a náš van.</b> Všechno, co se nám cestou stane, zůstane tady.</p><div class="road-mission-tags"><b>🚐 jeden víkend</b><b>🛣️ minimálně 600 km</b><b>🏕️ alespoň 2 místa na spaní</b></div></div>
 <div class="road-dashboard"><div class="road-km-head"><div><small>NAŠE ZKUŠEBNÍ JÍZDA</small><strong>${km} <i>/ 60VanLife Tínky a Tomíka</i></strong></div><div><small>DEN</small><strong>${t.day||1}</strong></div></div><div class="road-track"><i style="width:${pct}%"></i><span class="road-van" style="left:calc(${pct}% - 18px)">🚐</span></div><div class="road-track-labels"><span>VanLife Tínky a Tomíka</span><span>${left?`${left} km před námi`:"60VanLife Tínky a Tomíka ✓"}</span></div>${t.location?`<div class="road-location">📍 <span>Právě jsme:</span> <b>${esc(t.location)}</b></div>`:""}</div>
 <div class="road-section-head"><span>NÁŠ DENÍK CESTY</span><p>Co jsme cestou zažili, jak jsme se rozhodli a co z toho vzniklo.</p></div><div class="road-journal">${logs}</div>
 <div class="road-souvenir-locked"><div class="road-souvenir-icon">🎁</div><div><small>SUVENÝR Z PRVNÍ CESTY</small><b>Zatím čeká někde po cestě…</b><p>Během naší výpravy dostaneme možnost jeden si vybrat. Až ho získáme, zůstane tady v našem deníku.</p></div></div>
 ${km>=600?`<div class="road-600"><div>✦ 60VanLife Tínky a Tomíka ✓ ✦</div><h3>Naše první zkouška je za námi.</h3><p>Dojeli jsme až sem. Teď už zbývá zjistit, jestli pořád chceme vyrazit mnohem dál.</p></div>`:""}</div>`;
}
function wireRoadTrip(){}
function wireVanNameControls(){
  const saveBtn=$("saveVanNameBtn"), input=$("vanNameInput");
  if(saveBtn && input){
    saveBtn.addEventListener("click",()=>{
      const name=input.value.trim();
      if(!name) return;
      state.vanName=name;
      state.vanIdentityRevealed=false;
      backupVanIdentity();
      if(!save()) return;
      render();
      openChapter("van");
      setTimeout(()=>showVanIdentityReveal(),180);
    });
    input.addEventListener("keydown",e=>{
      if(e.key==="Enter"){e.preventDefault();saveBtn.click();}
    });
  }
}

function showVanIdentityReveal(){
  if(!state.vanName?.trim()) return;
  const modal=$("vanIdentityModal");
  if(!modal) return;
  $("vanRevealName").textContent=state.vanName;
  const img=$("vanRevealPhoto");
  const placeholder=$("vanPhotoPlaceholder");
  if(state.vanPhoto?.trim()){
    img.src=state.vanPhoto;
    img.classList.remove("hidden");
    placeholder.classList.add("hidden");
  }else{
    img.removeAttribute("src");
    img.classList.add("hidden");
    placeholder.classList.remove("hidden");
  }
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  requestAnimationFrame(()=>modal.classList.add("playing"));
}

function closeVanIdentityReveal(markDone=true){
  const modal=$("vanIdentityModal");
  if(!modal) return;
  modal.classList.remove("playing");
  modal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  if(markDone){
    state.vanIdentityRevealed=true;
    backupVanIdentity();
    save();
    render();
    openChapter("van");
  }
}

$("finishVanRevealBtn")?.addEventListener("click",()=>closeVanIdentityReveal(true));
$("closeVanIdentityBtn")?.addEventListener("click",()=>closeVanIdentityReveal(true));
$("vanIdentityModal")?.addEventListener("click",e=>{
  if(e.target===$("vanIdentityModal")) closeVanIdentityReveal(true);
});

$("chapterClose")?.addEventListener("click",()=>$("chapterContent").classList.add("hidden"));
document.querySelectorAll("[data-jump]").forEach(b=>b.addEventListener("click",()=>document.getElementById(b.dataset.jump)?.scrollIntoView({behavior:"smooth"})));
window.addEventListener("storage",e=>{if(e.key===STORAGE_KEY){state=load();render()}});
if($("unlockModal")){ $("unlockModal").classList.add("hidden"); $("unlockModal").style.display="none"; }

const VAPID_PUBLIC_KEY="BJ8EPpwVNqnc0rCScRSsFO8Kg9JpzJ3gneKFLYncEt-p99srQuImAuLeme-BIxvO0JU12bI1i5CpaCY8hve6D6c";

function vapidKeyToUint8Array(base64String){
  const padding="=".repeat((4-base64String.length%4)%4);
  const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
  const raw=atob(base64);
  return Uint8Array.from([...raw].map(ch=>ch.charCodeAt(0)));
}

async function existingPushSubscription(){
  if(!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg=await navigator.serviceWorker.register("/service-worker.js");
  return reg.pushManager.getSubscription();
}

async function initPushOptIn(){
  const panel=$("pushOptIn"),btn=$("enablePushBtn"),copy=$("pushOptInText");
  if(!panel||!btn)return;

  if(!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)){
    panel.classList.add("hidden");
    return;
  }

  try{
    const sub=await existingPushSubscription();
    if(sub && Notification.permission==="granted"){
      panel.classList.add("hidden");
      return;
    }
  }catch{}

  panel.classList.remove("hidden");

  btn.addEventListener("click",async()=>{
    btn.disabled=true;
    try{
      const standalone=window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone===true;
      const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent);

      if(isiOS && !standalone){
        copy.textContent="Na iPhonu nejdřív otevři Sdílet → Přidat na plochu. Pak spusť VanLife Tínky a Tomíka z ikonky a vrať se sem.";
        btn.textContent="Nejdřív přidat na plochu";
        btn.disabled=false;
        return;
      }

      const permission=await Notification.requestPermission();
      if(permission!=="granted"){
        copy.textContent="Upozornění nejsou povolená. Můžeš je později změnit v Nastavení iPhonu.";
        btn.disabled=false;
        return;
      }

      const reg=await navigator.serviceWorker.register("/service-worker.js");
      let sub=await reg.pushManager.getSubscription();
      if(!sub){
        sub=await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:vapidKeyToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      const res=await fetch("/.netlify/functions/push-subscribe",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(sub)
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok || !data.ok) throw new Error(data.error||"Subscription failed");

      panel.classList.add("success");
      copy.textContent="Hotovo. Když Tomík zazvoní, upozornění může přijít i se zavřeným VanLife Tínky a Tomíka. ♡";
      btn.textContent="✓ Upozornění zapnuta";
      if("setAppBadge" in navigator) try{await navigator.clearAppBadge()}catch{}
      setTimeout(()=>panel.classList.add("hidden"),2600);
    }catch(err){
      console.error(err);
      copy.textContent="Upozornění se nepodařilo zapnout. Zkontroluj, že je VanLife Tínky a Tomíka přidané na plochu a zkus to znovu.";
      btn.disabled=false;
    }
  });
}

initPushOptIn();

function showVanlifeNoticeFromUrl(){
  const params=new URLSearchParams(window.location.search);
  const message=params.get("vanlife_notice");
  const noticeId=params.get("vanlife_notice_id")||"";
  if(!message)return;
  if(noticeId){
    sessionStorage.setItem("vanlifeCurrentNoticeId",noticeId);
    fetch("/.netlify/functions/push-status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:noticeId,status:"opened"})}).catch(()=>{});
  }
  const modal=$("vanlifeNoticeModal"), text=$("vanlifeNoticeText");
  if(!modal||!text)return;
  text.textContent=message;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  params.delete("vanlife_notice");
  params.delete("vanlife_notice_id");
  const clean=window.location.pathname+(params.toString()?`?${params.toString()}`:"")+window.location.hash;
  history.replaceState({},document.title,clean);
}
$("closeVanlifeNotice")?.addEventListener("click",()=>{
  const id=sessionStorage.getItem("vanlifeCurrentNoticeId")||"";
  if(id){
    fetch("/.netlify/functions/push-status",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,status:"confirmed"})}).catch(()=>{});
    sessionStorage.removeItem("vanlifeCurrentNoticeId");
  }
  $("vanlifeNoticeModal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
});
$("vanlifeNoticeModal")?.addEventListener("click",e=>{
  if(e.target===$("vanlifeNoticeModal")){
    $("vanlifeNoticeModal").classList.add("hidden");
    document.body.classList.remove("modal-open");
  }
});

render();
showVanlifeNoticeFromUrl();
