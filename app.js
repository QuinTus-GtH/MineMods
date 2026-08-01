const IMAGE_BASE_PATH='./images/mods/';
const ITEMS_PER_PAGE=8;
const LS_CURRENT_USER='minemods-current-user';
const LS_SUGGESTIONS='minemods-suggestions';
const LS_SUGGESTIONS_TIME='minemods-suggestions-time';
const LS_MUSIC_VOLUME='minemods-volume';
const MAX_SUGGESTIONS=6;

const CATEGORIES=[
    {id:'aventure',name:'Aventure',icon:'⚔️',desc:'Donjons, quêtes et exploration.',order:1},
    {id:'decoration',name:'Décoration',icon:'🌸',desc:'Blocs déco, mobilier et esthétique.',order:2},
    {id:'creatures',name:'Créatures',icon:'🦖',desc:'Nouvelles créatures et animaux.',order:3},
    {id:'biomes',name:'Biomes',icon:'🌍',desc:'Biomes, structures et paysages.',order:4},
    {id:'utilitaire',name:'Utilitaire',icon:'⛏️',desc:'Qualité de vie et optimisations.',order:5},
    {id:'nourriture',name:'Nourriture',icon:'🍰',desc:'Aliments, recettes et cultures.',order:6},
    {id:'bibliotheque',name:'Bibliothèque',icon:'📚',desc:'API et librairies requises par d\'autres mods.',order:7}
];

const TAG_LABELS={optimisation:'Optimisation',animaux:'Animaux',dimension:'Dimension',fantastique:'Fantastique',magie:'Magie',technologie:'Technologie',combat:'Combat',boss:'Boss',donjons:'Donjons',structures:'Structures',biomes:'Biomes',decoration:'Décoration',cuisine:'Cuisine',agriculture:'Agriculture',stockage:'Stockage',transport:'Transport',interface:'Interface',minimap:'Minimap','creatures-hostiles':'Créatures hostiles',multijoueur:'Multijoueur',exploration:'Exploration',survie:'Survie',rpg:'RPG',animation:'Animation',configuration:'Configuration',librairie:'Librairie',esthetique:'Esthétique',accessoires:'Accessoires',commerce:'Commerce',protection:'Protection',automatisation:'Automatisation',outils:'Outils',villageois:'Villageois',minage:'Minage'};
function getTagLabel(t){return TAG_LABELS[t]||t}
function getAllTags(){const s=new Set();MODS_DATABASE.forEach(m=>(m.tags||[]).forEach(t=>s.add(t)));return[...s].sort((a,b)=>getTagLabel(a).localeCompare(getTagLabel(b)))}

// ═══ BADGES DEFINITIONS ═══
const BADGE_DEFS=[
    // Exploration (mods visités)
    {id:'explorer-1',name:'Explorateur débutant I',icon:'🔍',condition:s=>s.modsViewed>=1,desc:'1ère fiche consultée',metric:'modsViewed',target:1},
    {id:'explorer-2',name:'Explorateur débutant II',icon:'🔎',condition:s=>s.modsViewed>=20,desc:'20 fiches consultées',metric:'modsViewed',target:20},
    {id:'explorer-3',name:'Explorateur débutant III',icon:'🧭',condition:s=>s.modsViewed>=40,desc:'40 fiches consultées',metric:'modsViewed',target:40},
    {id:'explorer-4',name:'Explorateur avancé I',icon:'🗺️',condition:s=>s.modsViewed>=60,desc:'60 fiches consultées',metric:'modsViewed',target:60},
    {id:'explorer-5',name:'Explorateur avancé II',icon:'🌟',condition:s=>s.modsViewed>=80,desc:'80 fiches consultées',metric:'modsViewed',target:80},
    {id:'explorer-6',name:'Explorateur avancé III',icon:'⭐',condition:s=>s.modsViewed>=100,desc:'100 fiches consultées',metric:'modsViewed',target:100},
    {id:'explorer-7',name:'Explorateur expert I',icon:'💎',condition:s=>s.modsViewed>=120,desc:'120 fiches consultées',metric:'modsViewed',target:120},
    {id:'explorer-8',name:'Explorateur expert II',icon:'👑',condition:s=>s.modsViewed>=140,desc:'140 fiches consultées',metric:'modsViewed',target:140},
    {id:'explorer-9',name:'Explorateur expert III',icon:'🏆',condition:s=>s.modsViewed>=160,desc:'160 fiches consultées',metric:'modsViewed',target:160},
// Collections
    {id:'collector-1',name:'Collectionneur débutant',icon:'📁',condition:s=>s.collectionsCreated>=1,desc:'1ère collection créée',metric:'collectionsCreated',target:1},
    {id:'collector-2',name:'Collectionneur confirmé',icon:'📂',condition:s=>s.collectionsCreated>=5,desc:'5 collections créées',metric:'collectionsCreated',target:5},
    {id:'collector-3',name:'Collectionneur expert',icon:'🗄️',condition:s=>s.collectionsCreated>=10,desc:'10 collections créées',metric:'collectionsCreated',target:10},
    // Musique
    {id:'melomane-1',name:'Mélomane',icon:'🎵',condition:s=>s.tracksListened>=1,desc:'1ère musique écoutée',metric:'tracksListened',target:1},
    {id:'melomane-2',name:'DJ Minecraft',icon:'🎶',condition:s=>s.allTracksListened,desc:'Toutes les musiques écoutées',metric:'tracksListened',target:'ALL_TRACKS'},
];

let MODS_DATABASE = [];
const modsDataReady = fetch("mods.json")
  .then(r => r.json())
  .then(data => {
    MODS_DATABASE = data;
  });

// ═══ UTILITAIRES ═══
function versionToNum(v){const p=v.split('.').map(Number);return(p[0]||0)*10000+(p[1]||0)*100+(p[2]||0)}
function latestVersion(m){return m.versions[0]}
function latestVersionNum(m){return versionToNum(m.versions[0])}
function getSizeEntry(m,v){if(m.sizePerVersion&&m.sizePerVersion[v]!==undefined)return m.sizePerVersion[v];return m.sizeMo}
function getSizeRange(entry){if(entry&&typeof entry==='object'){const vals=Object.values(entry).filter(x=>typeof x==='number'&&!isNaN(x));if(!vals.length)return null;return{min:Math.min(...vals),max:Math.max(...vals)}}if(typeof entry==='number'&&!isNaN(entry))return{min:entry,max:entry};return null}
function getSizeForVersion(m,v,loader){const entry=getSizeEntry(m,v);if(entry&&typeof entry==='object'){if(loader&&entry[loader]!==undefined)return entry[loader];const r=getSizeRange(entry);return r?r.max:0}return typeof entry==='number'?entry:0}
function formatSizeEntry(entry){const r=getSizeRange(entry);if(!r)return'—';if(r.min===r.max)return formatSize(r.min);return formatSizeValue(r.min)+' - '+formatSize(r.max)}
function sizeEntryBreakdown(entry,sep){if(!entry||typeof entry!=='object')return null;return Object.entries(entry).filter(([,v])=>typeof v==='number'&&!isNaN(v)).sort((a,b)=>a[0].localeCompare(b[0])).map(([l,v])=>`${formatSize(v)} (${l})`).join(sep||' - ')}
function formatSizeDetail(entry,sep){const bk=sizeEntryBreakdown(entry,sep);if(bk)return bk;const r=getSizeRange(entry);return r?formatSize(r.max):'—'}
function getCatOrder(c){const cat=CATEGORIES.find(x=>x.id===c);return cat?cat.order:99}
const APOS=/[''ʼ`´'"„"‛‹›«»]/;
function isApos(c){return APOS.test(c)}
function normalizeStr(s){if(!s)return'';return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[''ʼ`´'"„"‛‹›«»]/g,'').replace(/[^a-z0-9]/g,' ').replace(/\s+/g,' ').trim()}
function findModByName(n){const t=normalizeStr(n);return MODS_DATABASE.find(m=>normalizeStr(m.name)===t)}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function formatSizeValue(mo){return mo<10?mo.toFixed(1):Math.round(mo)}
function formatSize(mo){return formatSizeValue(mo)+' Mo'}
function getCategoryLabel(id){const c=CATEGORIES.find(x=>x.id===id);return c?c.name:id}

function highlightMatch(text,query){
    if(!query||!text)return escapeHtml(text);const nq=normalizeStr(query);if(!nq)return escapeHtml(text);
    const map=[];let nt='';let lws=false;
    for(let i=0;i<text.length;i++){const c=text[i].toLowerCase();const d=c.normalize('NFD').replace(/[\u0300-\u036f]/g,'');if(isApos(c)){map.push(-1)}else if(/[a-z0-9]/i.test(d)&&d.length===1){map.push(nt.length);nt+=d.toLowerCase();lws=false}else{if(!lws&&nt.length>0){map.push(nt.length);nt+=' ';lws=true}else{map.push(-1)}}}
    nt=nt.trim();const ms=nt.indexOf(nq);if(ms===-1)return escapeHtml(text);const me=ms+nq.length;
    let os=-1,oe=-1;for(let i=0;i<map.length;i++){if(map[i]===-1)continue;if(map[i]>=ms&&map[i]<me){if(os===-1)os=i;oe=i+1}}
    if(os===-1)return escapeHtml(text);
    const qha=/['']/.test(query);if(qha&&oe<text.length&&isApos(text[oe]))oe++;
    let r=escapeHtml(text.substring(0,os));let ss=os;
    for(let k=os;k<oe;k++){if(isApos(text[k])){let sh=false;if(qha)sh=true;else if(k+1<map.length&&map[k+1]!==-1&&map[k+1]>=ms&&map[k+1]<me)sh=true;if(!sh){if(k>ss)r+='<mark>'+escapeHtml(text.substring(ss,k))+'</mark>';r+=escapeHtml(text[k]);ss=k+1}}}
    if(ss<oe)r+='<mark>'+escapeHtml(text.substring(ss,oe))+'</mark>';
    r+=escapeHtml(text.substring(oe));return r;
}

// ═══ POPULARITY ═══
function getModPopularity(mod){
    let score=0;
    // Nombre de favoris globaux (approximation locale)
    score+=favorites.includes(mod.id)?10:0;
    // Nombre de collections contenant ce mod
    score+=collections.filter(c=>c.modIds.includes(mod.id)).length*5;
    // Nombre de versions supportées (plus = plus populaire)
    score+=mod.versions.length*3;
    // Nombre de loaders supportés
    score+=mod.loaders.length*2;
    // Bonus si pas bibliothèque
    if(!mod.categories.includes('bibliotheque'))score+=5;
    // Bonus si peu de dépendances
    if(mod.dependencies.length===0)score+=3;
    return score;
}

// ═══ STATS GLOBALES DES MODS (fil d'actualité : tendances / popularité réelles) ═══
const TREND_WINDOW_DAYS=7;
let modStatsCache={};
let modStatsLoaded=false;

async function bumpModStat(modId,field,delta,trackTrend){
    if(!currentUser)return;
    const{doc,setDoc,increment,arrayUnion}=window.firebaseFn;
    const ref=doc(window.firebaseDb,'modStats',String(modId));
    const payload={[field]:increment(delta)};
    if(trackTrend)payload.recentAdds=arrayUnion(Date.now());
    try{
        await setDoc(ref,payload,{merge:true});
        // Mise à jour optimiste du cache local pour un fil d'actualité réactif
        const cur=modStatsCache[String(modId)]||{favCount:0,collCount:0,recentAdds:[]};
        cur[field]=(cur[field]||0)+delta;
        if(trackTrend)cur.recentAdds=[...(cur.recentAdds||[]),Date.now()];
        modStatsCache[String(modId)]=cur;
        renderActivityFeed();
    }catch(e){console.error('Erreur stats mod:',e)}
}

async function loadModStats(){
    try{
        const{collection,getDocs}=window.firebaseFn;
        const snap=await getDocs(collection(window.firebaseDb,'modStats'));
        const map={};
        snap.forEach(d=>{map[d.id]=d.data()});
        modStatsCache=map;
        modStatsLoaded=true;
    }catch(e){console.error('Erreur chargement stats mods:',e)}
    renderActivityFeed();
}

function getTrendScore(modId){
    const s=modStatsCache[String(modId)];
    if(!s||!s.recentAdds)return 0;
    const cutoff=Date.now()-TREND_WINDOW_DAYS*24*60*60*1000;
    return s.recentAdds.filter(ts=>ts>=cutoff).length;
}
function getGlobalPopularityScore(modId){
    const s=modStatsCache[String(modId)];
    if(!s)return 0;
    return(s.favCount||0)*2+(s.collCount||0)*3;
}

function getNewMods(limit){
    return MODS_DATABASE.filter(m=>m.dateAdded).sort((a,b)=>b.dateAdded-a.dateAdded).slice(0,limit||8);
}
function getRecentModUpdates(limit){
    const items=[];
    MODS_DATABASE.forEach(m=>{(m.updates||[]).forEach(u=>items.push({mod:m,update:u}))});
    items.sort((a,b)=>b.update.date-a.update.date);
    return items.slice(0,limit||8);
}
function getTrendingMods(limit){
    const scored=MODS_DATABASE.map(m=>({mod:m,score:getTrendScore(m.id)})).filter(x=>x.score>0);
    scored.sort((a,b)=>b.score-a.score);
    return scored.slice(0,limit||8);
}
function getPopularMods(limit){
    const hasStats=Object.keys(modStatsCache).length>0;
    const scored=MODS_DATABASE.map(m=>({mod:m,score:hasStats?getGlobalPopularityScore(m.id):getModPopularity(m)}));
    scored.sort((a,b)=>b.score-a.score);
    return scored.slice(0,limit||8).map(x=>x.mod);
}

function formatFeedRelativeTime(ts){
    const h=(Date.now()-ts)/3600000;
    if(h<24)return'Il y a moins de 24h';
    const days=Math.floor(h/24);
    if(days<7)return`Il y a ${days} jour${days>1?'s':''}`;
    const weeks=Math.floor(days/7);
    if(weeks<5)return`Il y a ${weeks} semaine${weeks>1?'s':''}`;
    return`Il y a ${Math.floor(days/30)} mois`;
}
function getMostRecentAddTs(modId){
    const s=modStatsCache[String(modId)];
    if(!s||!s.recentAdds||s.recentAdds.length===0)return null;
    return Math.max(...s.recentAdds);
}

function newsFeedCardHTML(mod,cardClass,badgeClass,badgeLabel,timeText,title,desc,linkClass,linkText){
    return`<div class="news-feed-card ${cardClass}" onclick="openModal(${mod.id})"><div class="news-feed-card-top"><span class="news-feed-badge ${badgeClass}">${badgeLabel}</span>${timeText?`<span class="news-feed-time">${timeText}</span>`:''}</div><div class="news-feed-card-main"><img class="news-feed-card-thumb" src="${getModImageUrl(mod)}" alt="${escapeHtml(mod.name)}" loading="lazy" onerror="this.onerror=null;this.src='${getImageFallback()}'"><div class="news-feed-card-info"><div class="news-feed-card-title">${escapeHtml(title)}</div><div class="news-feed-card-desc">${escapeHtml(desc)}</div><div class="news-feed-card-link ${linkClass}">${linkText} →</div></div></div></div>`;
}

function renderActivityFeed(){
    const sidebar=document.getElementById('newsFeedSidebar');
    const list=document.getElementById('newsFeedList');
    if(!sidebar||!list)return;
    const used=new Set();
    const cards=[];

    const nm=getNewMods(5).find(m=>!used.has(m.id));
    if(nm){used.add(nm.id);cards.push(newsFeedCardHTML(nm,'card-new','badge-new','🧩 NOUVEAU MOD',formatFeedRelativeTime(nm.dateAdded),nm.name,nm.description,'link-new','Découvrir'))}

    const up=getRecentModUpdates(5).find(u=>!used.has(u.mod.id));
    if(up){used.add(up.mod.id);const title=up.update.version?`${up.mod.name} ${up.update.version}`:up.mod.name;const desc=up.update.version?`La version ${up.update.version} est désormais disponible.`:(up.update.note||'Mise à jour disponible.');cards.push(newsFeedCardHTML(up.mod,'card-update','badge-update','🚀 MISE À JOUR',formatFeedRelativeTime(up.update.date),title,desc,'link-update','Voir les détails'))}

    const tr=getTrendingMods(5).find(x=>!used.has(x.mod.id));
    if(tr){used.add(tr.mod.id);const ts=getMostRecentAddTs(tr.mod.id);cards.push(newsFeedCardHTML(tr.mod,'card-trending','badge-trending','🔥 TENDANCE',ts?formatFeedRelativeTime(ts):'Cette semaine',tr.mod.name,tr.mod.description,'link-trending','Explorer'))}

    const pop=getPopularMods(5).find(m=>!used.has(m.id));
    if(pop){used.add(pop.id);const ts=getMostRecentAddTs(pop.id);cards.push(newsFeedCardHTML(pop,'card-popular','badge-popular','⭐ INCONTOURNABLE',ts?formatFeedRelativeTime(ts):'',pop.name,pop.description,'link-popular','Découvrir'))}

    if(cards.length===0){sidebar.style.display='none';list.innerHTML='';return}
    sidebar.style.display='';
    list.innerHTML=cards.join('');
}

// ═══ NOTIFICATIONS DE MISE À JOUR (mods favoris / dans une collection) ═══
async function checkFavoritedModUpdates(){
    if(!currentUser)return;
    const relevantIds=new Set(favorites);
    collections.forEach(c=>c.modIds.forEach(id=>relevantIds.add(id)));
    coCollections.forEach(c=>(c.modIds||[]).forEach(id=>relevantIds.add(id)));
    if(relevantIds.size===0)return;
    const notifiedUpdates={...(currentUser.notifiedUpdates||{})};
    let changed=false;
    for(const modId of relevantIds){
        const mod=MODS_DATABASE.find(m=>m.id===modId);
        if(!mod||!mod.updates||mod.updates.length===0)continue;
        const latest=mod.updates.reduce((a,b)=>b.date>a.date?b:a,mod.updates[0]);
        const lastSeen=notifiedUpdates[modId]||0;
        if(latest.date>lastSeen){
            await createNotification(currentUser.pseudo,{type:'mod-updated',from:'BlockDex',data:{modId:mod.id,modName:mod.name,note:latest.note||''}});
            notifiedUpdates[modId]=latest.date;
            changed=true;
        }
    }
    if(changed){
        currentUser.notifiedUpdates=notifiedUpdates;
        try{await window.firebaseFn.updateDoc(window.firebaseFn.doc(window.firebaseDb,'users',currentUser.uid),{notifiedUpdates})}catch(e){console.error('Erreur notifiedUpdates:',e)}
    }
}

// ═══ FIREBASE ═══
async function fbGetUser(pseudo){const{doc,getDoc}=window.firebaseFn;try{const pd=await getDoc(doc(window.firebaseDb,'pseudos',pseudo.toLowerCase()));if(!pd.exists())return null;const uid=pd.data().uid;const ud=await getDoc(doc(window.firebaseDb,'users',uid));if(!ud.exists())return null;return{uid,...ud.data()}}catch(e){return null}}
async function fbSaveCurrentUserData(){
    if(!currentUser||!currentUser.uid)return;
    const{doc,updateDoc}=window.firebaseFn;
    try{
        const tracksArr=(tracksListenedSet&&tracksListenedSet instanceof Set)?[...tracksListenedSet]:[];
        const viewedArr=(modsViewedSet&&modsViewedSet instanceof Set)?[...modsViewedSet]:[];
        await updateDoc(doc(window.firebaseDb,'users',currentUser.uid),{
            favorites:favorites||[],
            collections:collections||[],
            notifications:notifications||[],
            friends:friends||[],
            pendingFriends:pendingFriends||[],
            avatar:currentUser.avatar||null,
            viewHistory:viewHistory||[],
            modsViewedSet:viewedArr,
            badgesUnlocked:badgesUnlocked||[],
            tracksListenedSet:tracksArr,
            totalCollectionsCreated:totalCollectionsCreated||0
        });
    }catch(e){console.error('Save error:',e)}
}
function saveFavorites(){fbSaveCurrentUserData()}
function saveCollections(){fbSaveCurrentUserData()}
function saveNotifications(){fbSaveCurrentUserData()}

// ═══ STATE ═══
let currentUser=null;let selectedCategories=new Set();let currentVersion='all';let currentLoader='all';let searchQuery='';let currentSort='recent';let currentView='grid';let currentPage=1;let currentTab='browse';let currentModalModId=null;let suggestionsList=[];let highlightedSuggestionIndex=-1;let strictSearchModName=null;let favorites=[];let collections=[];let notifications=[];let friends=[];let pendingFriends=[];let realtimeUnsubscribe=null;let selectedPickerColId=null;let tagRowVisible=false;let selectedTags=new Set();let coCollections=[];let coCollectionsUnsubscribe=null;let selectedExportTarget=null;

// ═══ HISTORY & BADGES STATE ═══
let viewHistory=[];           // [{modId, timestamp},...] mods téléchargés via CurseForge (pour l'historique)
let modsViewedSet=new Set();  // Set des IDs de mods dont la fiche a été ouverte (pour badges Explorateur)
let badgesUnlocked=[];        // ['explorer-1','collector-1',...]
let tracksListenedSet=new Set();
let totalCollectionsCreated=0;
let badgeToastTimer=null;

// ═══ DOM ═══
const modsGrid=document.getElementById('modsGrid');const searchInput=document.getElementById('searchInput');const searchClearBtn=document.getElementById('searchClearBtn');const searchSuggestions=document.getElementById('searchSuggestions');const versionFilter=document.getElementById('versionFilter');const loaderFilter=document.getElementById('loaderFilter');const categoriesGrid=document.getElementById('categoriesGrid');const resultsCount=document.getElementById('resultsCount');const modalOverlay=document.getElementById('modalOverlay');const themeToggle=document.getElementById('themeToggle');const header=document.getElementById('header');const backToTop=document.getElementById('backToTop');const catalogSection=document.getElementById('catalogSection');const filtersPanel=document.getElementById('filtersPanel');const sortSelect=document.getElementById('sortSelect');const pagination=document.getElementById('pagination');const heroParticles=document.getElementById('heroParticles');const mobileMenuBtn=document.getElementById('mobileMenuBtn');const mobileMenu=document.getElementById('mobileMenu');const userBadge=document.getElementById('userBadge');const userAvatar=document.getElementById('userAvatar');const userPseudoEl=document.getElementById('userPseudo');const userDropdown=document.getElementById('userDropdown');const favoritesPanel=document.getElementById('favoritesPanel');const collectionsPanel=document.getElementById('collectionsPanel');const bellBtn=document.getElementById('bellBtn');const bellBadge=document.getElementById('bellBadge');const bellDropdown=document.getElementById('bellDropdown');const bellList=document.getElementById('bellList');const tagModeBtn=document.getElementById('tagModeBtn');

const STAR='<svg viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>';

// ═══ PARTICLES ═══
let heroParallaxTicking=false;
function updateHeroParallax(){
    heroParallaxTicking=false;
    const heroSection=document.getElementById('heroSection');
    if(!heroSection)return;
    const rect=heroSection.getBoundingClientRect();
    if(rect.bottom<0||rect.top>window.innerHeight)return;
    const offset=Math.min(window.scrollY*0.22,60);
    const bgImg=document.querySelector('.hero-bg-image');
    if(bgImg)bgImg.style.transform=`translateY(${offset}px)`;
    if(heroParticles)heroParticles.style.transform=`translateY(${offset*0.4}px)`;
}
window.addEventListener('scroll',()=>{
    if(!heroParallaxTicking){heroParallaxTicking=true;window.requestAnimationFrame(updateHeroParallax)}
},{passive:true});
function createParticles(){const c=['#7EC850','#4AEDD9','#FCDB05','#A946E8','#FF8B3D','#FFF'];for(let i=0;i<45;i++){const p=document.createElement('div');p.className='particle';const s=2+Math.random()*5;p.style.cssText=`left:${Math.random()*100}%;width:${s}px;height:${s}px;background:${c[Math.floor(Math.random()*c.length)]};color:${c[Math.floor(Math.random()*c.length)]};animation-duration:${12+Math.random()*18}s;animation-delay:-${Math.random()*20}s;--d:${(Math.random()-.5)*200}px;--po:${.4+Math.random()*.5}`;heroParticles.appendChild(p)}for(let i=0;i<20;i++){const s=document.createElement('div');s.className='sparkle';const sz=2+Math.random()*3;s.style.cssText=`width:${sz}px;height:${sz}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-duration:${2+Math.random()*4}s;animation-delay:-${Math.random()*6}s`;heroParticles.appendChild(s)}}

function getModImageUrl(m){return IMAGE_BASE_PATH+m.image}
function getImageFallback(){return"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 340'%3E%3Crect fill='%231a1a2e' width='600' height='340'/%3E%3Crect fill='%235D8C3E' x='220' y='100' width='160' height='100' rx='12'/%3E%3Ctext fill='white' font-family='monospace' font-size='48' x='300' y='165' text-anchor='middle'%3E⛏️%3C/text%3E%3C/svg%3E"}

function normalizePlatformLinks(val){
    if(!val)return[];
    if(typeof val==='string')return val?[{loader:null,url:val}]:[];
    return Object.entries(val).filter(([k,v])=>v).map(([k,v])=>({loader:k,url:v}));
}

function platformButtonHtml(mod,platform){
    const val=platform==='curseforge'?mod.curseforgeUrl:mod.modrinthUrl;
    const links=normalizePlatformLinks(val);
    const label=platform==='curseforge'?'CurseForge':'Modrinth';
    const icon=platform==='curseforge'?'./images/curseforge/curseforge.png':'./images/modrinth/modrinth.png';
    const cls=platform==='curseforge'?'btn-download':'btn-download btn-modrinth';
    const trackFn=platform==='curseforge'?'trackCurseforgeClick':'trackModrinthClick';
    if(links.length===0){
        return `<span class="${cls} btn-disabled" title="Non disponible sur ${label}"><img src="${icon}" alt="" class="cf-btn-icon" onerror="this.style.display='none'"> ${label}</span>`;
    }
    if(links.length===1){
        return `<a class="${cls}" href="${links[0].url}" target="_blank" rel="noopener" onclick="${trackFn}(${mod.id})"><img src="${icon}" alt="" class="cf-btn-icon" onerror="this.style.display='none'"> ${label}</a>`;
    }
    return `<button type="button" class="${cls} btn-multi-link" onclick="openPlatformLinkPicker(${mod.id},'${platform}')" title="${links.length} liens disponibles selon le loader"><span class="btn-multi-link-label"><img src="${icon}" alt="" class="cf-btn-icon" onerror="this.style.display='none'"> ${label}</span><span class="multi-link-badge">${links.length}</span></button>`;
}

function openPlatformLinkPicker(modId,platform){
    const mod=MODS_DATABASE.find(m=>m.id===modId);
    if(!mod)return;
    const val=platform==='curseforge'?mod.curseforgeUrl:mod.modrinthUrl;
    const links=normalizePlatformLinks(val);
    const label=platform==='curseforge'?'CurseForge':'Modrinth';
    const icon=platform==='curseforge'?'./images/curseforge/curseforge.png':'./images/modrinth/modrinth.png';
    const cls=platform==='curseforge'?'btn-download':'btn-download btn-modrinth';
    const trackFn=platform==='curseforge'?'trackCurseforgeClick':'trackModrinthClick';
    openPromptModal({
        title:`${label} — plusieurs liens`,
        hint:`« ${escapeHtml(mod.name)} » a un lien ${label} différent selon le loader. Choisissez le vôtre :`,
        inputsHtml:links.map(l=>`<a class="${cls}" style="width:100%;margin-bottom:10px" href="${l.url}" target="_blank" rel="noopener" onclick="${trackFn}(${modId});closePromptModal()"><img src="${icon}" alt="" class="cf-btn-icon" onerror="this.style.display='none'"> ${escapeHtml(l.loader||label)}</a>`).join(''),
        actionsHtml:''
    });
}

function wireModalPlatformButton(el,mod,platform){
    if(!el)return;
    const val=platform==='curseforge'?mod.curseforgeUrl:mod.modrinthUrl;
    const links=normalizePlatformLinks(val);
    const label=platform==='curseforge'?'CurseForge':'Modrinth';
    let badge=el.querySelector('.multi-link-badge');
    if(links.length===0){
        el.href='#';el.classList.add('btn-disabled');el.title=`Non disponible sur ${label}`;
        el.onclick=e=>e.preventDefault();
        if(badge)badge.remove();
    }else if(links.length===1){
        el.href=links[0].url;el.classList.remove('btn-disabled');el.removeAttribute('title');
        el.onclick=()=>{(platform==='curseforge'?trackCurseforgeClick:trackModrinthClick)(mod.id)};
        if(badge)badge.remove();
    }else{
        el.href='#';el.classList.remove('btn-disabled');el.removeAttribute('title');
        el.onclick=e=>{e.preventDefault();openPlatformLinkPicker(mod.id,platform)};
        if(!badge){
            badge=document.createElement('span');
            badge.className='multi-link-badge';
            el.appendChild(badge);
        }
        badge.textContent=links.length;
        el.title=`${links.length} liens disponibles selon le loader`;
    }
}
function populateVersionFilter(){const v=[...new Set(MODS_DATABASE.flatMap(m=>m.versions))];v.sort((a,b)=>versionToNum(b)-versionToNum(a));versionFilter.innerHTML='<option value="all">Toutes les versions</option>'+v.map(x=>`<option value="${x}">${x}</option>`).join('')}
function populateLoaderFilter(){const l=[...new Set(MODS_DATABASE.flatMap(m=>m.loaders))];l.sort();loaderFilter.innerHTML='<option value="all">Tous les loaders</option>'+l.map(x=>`<option value="${x}">${x}</option>`).join('')}
function getFilteredMods(){let list=MODS_DATABASE.filter(m=>{if(strictSearchModName)return normalizeStr(m.name)===normalizeStr(strictSearchModName);const mc=selectedCategories.size===0||[...selectedCategories].every(c=>m.categories.includes(c));const mv=currentVersion==='all'||m.versions.includes(currentVersion);const ml=currentLoader==='all'||m.loaders.includes(currentLoader);const mt=selectedTags.size===0||[...selectedTags].every(t=>(m.tags||[]).includes(t));const q=normalizeStr(searchQuery);const ms=q===''||normalizeStr(m.name).includes(q)||normalizeStr(m.description).includes(q)||m.categories.some(c=>c.includes(q));return mc&&mv&&ml&&mt&&ms});switch(currentSort){case'name-asc':list.sort((a,b)=>a.name.localeCompare(b.name));break;case'name-desc':list.sort((a,b)=>b.name.localeCompare(a.name));break;case'size':list.sort((a,b)=>b.sizeMo-a.sizeMo);break;case'popular':list.sort((a,b)=>getModPopularity(b)-getModPopularity(a));break;default:list.sort((a,b)=>latestVersionNum(b)-latestVersionNum(a))}return list}

// ═══ VIEW HISTORY ═══
// Tracking pour le badge Explorateur (ouverture de fiche)
function trackModView(modId){
    if(!currentUser||!modId)return;
    if(!modsViewedSet.has(modId)){
        modsViewedSet.add(modId);
        fbSaveCurrentUserData();
        checkBadges();
    }
}

// Tracking pour l'historique (clic CurseForge ou Modrinth)
const HISTORY_MAX_DAYS=7;
function pruneViewHistory(){
    const cutoff=Date.now()-HISTORY_MAX_DAYS*24*60*60*1000;
    const before=viewHistory.length;
    viewHistory=viewHistory.filter(h=>h.timestamp>=cutoff);
    return viewHistory.length!==before;
}
function addToViewHistory(modId,platform){
    if(!currentUser||!modId)return;
    viewHistory=viewHistory.filter(h=>h.modId!==modId);
    viewHistory.unshift({modId,timestamp:Date.now(),platform:platform||'curseforge'});
    pruneViewHistory();
    if(viewHistory.length>50)viewHistory=viewHistory.slice(0,50);
    fbSaveCurrentUserData();
    // Pas de checkBadges ici : le clic CurseForge/Modrinth ne débloque aucun succès
}

function trackCurseforgeClick(modId){
    addToViewHistory(modId,'curseforge');
}

function trackModrinthClick(modId){
    addToViewHistory(modId,'modrinth');
}

function getViewHistoryUniqueCount(){
    pruneViewHistory();
    return new Set(viewHistory.map(h=>h.modId)).size;
}

function getViewedModsCount(){
    return modsViewedSet.size;
}

// ═══ BADGES / ACHIEVEMENTS ═══
function getBadgeStats(){
    return{
        modsViewed:getViewedModsCount(),
        collectionsCreated:totalCollectionsCreated,
        tracksListened:tracksListenedSet.size,
        allTracksListened:tracksListenedSet.size>=MUSIC_PLAYLIST.length
    };
}

// Synchronise le compteur avec les vraies données au chargement
function syncCountersOnLoad(){
    // Si l'utilisateur a des collections propriétaires mais totalCollectionsCreated=0, on corrige
    const ownedCols=collections.filter(c=>!c.imported).length;
    if(totalCollectionsCreated<ownedCols){
        totalCollectionsCreated=ownedCols;
    }
}

// Flag pour éviter les toasts massifs au chargement
let badgesInitialized=false;

function getBadgeStats(){
    return{
        modsViewed:getViewedModsCount(),
        collectionsCreated:totalCollectionsCreated,
        tracksListened:tracksListenedSet.size,
        allTracksListened:tracksListenedSet.size>=MUSIC_PLAYLIST.length
    };
}

function syncCountersOnLoad(){
    const ownedCols=collections.filter(c=>!c.imported).length;
    if(totalCollectionsCreated<ownedCols){
        totalCollectionsCreated=ownedCols;
    }
}

function checkBadges(silent){
    if(!currentUser)return;
    const stats=getBadgeStats();
    let newBadges=[];
    BADGE_DEFS.forEach(bd=>{
        if(!badgesUnlocked.includes(bd.id)&&bd.condition(stats)){
            badgesUnlocked.push(bd.id);
            newBadges.push(bd);
        }
    });
    if(newBadges.length>0){
        fbSaveCurrentUserData();
        if(!silent&&badgesInitialized){
            newBadges.forEach((badge,i)=>{
                setTimeout(()=>showBadgeToast(badge),i*350);
            });
        }
    }
}

function initBadgesSystem(){
    syncCountersOnLoad();
    checkBadges(true);
    badgesInitialized=true;
}

function showBadgeToast(badge){
    const el=document.getElementById('badgeToast');
    if(!el)return;
    el.innerHTML=`
        <span class="badge-toast-icon">${badge.icon}</span>
        <div class="badge-toast-content">
            <span class="badge-toast-label">🏆 Succès débloqué !</span>
            <span class="badge-toast-name">${escapeHtml(badge.name)}</span>
        </div>
    `;
    el.classList.remove('visible');
    // Force reflow pour redémarrer l'animation
    void el.offsetWidth;
    el.classList.add('visible');
    clearTimeout(badgeToastTimer);
    badgeToastTimer=setTimeout(()=>el.classList.remove('visible'),5000);
    // Petit son visuel : jouer un son court si possible (optionnel)
    try{
        const audio=new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
        audio.volume=0.15;
        audio.play().catch(()=>{});
    }catch(e){}
}

function onTrackListened(trackFile){
    if(!currentUser)return;
    tracksListenedSet.add(trackFile);
    checkBadges();
}

// ═══ RECOMMENDATIONS ═══
function getRecommendations(){
    if(!currentUser||favorites.length===0&&viewHistory.length===0)return[];

    const scored=new Map();
    const viewedIds=new Set(viewHistory.map(h=>h.modId));
    const favIds=new Set(favorites);
    const allInteracted=new Set([...viewedIds,...favIds]);

    // Collecter les catégories préférées
    const catScores={};
    favorites.forEach(fid=>{
        const m=MODS_DATABASE.find(x=>x.id===fid);
        if(m)m.categories.forEach(c=>{catScores[c]=(catScores[c]||0)+3});
    });
    viewHistory.slice(0,20).forEach(h=>{
        const m=MODS_DATABASE.find(x=>x.id===h.modId);
        if(m)m.categories.forEach(c=>{catScores[c]=(catScores[c]||0)+1});
    });

    // Collecter les loaders préférés
    const loaderScores={};
    favorites.forEach(fid=>{
        const m=MODS_DATABASE.find(x=>x.id===fid);
        if(m)m.loaders.forEach(l=>{loaderScores[l]=(loaderScores[l]||0)+2});
    });

    // Collecter les versions préférées
    const verScores={};
    favorites.forEach(fid=>{
        const m=MODS_DATABASE.find(x=>x.id===fid);
        if(m)m.versions.forEach(v=>{verScores[v]=(verScores[v]||0)+1});
    });

    // Scorer chaque mod non-interagé
    MODS_DATABASE.forEach(mod=>{
        if(allInteracted.has(mod.id))return;
        if(mod.categories.includes('bibliotheque'))return;

        let score=0;
        let reasons=[];

        // Score par catégorie
        mod.categories.forEach(c=>{
            if(catScores[c]){
                score+=catScores[c]*2;
                reasons.push(getCategoryLabel(c));
            }
        });

        // Score par loader commun
        mod.loaders.forEach(l=>{
            if(loaderScores[l])score+=loaderScores[l];
        });

        // Score par version commune
        mod.versions.forEach(v=>{
            if(verScores[v])score+=verScores[v];
        });

        // Bonus si même dépendance qu'un favori
        const favDeps=new Set();
        favorites.forEach(fid=>{
            const fm=MODS_DATABASE.find(x=>x.id===fid);
            if(fm)(fm.dependencies||[]).forEach(d=>favDeps.add(d));
        });
        mod.dependencies.forEach(d=>{
            if(favDeps.has(d)){score+=4;reasons.push('Dép. commune')}
        });

        // Bonus si un favori dépend du même écosystème
        favorites.forEach(fid=>{
            const fm=MODS_DATABASE.find(x=>x.id===fid);
            if(fm){
                const shared=mod.categories.filter(c=>fm.categories.includes(c)&&c!=='utilitaire');
                if(shared.length>=2)score+=3;
            }
        });

        if(score>0){
            // Dédupliquer les raisons
            const uniqueReasons=[...new Set(reasons)].slice(0,2);
            scored.set(mod.id,{score,reasons:uniqueReasons});
        }
    });

    // Trier et retourner top 4
    return[...scored.entries()]
        .sort((a,b)=>b[1].score-a[1].score)
        .slice(0,4)
        .map(([id,data])=>({mod:MODS_DATABASE.find(m=>m.id===id),reasons:data.reasons}))
        .filter(x=>x.mod);
}

function renderRecommendations(){
    const section=document.getElementById('recoSection');
    const grid=document.getElementById('recoGrid');
    if(!section||!grid)return;

    // Ne rien afficher si utilisateur non connecté OU aucune activité
    if(!currentUser||(favorites.length===0&&viewHistory.length===0)){
        section.style.display='none';
        return;
    }

    const recos=getRecommendations();
    if(recos.length===0){
        section.style.display='none';
        return;
    }

    section.style.display='';
    grid.innerHTML=recos.map((r,i)=>{
        const reasonLabel=r.reasons.length>0?r.reasons.join(' · '):'Pour vous';
        return`<div style="animation:cardAppear .6s ease ${i*0.08}s both">
            <div class="reco-reason">💡 ${escapeHtml(reasonLabel)}</div>
            ${modCardHTML(r.mod,i)}
        </div>`;
    }).join('');
}

// ═══ CARROUSEL SUGGESTIONS ═══
let carouselIndex=0;
let carouselMods=[];
const CAROUSEL_SIZE=5;

function getSuggestedMods(){
    const st=parseInt(localStorage.getItem(LS_SUGGESTIONS_TIME)||'0');
    const si=JSON.parse(localStorage.getItem(LS_SUGGESTIONS)||'[]');
    if(si.length===CAROUSEL_SIZE&&(Date.now()-st)<3600000)return si.map(id=>MODS_DATABASE.find(m=>m.id===id)).filter(Boolean);
    return generateNewSuggestions();
}

function generateNewSuggestions(){
    const el=MODS_DATABASE.filter(m=>!m.categories.includes('bibliotheque'));
    const sh=[...el].sort(()=>Math.random()-0.5).slice(0,CAROUSEL_SIZE);
    localStorage.setItem(LS_SUGGESTIONS,JSON.stringify(sh.map(m=>m.id)));
    localStorage.setItem(LS_SUGGESTIONS_TIME,String(Date.now()));
    return sh;
}

function renderSuggestions(){
    const track=document.getElementById('carouselTrack');
    if(!track)return;
    carouselMods=getSuggestedMods();
    if(carouselMods.length===0){
        track.innerHTML='<div class="dropdown-empty" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)"><div class="dropdown-empty-icon">✨</div>Aucune suggestion disponible</div>';
        return;
    }
    carouselIndex=0;
    track.innerHTML=carouselMods.map((m,i)=>`<div class="carousel-item hidden" data-ci="${i}">${modCardHTML(m,i)}</div>`).join('');
    updateCarouselPositions();
}

function updateCarouselPositions(){
    const items=document.querySelectorAll('.carousel-item');
    const total=carouselMods.length;
    items.forEach((item,i)=>{
        item.className='carousel-item';
        const diff=(i-carouselIndex+total)%total;
        if(diff===0) item.classList.add('active');
        else if(diff===1) item.classList.add('right');
        else if(diff===total-1) item.classList.add('left');
        else if(diff===2) item.classList.add('far-right');
        else if(diff===total-2) item.classList.add('far-left');
        else item.classList.add('hidden');
    });
}

function carouselNext(){carouselIndex=(carouselIndex+1)%carouselMods.length;updateCarouselPositions()}
function carouselPrev(){carouselIndex=(carouselIndex-1+carouselMods.length)%carouselMods.length;updateCarouselPositions()}
function refreshSuggestions(manual){if(manual){localStorage.removeItem(LS_SUGGESTIONS);localStorage.removeItem(LS_SUGGESTIONS_TIME)}renderSuggestions()}

// Carousel touch + keyboard
(function(){
    let touchStartX=0;
    const wrapper=document.getElementById('carouselWrapper');
    if(!wrapper)return;
    wrapper.addEventListener('touchstart',function(e){touchStartX=e.touches[0].clientX},{passive:true});
    wrapper.addEventListener('touchend',function(e){const diff=touchStartX-e.changedTouches[0].clientX;if(Math.abs(diff)>50){diff>0?carouselNext():carouselPrev()}},{passive:true});
})();
document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
    const musicDD=document.getElementById('musicDropdown');
    if(musicDD&&musicDD.classList.contains('open'))return;
    if(modalOverlay.classList.contains('active'))return;
    const po=document.getElementById('promptOverlay');
    if(po&&po.classList.contains('active'))return;
    if(e.key==='ArrowLeft')carouselPrev();
    else if(e.key==='ArrowRight')carouselNext();
});

// ═══ TABS ═══
function switchTab(tab){currentTab=tab;document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.getElementById('browsePanel').style.display=tab==='browse'?'':'none';favoritesPanel.style.display=tab==='favorites'?'':'none';collectionsPanel.style.display=tab==='collections'?'':'none';collectionsPanel.classList.toggle('active',tab==='collections');if(tab==='favorites')renderFavorites();if(tab==='collections')renderCollections()}
document.getElementById('tabBar').addEventListener('click',e=>{const b=e.target.closest('.tab-btn');if(b)switchTab(b.dataset.tab)});

// ═══ CATEGORIES ═══
function renderCategories(){const counts={};CATEGORIES.forEach(c=>{counts[c.id]=MODS_DATABASE.filter(m=>{const cats=new Set(selectedCategories);cats.add(c.id);return[...cats].every(cat=>m.categories.includes(cat))}).length});categoriesGrid.innerHTML=CATEGORIES.map(c=>`<div class="category-card cat-${c.id} ${selectedCategories.has(c.id)?'active':''}" data-category="${c.id}"><div class="category-icon">${c.icon}</div><div class="category-name">${c.name}</div><div class="category-desc">${c.desc}</div><div class="category-count">${counts[c.id]}</div></div>`).join('');categoriesGrid.querySelectorAll('.category-card').forEach(card=>{card.addEventListener('click',()=>{const id=card.dataset.category;selectedCategories.has(id)?selectedCategories.delete(id):selectedCategories.add(id);strictSearchModName=null;currentPage=1;renderCategories();renderMods()})})}

// ═══ MOD CARD ═══
function modCardHTML(mod,i,rmCol,colId,incompat,ro){const isFav=favorites.includes(mod.id);return`<div class="mod-card ${incompat?'incompatible':''}" style="animation-delay:${(i||0)*0.04}s"><div class="mod-card-image-wrapper">${incompat?`<div class="incompat-badge">⚠️ Version incompatible</div>`:''}<img class="mod-card-image" src="${getModImageUrl(mod)}" alt="${escapeHtml(mod.name)}" loading="lazy" onerror="this.onerror=null;this.src='${getImageFallback()}'"><div class="mod-card-badges">${mod.categories.map(c=>`<span class="mod-badge ${c}">${getCategoryLabel(c)}</span>`).join('')}</div>${!ro?`<button class="fav-btn ${isFav?'active':''}" title="Favoris" onclick="toggleFavorite(${mod.id},this,event)" aria-label="Ajouter aux favoris">${STAR}</button>`:''}</div><div class="mod-card-body"><h3 class="mod-card-title">${escapeHtml(mod.name)}</h3><p class="mod-card-description">${escapeHtml(mod.description)}</p><div class="mod-card-stats"><span class="stat-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>${formatSizeEntry(getSizeEntry(mod,latestVersion(mod)))}</span><span class="version-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${latestVersion(mod)}</span></div><div class="mod-card-actions"><div class="mod-card-dl-col">${platformButtonHtml(mod,'curseforge')}${platformButtonHtml(mod,'modrinth')}</div><div class="mod-card-secondary-col"><button class="btn-details" onclick="openModal(${mod.id})">📋 Voir</button>${rmCol&&!ro?`<button class="btn-details" onclick="removeFromCollection(${colId},${mod.id})" style="color:var(--mc-redstone);border-color:rgba(255,26,26,.3)">✕</button>`:''}</div></div></div></div>`}

// ═══ RENDER ═══
function skeletonCardHTML(){return`<div class="skeleton-card"><div class="skeleton-block skeleton-image"></div><div class="skeleton-body"><div class="skeleton-block skeleton-line w-70"></div><div class="skeleton-block skeleton-line w-100"></div><div class="skeleton-block skeleton-line w-90"></div><div class="skeleton-block skeleton-line w-40"></div><div class="skeleton-actions"><div class="skeleton-block skeleton-line"></div><div class="skeleton-block skeleton-line"></div></div></div></div>`}
let modsRenderTimer=null;
function renderMods(){const f=getFilteredMods();const tp=Math.max(1,Math.ceil(f.length/ITEMS_PER_PAGE));if(currentPage>tp)currentPage=tp;resultsCount.innerHTML=`Affichage de <strong>${f.length}</strong> mod${f.length!==1?'s':''}`;modsGrid.className='mods-grid'+(currentView==='list'?' list-view':'');const skeletonCount=Math.min(ITEMS_PER_PAGE,f.length||ITEMS_PER_PAGE);modsGrid.innerHTML=Array(skeletonCount).fill(0).map(skeletonCardHTML).join('');pagination.innerHTML='';clearTimeout(modsRenderTimer);modsRenderTimer=setTimeout(()=>{if(f.length===0){modsGrid.innerHTML=`<div class="no-results"><div class="no-results-icon">🔍</div><h3>Aucun mod trouvé</h3><p>Modifiez vos filtres.</p></div>`;pagination.innerHTML='';return}const s=(currentPage-1)*ITEMS_PER_PAGE;modsGrid.innerHTML=f.slice(s,s+ITEMS_PER_PAGE).map((m,i)=>modCardHTML(m,i)).join('');renderPagination(tp)},600)}
function renderPagination(tp){if(tp<=1){pagination.innerHTML='';return}let h=`<button class="page-btn" ${currentPage===1?'disabled':''} onclick="goToPage(${currentPage-1})">‹</button>`;const pp=[1];if(currentPage>3)pp.push('...');for(let i=Math.max(2,currentPage-1);i<=Math.min(tp-1,currentPage+1);i++)pp.push(i);if(currentPage<tp-2)pp.push('...');if(tp>1)pp.push(tp);const seen=new Set();pp.forEach(p=>{if(p==='...')h+=`<span class="page-dots">…</span>`;else if(!seen.has(p)){seen.add(p);h+=`<button class="page-btn ${currentPage===p?'active':''}" onclick="goToPage(${p})">${p}</button>`}});h+=`<button class="page-btn" ${currentPage===tp?'disabled':''} onclick="goToPage(${currentPage+1})">›</button>`;h+=`<span class="page-jump">Aller à <input type="number" min="1" max="${tp}" placeholder="•••" id="pageJumpInput" onkeydown="if(event.key==='Enter'){submitPageJump(${tp});this.blur()}" onblur="submitPageJump(${tp})"> / ${tp}</span>`;pagination.innerHTML=h}
function goToPage(n,opts){currentPage=n;renderMods();const target=filtersPanel;target.scrollIntoView({behavior:'smooth',block:'start'})}
function submitPageJump(tp){const input=document.getElementById('pageJumpInput');if(!input||input.value==='')return;let n=parseInt(input.value,10);if(isNaN(n))return;n=Math.min(Math.max(n,1),tp);goToPage(n,{scrollToFilters:true})}
function requireAuth(a){if(!currentUser){showToast('info','🔐 Connectez-vous pour '+a);openAuthModal('login');return false}return true}
function toggleFavorite(id,btn,ev){ev&&ev.stopPropagation();if(!requireAuth('gérer vos favoris'))return;const i=favorites.indexOf(id);const adding=i<0;if(i>=0)favorites.splice(i,1);else favorites.push(id);saveFavorites();bumpModStat(id,'favCount',adding?1:-1,adding);if(btn){btn.classList.toggle('active',favorites.includes(id));btn.innerHTML=STAR}updateTabCounts();if(currentTab==='favorites')renderFavorites();renderRecommendations()}
function renderFavorites(){if(!currentUser){favoritesPanel.innerHTML=`<div class="login-required"><div class="login-required-icon">🔐</div><h3>Connectez-vous</h3><div class="login-required-btns"><button class="btn-primary" onclick="openAuthModal('login')">Se connecter</button><button class="btn-secondary" onclick="openAuthModal('register')">Créer un compte</button></div></div>`;return}const mods=MODS_DATABASE.filter(m=>favorites.includes(m.id));if(mods.length===0){favoritesPanel.innerHTML=`<div class="no-results"><div class="no-results-icon">⭐</div><h3>Aucun favori</h3><p>Cliquez sur l'étoile ⭐ d'un mod pour l'ajouter ici.</p></div>`;return}favoritesPanel.innerHTML=`<div class="mods-grid ${currentView==='list'?'list-view':''}">${mods.map((m,i)=>modCardHTML(m,i)).join('')}</div>`}

// ═══ COLLECTIONS ═══
function createCollection(){if(!requireAuth('créer une collection'))return;collections.push({id:Date.now(),name:'Nouvelle collection',modIds:[],owner:currentUser.pseudo,imported:false,sharedFrom:null});totalCollectionsCreated++;saveCollections();updateTabCounts();renderCollections();checkBadges()}

// ═══ COLLECTIONS COLLABORATIVES (temps réel entre 2 utilisateurs) ═══
function setupCoCollectionsSync(){
    if(!currentUser)return;
    if(coCollectionsUnsubscribe){coCollectionsUnsubscribe();coCollectionsUnsubscribe=null}
    const{collection,query,where,onSnapshot}=window.firebaseFn;
    const q=query(collection(window.firebaseDb,'coCollections'),where('members','array-contains',currentUser.pseudo));
    coCollectionsUnsubscribe=onSnapshot(q,snap=>{
        coCollections=snap.docs.map(d=>d.data());
        if(currentTab==='collections')renderCollections();
        if(currentModalModId)refreshPlaylistChips(currentModalModId);
    },e=>{console.error('Erreur sync collections collaboratives:',e)});
}
function openCoCreatePrompt(){
    if(!requireAuth('créer une collection collaborative'))return;
    if(friends.length===0){showToast('warning',"⚠️ Ajoutez d'abord un ami (icône 👥)");return}
    const fl=friends.map(f=>`<div class="friend-item" onclick="document.getElementById('coFriend').value='${escapeHtml(f.pseudo).replace(/'/g,"\\'")}'"><div class="avatar-circle">${escapeHtml(f.pseudo.charAt(0).toUpperCase())}</div><div class="name">${escapeHtml(f.pseudo)}</div></div>`).join('');
    openPromptModal({
        title:'🤝 Collection collaborative',
        hint:"Choisissez un ami avec qui collaborer. Vous pourrez chacun ajouter des mods, visibles en temps réel l'un pour l'autre.",
        extraContent:`<div class="friends-list">${fl}</div>`,
        inputsHtml:`<input type="text" class="prompt-input" id="coFriend" placeholder="Pseudo d'un ami" autocomplete="off"><input type="text" class="prompt-input" id="coName" placeholder="Nom de la collection" autocomplete="off" style="margin-top:10px">`,
        actionsHtml:`<button class="btn-secondary" onclick="closePromptModal()">Annuler</button><button class="btn-primary" onclick="doCreateCoCollection()">Créer</button>`,
        onOpen:()=>{const el=document.getElementById('coFriend');if(el)el.focus()}
    })
}
async function doCreateCoCollection(){
    const fp=document.getElementById('coFriend').value.trim();
    const name=document.getElementById('coName').value.trim()||'Collection collaborative';
    if(!fp){showPromptError('Pseudo requis');return}
    if(fp.toLowerCase()===currentUser.pseudo.toLowerCase()){showPromptError('Pas vous-même');return}
    if(!isFriend(fp)){showPromptError(`⚠️ ${fp} n'est pas votre ami`);return}
    const t=await fbGetUser(fp);
    if(!t){showPromptError('Introuvable');return}
    const{doc,setDoc,collection}=window.firebaseFn;
    try{
        const ref=doc(collection(window.firebaseDb,'coCollections'));
        await setDoc(ref,{id:ref.id,name,members:[currentUser.pseudo,t.pseudo],modIds:[],createdBy:currentUser.pseudo,createdAt:Date.now()});
        await createNotification(t.pseudo,{type:'co-invite',from:currentUser.pseudo,data:{collectionName:name}});
        showToast('info','✅ Collection collaborative créée');
        closePromptModal();
    }catch(e){console.error('Erreur création collection collaborative:',e);showPromptError(e.code==='permission-denied'?'Erreur : permissions Firestore insuffisantes (voir console)':'Erreur : '+(e.message||e.code||'inconnue'))}
}
async function toggleModInCoCollection(coId,modId){
    if(!requireAuth('modifier'))return;
    const col=coCollections.find(c=>c.id===coId);
    if(!col)return;
    const{doc,updateDoc,arrayUnion,arrayRemove}=window.firebaseFn;
    const inCol=(col.modIds||[]).includes(modId);
    try{
        await updateDoc(doc(window.firebaseDb,'coCollections',coId),{modIds:inCol?arrayRemove(modId):arrayUnion(modId)});
        bumpModStat(modId,'collCount',inCol?-1:1,!inCol);
    }catch(e){console.error('Erreur ajout/retrait mod collection collaborative:',e);showToast('error',e.code==='permission-denied'?'⚠️ Permissions Firestore insuffisantes':'Erreur de synchronisation')}
}
async function leaveCoCollection(coId){
    const col=coCollections.find(c=>c.id===coId);
    if(!col)return;
    const{doc,updateDoc,deleteDoc,arrayRemove}=window.firebaseFn;
    const remaining=(col.members||[]).filter(p=>p!==currentUser.pseudo);
    try{
        const ref=doc(window.firebaseDb,'coCollections',coId);
        if(remaining.length===0)await deleteDoc(ref);
        else await updateDoc(ref,{members:arrayRemove(currentUser.pseudo)});
        coCollections=coCollections.filter(c=>c.id!==coId);
        if(currentTab==='collections')renderCollections();
        if(currentModalModId)refreshPlaylistChips(currentModalModId);
        showToast('info','🚪 Collection quittée');
    }catch(e){console.error('Erreur pour quitter la collection collaborative:',e);showToast('error',e.code==='permission-denied'?'⚠️ Permissions Firestore insuffisantes':'Erreur')}
}
function deleteCollection(id){collections=collections.filter(c=>c.id!==id);saveCollections();updateTabCounts();renderCollections()}
function renameCollection(id,n){const c=collections.find(x=>x.id===id);if(c){c.name=n;saveCollections()}}
function removeFromCollection(cid,mid){const c=collections.find(x=>x.id===cid);if(c){c.modIds=c.modIds.filter(i=>i!==mid);saveCollections();renderCollections();if(currentModalModId)refreshPlaylistChips(currentModalModId)}}
function toggleModInCollection(cid,mid){if(!requireAuth('modifier'))return;const c=collections.find(x=>x.id===cid);if(!c)return;const i=c.modIds.indexOf(mid);const adding=i<0;if(i>=0)c.modIds.splice(i,1);else c.modIds.push(mid);saveCollections();bumpModStat(mid,'collCount',adding?1:-1,adding);refreshPlaylistChips(mid);updateTabCounts()}

function analyzeCollection(col){const mods=col.modIds.map(id=>MODS_DATABASE.find(m=>m.id===id)).filter(Boolean);const ts=mods.reduce((s,m)=>s+getSizeForVersion(m,latestVersion(m)),0);let cv=null;mods.forEach(m=>{const s=new Set(m.versions);cv=cv===null?s:new Set([...cv].filter(v=>s.has(v)))});const hcv=cv&&cv.size>0;let iids=[],bv=null;if(!hcv&&mods.length>=2){const vc={};mods.forEach(m=>{m.versions.forEach(v=>{vc[v]=(vc[v]||0)+1})});let mx=0;Object.entries(vc).forEach(([v,c])=>{if(c>mx||(c===mx&&bv&&versionToNum(v)>versionToNum(bv))){mx=c;bv=v}});iids=mods.filter(m=>!m.versions.includes(bv)).map(m=>m.id)}const mn=new Set(mods.map(m=>normalizeStr(m.name)));const md=new Set();mods.forEach(m=>{(m.dependencies||[]).forEach(d=>{if(!mn.has(normalizeStr(d)))md.add(d)})});return{totalSize:ts,modCount:mods.length,hasCommonVersion:hcv,commonVersions:cv?[...cv].sort((a,b)=>versionToNum(b)-versionToNum(a)):[],bestVersion:bv,incompatibleModIds:iids,missingDeps:[...md]}}

function resolveAllDeps(colId){
    const col=collections.find(c=>c.id===colId);
    if(!col)return;
    const a=analyzeCollection(col);
    if(a.missingDeps.length===0){showToast('info','✅ Aucune dépendance manquante');return}
    let added=0;
    a.missingDeps.forEach(depName=>{
        const depMod=findModByName(depName);
        if(depMod&&!col.modIds.includes(depMod.id)){
            col.modIds.push(depMod.id);
            bumpModStat(depMod.id,'collCount',1,true);
            added++;
        }
    });
    if(added>0){
        saveCollections();
        renderCollections();
        showToast('info',`📚 ${added} dépendance${added>1?'s':''} ajoutée${added>1?'s':''}`);
    }else{
        showToast('warning','⚠️ Dépendances introuvables dans le catalogue');
    }
}

function searchDependencyFromCollection(d){const f=findModByName(d);if(f){strictSearchModName=f.name;searchInput.value=f.name;searchQuery=f.name;searchClearBtn.classList.add('visible');searchSuggestions.classList.remove('visible');selectedCategories.clear();selectedTags.clear();tagRowVisible=false;tagModeBtn.classList.remove('active');currentVersion='all';versionFilter.value='all';currentLoader='all';loaderFilter.value='all';switchTab('browse');currentPage=1;renderCategories();renderMods();setTimeout(()=>filtersPanel.scrollIntoView({behavior:'smooth',block:'start'}),100)}else showToast('warning',`⚠️ "${d}" absent du catalogue`)}

function renderCollections(){if(!currentUser){collectionsPanel.innerHTML=`<div class="login-required"><div class="login-required-icon">🔐</div><h3>Connectez-vous</h3><div class="login-required-btns"><button class="btn-primary" onclick="openAuthModal('login')">Se connecter</button><button class="btn-secondary" onclick="openAuthModal('register')">Créer un compte</button></div></div>`;return}let h=`<div class="collections-header-actions"><button class="btn-create-collection" onclick="createCollection()">➕ Créer</button><button class="btn-import-collection" onclick="openImportPrompt()">📥 Importer d'un ami</button><button class="btn-export-collection" onclick="openExportPrompt()">📤 Exporter vers un ami</button><button class="btn-coop-collection" onclick="openCoCreatePrompt()">🤝 Collaborer avec un ami</button></div>`;if(collections.length===0&&coCollections.length===0){h+=`<div class="no-results"><div class="no-results-icon">📁</div><h3>Aucune collection</h3><p>Créez une collection pour regrouper vos mods préférés.</p></div>`;collectionsPanel.innerHTML=h;return}if(collections.length>0)h+=collections.map(col=>{const mods=col.modIds.map(id=>MODS_DATABASE.find(m=>m.id===id)).filter(Boolean);const a=analyzeCollection(col);const imp=col.imported;let sum='';if(mods.length>0)sum=`<div class="collection-summary"><span class="collection-summary-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>Poids : <strong>${formatSize(a.totalSize)}</strong></span><span class="collection-summary-item">📦 <strong>${a.modCount}</strong> mod${a.modCount>1?'s':''}</span>${a.hasCommonVersion?`<span class="collection-summary-item">✓ <strong>${a.commonVersions.slice(0,3).join(', ')}</strong></span>`:''}</div>`;let al='';if(mods.length>=2&&!a.hasCommonVersion){const im=mods.filter(m=>a.incompatibleModIds.includes(m.id));al+=`<div class="collection-alert error"><div class="collection-alert-title">⚠️ Versions incompatibles</div><ul class="collection-alert-list">${im.map(m=>`<li><strong>${escapeHtml(m.name)}</strong> — ${m.versions.join(', ')}</li>`).join('')}</ul></div>`}if(a.missingDeps.length>0){const hasResolvable=a.missingDeps.some(d=>!!findModByName(d));al+=`<div class="collection-alert warning"><div class="collection-alert-title">📚 Dépendances manquantes</div><ul class="collection-alert-list">${a.missingDeps.map(d=>{const ic=findModByName(d);return`<li>${ic?`<span class="dep-link" onclick="searchDependencyFromCollection('${escapeHtml(d).replace(/'/g,"\\'")}')">${escapeHtml(d)}</span>`:`<strong>${escapeHtml(d)}</strong> (absent)`}</li>`}).join('')}</ul>${!imp&&hasResolvable?`<button class="btn-resolve-deps" onclick="resolveAllDeps(${col.id})">📚 Résoudre les dépendances</button>`:''}</div>`}let act=imp?`<button class="collection-action-btn delete-btn" onclick="deleteCollection(${col.id})">🗑️</button>`:`<button class="collection-action-btn" onclick="shareCollection(${col.id})">📤</button><button class="collection-action-btn delete-btn" onclick="deleteCollection(${col.id})">🗑️</button>`;return`<div class="collection-card ${imp?'shared':''}"><div class="collection-header"><div class="collection-name-wrapper"><input class="collection-name-input" value="${escapeHtml(col.name)}" onchange="renameCollection(${col.id},this.value)" spellcheck="false" ${imp?'disabled':''}>${imp?`<span class="shared-badge">📥 de ${escapeHtml(col.sharedFrom||'?')}</span>`:''}</div><div class="collection-actions">${act}</div></div>${sum}${al}${mods.length===0?'<div class="empty-collection">Aucun mod.</div>':''}<div class="mods-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${mods.map((m,i)=>modCardHTML(m,i,true,col.id,a.incompatibleModIds.includes(m.id),imp)).join('')}</div></div>`}).join('');if(coCollections.length>0){h+=`<div class="coop-section-title">🤝 Collections collaboratives</div>`;h+=coCollections.map(col=>{const mods=(col.modIds||[]).map(id=>MODS_DATABASE.find(m=>m.id===id)).filter(Boolean);const others=(col.members||[]).filter(p=>p!==currentUser.pseudo);return`<div class="collection-card coop"><div class="collection-header"><div class="collection-name-wrapper"><span class="collection-name-display">${escapeHtml(col.name)}</span><span class="shared-badge coop-badge">🤝 avec ${others.map(p=>escapeHtml(p)).join(', ')||'?'}</span></div><div class="collection-actions"><button class="collection-action-btn delete-btn" onclick="leaveCoCollection('${col.id}')" title="Quitter">🚪</button></div></div>${mods.length===0?'<div class="empty-collection">Aucun mod. Ajoutez-en depuis la fiche d\'un mod (bouton "+").</div>':''}<div class="mods-grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${mods.map((m,i)=>modCardHTML(m,i,false,null,false,true)).join('')}</div></div>`}).join('')}collectionsPanel.innerHTML=h}
function updateTabCounts(){document.getElementById('favCount').textContent=favorites.length;document.getElementById('colCount').textContent=collections.length}

// ═══ SEARCH SUGGESTIONS ═══
function computeSuggestions(q){const n=normalizeStr(q);if(!n)return[];const s=[],c=[];MODS_DATABASE.forEach(m=>{const nm=normalizeStr(m.name);if(nm.startsWith(n))s.push(m);else if(nm.includes(n))c.push(m)});return[...s,...c]}
function getModsUsingLibrary(libName){return MODS_DATABASE.filter(m=>m.dependencies.includes(libName))}

function suggestionItemHTML(m,i,q){
    const isLib=m.categories.includes('bibliotheque');
    const hasDeps=!isLib&&m.dependencies&&m.dependencies.length>0;
    const usedBy=isLib?getModsUsingLibrary(m.name):[];

    // Bouton à droite selon le type
    let rightBtn='';
    if(isLib){
        rightBtn=`<button class="suggestion-expand-btn" type="button" title="Voir les mods utilisant cette librairie" onclick="event.stopPropagation();toggleUsedBy(${m.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>`;
    }else if(hasDeps){
        rightBtn=`<button class="suggestion-expand-btn deps-btn" type="button" title="Voir les librairies requises" onclick="event.stopPropagation();toggleDepsList(${m.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg></button>`;
    }else{
        rightBtn=`<div class="suggestion-spacer"></div>`;
    }

    const row=`<div class="suggestion-row">
        <div class="suggestion-item" data-index="${i}" onclick="selectSuggestion(${m.id})">
            <img class="suggestion-img" src="${getModImageUrl(m)}" alt="" onerror="this.onerror=null;this.src='${getImageFallback()}'">
            <div class="suggestion-content">
                <div class="suggestion-name">${highlightMatch(m.name,q)}</div>
                <div class="suggestion-cats">${m.categories.slice(0,3).map(c=>`<span class="suggestion-cat ${c}">${getCategoryLabel(c)}</span>`).join('')}</div>
            </div>
            <span class="suggestion-arrow">→</span>
        </div>
        ${rightBtn}
    </div>`;

    // Panneau déroulant pour les librairies (utilisé par)
    let panel='';
    if(isLib){
        panel=`<div class="suggestion-usedby" id="usedby-${m.id}">${usedBy.length===0?`<div class="suggestion-usedby-empty">Aucun mod du catalogue ne dépend de cette librairie.</div>`:`<div class="suggestion-usedby-label">Utilisé par :</div><div class="suggestion-usedby-list">${usedBy.map(u=>`<span class="suggestion-usedby-chip" onclick="event.stopPropagation();selectSuggestion(${u.id})">${escapeHtml(u.name)}</span>`).join('')}</div>`}</div>`;
    }else if(hasDeps){
        // Panneau déroulant pour les mods normaux (librairies requises)
        const depsHtml=m.dependencies.map(depName=>{
            const depMod=findModByName(depName);
            if(depMod){
                return`<span class="suggestion-deps-chip" onclick="event.stopPropagation();selectSuggestion(${depMod.id})" title="Voir cette librairie">${escapeHtml(depName)}</span>`;
            }else{
                return`<span class="suggestion-deps-chip missing" title="Librairie absente du catalogue">${escapeHtml(depName)} ⚠️</span>`;
            }
        }).join('');
        panel=`<div class="suggestion-deps" id="deps-${m.id}"><div class="suggestion-deps-label">Librairies requises :</div><div class="suggestion-deps-list">${depsHtml}</div></div>`;
    }

    return row+panel;
}

function renderSearchSuggestions(q){
    const nq=normalizeStr(q);
    let base;let modQuery=q;
    if(tagRowVisible){
        base=selectedTags.size>0?MODS_DATABASE.filter(m=>[...selectedTags].every(t=>(m.tags||[]).includes(t))):[];
        modQuery='';
    }else{
        base=nq?computeSuggestions(q):[];
        if(selectedTags.size>0)base=base.filter(m=>[...selectedTags].every(t=>(m.tags||[]).includes(t)));
    }
    suggestionsList=base.slice(0,MAX_SUGGESTIONS);
    highlightedSuggestionIndex=-1;
    const shouldShow=!!q.trim()||selectedTags.size>0||tagRowVisible;
    if(!shouldShow){searchSuggestions.classList.remove('visible');return}
    const topHtml=tagRowVisible?buildTagsRowHtml(q):`<div class="suggestion-tag-hint" onclick="toggleTagMode()">🏷️ Activer la recherche par tag pour une recherche avancée</div>`;
    let bodyHtml;
    if(suggestionsList.length===0){
        if(tagRowVisible)bodyHtml=selectedTags.size>0?`<div class="suggestion-empty">Aucun mod pour ces tags</div>`:`<div class="suggestion-empty">Choisissez un tag ci-dessus</div>`;
        else if(q.trim())bodyHtml=`<div class="suggestion-empty">Aucun mod pour <strong>« ${escapeHtml(q)} »</strong></div>`;
        else bodyHtml=`<div class="suggestion-empty">Tapez le nom d'un mod</div>`;
    }else{
        bodyHtml=`<div class="suggestion-header">${suggestionsList.length} résultat${suggestionsList.length>1?'s':''}</div>${suggestionsList.map((m,i)=>suggestionItemHTML(m,i,modQuery)).join('')}`;
    }
    searchSuggestions.innerHTML=topHtml+bodyHtml;
    searchSuggestions.classList.add('visible');
    if(tagRowVisible)wireTagPillEvents();
}
function buildTagsRowHtml(q){
    const all=getAllTags();
    const nq=normalizeStr(q);
    const selected=all.filter(t=>selectedTags.has(t));
    let rest=all.filter(t=>!selectedTags.has(t));
    if(nq)rest=rest.filter(t=>normalizeStr(getTagLabel(t)).includes(nq)||normalizeStr(t).includes(nq));
    const pill=(t,active)=>`<span class="tag-pill-mini${active?' active':''}" data-tag="${escapeHtml(t)}">${highlightMatch(getTagLabel(t),q)}</span>`;
    const divider=selected.length>0&&rest.length>0?'<span class="tag-row-divider"></span>':'';
    const emptyRest=nq&&rest.length===0?'<span class="tag-row-empty">Aucun tag ne correspond</span>':'';
    return`<div class="suggestion-tags-row">${selected.map(t=>pill(t,true)).join('')}${divider}${rest.map(t=>pill(t,false)).join('')}${emptyRest}</div>`;
}
function wireTagPillEvents(){searchSuggestions.querySelectorAll('.tag-pill-mini').forEach(el=>{el.addEventListener('click',e=>{e.stopPropagation();const t=el.dataset.tag;if(selectedTags.has(t))selectedTags.delete(t);else selectedTags.add(t);searchInput.value='';searchQuery='';searchClearBtn.classList.remove('visible');currentPage=1;renderSearchSuggestions('');renderMods()})})}
function toggleTagMode(){tagRowVisible=!tagRowVisible;if(!tagRowVisible&&selectedTags.size>0){selectedTags.clear();currentPage=1;renderMods()}tagModeBtn.classList.toggle('active',tagRowVisible);tagModeBtn.setAttribute('aria-pressed',String(tagRowVisible));renderSearchSuggestions(searchInput.value);searchInput.focus()}
function toggleUsedBy(id){
    const panel=document.getElementById(`usedby-${id}`);
    if(!panel)return;
    const btn=panel.previousElementSibling;
    const expandBtn=btn?btn.querySelector('.suggestion-expand-btn'):null;
    const open=panel.classList.toggle('open');
    if(expandBtn)expandBtn.classList.toggle('open',open);
}

function toggleDepsList(id){
    const panel=document.getElementById(`deps-${id}`);
    if(!panel)return;
    const btn=panel.previousElementSibling;
    const expandBtn=btn?btn.querySelector('.suggestion-expand-btn'):null;
    const open=panel.classList.toggle('open');
    if(expandBtn)expandBtn.classList.toggle('open',open);
}
function selectSuggestion(id){const m=MODS_DATABASE.find(x=>x.id===id);if(!m)return;searchInput.value=m.name;searchQuery=m.name;strictSearchModName=m.name;searchClearBtn.classList.add('visible');searchSuggestions.classList.remove('visible');currentPage=1;renderMods();setTimeout(()=>filtersPanel.scrollIntoView({behavior:'smooth',block:'start'}),100)}

function updateSuggestionHighlight(){const items=searchSuggestions.querySelectorAll('.suggestion-item');items.forEach((el,i)=>el.classList.toggle('highlighted',i===highlightedSuggestionIndex));if(highlightedSuggestionIndex>=0&&items[highlightedSuggestionIndex])items[highlightedSuggestionIndex].scrollIntoView({block:'nearest'})}
function searchDependency(d){closeModal();const f=findModByName(d);if(f){strictSearchModName=f.name;searchInput.value=f.name;searchQuery=f.name}else{strictSearchModName=null;searchInput.value=d;searchQuery=d}searchClearBtn.classList.add('visible');searchSuggestions.classList.remove('visible');selectedCategories.clear();selectedTags.clear();tagRowVisible=false;tagModeBtn.classList.remove('active');currentVersion='all';versionFilter.value='all';currentLoader='all';loaderFilter.value='all';switchTab('browse');currentPage=1;renderCategories();renderMods();setTimeout(()=>filtersPanel.scrollIntoView({behavior:'smooth',block:'start'}),100)}

// ═══ MODAL ═══
function getModFavoritesCount(mod){
    // Compte les favoris locaux + collections locales contenant ce mod
    let count=0;
    if(favorites.includes(mod.id))count++;
    // Note: pour un vrai compteur global, il faudrait une agrégation Firestore
    return count;
}

function openModal(id){
    currentModalModId=id;
    trackModView(id); // Track pour les badges Explorateur
    const m=MODS_DATABASE.find(x=>x.id===id);if(!m)return;
    const img=document.getElementById('modalImage');img.src=getModImageUrl(m);img.alt=m.name;img.onerror=function(){this.onerror=null;this.src=getImageFallback()};document.getElementById('modalTitle').textContent=m.name;document.getElementById('modalCategories').innerHTML=m.categories.map(c=>`<span class="mod-badge ${c}">${getCategoryLabel(c)}</span>`).join('');document.getElementById('modalTags').innerHTML=(m.tags||[]).map(t=>`<span class="modal-tag-pill">${getTagLabel(t)}</span>`).join('');document.getElementById('modalDescription').textContent=m.fullDescription;const iv=m.versions[0];const ivEntry=getSizeEntry(m,iv);document.getElementById('modalSize').innerHTML=formatSizeDetail(ivEntry);
    const favCount=getModFavoritesCount(m);
    const popEl=document.getElementById('modalPopularity');
    if(popEl)popEl.textContent=favCount>0?`⭐ ${favCount} favori${favCount>1?'s':''}`:'Aucun favori';wireModalPlatformButton(document.getElementById('modalDownload'),m,'curseforge');wireModalPlatformButton(document.getElementById('modalDownloadModrinth'),m,'modrinth');document.getElementById('modalLoaders').innerHTML=m.loaders.map(l=>`<span class="loader-tag ${l.toLowerCase().replace(/\s+/g,'')}">${l}</span>`).join('');const de=document.getElementById('modalDeps');if(!m.dependencies||m.dependencies.length===0)de.innerHTML='<span class="dep-none">Aucune dépendance ✓</span>';else de.innerHTML=m.dependencies.map(d=>`<button class="dep-chip" onclick="searchDependency('${d.replace(/'/g,"\\'")}')">${d}</button>`).join('');const btn=document.getElementById('versionDropdownBtn');const list=document.getElementById('versionDropdownList');document.getElementById('versionDropdownLabel').textContent=iv+' (dernière)';btn.classList.remove('open');list.classList.remove('open');list.innerHTML=m.versions.map((v,i)=>{const entry=getSizeEntry(m,v);return`<div class="version-item ${i===0?'current':''}" onclick="selectVersion(this,'${v}',${i===0},${id})"><span>${v}${i===0?' <span class="ver-latest">Dernière</span>':''}</span><span class="ver-size">${formatSizeDetail(entry,'<br>')}</span></div>`}).join('');refreshPlaylistChips(id);modalOverlay.classList.add('active');document.body.style.overflow='hidden';const modalEditBtn=document.getElementById('modalEditBtn');if(modalEditBtn)modalEditBtn.style.display=isModAdmin()?'inline-flex':'none'
}
function refreshPlaylistChips(id){const c=document.getElementById('playlistChips');if(!currentUser){c.innerHTML='<div style="font-size:13px;color:var(--text-muted);font-style:italic">🔐 Connectez-vous</div>';return}const ec=collections.filter(x=>!x.imported);let h=ec.map(col=>{const inCol=col.modIds.includes(id);return`<button class="playlist-chip ${inCol?'in-playlist':''}" onclick="toggleModInCollection(${col.id},${id})"><span class="plus">+</span><span class="check">✓</span>${escapeHtml(col.name)}</button>`}).join('');h+=coCollections.map(col=>{const inCol=(col.modIds||[]).includes(id);const other=(col.members||[]).find(p=>p!==currentUser.pseudo)||'?';return`<button class="playlist-chip coop-chip ${inCol?'in-playlist':''}" onclick="toggleModInCoCollection('${col.id}',${id})"><span class="plus">+</span><span class="check">✓</span>🤝 ${escapeHtml(col.name)} <span style="opacity:.6">(${escapeHtml(other)})</span></button>`}).join('');h+=`<button class="btn-new-playlist" onclick="createCollection();refreshPlaylistChips(${id});updateTabCounts()">+ Nouvelle</button>`;c.innerHTML=h}
function toggleVersionDropdown(){document.getElementById('versionDropdownBtn').classList.toggle('open');document.getElementById('versionDropdownList').classList.toggle('open')}
function selectVersion(el,v,latest,id){document.getElementById('versionDropdownLabel').textContent=v+(latest?' (dernière)':'');document.querySelectorAll('.version-item').forEach(x=>x.classList.remove('current'));el.classList.add('current');document.getElementById('versionDropdownBtn').classList.remove('open');document.getElementById('versionDropdownList').classList.remove('open');const m=MODS_DATABASE.find(x=>x.id===id);if(m){const entry=getSizeEntry(m,v);const se=document.getElementById('modalSize');se.innerHTML=formatSizeDetail(entry);se.classList.remove('updating');void se.offsetWidth;se.classList.add('updating');setTimeout(()=>se.classList.remove('updating'),500)}}
function closeModal(){modalOverlay.classList.remove('active');document.body.style.overflow='';currentModalModId=null}
document.getElementById('modalClose').addEventListener('click',closeModal);
modalOverlay.addEventListener('click',e=>{if(e.target===modalOverlay)closeModal()});

// ═══ EVENT LISTENERS ═══
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeModal();closeMobileMenu();searchSuggestions.classList.remove('visible');closePromptModal();closeUserDropdown();closeBellDropdown();closeFriendsDropdown();const mdd2=document.getElementById('musicDropdown');if(mdd2)mdd2.classList.remove('open')}});
searchInput.addEventListener('input',e=>{searchQuery=e.target.value;strictSearchModName=null;currentPage=1;searchClearBtn.classList.toggle('visible',searchQuery.length>0);renderSearchSuggestions(searchQuery);renderMods()});
searchInput.addEventListener('focus',()=>{if(tagRowVisible||selectedTags.size>0||(searchQuery.length>0&&!strictSearchModName))renderSearchSuggestions(searchInput.value)});
searchInput.addEventListener('keydown',e=>{const v=searchSuggestions.classList.contains('visible');if(e.key==='ArrowDown'){if(!v||suggestionsList.length===0)return;e.preventDefault();highlightedSuggestionIndex=Math.min(highlightedSuggestionIndex+1,suggestionsList.length-1);updateSuggestionHighlight()}else if(e.key==='ArrowUp'){if(!v||suggestionsList.length===0)return;e.preventDefault();highlightedSuggestionIndex=Math.max(highlightedSuggestionIndex-1,-1);updateSuggestionHighlight()}else if(e.key==='Enter'){if(v&&highlightedSuggestionIndex>=0&&suggestionsList[highlightedSuggestionIndex]){e.preventDefault();selectSuggestion(suggestionsList[highlightedSuggestionIndex].id);return}if(tagRowVisible&&searchInput.value.trim()){e.preventDefault();const nq=normalizeStr(searchInput.value);const all=getAllTags();const match=all.find(t=>normalizeStr(t)===nq||normalizeStr(getTagLabel(t))===nq)||all.find(t=>normalizeStr(t).includes(nq)||normalizeStr(getTagLabel(t)).includes(nq));if(match){selectedTags.add(match);searchInput.value='';searchQuery='';searchClearBtn.classList.remove('visible');currentPage=1;renderSearchSuggestions('');renderMods()}else showToast('warning',`⚠️ Tag introuvable`)}}else if(e.key==='Escape')searchSuggestions.classList.remove('visible')});
document.addEventListener('click',e=>{if(!searchInput.contains(e.target)&&!searchSuggestions.contains(e.target))searchSuggestions.classList.remove('visible')});
searchClearBtn.addEventListener('click',()=>{searchInput.value='';searchQuery='';strictSearchModName=null;selectedTags.clear();currentPage=1;searchClearBtn.classList.remove('visible');searchSuggestions.classList.remove('visible');searchInput.focus();renderMods()});
tagModeBtn.addEventListener('click',toggleTagMode);
versionFilter.addEventListener('change',e=>{currentVersion=e.target.value;currentPage=1;renderMods()});
loaderFilter.addEventListener('change',e=>{currentLoader=e.target.value;currentPage=1;renderMods()});
sortSelect.addEventListener('change',e=>{currentSort=e.target.value;currentPage=1;renderMods()});
document.querySelectorAll('.view-btn').forEach(b=>{b.addEventListener('click',()=>{document.querySelectorAll('.view-btn').forEach(x=>x.classList.remove('active'));b.classList.add('active');currentView=b.dataset.view;renderMods();if(currentTab==='favorites')renderFavorites()})});
function closeMobileMenu(){mobileMenu.classList.remove('open')}
mobileMenuBtn.addEventListener('click',e=>{e.stopPropagation();mobileMenu.classList.toggle('open')});
document.addEventListener('click',e=>{if(!mobileMenu.contains(e.target)&&!mobileMenuBtn.contains(e.target))closeMobileMenu();if(!userBadge.contains(e.target)&&!userDropdown.contains(e.target))closeUserDropdown();if(!bellBtn.contains(e.target)&&!bellDropdown.contains(e.target))closeBellDropdown();const fb=document.getElementById('friendsBtn'),fd=document.getElementById('friendsDropdown');if(fb&&fd&&!fb.contains(e.target)&&!fd.contains(e.target))closeFriendsDropdown();const mb=document.getElementById('musicBtn'),mdd=document.getElementById('musicDropdown');if(mb&&mdd){const path=e.composedPath?e.composedPath():[e.target];if(!path.includes(mb)&&!path.includes(mdd))mdd.classList.remove('open')}});
function setTheme(t){document.documentElement.setAttribute('data-theme',t);localStorage.setItem('minemods-theme',t);themeToggle.textContent=t==='dark'?'☀️':'🌙'}
themeToggle.addEventListener('click',()=>setTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark'));
setTheme(localStorage.getItem('minemods-theme')||'dark');
function showHome(){window.scrollTo({top:0,behavior:'smooth'})}
function showCatalog(){setTimeout(()=>catalogSection.scrollIntoView({behavior:'smooth'}),100)}
function scrollToSuggestions(){const el=document.querySelector('.suggestions-section');if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
function scrollToRecommendations(){
    const el=document.getElementById('recoSection');
    if(el&&el.style.display!=='none'){
        el.scrollIntoView({behavior:'smooth',block:'start'});
    }else{
        // Si la section est cachée (utilisateur non connecté ou aucune activité)
        if(!currentUser){
            showToast('info','🔐 Connectez-vous pour voir vos recommandations');
            openAuthModal('login');
        }else{
            showToast('info','💡 Ajoutez des mods en favoris pour obtenir des recommandations');
            scrollToSuggestions();
        }
    }
}
backToTop.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));
function animateCounter(el,target,d=2000){const st=performance.now();function u(t){const p=Math.min((t-st)/d,1);el.textContent=Math.floor((1-Math.pow(1-p,3))*target);if(p<1)requestAnimationFrame(u)}requestAnimationFrame(u)}

// ═══ TOAST ═══
let toastTimer=null;
function showToast(type,msg){const t=document.getElementById('toast');t.className='toast '+type;t.textContent=msg;requestAnimationFrame(()=>t.classList.add('visible'));clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),4000)}

// ═══ HELP / TIPS MODAL ═══
const TIPS_DATA=[
    {
        id:'install-mods',
        icon:'📦',
        title:'Comment installer un mod Minecraft',
        content:`<p>Pour installer un mod téléchargé depuis <strong>CurseForge</strong> :</p>
        <ol>
            <li>Appuie sur <kbd>Windows</kbd> + <kbd>R</kbd> pour ouvrir la fenêtre "Exécuter"</li>
            <li>Tape <code>%appdata%</code> et valide avec Entrée</li>
            <li>Ouvre le dossier <code>.minecraft</code></li>
            <li>Ouvre (ou crée) le dossier <code>mods</code></li>
            <li>Glisse-dépose ton fichier <code>.jar</code> téléchargé dans ce dossier</li>
            <li>Lance Minecraft avec le profil <strong>Forge</strong>, <strong>Fabric</strong> ou <strong>NeoForge</strong> correspondant</li>
        </ol>
        <div class="tip-warning">⚠️ Vérifie que la version du mod correspond exactement à ta version de Minecraft ET à ton loader (Forge ≠ Fabric).</div>`
    },
    {
        id:'install-forge',
        icon:'⚒️',
        title:'Installer Forge',
        content:`<p>Forge est le loader de mods le plus populaire :</p>
        <ol>
            <li>Va sur <strong>files.minecraftforge.net</strong></li>
            <li>Choisis la version Minecraft souhaitée (ex : 1.20.1)</li>
            <li>Télécharge le fichier <strong>Installer</strong> (recommandé)</li>
            <li>Lance le fichier <code>.jar</code> téléchargé</li>
            <li>Sélectionne <strong>Install client</strong> et valide</li>
            <li>Lance Minecraft Launcher, un nouveau profil "Forge" apparaîtra</li>
        </ol>
        <div class="tip-note">💡 Java doit être installé sur ton PC. Sinon, télécharge-le sur <strong>java.com</strong>.</div>`
    },
    {
        id:'install-fabric',
        icon:'🧵',
        title:'Installer Fabric',
        content:`<p>Fabric est un loader plus léger, idéal pour les mods de performance :</p>
        <ol>
            <li>Va sur <strong>fabricmc.net/use</strong></li>
            <li>Télécharge le <strong>Fabric Installer</strong></li>
            <li>Lance le fichier téléchargé</li>
            <li>Sélectionne ta version Minecraft et clique sur <strong>Install</strong></li>
            <li>Un profil "Fabric" apparaîtra dans le launcher</li>
        </ol>
        <div class="tip-warning">⚠️ N'oublie pas d'installer <strong>Fabric API</strong> (mod requis par presque tous les mods Fabric) dans ton dossier <code>mods</code>.</div>`
    },
    {
        id:'allocate-ram',
        icon:'🧠',
        title:'Allouer plus de RAM à Minecraft',
        content:`<p>Si Minecraft crashe avec beaucoup de mods, augmente la RAM allouée :</p>
        <ol>
            <li>Ouvre le <strong>Minecraft Launcher</strong></li>
            <li>Va dans l'onglet <strong>Installations</strong></li>
            <li>Passe la souris sur ton profil modé et clique sur les <strong>3 points</strong> → <strong>Modifier</strong></li>
            <li>Clique sur <strong>Plus d'options</strong></li>
            <li>Dans <strong>Arguments JVM</strong>, remplace <code>-Xmx2G</code> par <code>-Xmx6G</code> (6 Go)</li>
            <li>Enregistre et relance Minecraft</li>
        </ol>
        <div class="tip-note">💡 Recommandé : <strong>4-6 Go</strong> pour 50-100 mods, <strong>8 Go+</strong> pour de gros modpacks. Ne dépasse jamais la moitié de ta RAM totale.</div>`
    },
    {
        id:'find-crash',
        icon:'🔍',
        title:'Trouver la cause d\'un crash',
        content:`<p>Si Minecraft crashe, un rapport est généré automatiquement :</p>
        <ol>
            <li><kbd>Windows</kbd> + <kbd>R</kbd> → <code>%appdata%</code></li>
            <li>Ouvre <code>.minecraft</code> → <code>crash-reports</code></li>
            <li>Ouvre le fichier <code>.txt</code> le plus récent avec le Bloc-notes</li>
            <li>Cherche la ligne commençant par <code>Caused by:</code></li>
            <li>Le nom du mod fautif est généralement mentionné juste après</li>
        </ol>
        <div class="tip-note">💡 Tu peux aussi copier le contenu du rapport et le coller sur <strong>mclo.gs</strong> pour un affichage plus lisible et facile à partager.</div>`
    },
    {
        id:'backup-world',
        icon:'💾',
        title:'Sauvegarder ses mondes',
        content:`<p>Toujours sauvegarder avant d'ajouter de nouveaux mods :</p>
        <ol>
            <li><kbd>Windows</kbd> + <kbd>R</kbd> → <code>%appdata%</code></li>
            <li>Ouvre <code>.minecraft</code> → <code>saves</code></li>
            <li>Fais un <strong>clic droit</strong> sur ton monde → <strong>Copier</strong></li>
            <li>Colle-le ailleurs (ex : bureau ou clé USB) et renomme-le (ex : "MonMonde_backup_2025")</li>
        </ol>
        <div class="tip-warning">⚠️ Certains mods modifient irréversiblement ton monde. Sans sauvegarde, tu peux tout perdre en cas d'incompatibilité !</div>`
    },
    {
        id:'organize-mods',
        icon:'🗂️',
        title:'Organiser ses mods par version',
        content:`<p>Pour jouer à plusieurs versions de Minecraft sans mélanger les mods :</p>
        <ol>
            <li>Utilise un launcher tiers comme <strong>Prism Launcher</strong> ou <strong>MultiMC</strong> (gratuits)</li>
            <li>Chaque instance a son propre dossier <code>mods</code> isolé</li>
            <li>Tu peux créer une instance "1.20.1 Aventure", une autre "1.19.2 Tech", etc.</li>
        </ol>
        <div class="tip-note">💡 Prism Launcher permet aussi d'importer directement des modpacks depuis CurseForge en un clic.</div>`
    },
    {
        id:'check-compatibility',
        icon:'🔗',
        title:'Vérifier la compatibilité des mods',
        content:`<p>Avant d'installer plusieurs mods ensemble :</p>
        <ul>
            <li>Vérifie que <strong>tous les mods</strong> supportent la même version de Minecraft (ex : 1.20.1)</li>
            <li>Vérifie qu'ils utilisent le même <strong>loader</strong> (tous en Forge OU tous en Fabric)</li>
            <li>Certains mods ont des <strong>dépendances</strong> (librairies requises) — pense à les télécharger aussi</li>
            <li>Lis les commentaires CurseForge pour repérer les incompatibilités connues</li>
        </ul>
        <div class="tip-note">💡 Sur <strong>MineMods</strong>, l'onglet "Collections" détecte automatiquement les incompatibilités de version et les dépendances manquantes !</div>`
    },
    {
        id:'optifine-alt',
        icon:'⚡',
        title:'Alternatives à OptiFine (performance)',
        content:`<p>OptiFine est souvent incompatible avec les mods modernes. Voici des alternatives :</p>
        <ul>
            <li><strong>Sodium</strong> (Fabric) — Améliore drastiquement les FPS</li>
            <li><strong>Lithium</strong> (Fabric) — Optimise les calculs du serveur</li>
            <li><strong>Phosphor</strong> (Fabric) — Améliore les calculs de lumière</li>
            <li><strong>Iris Shaders</strong> (Fabric) — Support des shaders (comme OptiFine)</li>
            <li><strong>Embeddium</strong> (Forge) — Équivalent de Sodium pour Forge</li>
        </ul>
        <div class="tip-note">💡 Combo recommandé : <strong>Sodium + Lithium + Phosphor + Iris</strong> = performances excellentes + shaders.</div>`
    },
    {
        id:'minemods-features',
        icon:'⭐',
        title:'Astuces MineMods',
        content:`<p>Tire le meilleur parti de ce site :</p>
        <ul>
            <li>⭐ Ajoute des mods en <strong>Favoris</strong> pour les retrouver rapidement</li>
            <li>📁 Crée des <strong>Collections</strong> thématiques (ex : "Modpack Aventure", "Tech Base")</li>
            <li>💡 La section <strong>Recommandé pour vous</strong> se remplit selon tes favoris</li>
            <li>👥 Ajoute des <strong>amis</strong> pour partager tes collections</li>
            <li>🏆 Débloque des <strong>succès</strong> en explorant le site</li>
            <li>🎵 Écoute la musique Minecraft pendant que tu navigues</li>
            <li>🔍 Utilise la <strong>recherche</strong> avec suggestions instantanées</li>
            <li>📚 Pour les librairies, clique sur la flèche pour voir quels mods l'utilisent</li>
        </ul>`
    }
];

function openHelpModal(){
    const content=`<div style="padding-right:2px">
        ${TIPS_DATA.map(tip=>`
            <div class="tip-section" data-tip-id="${tip.id}">
                <div class="tip-section-header" onclick="toggleTipSection('${tip.id}')">
                    <span class="tip-section-icon">${tip.icon}</span>
                    <span class="tip-section-title">${escapeHtml(tip.title)}</span>
                    <span class="tip-section-arrow">▼</span>
                </div>
                <div class="tip-section-content">
                    <div class="tip-content-inner">${tip.content}</div>
                </div>
            </div>
        `).join('')}
    </div>`;

    openPromptModal({
        title:'💡 Astuces & Aide',
        hint:'Clique sur une astuce pour la déplier. Retrouve ici tout ce dont tu as besoin pour bien utiliser Minecraft modé.',
        extraContent:content,
        actionsHtml:`<button class="btn-primary" onclick="closePromptModal()">Fermer</button>`
    });
}

function toggleTipSection(tipId){
    const section=document.querySelector(`.tip-section[data-tip-id="${tipId}"]`);
    if(section)section.classList.toggle('open');
}

// ═══ PROMPT MODAL ═══
const promptOverlay=document.getElementById('promptOverlay');
function openPromptModal(cfg){document.getElementById('promptModal').style.maxWidth=cfg.maxWidth||'520px';document.getElementById('promptTitle').textContent=cfg.title;document.getElementById('promptHint').innerHTML=cfg.hint||'';document.getElementById('promptExtraContent').innerHTML=cfg.extraContent||'';document.getElementById('promptError').classList.remove('visible');document.getElementById('promptInputsContainer').innerHTML=cfg.inputsHtml||'';document.getElementById('promptActions').innerHTML=cfg.actionsHtml||'';promptOverlay.classList.add('active');document.body.style.overflow='hidden';if(cfg.onOpen)setTimeout(cfg.onOpen,100)}
function closePromptModal(){promptOverlay.classList.remove('active');document.body.style.overflow=''}
promptOverlay.addEventListener('click',e=>{if(e.target===promptOverlay)closePromptModal()});
function showPromptError(msg){const el=document.getElementById('promptError');el.textContent=msg;el.classList.add('visible')}

// ═══ AUTH ═══
function openAuthModal(mode){
    closeUserDropdown();
    if(mode==='forgot'){openPromptModal({title:'🔑 Mot de passe oublié',hint:'Entrez votre <strong>pseudo</strong> ou <strong>email</strong>.',inputsHtml:`<input type="text" class="prompt-input" id="forgotInput" placeholder="Pseudo ou email" autocomplete="off">`,actionsHtml:`<button class="btn-secondary" onclick="openAuthModal('login')">← Retour</button><button class="btn-primary" onclick="doForgotPassword()">Envoyer</button>`,onOpen:()=>{const el=document.getElementById('forgotInput');if(el)el.focus()}});return}
    const isReg=mode==='register';
    openPromptModal({title:isReg?'📝 Créer un compte':'🔐 Se connecter',hint:isReg?'Créez un compte pour sauvegarder vos favoris et partager avec vos amis.':'Connectez-vous pour retrouver vos données.',
    inputsHtml:`<input type="text" class="prompt-input" id="authPseudo" placeholder="Pseudo (2-20 caractères)" autocomplete="off">${isReg?'<input type="email" class="prompt-input" id="authEmail" placeholder="Adresse email" autocomplete="email">':''}<input type="password" class="prompt-input" id="authPassword" placeholder="Mot de passe (min. 6 caractères)" autocomplete="${isReg?'new-password':'current-password'}">${isReg?'<input type="password" class="prompt-input" id="authPasswordConfirm" placeholder="Confirmez le mot de passe" autocomplete="new-password">':''}${!isReg?'<button class="forgot-link" onclick="openAuthModal(\'forgot\')">Mot de passe oublié ?</button>':''}`,
    actionsHtml:`<button class="btn-secondary" onclick="openAuthModal('${isReg?'login':'register'}')">${isReg?'← Se connecter':'Créer un compte →'}</button><button class="btn-primary" id="authSubmitBtn" onclick="submitAuth('${mode}')">${isReg?'S\'inscrire':'Se connecter'}</button>`,
    onOpen:()=>{const el=document.getElementById('authPseudo');if(el)el.focus()}});
    setTimeout(()=>{['authPseudo','authEmail','authPassword','authPasswordConfirm'].forEach(id=>{const el=document.getElementById(id);if(el)el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();submitAuth(mode)}})})},150);
}

async function submitAuth(mode){
    const pseudo=document.getElementById('authPseudo').value.trim();const pwd=document.getElementById('authPassword').value;
    if(!pseudo){showPromptError('Pseudo requis');return}if(pseudo.length<2||pseudo.length>20){showPromptError('Pseudo : 2-20 caractères');return}if(!/^[a-zA-Z0-9_\-]+$/.test(pseudo)){showPromptError('Pseudo : lettres, chiffres, _ -');return}if(!pwd||pwd.length<6){showPromptError('Mot de passe : min. 6 caractères');return}
    const{createUserWithEmailAndPassword,signInWithEmailAndPassword,doc,setDoc,getDoc}=window.firebaseFn;const btn=document.getElementById('authSubmitBtn');if(btn){btn.disabled=true;btn.textContent='...'}
    try{
        if(mode==='register'){
            const eEl=document.getElementById('authEmail');const email=eEl?eEl.value.trim():'';
            if(!email||!email.includes('@')){showPromptError('Email requis');if(btn){btn.disabled=false;btn.textContent='S\'inscrire'}return}
            const pc=document.getElementById('authPasswordConfirm').value;if(pwd!==pc){showPromptError('Mots de passe différents');if(btn){btn.disabled=false;btn.textContent='S\'inscrire'}return}
            const ex=await getDoc(doc(window.firebaseDb,'pseudos',pseudo.toLowerCase()));if(ex.exists()){showPromptError('Pseudo déjà pris');if(btn){btn.disabled=false;btn.textContent='S\'inscrire'}return}
            const cred=await createUserWithEmailAndPassword(window.firebaseAuth,email,pwd);const uid=cred.user.uid;
            await setDoc(doc(window.firebaseDb,'users',uid),{pseudo,email,role:'user',favorites:[],collections:[],notifications:[],friends:[],pendingFriends:[],avatar:null,viewHistory:[],modsViewedSet:[],badgesUnlocked:[],tracksListenedSet:[],totalCollectionsCreated:0});
            await setDoc(doc(window.firebaseDb,'pseudos',pseudo.toLowerCase()),{uid,pseudo,email});
            await setDoc(doc(window.firebaseDb,'emails',email.toLowerCase().replace(/[.#$/\[\]]/g,'_')),{uid,pseudo,email});
            currentUser={uid,pseudo,email,avatar:null,role:'user'};localStorage.setItem(LS_CURRENT_USER,pseudo);favorites=[];collections=[];notifications=[];friends=[];pendingFriends=[];viewHistory=[];modsViewedSet=new Set();badgesUnlocked=[];tracksListenedSet=new Set();totalCollectionsCreated=0;
            showToast('info',`🎉 Bienvenue ${pseudo} !`);
    }else{
        const pd=await getDoc(doc(window.firebaseDb,'pseudos',pseudo.toLowerCase()));
        if(!pd.exists()){showPromptError('Compte inexistant');if(btn){btn.disabled=false;btn.textContent='Se connecter'}return}
        const re=pd.data().email;if(!re){showPromptError('Pas d\'email associé');if(btn){btn.disabled=false;btn.textContent='Se connecter'}return}
        const cred=await signInWithEmailAndPassword(window.firebaseAuth,re,pwd);const uid=cred.user.uid;
        const ud=await getDoc(doc(window.firebaseDb,'users',uid));if(!ud.exists()){showPromptError('Introuvable');if(btn){btn.disabled=false;btn.textContent='Se connecter'}return}
        const d=ud.data();
        currentUser={uid,pseudo:d.pseudo,email:d.email,avatar:d.avatar||null,role:d.role||'user'};
        localStorage.setItem(LS_CURRENT_USER,d.pseudo);
        favorites=d.favorites||[];
        collections=d.collections||[];
        notifications=d.notifications||[];
        friends=d.friends||[];
        pendingFriends=d.pendingFriends||[];
        viewHistory=d.viewHistory||[];
        modsViewedSet=new Set(Array.isArray(d.modsViewedSet)?d.modsViewedSet:[]);
        badgesUnlocked=d.badgesUnlocked||[];
        tracksListenedSet=new Set(Array.isArray(d.tracksListenedSet)?d.tracksListenedSet:[]);
        totalCollectionsCreated=d.totalCollectionsCreated||0;

        // Migration : sauvegarder les nouveaux champs si absents dans l'ancien compte
    if(d.viewHistory===undefined||d.modsViewedSet===undefined||d.badgesUnlocked===undefined||d.tracksListenedSet===undefined||d.totalCollectionsCreated===undefined){
        try{
            await window.firebaseFn.updateDoc(doc(window.firebaseDb,'users',uid),{
                viewHistory:viewHistory,
                modsViewedSet:[...modsViewedSet],
                badgesUnlocked:badgesUnlocked,
                tracksListenedSet:[...tracksListenedSet],
                totalCollectionsCreated:totalCollectionsCreated
            });
        }catch(err){console.error('Migration error:',err)}
    }
    showToast('info',`👋 Rebonjour ${d.pseudo} !`);
}
        updateUserBadge();updateTabCounts();updateBellBadge();updateFriendsBadge();if(currentTab==='favorites')renderFavorites();if(currentTab==='collections')renderCollections();renderMods();renderRecommendations();closePromptModal();setupRealtimeSync();setupCoCollectionsSync();initBadgesSystem();setTimeout(()=>checkFavoritedModUpdates(),1500);
    }catch(e){
        console.error('Auth full error:',e);
        let msg='Erreur';
        if(e.code==='auth/email-already-in-use')msg='Email déjà utilisé';
        else if(e.code==='auth/wrong-password'||e.code==='auth/invalid-credential')msg='Mot de passe incorrect';
        else if(e.code==='auth/user-not-found')msg='Compte inexistant';
        else if(e.code==='auth/weak-password')msg='Mot de passe trop faible';
        else if(e.code==='auth/invalid-email')msg='Email invalide';
        else if(e.code==='auth/network-request-failed')msg='Erreur réseau';
        else if(e.code==='auth/too-many-requests')msg='Trop de tentatives';
        else msg=e.message||'Erreur inconnue';
        showPromptError(msg);
        if(btn){btn.disabled=false;btn.textContent=mode==='register'?'S\'inscrire':'Se connecter'}
    }
}

async function doForgotPassword(){
    const input=document.getElementById('forgotInput').value.trim();if(!input){showPromptError('Entrez pseudo ou email');return}
    const{sendPasswordResetEmail,doc,getDoc}=window.firebaseFn;let email=input;
    if(!input.includes('@')){try{const pd=await getDoc(doc(window.firebaseDb,'pseudos',input.toLowerCase()));if(!pd.exists()){showPromptError('Pseudo inexistant');return}email=pd.data().email;if(!email){showPromptError('Pas d\'email');return}}catch(e){showPromptError('Erreur');return}}
    try{await sendPasswordResetEmail(window.firebaseAuth,email);document.getElementById('promptError').classList.remove('visible');document.getElementById('promptExtraContent').innerHTML=`<div class="form-success">✅ Email envoyé à <strong>${escapeHtml(email)}</strong>. Vérifiez vos spams.</div>`}catch(e){if(e.code==='auth/user-not-found')showPromptError('Aucun compte');else showPromptError(e.message)}
}

async function logout(){
    if(!currentUser)return;
    try{await window.firebaseFn.signOut(window.firebaseAuth)}catch(e){}
    if(realtimeUnsubscribe){realtimeUnsubscribe();realtimeUnsubscribe=null}
    if(coCollectionsUnsubscribe){coCollectionsUnsubscribe();coCollectionsUnsubscribe=null}
    coCollections=[];
    currentUser=null;
    localStorage.removeItem(LS_CURRENT_USER);
    favorites=[]; collections=[]; notifications=[]; friends=[]; pendingFriends=[];
    viewHistory=[]; modsViewedSet=new Set(); badgesUnlocked=[]; tracksListenedSet=new Set();
    totalCollectionsCreated=0; badgesInitialized=false;
    updateUserBadge(); updateTabCounts(); updateBellBadge(); updateFriendsBadge();
    if(currentTab==='favorites')renderFavorites();
    if(currentTab==='collections')renderCollections();
    renderMods(); renderRecommendations(); closeUserDropdown();
    showToast('info','👋 Déconnecté');
}

async function deleteAccount(){
    if(!currentUser)return;
    openPromptModal({title:'🗑️ Supprimer votre compte',hint:`Êtes-vous sûr de vouloir supprimer <strong>${escapeHtml(currentUser.pseudo)}</strong> ? Cette action est irréversible.`,actionsHtml:`<button class="btn-secondary" onclick="closePromptModal()">Annuler</button><button class="btn-primary" style="background:linear-gradient(135deg,var(--mc-redstone),#cc1111)" onclick="doDeleteAccount()">Supprimer définitivement</button>`});
}
async function doDeleteAccount(){
    if(!currentUser)return;const{deleteDoc,doc,deleteUser}=window.firebaseFn;
    try{await deleteUser(window.firebaseAuth.currentUser);await deleteDoc(doc(window.firebaseDb,'users',currentUser.uid));await deleteDoc(doc(window.firebaseDb,'pseudos',currentUser.pseudo.toLowerCase()));closePromptModal();if(realtimeUnsubscribe){realtimeUnsubscribe();realtimeUnsubscribe=null}if(coCollectionsUnsubscribe){coCollectionsUnsubscribe();coCollectionsUnsubscribe=null}coCollections=[];currentUser=null;localStorage.removeItem(LS_CURRENT_USER);favorites=[];collections=[];notifications=[];friends=[];pendingFriends=[];viewHistory=[];modsViewedSet=new Set();badgesUnlocked=[];tracksListenedSet=new Set();totalCollectionsCreated=0;updateUserBadge();updateTabCounts();updateBellBadge();updateFriendsBadge();if(currentTab==='favorites')renderFavorites();if(currentTab==='collections')renderCollections();renderMods();renderRecommendations();closeUserDropdown();showToast('error','🗑️ Compte supprimé')}catch(e){closePromptModal();showToast('error','Erreur. Reconnectez-vous d\'abord puis réessayez.')}
}

// ═══ USER DROPDOWN (avec historique + badges) ═══
function toggleUserDropdown(f){
    if(f===false){userDropdown.classList.remove('open');return}
    if(!currentUser){openAuthModal('login');return}
    closeBellDropdown();
    closeFriendsDropdown();
    const md=document.getElementById('musicDropdown');
    if(md)md.classList.remove('open');
    userDropdown.classList.toggle('open');
    if(userDropdown.classList.contains('open'))renderUserDropdown();
}

function toggleBellDropdown(){
    if(!currentUser){openAuthModal('login');return}
    closeFriendsDropdown();
    closeUserDropdown();
    const md=document.getElementById('musicDropdown');
    if(md)md.classList.remove('open');
    bellDropdown.classList.toggle('open');
    if(bellDropdown.classList.contains('open')){
        const tabsEl=document.getElementById('notifTabs');
        if(isModAdmin()){
            if(tabsEl)tabsEl.style.display='flex';
            notifAdminTab='general';
            document.querySelectorAll('.notif-tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.notiftab==='general'));
            renderBellList();
        }else{
            if(tabsEl)tabsEl.style.display='none';
            renderBellList();
            notifications.forEach(n=>n.read=true);
            saveNotifications();
        }
        updateBellBadge();
    }
}

function toggleFriendsDropdown(){
    if(!currentUser){openAuthModal('login');return}
    closeBellDropdown();
    closeUserDropdown();
    const md=document.getElementById('musicDropdown');
    if(md)md.classList.remove('open');
    const dd=document.getElementById('friendsDropdown');
    dd.classList.toggle('open');
    if(dd.classList.contains('open')){
        document.getElementById('friendSearchInput').value='';
        renderFriendsDropdownList();
    }
}

function toggleMusicDropdown(){
    closeBellDropdown();
    closeFriendsDropdown();
    closeUserDropdown();
    const dd=document.getElementById('musicDropdown');
    dd.classList.toggle('open');
    if(dd.classList.contains('open'))loadMusicList();
}

function closeUserDropdown(){userDropdown.classList.remove('open')}
userBadge.addEventListener('click',e=>{e.stopPropagation();toggleUserDropdown()});

function renderUserDropdown(){
    if(!currentUser)return;
    const unlockedCount=badgesUnlocked.length;
    const historyCount=getViewHistoryUniqueCount();
    let h=`<div class="user-dropdown-header">Connecté</div>`;
    h+=`<div style="padding:0 14px 8px;font-size:14px;font-weight:800">${escapeHtml(currentUser.pseudo)}</div>`;
    h+=`<div class="user-dropdown-divider"></div>`;
    h+=`<button class="user-dropdown-item" onclick="closeUserDropdown();switchTab('favorites')">⭐ Favoris (${favorites.length})</button>`;
    h+=`<button class="user-dropdown-item" onclick="closeUserDropdown();switchTab('collections')">📁 Collections (${collections.length})</button>`;
    h+=`<button class="user-dropdown-item" onclick="openBadgesModal()">🏆 Succès (${unlockedCount}/${BADGE_DEFS.length})</button>`;
    h+=`<button class="user-dropdown-item" onclick="openHistoryModal()">🕐 Historique (${historyCount})</button>`;
    h+=`<button class="user-dropdown-item" onclick="openAvatarUpload()">🖼️ Changer l'avatar</button>`;
    h+=`<div class="user-dropdown-divider"></div>`;
    h+=`<button class="user-dropdown-item" onclick="logout()">🚪 Déconnexion</button>`;
    h+=`<button class="user-dropdown-item danger" onclick="deleteAccount()">🗑️ Supprimer</button>`;
    userDropdown.innerHTML=h;
}

// Résout la cible numérique d'un badge (gère la sentinelle 'ALL_TRACKS' pour éviter une référence
// à MUSIC_PLAYLIST avant sa déclaration plus bas dans le fichier).
function badgeTarget(bd){return bd.target==='ALL_TRACKS'?MUSIC_PLAYLIST.length:bd.target}

// Grille de badges réutilisable pour le modal "Vos succès", avec jauge de progression par palier.
function badgeGridHTML(unlockedIds,stats){
    return`<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;max-height:400px;overflow-y:auto;overflow-x:hidden;padding-right:6px;box-sizing:border-box;width:100%">${BADGE_DEFS.map(bd=>{
        const unlocked=unlockedIds.includes(bd.id);
        let progressBar='';
        if(!unlocked&&bd.metric&&stats){
            const target=badgeTarget(bd);
            const current=Math.min(stats[bd.metric]||0,target);
            const pct=target>0?Math.round((current/target)*100):0;
            progressBar=`<div style="margin-top:6px"><div style="height:5px;background:var(--bg-input);border-radius:3px;overflow:hidden"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--mc-green),var(--mc-diamond));transition:width .6s ease"></div></div><div style="font-size:9.5px;color:var(--text-muted);margin-top:3px;font-weight:700">${current}/${target}</div></div>`;
        }
        return`<div style="padding:12px;border-radius:12px;background:var(--bg-secondary);border:1px solid ${unlocked?'var(--mc-gold)':'var(--border-color)'};display:flex;align-items:center;gap:10px;min-width:0;box-sizing:border-box;overflow:hidden;${!unlocked?'opacity:0.6':''}">
            <div style="font-size:24px;flex-shrink:0;line-height:1;${!unlocked?'filter:grayscale(1)':''}">${bd.icon}</div>
            <div style="flex:1;min-width:0;overflow:hidden">
                <div style="font-size:12px;font-weight:800;color:${unlocked?'var(--mc-gold)':'var(--text-primary)'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${bd.name}</div>
                <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${bd.desc}</div>
                ${progressBar}
            </div>
        </div>`;
    }).join('')}</div>`;
}

function openBadgesModal(){
    closeUserDropdown();
    const unlockedCount=badgesUnlocked.length;
    const progressPct=Math.round((unlockedCount/BADGE_DEFS.length)*100);

    let content=`<div style="margin-bottom:20px;width:100%;box-sizing:border-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px;font-weight:700;color:var(--text-secondary)">
            <span>Progression globale</span><span>${unlockedCount}/${BADGE_DEFS.length}</span>
        </div>
        <div style="height:8px;background:var(--bg-secondary);border-radius:4px;overflow:hidden">
            <div style="width:${progressPct}%;height:100%;background:linear-gradient(90deg,var(--mc-green),var(--mc-gold));transition:width .8s ease"></div>
        </div>
    </div>`;
    content+=badgeGridHTML(badgesUnlocked,getBadgeStats());

    openPromptModal({
        title:`🏆 Vos succès`,
        hint:'Consultez vos accomplissements sur MineMods.',
        extraContent:content,
        actionsHtml:`<button class="btn-primary" onclick="closePromptModal()">Fermer</button>`
    });
}

function openHistoryModal(){
    closeUserDropdown();
    if(pruneViewHistory())fbSaveCurrentUserData();
    let content='';
    if(viewHistory.length===0){
        content=`<div style="text-align:center;padding:40px 20px;color:var(--text-muted)"><div style="font-size:48px;margin-bottom:12px;opacity:.4">🕐</div><div style="font-size:14px">Aucun téléchargement pour le moment.</div><div style="font-size:12px;margin-top:8px">Cliquez sur "CurseForge" ou "Modrinth" d'un mod pour l'ajouter à votre historique !</div></div>`;
    }else{
        content=`<div style="max-height:450px;overflow-y:auto;padding-right:4px">`;
        content+=viewHistory.map(entry=>{
            const m=MODS_DATABASE.find(x=>x.id===entry.modId);
            if(!m)return'';
            const platform=entry.platform==='modrinth'?'modrinth':'curseforge';
            const platformLabel=platform==='modrinth'?'Modrinth':'CurseForge';
            const platformIcon=platform==='modrinth'?'./images/modrinth/modrinth.png':'./images/curseforge/curseforge.png';
            return`<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;background:var(--bg-secondary);border:1px solid var(--border-color);margin-bottom:6px;cursor:pointer;transition:var(--transition)" onclick="closePromptModal();openModal(${m.id})" onmouseover="this.style.borderColor='var(--mc-green)'" onmouseout="this.style.borderColor='var(--border-color)'"><img src="${getModImageUrl(m)}" alt="" style="width:40px;height:40px;border-radius:8px;object-fit:cover;flex-shrink:0;background:var(--bg-card)" onerror="this.onerror=null;this.src='${getImageFallback()}'"><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(m.name)}</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">${m.categories.slice(0,2).map(c=>getCategoryLabel(c)).join(' · ')}</div></div><div style="font-size:11px;color:var(--text-muted);flex-shrink:0;text-align:right"><div style="display:flex;align-items:center;justify-content:flex-end;gap:5px"><img src="${platformIcon}" alt="" style="width:12px;height:12px;object-fit:contain" onerror="this.style.display='none'">${platformLabel}</div><div style="margin-top:2px">${formatHistoryRelativeTime(entry.timestamp)}</div></div></div>`;
        }).join('');
        content+=`</div>`;
    }
    const actions=viewHistory.length>0?`<button class="btn-secondary" onclick="clearHistory()">🗑️ Effacer tout</button><button class="btn-primary" onclick="closePromptModal()">Fermer</button>`:`<button class="btn-primary" onclick="closePromptModal()">Fermer</button>`;
    openPromptModal({title:'🕐 Historique de téléchargements',hint:`${viewHistory.length} mod${viewHistory.length>1?'s':''} téléchargé${viewHistory.length>1?'s':''} depuis CurseForge ou Modrinth · conservé 7 jours.`,extraContent:content,actionsHtml:actions});
}

function clearHistory(){
    openPromptModal({title:'🗑️ Effacer l\'historique',hint:'Êtes-vous sûr de vouloir supprimer tout votre historique de téléchargements ? Cette action est irréversible.',actionsHtml:`<button class="btn-secondary" onclick="openHistoryModal()">← Retour</button><button class="btn-primary" style="background:linear-gradient(135deg,var(--mc-redstone),#cc1111)" onclick="doClearHistory()">Effacer tout</button>`});
}

async function doClearHistory(){
    viewHistory=[];
    await fbSaveCurrentUserData();
    closePromptModal();
    showToast('info','🗑️ Historique effacé');
}

function updateUserBadge(){if(currentUser){userPseudoEl.textContent=currentUser.pseudo;if(currentUser.avatar){userAvatar.innerHTML=`<img src="${currentUser.avatar}" style="width:100%;height:100%;object-fit:cover">`}else{userAvatar.innerHTML='';userAvatar.textContent=currentUser.pseudo.charAt(0).toUpperCase()}userBadge.classList.add('logged-in')}else{userPseudoEl.textContent='Se connecter';userAvatar.innerHTML='';userAvatar.textContent='?';userBadge.classList.remove('logged-in')}updateAdminModBtn()}

// ═══ AVATAR ═══
function openAvatarUpload(){closeUserDropdown();openPromptModal({title:'🖼️ Changer votre avatar',hint:'Choisissez une image (max 200 Ko).',extraContent:`<div style="display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:20px"><div id="avatarPreviewLarge" style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,var(--mc-green),var(--mc-diamond));display:flex;align-items:center;justify-content:center;font-size:44px;color:white;font-weight:800;overflow:hidden;border:3px solid var(--border-color)">${currentUser.avatar?`<img src="${currentUser.avatar}" style="width:100%;height:100%;object-fit:cover">`:currentUser.pseudo.charAt(0).toUpperCase()}</div></div>`,inputsHtml:`<input type="file" id="avatarFileInput" accept="image/*" style="margin-bottom:12px" onchange="previewAvatar(this)">`,actionsHtml:`<button class="btn-secondary" onclick="removeAvatar()">Supprimer</button><button class="btn-primary" onclick="saveAvatar()">Enregistrer</button>`})}
function previewAvatar(input){const f=input.files[0];if(!f)return;if(f.size>200000){showPromptError('Max 200 Ko');return}const r=new FileReader();r.onload=function(e){document.getElementById('avatarPreviewLarge').innerHTML=`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;window._pendingAvatar=e.target.result};r.readAsDataURL(f)}
async function saveAvatar(){if(!window._pendingAvatar){showPromptError('Choisissez une image');return}currentUser.avatar=window._pendingAvatar;try{await window.firebaseFn.updateDoc(window.firebaseFn.doc(window.firebaseDb,'users',currentUser.uid),{avatar:currentUser.avatar});updateUserBadge();showToast('info','✅ Avatar mis à jour');closePromptModal()}catch(e){showPromptError(e.message)}window._pendingAvatar=null}
async function removeAvatar(){currentUser.avatar=null;try{await window.firebaseFn.updateDoc(window.firebaseFn.doc(window.firebaseDb,'users',currentUser.uid),{avatar:null});updateUserBadge();showToast('info','Avatar supprimé');closePromptModal()}catch(e){showPromptError('Erreur')}}

// ═══ NOTIFICATIONS ═══
async function createNotification(target,notif){const{doc,updateDoc,arrayUnion}=window.firebaseFn;const u=await fbGetUser(target);if(!u)return false;try{await updateDoc(doc(window.firebaseDb,'users',u.uid),{notifications:arrayUnion({id:Date.now()+Math.floor(Math.random()*10000),read:false,timestamp:Date.now(),...notif})});return true}catch(e){return false}}
function updateBellBadge(){if(!currentUser){bellBadge.classList.remove('visible');bellBtn.classList.remove('has-notif');const dg=document.getElementById('notifDotGeneral'),dr=document.getElementById('notifDotModRequest');if(dg)dg.classList.remove('visible');if(dr)dr.classList.remove('visible');return}const u=notifications.filter(n=>!n.read).length;if(u>0){bellBadge.textContent=u>9?'9+':String(u);bellBadge.classList.toggle('wide',u>9);bellBadge.classList.add('visible');bellBtn.classList.add('has-notif')}else{bellBadge.classList.remove('visible');bellBtn.classList.remove('has-notif')}const dotGeneral=document.getElementById('notifDotGeneral');const dotModRequest=document.getElementById('notifDotModRequest');if(dotGeneral)dotGeneral.classList.toggle('visible',notifications.some(n=>!n.read&&n.type!=='mod-request'));if(dotModRequest)dotModRequest.classList.toggle('visible',notifications.some(n=>!n.read&&n.type==='mod-request'))}
function toggleBellDropdown(){
    if(!currentUser){openAuthModal('login');return}
    closeFriendsDropdown();
    closeUserDropdown();
    const md=document.getElementById('musicDropdown');
    if(md)md.classList.remove('open');
    bellDropdown.classList.toggle('open');if(bellDropdown.classList.contains('open')){const tabsEl=document.getElementById('notifTabs');if(isModAdmin()){if(tabsEl)tabsEl.style.display='flex';notifAdminTab='general';document.querySelectorAll('.notif-tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.notiftab==='general'));renderBellList()}else{if(tabsEl)tabsEl.style.display='none';renderBellList();notifications.forEach(n=>n.read=true);saveNotifications()}updateBellBadge()}}
function closeBellDropdown(){bellDropdown.classList.remove('open')}
bellBtn.addEventListener('click',e=>{e.stopPropagation();toggleBellDropdown()});
let notifAdminTab='general';
function switchNotifTab(tab){notifAdminTab=tab;document.querySelectorAll('.notif-tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.notiftab===tab));renderBellList()}
document.getElementById('clearAllNotifs').addEventListener('click',async()=>{if(!confirm('Tout effacer ?'))return;if(isModAdmin()){notifications=notifications.filter(n=>notifAdminTab==='mod-request'?n.type!=='mod-request':n.type==='mod-request')}else{notifications=[]}await fbSaveCurrentUserData();updateBellBadge();renderBellList()});
function formatRelativeTime(ts){const d=Date.now()-ts;const s=Math.floor(d/1000);if(s<60)return'à l\'instant';const m=Math.floor(s/60);if(m<60)return`il y a ${m} min`;const h=Math.floor(m/60);if(h<24)return`il y a ${h}h`;return`il y a ${Math.floor(h/24)}j`}
function formatHistoryRelativeTime(ts){const h=(Date.now()-ts)/3600000;if(h<24)return'Il y a moins de 24h';const days=Math.min(HISTORY_MAX_DAYS,Math.max(1,Math.floor(h/24)));return`Il y a ${days} jour${days>1?'s':''}`}
// Liste de ROUTAGE uniquement : à qui envoyer les suggestions de mods.
// Ce n'est PAS une vérification de sécurité — voir isModAdmin() ci-dessous,
// qui elle repose sur le champ Firestore "role", protégé côté règles.
const MOD_REQUEST_RECIPIENTS=['QuinTus','Pouicpouic'];
function isModAdmin(){return!!(currentUser&&currentUser.role==='admin')}
function notifItemHTML(n){let t='',d='',a='';const dismissCall=isModAdmin()?`ackNotif(${n.id})`:`dismissNotif(${n.id})`;if(n.type==='share-offer'){t=`📤 ${escapeHtml(n.from)} partage`;d=`<strong>« ${escapeHtml(n.data.name)} »</strong>`;a=`<button class="notif-btn accept" onclick="acceptShare(${n.id})">✓</button><button class="notif-btn reject" onclick="rejectShare(${n.id})">✕</button>`}else if(n.type==='import-request'){t=`📥 ${escapeHtml(n.from)} demande`;d=`<strong>« ${escapeHtml(n.data.collectionName)} »</strong>`;a=`<button class="notif-btn accept" onclick="acceptImport(${n.id})">✓</button><button class="notif-btn reject" onclick="rejectImport(${n.id})">✕</button>`}else if(n.type==='accepted'){t=`✅ Accepté`;d=`${escapeHtml(n.from)} : <strong>${escapeHtml(n.data.collectionName)}</strong>`;a=`<button class="notif-btn dismiss" onclick="${dismissCall}">OK</button>`}else if(n.type==='rejected'){t=`❌ Refusé`;d=`${escapeHtml(n.from)}`;a=`<button class="notif-btn dismiss" onclick="${dismissCall}">OK</button>`}else if(n.type==='friend-request'){t=`👋 ${escapeHtml(n.from)} veut être ami`;d=`Onglet Amis (icône 👥) pour accepter.`;a=`<button class="notif-btn dismiss" onclick="${dismissCall}">OK</button>`}else if(n.type==='friend-accepted'){t=`✅ ${escapeHtml(n.from)} est votre ami`;d=`Vous pouvez partager des collections.`;a=`<button class="notif-btn dismiss" onclick="${dismissCall}">OK</button>`}else if(n.type==='mod-request'){t=`🧩 ${escapeHtml(n.from)} propose un mod`;d=`<strong>« ${escapeHtml(n.data.modName)} »</strong>`;a=`<button class="notif-btn dismiss" onclick="${dismissCall}">OK</button>`}else if(n.type==='co-invite'){t=`🤝 ${escapeHtml(n.from)} vous a ajouté`;d=`Collection collaborative : <strong>${escapeHtml(n.data.collectionName)}</strong>`;a=`<button class="notif-btn dismiss" onclick="${dismissCall}">OK</button>`}else if(n.type==='mod-updated'){t=`🔄 Mise à jour disponible`;d=`<strong>${escapeHtml(n.data.modName)}</strong>${n.data.note?` — ${escapeHtml(n.data.note)}`:''}`;a=`<button class="notif-btn accept" onclick="closeBellDropdown();openModal(${n.data.modId})">Voir</button><button class="notif-btn dismiss" onclick="${dismissCall}">OK</button>`}if(n.acked)a=`<span class="notif-acked">✔ Traité</span>`;return`<div class="notif-item ${!n.read?'unread':''} ${n.acked?'acked':''}"><div class="notif-title">${t}</div><div class="notif-desc">${d}</div><div class="notif-time">${formatRelativeTime(n.timestamp)}</div><div class="notif-actions">${a}</div></div>`}
function renderBellList(){const tabsEl=document.getElementById('notifTabs');if(isModAdmin()){if(tabsEl)tabsEl.style.display='flex';const filtered=notifAdminTab==='mod-request'?notifications.filter(n=>n.type==='mod-request'):notifications.filter(n=>n.type!=='mod-request');if(filtered.length===0){bellList.innerHTML=`<div class="dropdown-empty"><div class="dropdown-empty-icon">🔔</div>Aucune notification</div>`;return}bellList.innerHTML=filtered.map(notifItemHTML).join('')}else{if(tabsEl)tabsEl.style.display='none';if(notifications.length===0){bellList.innerHTML=`<div class="dropdown-empty"><div class="dropdown-empty-icon">🔔</div>Aucune notification</div>`;return}bellList.innerHTML=notifications.map(notifItemHTML).join('')}}
async function dismissNotif(id){notifications=notifications.filter(n=>n.id!==id);await fbSaveCurrentUserData();updateBellBadge();renderBellList()}
async function ackNotif(id){const n=notifications.find(x=>x.id===id);if(!n)return;n.read=true;n.acked=true;await fbSaveCurrentUserData();updateBellBadge();renderBellList()}

// ═══ SHARE / IMPORT ═══
function isFriend(p){return friends.some(f=>f.pseudo.toLowerCase()===p.toLowerCase())}
async function shareCollection(cid){if(!currentUser)return;const col=collections.find(c=>c.id===cid);if(!col)return;const fl=friends.map(f=>`<div class="friend-item" onclick="document.getElementById('shareRecipient').value='${escapeHtml(f.pseudo).replace(/'/g,"\\'")}'"><div class="avatar-circle">${escapeHtml(f.pseudo.charAt(0).toUpperCase())}</div><div class="name">${escapeHtml(f.pseudo)}</div></div>`).join('');openPromptModal({title:`📤 Partager « ${col.name} »`,hint:'Choisissez un <strong>ami</strong>.',extraContent:friends.length>0?`<div class="friends-list">${fl}</div>`:'<div style="color:var(--text-muted);font-size:13px;margin-bottom:14px">Ajoutez des amis d\'abord (icône 👥).</div>',inputsHtml:`<input type="text" class="prompt-input" id="shareRecipient" placeholder="Pseudo d'un ami" autocomplete="off">`,actionsHtml:`<button class="btn-secondary" onclick="closePromptModal()">Annuler</button><button class="btn-primary" onclick="doShare(${cid})">Partager</button>`,onOpen:()=>{const el=document.getElementById('shareRecipient');if(el)el.focus()}})}
async function doShare(cid){const v=document.getElementById('shareRecipient').value.trim();if(!v){showPromptError('Pseudo requis');return}if(v.toLowerCase()===currentUser.pseudo.toLowerCase()){showPromptError('Pas vous-même');return}if(!isFriend(v)){showPromptError(`⚠️ ${v} n'est pas votre ami`);return}const t=await fbGetUser(v);if(!t){showPromptError('Introuvable');return}const col=collections.find(c=>c.id===cid);if(!col)return;if(await createNotification(t.pseudo,{type:'share-offer',from:currentUser.pseudo,data:{name:col.name,modIds:[...col.modIds]}})){showToast('info',`✅ Partage envoyé`);closePromptModal()}else showPromptError('Erreur')}
async function acceptShare(nid){const n=notifications.find(x=>x.id===nid);if(!n)return;collections.push({id:Date.now()+Math.floor(Math.random()*10000),name:n.data.name,modIds:[...n.data.modIds],owner:currentUser.pseudo,imported:true,sharedFrom:n.from});n.data.modIds.forEach(mid=>bumpModStat(mid,'collCount',1,true));notifications=notifications.filter(x=>x.id!==nid);await fbSaveCurrentUserData();await createNotification(n.from,{type:'accepted',from:currentUser.pseudo,data:{collectionName:n.data.name}});updateTabCounts();updateBellBadge();renderBellList();if(currentTab==='collections')renderCollections();showToast('info','✅ Ajouté')}
async function rejectShare(nid){const n=notifications.find(x=>x.id===nid);if(!n)return;notifications=notifications.filter(x=>x.id!==nid);await fbSaveCurrentUserData();await createNotification(n.from,{type:'rejected',from:currentUser.pseudo,data:{collectionName:n.data.name}});updateBellBadge();renderBellList()}
function openImportPrompt(){if(!currentUser){openAuthModal('login');return}const fl=friends.map(f=>`<div class="friend-item" onclick="document.getElementById('importFrom').value='${escapeHtml(f.pseudo).replace(/'/g,"\\'")}'"><div class="avatar-circle">${escapeHtml(f.pseudo.charAt(0).toUpperCase())}</div><div class="name">${escapeHtml(f.pseudo)}</div></div>`).join('');openPromptModal({title:'📥 Importer',hint:'Étape 1/2 : choisissez un <strong>ami</strong>.',extraContent:friends.length>0?`<div class="friends-list">${fl}</div>`:'<div style="color:var(--text-muted);font-size:13px;margin-bottom:14px">Ajoutez des amis d\'abord.</div>',inputsHtml:`<input type="text" class="prompt-input" id="importFrom" placeholder="Pseudo d'un ami" autocomplete="off">`,actionsHtml:`<button class="btn-secondary" onclick="closePromptModal()">Annuler</button><button class="btn-primary" onclick="chooseImportCol()">Suivant →</button>`,onOpen:()=>{const el=document.getElementById('importFrom');if(el)el.focus()}})}

function openExportPrompt(){
    if(!currentUser){openAuthModal('login');return}
    if(collections.filter(c=>!c.imported).length===0){showToast('warning','⚠️ Aucune collection à exporter');return}
    const fl=friends.map(f=>`<div class="friend-item" onclick="document.getElementById('exportTo').value='${escapeHtml(f.pseudo).replace(/'/g,"\\'")}'"><div class="avatar-circle">${escapeHtml(f.pseudo.charAt(0).toUpperCase())}</div><div class="name">${escapeHtml(f.pseudo)}</div></div>`).join('');
    openPromptModal({title:'📤 Exporter vers un ami',hint:'Étape 1/2 : choisissez un <strong>ami</strong>.',extraContent:friends.length>0?`<div class="friends-list">${fl}</div>`:'<div style="color:var(--text-muted);font-size:13px;margin-bottom:14px">Ajoutez des amis d\'abord.</div>',inputsHtml:`<input type="text" class="prompt-input" id="exportTo" placeholder="Pseudo d'un ami" autocomplete="off">`,actionsHtml:`<button class="btn-secondary" onclick="closePromptModal()">Annuler</button><button class="btn-primary" onclick="chooseExportCol()">Suivant →</button>`,onOpen:()=>{const el=document.getElementById('exportTo');if(el)el.focus()}})
}
async function chooseExportCol(){
    const v=document.getElementById('exportTo').value.trim();
    if(!v){showPromptError('Pseudo requis');return}
    if(v.toLowerCase()===currentUser.pseudo.toLowerCase()){showPromptError('Pas vous-même');return}
    if(!isFriend(v)){showPromptError(`⚠️ ${v} n'est pas votre ami`);return}
    const t=await fbGetUser(v);
    if(!t){showPromptError('Introuvable');return}
    const mc=collections.filter(c=>!c.imported);
    if(mc.length===0){showPromptError('Aucune collection à exporter');return}
    selectedExportTarget=t.pseudo;
    openPromptModal({title:'📤 Exporter',hint:`Étape 2/2 : choisissez la collection à envoyer à <strong>${escapeHtml(t.pseudo)}</strong>.`,extraContent:`<div class="collection-picker-list">${mc.map(c=>`<div class="collection-picker-item" data-colid="${c.id}" onclick="selectPickerItem(this)"><div class="collection-picker-icon">📁</div><div class="collection-picker-info"><div class="collection-picker-name">${escapeHtml(c.name)}</div><div class="collection-picker-meta">${c.modIds.length} mod${c.modIds.length>1?'s':''}</div></div><div class="collection-picker-check"></div></div>`).join('')}</div>`,actionsHtml:`<button class="btn-secondary" onclick="openExportPrompt()">← Retour</button><button class="btn-primary" onclick="doExportCollection()">Envoyer</button>`})
}
async function doExportCollection(){
    if(!selectedPickerColId){showPromptError('Choisissez');return}
    const col=collections.find(c=>c.id===selectedPickerColId);
    if(!col||!selectedExportTarget)return;
    if(await createNotification(selectedExportTarget,{type:'share-offer',from:currentUser.pseudo,data:{name:col.name,modIds:[...col.modIds]}})){
        showToast('info',`✅ Envoyé à ${selectedExportTarget}`);
        selectedPickerColId=null;selectedExportTarget=null;closePromptModal();
    }else showPromptError('Erreur')
}
async function chooseImportCol(){const v=document.getElementById('importFrom').value.trim();if(!v){showPromptError('Pseudo requis');return}if(!isFriend(v)){showPromptError(`⚠️ ${v} n'est pas votre ami`);return}const t=await fbGetUser(v);if(!t){showPromptError('Introuvable');return}const fc=(t.collections||[]).filter(c=>!c.imported);if(fc.length===0){showPromptError('Aucune collection');return}openPromptModal({title:'📥 Choisir',hint:`Étape 2/2 : collection de <strong>${escapeHtml(t.pseudo)}</strong>.`,extraContent:`<div class="collection-picker-list">${fc.map(c=>`<div class="collection-picker-item" data-colid="${c.id}" onclick="selectPickerItem(this)"><div class="collection-picker-icon">📁</div><div class="collection-picker-info"><div class="collection-picker-name">${escapeHtml(c.name)}</div><div class="collection-picker-meta">${c.modIds.length} mod${c.modIds.length>1?'s':''}</div></div><div class="collection-picker-check"></div></div>`).join('')}</div>`,actionsHtml:`<button class="btn-secondary" onclick="openImportPrompt()">← Retour</button><button class="btn-primary" onclick="doRequestImport('${escapeHtml(t.pseudo).replace(/'/g,"\\'")}')">Demander</button>`})}
function selectPickerItem(el){document.querySelectorAll('.collection-picker-item').forEach(i=>i.classList.remove('selected'));el.classList.add('selected');selectedPickerColId=parseInt(el.dataset.colid)}
async function doRequestImport(fp){if(!selectedPickerColId){showPromptError('Choisissez');return}const t=await fbGetUser(fp);if(!t)return;const col=(t.collections||[]).find(c=>c.id===selectedPickerColId);if(!col)return;if(await createNotification(fp,{type:'import-request',from:currentUser.pseudo,data:{collectionId:col.id,collectionName:col.name}})){showToast('info','✅ Demande envoyée');selectedPickerColId=null;closePromptModal()}}
async function acceptImport(nid){const n=notifications.find(x=>x.id===nid);if(!n)return;const col=collections.find(c=>c.id===n.data.collectionId&&!c.imported);if(!col){notifications=notifications.filter(x=>x.id!==nid);await fbSaveCurrentUserData();updateBellBadge();renderBellList();return}const t=await fbGetUser(n.from);if(!t)return;const{doc,updateDoc,arrayUnion}=window.firebaseFn;try{await updateDoc(doc(window.firebaseDb,'users',t.uid),{collections:arrayUnion({id:Date.now()+Math.floor(Math.random()*10000),name:col.name,modIds:[...col.modIds],owner:t.pseudo,imported:true,sharedFrom:currentUser.pseudo})})}catch(e){return}await createNotification(n.from,{type:'accepted',from:currentUser.pseudo,data:{collectionName:col.name}});notifications=notifications.filter(x=>x.id!==nid);await fbSaveCurrentUserData();updateBellBadge();renderBellList();showToast('info','✅ Envoyé')}
async function rejectImport(nid){const n=notifications.find(x=>x.id===nid);if(!n)return;notifications=notifications.filter(x=>x.id!==nid);await fbSaveCurrentUserData();await createNotification(n.from,{type:'rejected',from:currentUser.pseudo,data:{collectionName:n.data.collectionName}});updateBellBadge();renderBellList()}

// ═══ FRIENDS ═══
function toggleFriendsDropdown(){
    if(!currentUser){openAuthModal('login');return}
    closeBellDropdown();
    closeUserDropdown();
    const md=document.getElementById('musicDropdown');
    if(md)md.classList.remove('open');
    const dd=document.getElementById('friendsDropdown');dd.classList.toggle('open');if(dd.classList.contains('open')){document.getElementById('friendSearchInput').value='';renderFriendsDropdownList()}}
function closeFriendsDropdown(){document.getElementById('friendsDropdown').classList.remove('open')}
document.getElementById('friendsBtn').addEventListener('click',e=>{e.stopPropagation();toggleFriendsDropdown()});
function renderFriendsDropdownList(){const list=document.getElementById('friendsDropdownList');const q=(document.getElementById('friendSearchInput').value||'').trim().toLowerCase();if(!currentUser){list.innerHTML=`<div class="dropdown-empty">🔐 Connectez-vous</div>`;return}let h='';const received=pendingFriends.filter(p=>p.direction==='received');if(received.length>0&&!q){h+=`<div class="friend-search-section-title">📬 Demandes (${received.length})</div>`;h+=received.map(p=>`<div class="friend-item" style="border-left:3px solid var(--mc-gold)"><div class="avatar-circle">${escapeHtml(p.pseudo.charAt(0).toUpperCase())}</div><div style="flex:1"><div class="name">${escapeHtml(p.pseudo)}</div><div class="subtitle">Veut être votre ami</div></div><div style="display:flex;gap:4px"><button class="friend-card-btn accept-btn" onclick="acceptFriend('${escapeHtml(p.pseudo).replace(/'/g,"\\'")}')">✓</button><button class="friend-card-btn reject-btn" onclick="rejectFriend('${escapeHtml(p.pseudo).replace(/'/g,"\\'")}')">✕</button></div></div>`).join('')}const ff=q?friends.filter(f=>f.pseudo.toLowerCase().includes(q)):friends;if(ff.length>0){h+=`<div class="friend-search-section-title">Amis (${ff.length})</div>`;h+=ff.map(f=>`<div class="friend-item"><div class="avatar-circle">${escapeHtml(f.pseudo.charAt(0).toUpperCase())}</div><div class="name">${q?highlightMatch(f.pseudo,q):escapeHtml(f.pseudo)}</div><button class="friend-card-btn reject-btn" onclick="removeFriend('${escapeHtml(f.pseudo).replace(/'/g,"\\'")}')" title="Retirer" style="margin-left:auto">🗑️</button></div>`).join('')}if(!q&&friends.length===0&&received.length===0)h=`<div class="dropdown-empty"><div class="dropdown-empty-icon">👥</div>Aucun ami. Cliquez ➕.</div>`;if(q&&ff.length===0)h+=`<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:13px">Aucun ami pour « ${escapeHtml(q)} »</div>`;list.innerHTML=h}
function updateFriendsBadge(){const el=document.getElementById('friendsBadge');if(!el)return;const r=pendingFriends.filter(p=>p.direction==='received').length;if(r>0){el.textContent=String(r);el.classList.add('visible');document.getElementById('friendsBtn').classList.add('has-notif')}else{el.classList.remove('visible');document.getElementById('friendsBtn').classList.remove('has-notif')}}
function openAddFriendModal(){if(!requireAuth('ajouter un ami'))return;closeFriendsDropdown();openPromptModal({title:'➕ Ajouter un ami',hint:'Entrez le pseudo de la personne.',inputsHtml:`<input type="text" class="prompt-input" id="addFriendInput" placeholder="Pseudo" autocomplete="off">`,actionsHtml:`<button class="btn-secondary" onclick="closePromptModal()">Annuler</button><button class="btn-primary" onclick="sendFriendRequest()">Envoyer</button>`,onOpen:()=>{const el=document.getElementById('addFriendInput');if(el)el.focus()}})}
function openRequestModModal(){if(!requireAuth('demander l\'ajout d\'un mod'))return;openPromptModal({title:'🧩 Demander un mod',hint:'Indiquez le nom du mod que vous aimeriez voir ajouté au catalogue. Les liens ne sont pas pris en compte.',inputsHtml:`<input type="text" class="prompt-input" id="modRequestInput" placeholder="Nom du mod" autocomplete="off">`,actionsHtml:`<button class="btn-secondary" onclick="closePromptModal()">Annuler</button><button class="btn-primary" onclick="sendModRequest()">Envoyer</button>`,onOpen:()=>{const el=document.getElementById('modRequestInput');if(el)el.focus()}})}
async function sendModRequest(){let v=(document.getElementById('modRequestInput').value||'').trim();if(!v){showPromptError('Nom du mod requis');return}v=v.replace(/https?:\/\/\S+|www\.\S+/gi,'').replace(/\s+/g,' ').trim();if(!v){showPromptError('Nom du mod requis (sans lien)');return}let sentAny=false;for(const admin of MOD_REQUEST_RECIPIENTS){const ok=await createNotification(admin,{type:'mod-request',from:currentUser.pseudo,data:{modName:v}});if(ok)sentAny=true}if(sentAny){showToast('info','✅ Demande envoyée aux administrateurs');closePromptModal()}else showPromptError('Erreur lors de l\'envoi')}
async function sendFriendRequest(){const p=document.getElementById('addFriendInput').value.trim();if(!p){showPromptError('Pseudo requis');return}if(p.toLowerCase()===currentUser.pseudo.toLowerCase()){showPromptError('Pas vous-même');return}if(isFriend(p)){showPromptError('Déjà ami');return}if(pendingFriends.some(x=>x.pseudo.toLowerCase()===p.toLowerCase())){showPromptError('Déjà en cours');return}const t=await fbGetUser(p);if(!t){showPromptError(`"${p}" n'existe pas`);return}const{doc,updateDoc,arrayUnion}=window.firebaseFn;pendingFriends.push({pseudo:t.pseudo,uid:t.uid,direction:'sent',since:Date.now()});await fbSaveCurrentUserData();try{await updateDoc(doc(window.firebaseDb,'users',t.uid),{pendingFriends:arrayUnion({pseudo:currentUser.pseudo,uid:currentUser.uid,direction:'received',since:Date.now()})})}catch(e){showPromptError('Erreur');return}await createNotification(t.pseudo,{type:'friend-request',from:currentUser.pseudo,data:{}});showToast('info',`✅ Demande envoyée à ${t.pseudo}`);closePromptModal();updateFriendsBadge()}
async function acceptFriend(p){const t=await fbGetUser(p);if(!t)return;const{doc,updateDoc}=window.firebaseFn;const now=Date.now();pendingFriends=pendingFriends.filter(x=>x.pseudo.toLowerCase()!==p.toLowerCase());friends.push({pseudo:t.pseudo,uid:t.uid,since:now});await fbSaveCurrentUserData();try{const td=await fbGetUser(p);if(td){await updateDoc(doc(window.firebaseDb,'users',t.uid),{pendingFriends:(td.pendingFriends||[]).filter(x=>x.pseudo.toLowerCase()!==currentUser.pseudo.toLowerCase()),friends:[...(td.friends||[]),{pseudo:currentUser.pseudo,uid:currentUser.uid,since:now}]})}}catch(e){}await createNotification(p,{type:'friend-accepted',from:currentUser.pseudo,data:{}});showToast('info',`✅ Ami avec ${p}`);renderFriendsDropdownList();updateFriendsBadge();updateTabCounts()}
async function rejectFriend(p){const t=await fbGetUser(p);pendingFriends=pendingFriends.filter(x=>x.pseudo.toLowerCase()!==p.toLowerCase());await fbSaveCurrentUserData();if(t){try{const td=await fbGetUser(p);if(td)await window.firebaseFn.updateDoc(window.firebaseFn.doc(window.firebaseDb,'users',t.uid),{pendingFriends:(td.pendingFriends||[]).filter(x=>x.pseudo.toLowerCase()!==currentUser.pseudo.toLowerCase())})}catch(e){}}showToast('info','Refusé');renderFriendsDropdownList();updateFriendsBadge()}
async function removeFriend(p){openPromptModal({title:'👥 Retirer un ami',hint:`Êtes-vous sûr de vouloir retirer <strong>${escapeHtml(p)}</strong> de vos amis ?`,actionsHtml:`<button class="btn-secondary" onclick="closePromptModal()">Annuler</button><button class="btn-primary" style="background:linear-gradient(135deg,var(--mc-redstone),#cc1111)" onclick="doRemoveFriend('${escapeHtml(p).replace(/'/g,"\\'")}')">Retirer</button>`})}
async function doRemoveFriend(p){closePromptModal();const t=await fbGetUser(p);friends=friends.filter(f=>f.pseudo.toLowerCase()!==p.toLowerCase());await fbSaveCurrentUserData();if(t){try{const td=await fbGetUser(p);if(td)await window.firebaseFn.updateDoc(window.firebaseFn.doc(window.firebaseDb,'users',t.uid),{friends:(td.friends||[]).filter(f=>f.pseudo.toLowerCase()!==currentUser.pseudo.toLowerCase())})}catch(e){}}showToast('info',`${p} retiré`);renderFriendsDropdownList();updateFriendsBadge();updateTabCounts()}

// ═══ REALTIME SYNC ═══
function setupRealtimeSync(){if(!currentUser||!currentUser.uid)return;if(realtimeUnsubscribe){realtimeUnsubscribe();realtimeUnsubscribe=null}const{doc,onSnapshot}=window.firebaseFn;realtimeUnsubscribe=onSnapshot(doc(window.firebaseDb,'users',currentUser.uid),snap=>{if(!snap.exists())return;const d=snap.data();const oldNIds=new Set(notifications.map(n=>n.id));const newN=(d.notifications||[]).filter(n=>!oldNIds.has(n.id));favorites=d.favorites||[];collections=d.collections||[];notifications=d.notifications||[];friends=d.friends||[];pendingFriends=d.pendingFriends||[];viewHistory=d.viewHistory||[];modsViewedSet=new Set(Array.isArray(d.modsViewedSet)?d.modsViewedSet:[]);badgesUnlocked=d.badgesUnlocked||[];tracksListenedSet=new Set(Array.isArray(d.tracksListenedSet)?d.tracksListenedSet:[]);totalCollectionsCreated=d.totalCollectionsCreated||0;currentUser.avatar=d.avatar||null;updateTabCounts();updateBellBadge();updateFriendsBadge();updateUserBadge();if(bellDropdown.classList.contains('open'))renderBellList();if(document.getElementById('friendsDropdown').classList.contains('open'))renderFriendsDropdownList();if(currentTab==='favorites')renderFavorites();if(currentTab==='collections')renderCollections();renderRecommendations();const nr=newN.filter(n=>!n.read);if(nr.length>0)showToast('info',`🔔 ${nr.length} nouvelle${nr.length>1?'s':''} notification${nr.length>1?'s':''}`)})}

// ═══ MUSIC PLAYER ═══
const MUSIC_FOLDER='./musics/';
const MUSIC_PLAYLIST=[
    {"name":"Minecraft - Aria Math","file":"aria-math.mp3"},
    {"name":"Minecraft - Beginning 2","file":"beginning-2.mp3"},
    {"name":"Minecraft - Clark","file":"clark.mp3"},
    {"name":"Minecraft - Danny","file":"danny.mp3"},
    {"name":"Minecraft - Door","file":"door.mp3"},
    {"name":"Minecraft - Equinoxe","file":"equinoxe.mp3"},
    {"name":"Minecraft - Moog City 2","file":"moog-city-2.mp3"},
    {"name":"Minecraft - Subwoofer Lullaby","file":"subwoofer-lullaby.mp3"},
    {"name":"Minecraft - Sweden","file":"sweden.mp3"},
    {"name":"Minecraft - Ward","file":"ward.mp3"},
    {"name":"Minecraft - Wet Hands","file":"wet-hands.mp3"},
    {"name":"Minecraft - Haggstrom","file":"haggstrom.mp3"}
];
let musicPlaylist=[];
let musicAudio=null;
let musicCurrentIndex=-1;
let musicEnabled=[];
let musicRepeatOne=-1;
let musicShuffle=false;
let musicHistory=[];
let musicSeeking=false;

function toggleMusicDropdown(){
    closeBellDropdown();
    closeFriendsDropdown();
    closeUserDropdown();
    const dd=document.getElementById('musicDropdown');
    dd.classList.toggle('open');
    if(dd.classList.contains('open'))loadMusicList();
}

function loadMusicList(){
    if(musicPlaylist.length===0){
        musicPlaylist=MUSIC_PLAYLIST;
        musicEnabled=musicPlaylist.map(()=>true);
    }
    const savedVol=localStorage.getItem(LS_MUSIC_VOLUME);
    if(savedVol!==null){const v=parseInt(savedVol,10);if(!isNaN(v))setMusicVolume(v)}
    renderMusicList();
    updateMusicHeaderControls();
}

function renderMusicList(){
    const list=document.getElementById('musicList');
    list.innerHTML=musicPlaylist.map((track,i)=>{
        const isPlaying=musicCurrentIndex===i&&musicAudio&&!musicAudio.paused;
        const isPaused=musicCurrentIndex===i&&musicAudio&&musicAudio.paused;
        const isChecked=musicEnabled[i];
        const isRepeat=musicRepeatOne===i;
        const isLoaded=musicCurrentIndex===i&&musicAudio;
        return`<div class="music-item ${isPlaying||isPaused?'playing':''}" style="${!isChecked&&!isPlaying&&!isPaused?'opacity:0.5':''}">
            <input type="checkbox" ${isChecked?'checked':''} onchange="toggleMusicEnabled(${i})" style="width:16px;height:16px;cursor:pointer;accent-color:var(--mc-green-light);flex-shrink:0" aria-label="Activer ${escapeHtml(track.name)}">
            <span class="music-item-name" onclick="playMusicTrack(${i})" style="cursor:pointer">${escapeHtml(track.name||track.file)}</span>
            <span class="music-item-time" id="musicTime-${i}">${isLoaded?getTrackTimeLabel():''}</span>
            <button class="music-btn ${isPlaying?'active':''}" onclick="playMusicTrack(${i})" title="${isPlaying?'Pause':'Lecture'}" aria-label="${isPlaying?'Pause':'Lecture'}">${isPlaying?'<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/></svg>':'<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="7 4 20 12 7 20"/></svg>'}</button>
            <button class="music-btn-flat ${isRepeat?'repeat-active':''}" onclick="toggleMusicRepeat(${i})" title="${isRepeat?'Répétition activée':'Répéter ce titre'}" aria-label="Répéter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 8 16 8"/></svg></button>
        </div>`;
    }).join('');
}

function formatMusicTime(sec){if(!isFinite(sec)||sec<0)sec=0;const m=Math.floor(sec/60);const s=Math.floor(sec%60).toString().padStart(2,'0');return`${m}:${s}`}
function getTrackTimeLabel(){if(!musicAudio)return'';const cur=formatMusicTime(musicAudio.currentTime||0);const dur=isFinite(musicAudio.duration)?formatMusicTime(musicAudio.duration):'--:--';return`${cur} / ${dur}`}
function updateMusicTimeDisplay(){updateMusicProgressBar();if(musicCurrentIndex<0)return;const el=document.getElementById('musicTime-'+musicCurrentIndex);if(el)el.textContent=getTrackTimeLabel()}

function updateMusicProgressBar(){
    const bar=document.getElementById('musicProgressBar');
    const curEl=document.getElementById('musicProgressCur');
    const durEl=document.getElementById('musicProgressDur');
    if(!bar)return;
    if(!musicAudio||musicCurrentIndex<0){
        if(!musicSeeking)bar.value=0;
        bar.style.background='';
        if(curEl)curEl.textContent='0:00';
        if(durEl)durEl.textContent='0:00';
        return;
    }
    const dur=isFinite(musicAudio.duration)&&musicAudio.duration>0?musicAudio.duration:0;
    const cur=musicAudio.currentTime||0;
    const pct=dur>0?(cur/dur)*100:0;
    if(!musicSeeking)bar.value=Math.round(pct*10);
    bar.style.background=`linear-gradient(to right, var(--mc-green-light) ${pct}%, var(--border-color) ${pct}%)`;
    if(curEl)curEl.textContent=formatMusicTime(cur);
    if(durEl)durEl.textContent=dur>0?formatMusicTime(dur):'0:00';
}

function onMusicProgressInput(val){
    if(!musicAudio||musicCurrentIndex<0)return;
    const dur=isFinite(musicAudio.duration)&&musicAudio.duration>0?musicAudio.duration:0;
    if(dur<=0)return;
    musicSeeking=true;
    musicAudio.currentTime=(val/1000)*dur;
    updateMusicProgressBar();
    updateMusicTimeDisplay();
    musicSeeking=false;
}

function playMusicTrack(index,opts){
    opts=opts||{};
    if(musicCurrentIndex===index&&musicAudio&&!musicAudio.paused){
        musicAudio.pause();
        renderMusicList();updateMusicNowPlaying();updateMusicHeaderControls();
        return;
    }
    if(!opts.fromHistory&&musicCurrentIndex>=0&&musicCurrentIndex!==index){
        musicHistory.push(musicCurrentIndex);
        if(musicHistory.length>50)musicHistory.shift();
    }
    if(musicRepeatOne!==-1&&musicRepeatOne!==index)musicRepeatOne=-1;

    if(!musicAudio){
        musicAudio=new Audio();
        const savedVol=localStorage.getItem(LS_MUSIC_VOLUME);
        musicAudio.volume=savedVol!==null?parseInt(savedVol,10)/100:0.5;
        musicAudio.addEventListener('ended',onMusicEnded);
        musicAudio.addEventListener('timeupdate',updateMusicTimeDisplay);
        musicAudio.addEventListener('loadedmetadata',updateMusicTimeDisplay);
    }

    musicCurrentIndex=index;
    musicAudio.src=MUSIC_FOLDER+musicPlaylist[index].file;
    musicAudio.play().catch(e=>console.error('Audio:',e));

    // Track pour le badge musique
    onTrackListened(musicPlaylist[index].file);

    renderMusicList();updateMusicNowPlaying();updateMusicHeaderControls();updateMusicTimeDisplay();
}

function onMusicEnded(){
    if(musicRepeatOne===musicCurrentIndex){
        musicAudio.currentTime=0;musicAudio.play();return;
    }
    const next=findNextEnabled(musicCurrentIndex);
    if(next!==-1){playMusicTrack(next)}
    else{musicCurrentIndex=-1;renderMusicList();updateMusicNowPlaying();updateMusicHeaderControls()}
}

function findNextEnabled(fromIndex){
    const ei=[];for(let i=0;i<musicPlaylist.length;i++){if(musicEnabled[i])ei.push(i)}
    if(ei.length===0)return -1;
    if(musicShuffle){
        if(ei.length===1)return ei[0];
        let next=fromIndex;while(next===fromIndex){next=ei[Math.floor(Math.random()*ei.length)]}return next;
    }
    const total=musicPlaylist.length;
    for(let i=1;i<=total;i++){const idx=(fromIndex+i)%total;if(musicEnabled[idx])return idx}
    return -1;
}

function findPreviousSequential(fromIndex){
    const total=musicPlaylist.length;
    for(let i=1;i<=total;i++){const idx=(fromIndex-i+total)%total;if(musicEnabled[idx])return idx}
    return -1;
}

function getFirstEnabledIndex(){for(let i=0;i<musicPlaylist.length;i++){if(musicEnabled[i])return i}return -1}
function getRandomEnabledIndex(){const ei=[];for(let i=0;i<musicPlaylist.length;i++){if(musicEnabled[i])ei.push(i)}if(ei.length===0)return -1;return ei[Math.floor(Math.random()*ei.length)]}

function toggleMusicShuffle(){musicShuffle=!musicShuffle;updateMusicHeaderControls()}

function toggleMusicPlayPause(){
    if(musicAudio&&!musicAudio.paused){musicAudio.pause();renderMusicList();updateMusicNowPlaying();updateMusicHeaderControls();return}
    if(musicAudio&&musicCurrentIndex>=0){musicAudio.play().catch(e=>console.error('Audio:',e));renderMusicList();updateMusicNowPlaying();updateMusicHeaderControls();return}
    const first=musicShuffle?getRandomEnabledIndex():getFirstEnabledIndex();
    if(first!==-1)playMusicTrack(first);
}

function nextTrack(){if(musicCurrentIndex<0){toggleMusicPlayPause();return}const next=findNextEnabled(musicCurrentIndex);if(next!==-1)playMusicTrack(next)}

function previousTrack(){
    if(musicHistory.length>0){const prev=musicHistory.pop();playMusicTrack(prev,{fromHistory:true});return}
    if(musicCurrentIndex<0){toggleMusicPlayPause();return}
    const prev=findPreviousSequential(musicCurrentIndex);
    if(prev!==-1)playMusicTrack(prev,{fromHistory:true});
}

function restartTrack(){
    if(musicAudio&&musicCurrentIndex>=0){
        musicAudio.currentTime=0;updateMusicTimeDisplay();
        if(musicAudio.paused){renderMusicList();updateMusicNowPlaying()}
    }
}

function updateMusicHeaderControls(){
    const shuffleBtn=document.getElementById('musicShuffleBtn');
    const playPauseIcon=document.getElementById('musicPlayPauseIcon');
    if(shuffleBtn)shuffleBtn.classList.toggle('shuffle-active',musicShuffle);
    if(playPauseIcon){
        const isPlaying=musicAudio&&!musicAudio.paused&&musicCurrentIndex>=0;
        playPauseIcon.innerHTML=isPlaying
            ?'<rect x="5" y="4" width="5" height="16" rx="1"/><rect x="14" y="4" width="5" height="16" rx="1"/>'
            :'<polygon points="6 4 20 12 6 20"/>';
    }
}

function toggleMusicEnabled(index){
    musicEnabled[index]=!musicEnabled[index];
    if(!musicEnabled[index]&&musicRepeatOne===index)musicRepeatOne=-1;
    renderMusicList();
}

function toggleMusicRepeat(index){
    musicRepeatOne=musicRepeatOne===index?-1:index;
    renderMusicList();
}

function setMusicVolume(val){
    let v=Math.round(Math.min(100,Math.max(0,parseFloat(val)||0)));
    if(musicAudio)musicAudio.volume=v/100;
    const slider=document.getElementById('musicVolumeSlider');
    if(slider)slider.value=v;
    const pct=document.getElementById('musicVolPct');
    if(pct)pct.textContent=v+'%';
    localStorage.setItem(LS_MUSIC_VOLUME,String(v));
}

function adjustMusicVolume(delta){
    const slider=document.getElementById('musicVolumeSlider');
    const cur=slider?parseFloat(slider.value):50;
    setMusicVolume(cur+delta);
}

function updateMusicNowPlaying(){
    const el=document.getElementById('musicNowPlaying');
    const title=document.getElementById('musicNowTitle');
    if(musicCurrentIndex>=0&&musicAudio){
        el.style.display='flex';
        title.textContent=musicPlaylist[musicCurrentIndex].name||musicPlaylist[musicCurrentIndex].file;
    }else{
        el.style.display='none';
    }
    updateMusicProgressBar();
}

// ═══ SCROLL LISTENERS ═══
window.addEventListener('scroll',()=>{
    const scrolled=window.scrollY>50;
    header.classList.toggle('scrolled',scrolled);
    backToTop.classList.toggle('visible',window.scrollY>500);
},{passive:true});

// ═══ INIT ═══
// ═══ ADMIN : AJOUTER / MODIFIER UN MOD ═══
const LOADER_OPTIONS=['Forge','Fabric','NeoForge','Quilt'];
let adminEditingModId=null;
let admVersionRowCounter=0;
let admDepRowCounter=0;
let admPendingChanges=0;

window.addEventListener('beforeunload',e=>{
    if(admPendingChanges>0){e.preventDefault();e.returnValue=''}
});

function slugify(s){return normalizeStr(s).replace(/\s+/g,'-')}

function updateAdminModBtn(){
    const btn=document.getElementById('tabAddBtn');
    if(!btn)return;
    if(isModAdmin()){
        btn.textContent='🛠️ Modifier/Ajouter un mod';
        btn.title='Ajouter un nouveau mod ou modifier un mod existant';
        btn.onclick=openAdminModPicker;
    }else{
        btn.textContent='+ Demander un mod';
        btn.title="Demander l'ajout d'un mod";
        btn.onclick=openRequestModModal;
    }
}

function openAdminModPicker(){
    if(!requireAuth('gérer les mods'))return;
    if(!isModAdmin()){showToast('error','🔒 Réservé aux administrateurs');return}
    openPromptModal({
        title:'🛠️ Modifier/Ajouter un mod',
        hint:admPendingChanges>0?`⚠️ ${admPendingChanges} modification${admPendingChanges>1?'s':''} en attente — cliquez sur « Enregistrer tout » une fois terminé pour générer le fichier mods.json à jour.`:'Créez un nouveau mod ou sélectionnez un mod existant ci-dessous pour le modifier. Vos modifications restent en mémoire tant que vous ne cliquez pas sur « Enregistrer tout ».',
        inputsHtml:`<input type="text" class="prompt-input" id="adminModSearch" placeholder="🔍 Rechercher un mod à modifier…" autocomplete="off" oninput="renderAdminModPickerList()"><div class="dropdown-list" id="adminModPickerList" style="max-height:280px;margin-bottom:12px"></div>`,
        actionsHtml:`<button class="btn-secondary" onclick="closePromptModal()">Fermer</button><button class="btn-primary" onclick="openAdminModForm(null)">➕ Nouveau mod</button><button class="btn-primary" id="admSaveAllBtn" ${admPendingChanges===0?'disabled':''} onclick="admSaveAllChanges()" style="background:linear-gradient(135deg,#5D8C3E,#3f6b28)">💾 Enregistrer tout${admPendingChanges>0?` (${admPendingChanges})`:''}</button>`,
        onOpen:()=>{renderAdminModPickerList();const el=document.getElementById('adminModSearch');if(el)el.focus()}
    });
}

function admSaveAllChanges(){
    if(admPendingChanges===0)return;
    downloadModsJson();
    showToast('info',`💾 mods.json généré avec ${admPendingChanges} modification${admPendingChanges>1?'s':''}`);
    admPendingChanges=0;
    openAdminModPicker();
}

function renderAdminModPickerList(){
    const el=document.getElementById('adminModSearch');
    const q=normalizeStr(el?el.value:'');
    const list=document.getElementById('adminModPickerList');
    if(!list)return;
    const items=[...MODS_DATABASE].sort((a,b)=>a.name.localeCompare(b.name)).filter(m=>!q||normalizeStr(m.name).includes(q));
    if(items.length===0){list.innerHTML='<div class="dropdown-empty"><div class="dropdown-empty-icon">🧩</div>Aucun mod trouvé</div>';return}
    list.innerHTML=items.map(m=>`<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;background:var(--bg-secondary);border:1px solid var(--border-color);margin-bottom:6px;cursor:pointer;transition:var(--transition)" onclick="openAdminModForm(${m.id})"><img src="${getModImageUrl(m)}" alt="" style="width:36px;height:36px;border-radius:8px;object-fit:cover;flex-shrink:0;background:var(--bg-card)" onerror="this.onerror=null;this.src='${getImageFallback()}'"><div style="flex:1;min-width:0"><div style="font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(m.name)}</div><div style="font-size:11px;color:var(--text-muted)">#${m.id} · ${m.versions[0]}</div></div><span style="font-size:12px;color:var(--mc-green);flex-shrink:0">✏️ Modifier</span></div>`).join('');
}

function admVersionsMultiMode(){const cb=document.getElementById('admSizeMultiToggle');return!!(cb&&cb.checked)}
function admCurrentLoaders(){return[...document.querySelectorAll('#admLoaders input:checked')].map(x=>x.value)}
function admWeightInputsHtml(sizeEntry){
    if(admVersionsMultiMode()){
        const loaders=admCurrentLoaders();
        const obj=(sizeEntry&&typeof sizeEntry==='object')?sizeEntry:{};
        const single=(typeof sizeEntry==='number')?sizeEntry:'';
        if(loaders.length===0)return`<div class="admin-version-weights"><span class="admin-hint" style="margin:0">Sélectionnez d'abord les loaders ci-dessus</span></div>`;
        return`<div class="admin-version-weights">${loaders.map(l=>{const v=obj[l]!==undefined?obj[l]:single;return`<input type="number" step="0.1" min="0" class="prompt-input admin-dyn-input-sm admin-weight-input" data-loader="${l}" placeholder="${l} (Mo)" value="${v!==undefined&&v!==''?v:''}">`}).join('')}</div>`;
    }
    const v=(typeof sizeEntry==='number')?sizeEntry:(sizeEntry&&typeof sizeEntry==='object'?(Object.values(sizeEntry)[0]??''):'');
    return`<input type="number" step="0.1" min="0" class="prompt-input admin-dyn-input-sm admin-weight-input" placeholder="Poids (Mo)" value="${v!==undefined&&v!==''?v:''}">`;
}
function admReadRowSizeEntry(row){
    const inputs=[...row.querySelectorAll('.admin-weight-input')];
    if(inputs.length===0)return undefined;
    if(!inputs[0].dataset.loader){const v=parseFloat(inputs[0].value);return isNaN(v)?undefined:v}
    const obj={};inputs.forEach(inp=>{const l=inp.dataset.loader;const v=parseFloat(inp.value);if(l&&!isNaN(v))obj[l]=v});
    return Object.keys(obj).length?obj:undefined;
}
function admRenderVersionRow(div,version,sizeEntry){
    div.innerHTML=`<input type="text" class="prompt-input admin-dyn-input admin-version-input" placeholder="Version (ex: 1.20.1)" value="${escapeHtml(version||'')}">${admWeightInputsHtml(sizeEntry)}<button type="button" class="admin-dyn-remove" title="Retirer" onclick="document.getElementById('${div.id}').remove()">✕</button>`;
}
function admAddVersionRow(version,size){
    const id='admVrow'+(admVersionRowCounter++);
    const div=document.createElement('div');
    div.className='admin-dyn-row admin-version-row';
    div.id=id;
    admRenderVersionRow(div,version,size);
    document.getElementById('admVersionsList').appendChild(div);
}
function admOnSizeMultiToggleChange(){
    [...document.querySelectorAll('#admVersionsList .admin-version-row')].forEach(row=>{
        const versionInput=row.querySelector('.admin-version-input');
        const version=versionInput?versionInput.value:'';
        const sizeEntry=admReadRowSizeEntry(row);
        admRenderVersionRow(row,version,sizeEntry);
    });
}

function admAddDepRow(name){
    const id='admDrow'+(admDepRowCounter++);
    const div=document.createElement('div');
    div.className='admin-dyn-row';
    div.id=id;
    div.innerHTML=`<input type="text" class="prompt-input admin-dyn-input" placeholder="Nom du mod dépendance (ex: Placebo)" value="${escapeHtml(name||'')}"><button type="button" class="admin-dyn-remove" title="Retirer" onclick="document.getElementById('${id}').remove()">✕</button>`;
    document.getElementById('admDepsList').appendChild(div);
}

function admOnImagePick(input){
    const f=input.files[0];
    if(!f)return;
    if(!/^image\//.test(f.type)){showPromptError('Le fichier doit être une image');return}
    const r=new FileReader();
    r.onload=e=>{const prev=document.getElementById('admImagePreview');if(prev)prev.innerHTML=`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`};
    r.readAsDataURL(f);
    const nameEl=document.getElementById('admImageName');
    if(nameEl&&!nameEl.value.trim()){
        const clean=f.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9.]+/g,'-').replace(/-+/g,'-');
        nameEl.value=clean;
    }
}

function admGroupLoaderLabels(loaders){
    const splitCb=document.getElementById('admSplitForgeNeo');
    const split=splitCb&&splitCb.checked;
    const has=l=>loaders.includes(l);
    const groups=[];
    if(split){
        if(has('Forge'))groups.push('Forge');
        if(has('NeoForge'))groups.push('NeoForge');
    }else{
        if(has('Forge')||has('NeoForge'))groups.push('Forge/NeoForge');
    }
    if(has('Fabric'))groups.push('Fabric');
    if(has('Quilt'))groups.push('Quilt');
    return groups.length?groups:loaders;
}

function admUpdateSplitForgeNeoVisibility(){
    const checked=[...document.querySelectorAll('#admLoaders input:checked')].map(x=>x.value);
    const wrap=document.getElementById('admSplitForgeNeoWrap');
    if(!wrap)return;
    wrap.style.display=(checked.includes('Forge')&&checked.includes('NeoForge'))?'block':'none';
}

function admBridgeForgeNeoValues(existing){
    if(existing['Forge/NeoForge']){
        if(!existing['Forge'])existing['Forge']=existing['Forge/NeoForge'];
        if(!existing['NeoForge'])existing['NeoForge']=existing['Forge/NeoForge'];
    }else{
        const combined=existing['Forge']||existing['NeoForge'];
        if(combined)existing['Forge/NeoForge']=combined;
    }
    return existing;
}

function admOnSplitForgeNeoChange(){
    const loaders=[...document.querySelectorAll('#admLoaders input:checked')].map(x=>x.value);
    ['Cf','Mr'].forEach(prefix=>{
        const toggle=document.getElementById(`adm${prefix}MultiToggle`);
        const wrap=document.getElementById(`adm${prefix}MultiWrap`);
        if(toggle&&toggle.checked&&wrap){
            const existing={};
            wrap.querySelectorAll('input').forEach(inp=>{if(inp.value.trim())existing[inp.dataset.loader]=inp.value.trim()});
            admBridgeForgeNeoValues(existing);
            admBuildMultiLinkRows(`adm${prefix}MultiWrap`,loaders,existing);
        }
    });
}

function admBuildMultiLinkRows(containerId,loaders,existingObj,prefill){
    const container=document.getElementById(containerId);
    if(!container)return;
    const groups=admGroupLoaderLabels(loaders);
    container.innerHTML=groups.map(g=>{
        let val=existingObj&&existingObj[g]?existingObj[g]:'';
        if(!val&&existingObj&&g==='Forge/NeoForge')val=existingObj['Forge']||existingObj['NeoForge']||'';
        if(!val)val=prefill||'';
        return `<div class="admin-dyn-row"><span style="width:110px;flex-shrink:0;font-size:12px;font-weight:700;color:var(--text-muted);display:flex;align-items:center">${g}</span><input type="text" class="prompt-input admin-dyn-input" data-loader="${g}" placeholder="https://…" value="${escapeHtml(val)}" style="flex:2;margin-bottom:0"></div>`;
    }).join('');
}

function admToggleMultiLink(prefix){
    const toggle=document.getElementById(`adm${prefix}MultiToggle`);
    const singleInput=document.getElementById(`adm${prefix}Url`);
    const wrap=document.getElementById(`adm${prefix}MultiWrap`);
    const loaders=[...document.querySelectorAll('#admLoaders input:checked')].map(x=>x.value);
    if(toggle.checked){
        if(loaders.length===0){toggle.checked=false;showPromptError('Sélectionnez au moins un loader avant d\'activer les liens multiples');return}
        admBuildMultiLinkRows(`adm${prefix}MultiWrap`,loaders,null,singleInput.value.trim());
        singleInput.style.display='none';
        wrap.style.display='block';
    }else{
        singleInput.style.display='';
        wrap.style.display='none';
    }
}

function admReadPlatformUrl(prefix,required){
    const toggle=document.getElementById(`adm${prefix}MultiToggle`);
    const label=prefix==='Cf'?'CurseForge':'Modrinth';
    if(toggle&&toggle.checked){
        const rows=[...document.querySelectorAll(`#adm${prefix}MultiWrap input`)];
        const obj={};
        rows.forEach(inp=>{const l=inp.dataset.loader;const v=inp.value.trim();if(v)obj[l]=v});
        if(Object.keys(obj).length===0){if(required)showPromptError(`Renseignez au moins un lien ${label}`);return required?null:''}
        return obj;
    }
    const v=(document.getElementById(`adm${prefix}Url`).value||'').trim();
    if(!v&&required){showPromptError(`URL ${label} requise`);return null}
    return v;
}

function openAdminModForm(id){
    if(!isModAdmin()){showToast('error','🔒 Réservé aux administrateurs');return}
    adminEditingModId=id;
    const mod=id!=null?MODS_DATABASE.find(m=>m.id===id):null;
    admVersionRowCounter=0;admDepRowCounter=0;
    const catsHtml=CATEGORIES.map(c=>`<label class="admin-check-chip"><input type="checkbox" value="${c.id}" ${mod&&mod.categories.includes(c.id)?'checked':''}> ${c.icon} ${c.name}</label>`).join('');
    const loadersHtml=LOADER_OPTIONS.map(l=>`<label class="admin-check-chip"><input type="checkbox" value="${l}" ${mod&&mod.loaders.includes(l)?'checked':''}> ${l}</label>`).join('');
    const html=`
        <div class="admin-form-section"><label class="admin-form-label">Nom du mod *</label><input type="text" class="prompt-input" id="admName" placeholder="Nom du mod" value="${mod?escapeHtml(mod.name):''}"></div>
        <div class="admin-form-section"><label class="admin-form-label">Slug (identifiant URL)</label><input type="text" class="prompt-input" id="admSlug" placeholder="auto-généré à partir du nom" value="${mod?escapeHtml(mod.slug||''):''}"></div>
        <div class="admin-form-section"><label class="admin-form-label">Catégories *</label><div class="admin-check-grid" id="admCategories">${catsHtml}</div></div>
        <div class="admin-form-section"><label class="admin-form-label">Description courte *</label><textarea class="prompt-input admin-textarea" id="admDesc" placeholder="Description courte (affichée sur les cartes du catalogue)">${mod?escapeHtml(mod.description||''):''}</textarea></div>
        <div class="admin-form-section"><label class="admin-form-label">Description complète</label><textarea class="prompt-input admin-textarea admin-textarea-lg" id="admFullDesc" placeholder="Description détaillée (peut être laissée vide et complétée plus tard, par exemple par une IA à partir des données du mod)">${mod?escapeHtml(mod.fullDescription||''):''}</textarea></div>
        <div class="admin-form-section"><label class="admin-form-label">Image</label><div class="admin-image-row"><div class="admin-image-preview" id="admImagePreview">${mod?`<img src="${getModImageUrl(mod)}" style="width:100%;height:100%;object-fit:cover">`:'🖼️'}</div><div style="flex:1"><input type="file" id="admImageFile" accept="image/*" onchange="admOnImagePick(this)" style="margin-bottom:8px;width:100%"><input type="text" class="prompt-input" id="admImageName" placeholder="nom-du-fichier.png" value="${mod?escapeHtml(mod.image||''):''}" style="margin-bottom:0"><div class="admin-hint">La prévisualisation est locale uniquement. Placez ensuite ce fichier dans <code>images/mods/</code> puis poussez-le sur GitHub.</div></div></div></div>
        <div class="admin-form-section"><label class="admin-form-label">Loaders *</label><div class="admin-check-grid" id="admLoaders">${loadersHtml}</div><div id="admSplitForgeNeoWrap" style="display:none;margin-top:8px"><label class="admin-check-chip"><input type="checkbox" id="admSplitForgeNeo" onchange="admOnSplitForgeNeoChange()"> Forge et NeoForge ont des liens différents pour ce mod</label></div></div>
        <div class="admin-form-section"><label class="admin-form-label">Versions Minecraft et poids (Mo) *</label><label class="admin-check-chip" style="margin-bottom:10px"><input type="checkbox" id="admSizeMultiToggle" onchange="admOnSizeMultiToggleChange()"> Poids différent selon le loader (ex : 3.5 Mo en NeoForge, 3.1 Mo en Fabric)</label><div id="admVersionsList"></div><button type="button" class="btn-secondary admin-add-btn" onclick="admAddVersionRow()">+ Ajouter une version</button></div>
        <div class="admin-form-section"><label class="admin-form-label">Dépendances</label><div id="admDepsList"></div><button type="button" class="btn-secondary admin-add-btn" onclick="admAddDepRow()">+ Ajouter une dépendance</button></div>
        <div class="admin-form-section"><label class="admin-form-label">URL CurseForge *</label><input type="text" class="prompt-input" id="admCfUrl" placeholder="https://www.curseforge.com/minecraft/mc-mods/…" value="${mod&&typeof mod.curseforgeUrl==='string'?escapeHtml(mod.curseforgeUrl):''}"><div id="admCfMultiWrap" style="display:none;margin-top:8px"></div><label class="admin-check-chip" style="margin-top:8px"><input type="checkbox" id="admCfMultiToggle" onchange="admToggleMultiLink('Cf')"> Liens différents selon le loader</label></div>
        <div class="admin-form-section"><label class="admin-form-label">URL Modrinth</label><input type="text" class="prompt-input" id="admMrUrl" placeholder="https://modrinth.com/mod/… (laisser vide si le mod n'existe pas sur Modrinth)" value="${mod&&typeof mod.modrinthUrl==='string'?escapeHtml(mod.modrinthUrl):''}"><div id="admMrMultiWrap" style="display:none;margin-top:8px"></div><label class="admin-check-chip" style="margin-top:8px"><input type="checkbox" id="admMrMultiToggle" onchange="admToggleMultiLink('Mr')"> Liens différents selon le loader</label></div>
    `;
    openPromptModal({
        title:mod?`✏️ Modifier « ${mod.name} »`:'➕ Nouveau mod',
        hint:'Les champs marqués * sont obligatoires. Cette modification reste en mémoire ; générez le fichier mods.json à jour depuis le bouton « Enregistrer tout » de la liste.',
        maxWidth:'760px',
        inputsHtml:html,
        actionsHtml:`<button class="btn-secondary" onclick="openAdminModPicker()">← Retour à la liste</button>${mod?`<button class="btn-secondary" style="color:var(--mc-redstone);border-color:rgba(255,26,26,.3)" onclick="admDeleteMod(${mod.id})">🗑️ Supprimer</button>`:''}<button class="btn-primary" onclick="admSaveMod()">💾 Enregistrer</button>`,
        onOpen:()=>{
            const sizeToggle=document.getElementById('admSizeMultiToggle');
            if(sizeToggle)sizeToggle.checked=!!(mod&&mod.sizePerVersion&&Object.values(mod.sizePerVersion).some(v=>v&&typeof v==='object'));
            if(mod&&mod.versions&&mod.versions.length){mod.versions.forEach(v=>admAddVersionRow(v,getSizeEntry(mod,v)))}else{admAddVersionRow()}
            if(mod&&mod.dependencies&&mod.dependencies.length){mod.dependencies.forEach(d=>admAddDepRow(d))}
            document.getElementById('admLoaders').addEventListener('change',()=>{admUpdateSplitForgeNeoVisibility();if(admVersionsMultiMode())admOnSizeMultiToggleChange()});
            admUpdateSplitForgeNeoVisibility();
            const cfObj=mod&&typeof mod.curseforgeUrl==='object'?mod.curseforgeUrl:null;
            const mrObj=mod&&typeof mod.modrinthUrl==='object'?mod.modrinthUrl:null;
            const detectSplit=obj=>!!obj&&(obj['Forge']!==undefined||obj['NeoForge']!==undefined)&&obj['Forge/NeoForge']===undefined;
            const splitCb=document.getElementById('admSplitForgeNeo');
            if(splitCb)splitCb.checked=detectSplit(cfObj)||detectSplit(mrObj);
            const modLoaders=mod&&mod.loaders?mod.loaders:[...document.querySelectorAll('#admLoaders input:checked')].map(x=>x.value);
            if(cfObj){
                document.getElementById('admCfMultiToggle').checked=true;
                admBuildMultiLinkRows('admCfMultiWrap',modLoaders,cfObj);
                document.getElementById('admCfUrl').style.display='none';
                document.getElementById('admCfMultiWrap').style.display='block';
            }
            if(mrObj){
                document.getElementById('admMrMultiToggle').checked=true;
                admBuildMultiLinkRows('admMrMultiWrap',modLoaders,mrObj);
                document.getElementById('admMrUrl').style.display='none';
                document.getElementById('admMrMultiWrap').style.display='block';
            }
            const nameEl=document.getElementById('admName');
            const slugEl=document.getElementById('admSlug');
            if(nameEl){
                nameEl.addEventListener('input',()=>{if(slugEl&&!slugEl.dataset.touched)slugEl.value=slugify(nameEl.value)});
                if(!mod)nameEl.focus();
            }
            if(slugEl)slugEl.addEventListener('input',()=>{slugEl.dataset.touched='1'});
        }
    });
}

function admSaveMod(){
    const name=(document.getElementById('admName').value||'').trim();
    if(!name){showPromptError('Le nom du mod est requis');return}
    let slug=(document.getElementById('admSlug').value||'').trim();
    if(!slug)slug=slugify(name);
    const categories=[...document.querySelectorAll('#admCategories input:checked')].map(x=>x.value);
    if(categories.length===0){showPromptError('Sélectionnez au moins une catégorie');return}
    const description=(document.getElementById('admDesc').value||'').trim();
    if(!description){showPromptError('La description courte est requise');return}
    const fullDescription=(document.getElementById('admFullDesc').value||'').trim()||description;
    const imageName=(document.getElementById('admImageName').value||'').trim();
    if(!imageName){showPromptError('Indiquez le nom du fichier image (ex: monmod.png)');return}
    const loaders=[...document.querySelectorAll('#admLoaders input:checked')].map(x=>x.value);
    if(loaders.length===0){showPromptError('Sélectionnez au moins un loader');return}
    const versionRows=[...document.querySelectorAll('#admVersionsList .admin-version-row')].map(row=>{
        const versionInput=row.querySelector('.admin-version-input');
        return{version:(versionInput?versionInput.value:'').trim(),size:admReadRowSizeEntry(row)};
    }).filter(r=>r.version);
    if(versionRows.length===0){showPromptError('Ajoutez au moins une version Minecraft');return}
    versionRows.sort((a,b)=>versionToNum(b.version)-versionToNum(a.version));
    const versions=versionRows.map(r=>r.version);
    const sizePerVersion={};versionRows.forEach(r=>{sizePerVersion[r.version]=r.size!==undefined?r.size:0});
    const latestEntry=sizePerVersion[versions[0]];
    const latestRange=getSizeRange(latestEntry);
    const sizeMo=latestRange?latestRange.max:0;
    const dependencies=[...document.querySelectorAll('#admDepsList .admin-dyn-row input')].map(i=>i.value.trim()).filter(Boolean);
    const curseforgeUrl=admReadPlatformUrl('Cf',true);
    if(curseforgeUrl===null)return;
    const modrinthUrl=admReadPlatformUrl('Mr',false);

    const modObj={
        id:adminEditingModId!=null?adminEditingModId:(MODS_DATABASE.length?Math.max(...MODS_DATABASE.map(m=>m.id))+1:1),
        name,categories,description,fullDescription,
        image:imageName,
        versions,loaders,sizeMo,sizePerVersion,dependencies,
        curseforgeUrl,modrinthUrl,slug
    };

    if(adminEditingModId!=null){
        const idx=MODS_DATABASE.findIndex(m=>m.id===adminEditingModId);
        if(idx>=0)MODS_DATABASE[idx]=modObj;
    }else{
        MODS_DATABASE.push(modObj);
    }

    populateVersionFilter();populateLoaderFilter();renderCategories();renderMods();
    admPendingChanges++;
    showToast('info',adminEditingModId!=null?`✅ « ${name} » mis à jour`:`✅ « ${name} » ajouté`);
    adminEditingModId=null;
    openAdminModPicker();
}

function admDeleteMod(id){
    if(!confirm('Supprimer définitivement ce mod du catalogue ?'))return;
    const m=MODS_DATABASE.find(x=>x.id===id);
    MODS_DATABASE=MODS_DATABASE.filter(x=>x.id!==id);
    populateVersionFilter();populateLoaderFilter();renderCategories();renderMods();
    admPendingChanges++;
    showToast('info',m?`🗑️ « ${m.name} » supprimé`:'🗑️ Mod supprimé');
    adminEditingModId=null;
    openAdminModPicker();
}

function downloadModsJson(){
    const blob=new Blob([JSON.stringify(MODS_DATABASE,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download='mods.json';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function init(){
    await modsDataReady;
    createParticles();
    populateVersionFilter();
    populateLoaderFilter();
    updateUserBadge();
    updateBellBadge();
    updateFriendsBadge();
    renderCategories();
    renderMods();
    renderActivityFeed();
    loadModStats();
    setTimeout(()=>renderSuggestions(),100);
    setTimeout(()=>renderRecommendations(),200);
    updateTabCounts();
    const cats=CATEGORIES.length;
    const vers=[...new Set(MODS_DATABASE.flatMap(m=>m.versions))].length;
    setTimeout(()=>{
        animateCounter(document.getElementById('statMods'),MODS_DATABASE.length);
        animateCounter(document.getElementById('statCategories'),cats);
        animateCounter(document.getElementById('statVersions'),vers);
    },500);
    initFadeInSections();
}

function initFadeInSections(){
    const sections=document.querySelectorAll('.fade-in-section');
    if(!('IntersectionObserver' in window)){sections.forEach(s=>s.classList.add('visible'));return}
    const obs=new IntersectionObserver((entries)=>{
        entries.forEach(entry=>{
            if(entry.isIntersecting){entry.target.classList.add('visible');obs.unobserve(entry.target)}
        });
    },{threshold:0.05,rootMargin:'0px 0px -50px 0px'});
    sections.forEach(s=>obs.observe(s));
}

function initFirebaseAuth(){
    const{onAuthStateChanged,doc,getDoc,updateDoc}=window.firebaseFn;
    onAuthStateChanged(window.firebaseAuth,async user=>{
        if(user){
            try{
                const ud=await getDoc(doc(window.firebaseDb,'users',user.uid));
                if(ud.exists()){
                    const d=ud.data();
                    currentUser={uid:user.uid,pseudo:d.pseudo,email:d.email||user.email,avatar:d.avatar||null,role:d.role||'user'};
                    favorites=d.favorites||[];
                    collections=d.collections||[];
                    notifications=d.notifications||[];
                    friends=d.friends||[];
                    pendingFriends=d.pendingFriends||[];
                    viewHistory=d.viewHistory||[];
                    modsViewedSet=new Set(Array.isArray(d.modsViewedSet)?d.modsViewedSet:[]);
                    badgesUnlocked=d.badgesUnlocked||[];
                    tracksListenedSet=new Set(Array.isArray(d.tracksListenedSet)?d.tracksListenedSet:[]);
                    totalCollectionsCreated=d.totalCollectionsCreated||0;

                    // Migration silencieuse pour anciens comptes
                    if(d.viewHistory===undefined||d.modsViewedSet===undefined||d.badgesUnlocked===undefined||d.tracksListenedSet===undefined||d.totalCollectionsCreated===undefined){
                        try{
                            await updateDoc(doc(window.firebaseDb,'users',user.uid),{
                                viewHistory:viewHistory,
                                modsViewedSet:[...modsViewedSet],
                                badgesUnlocked:badgesUnlocked,
                                tracksListenedSet:[...tracksListenedSet],
                                totalCollectionsCreated:totalCollectionsCreated
                            });
                        }catch(err){console.error('Migration:',err)}
                    }
                    updateUserBadge();
                    updateTabCounts();
                    updateBellBadge();
                    updateFriendsBadge();
                    if(currentTab==='favorites')renderFavorites();
                    if(currentTab==='collections')renderCollections();
                    renderRecommendations();
                    setupRealtimeSync();
                    setupCoCollectionsSync();
                    renderSuggestions();
                    initBadgesSystem();
                    setTimeout(()=>checkFavoritedModUpdates(),1500);
                }
            }catch(e){console.error('Auth error:',e)}
        }
    });
}

document.addEventListener('DOMContentLoaded',init);
if(window.firebaseReady)initFirebaseAuth();else window.addEventListener('firebase-ready',initFirebaseAuth);
