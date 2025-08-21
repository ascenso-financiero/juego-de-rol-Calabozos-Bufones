// ==========================
//   SISTEMA DE DATOS BASE
// ==========================
const RNG = (n) => Math.floor(Math.random()*n);
const dice = { d: (sides) => RNG(sides)+1 };
const XP_TABLE = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200];

const STATUS_ICONS = {
  defending: { icon: '🛡️', title: 'Defendiendo (+4 CA)' },
  stun: { icon: '💫', title: 'Aturdido (No puede actuar)' },
  confused: { icon: '❓', title: 'Confuso' },
  invulnerable: { icon: '✨', title: 'Invulnerable' },
  divine_might: { icon: '⚔️', title: 'Poder Divino (+2 Ataque)' },
  melancholy: { icon: '💧', title: 'Melancolía (-2 Ataque)' }
};

const HERO_PORTRAITS = {
  GUERRERO: 'personajes/throg5.png', MAGO: 'personajes/elowen.png',
  PICARO: 'personajes/grimble.png', CLERIGO: 'personajes/beryl.png'
};

const ENEMY_PORTRAITS = {
  GOBLIN_BUROCRATA: 'personajes/goblin.png', ESQUELETO_DESMOTIVADO: 'personajes/esqueleto.png',
  ORCO_CHISTOSO: 'personajes/orco.png', MIMICO_EXISTENCIAL: 'personajes/mimi.png',
  LIMO_NOSTALGIA: 'personajes/limo.png', REY_ORCO_KARAOKE: 'personajes/rey orco.png',
  CAOS_PRIMORDIAL: 'personajes/caos.png',
  DEMONIO_FINANZAS: 'personajes/demonio.png', SOMBRA_NARRADOR: 'personajes/la sombra final.png'
};

const HERO_LORE = {
  GUERRERO: {
      name: "Throg el Guerrero Buldero",
      history: "Throg era el portero del 'Bar los Muertos' hasta que la Gran Pifia teletransportó el bar (y a él con él) a mitad de un campo de batalla. Descubrió que era bueno golpeando cosas y decidió profesionalizarse. Su armadura está cubierta de parches de sus bandas favoritas y de 'Penélope', el nombre de su hacha.",
      attributes: "FUERZA bruta para abrirse paso y abrir botellines. CONSTITUCIÓN de hierro, forjada a base de guisos dudosos. Su CARISMA es... directo.",
  },
  MAGO: {
      name: "Elowen la Maga Sarcástica",
      history: "Elowen era una bibliotecaria en la Última Biblioteca, hasta que un libro sobre 'hechizos de optimización de estanterías' explotó en sus manos durante la Pifia. Ahora, la magia caótica fluye a través de ella, a menudo acompañada de un comentario mordaz. Su heterocromía es un efecto secundario.",
      attributes: "INTELIGENCIA afilada como el cristal de su bastón. SABIDÉRÍA para saber cuándo callar (casi nunca). Su DESTREZA es sorprendentemente alta para esquivar libros que se le caen.",
  },
  PICARO: {
      name: "Grimble el Pícaro Bocazas",
      history: "Grimble era un simple carterista hasta que la Pifia le dio la habilidad de robar conceptos abstractos. Su primer gran golpe fue robarle el 'sentido de la orientación' a un minotauro en un laberinto. Ahora busca el botín definitivo: el 'sentido común' que perdieron los dioses.",
      attributes: "DESTREZA increíble para el sigilo y para gesticular mientras cuenta sus hazañas. Su CARISMA es magnético, aunque poco fiable. INTELIGENCIA para planear robos, no para pensar en las consecuencias.",
  },
  CLERIGO: {
      name: "Sister Beryl la Clérigo Irreverente",
      history: "Beryl regentaba una cervecería monástica. Durante la Pifia, rezó para que sus barriles no se estropearan y, para su sorpresa, una deidad menor del buen beber y las peleas de taberna respondió. Ahora canaliza poder divino a través de su martillo y su fiel gallina de combate, Clotilde.",
      attributes: "SABIDÉRÍA para elaborar la mejor cerveza divina. FUERZA para manejar su martillo y echar a los borrachos. Su FE es inquebrantable, sobre todo en la calidad de su producto.",
  }
};

const CLASSES = {
  GUERRERO: { 
      name:"Guerrero Buldero", 
      lore: HERO_LORE.GUERRERO, 
      base:{ hp: 14, ac: 14, speed: 6, resourceName:"Furia", res:2, attrs:{STR:16, DEX:12, CON:14, INT:8, WIS:10, CHA:12} }, 
      actions:[ 
          { key:"golpe_poder", name:"Golpe Poderoso", info:"Ataque con +2 de daño.", cost:1, range:1, use:(ctx, target)=> basicMelee(ctx, target, { extraDamage: 2 }) }, 
          { 
              key: "inmortal", name: "Inmortal (por un rato)", info: "1 vez por combate, ignora todo el daño hasta su próximo turno. Coste: 2 Furia", cost: 2, range: 0,
              use: (ctx) => {
                  if (ctx.self.usedInmortalThisCombat) {
                      log(`<b>${ctx.self.name}</b> ya ha usado su poder de inmortalidad en este combate.`, 'info');
                      return;
                  }
                  ctx.self.usedInmortalThisCombat = true;
                  ctx.self.buffs.push({key: 'invulnerable', rounds: 2, desc: 'Invulnerable a todo el daño'}); 
                  log(`<b>${ctx.self.name} grita '¡NO HOY!' y se vuelve invulnerable.</b>`, 'game'); 
                  showBuffEffect(ctx.self.pos.x, ctx.self.pos.y);
                  const isCombat = state.initOrder.length > 0;
                  if (isCombat) ctx.self.hasActed = true;
                  ctx.self.res -= ctx.ability.cost;
                  state.mode = { type: 'none' };
                  clearHighlights();
                  renderUI();
              } 
          }
      ] 
  },
  MAGO: { 
      name:"Mago Sarcástico", 
      lore: HERO_LORE.MAGO, 
      base:{ hp: 10, ac: 12, speed: 6, resourceName:"Maná", res:4, attrs:{STR:8, DEX:14, CON:12, INT:16, WIS:14, CHA:10} }, 
      actions:[ 
          { key:"misil_magico", name:"Misil Mágico", info:"Auto-impacta.", cost:1, range:10, use:(ctx, target)=> autoDamage(ctx, target, { dmgN: 2, dmgS: 4 }) },
          { 
              key: "tormenta_sarcasmo", name: "Tormenta de Sarcasmo", info: "Ataque en área que daña y confunde a los enemigos con insultos arcanos. Coste: 3 Maná", cost: 3, range: 8, radius: 2,
              use: (ctx, targetPos) => fireball(ctx, targetPos, {radius: 2, dmgN: 2, dmgS: 8, effect: 'confused'}) 
          }
      ] 
  },
  PICARO: { 
      name:"Pícaro Bocazas", 
      lore: HERO_LORE.PICARO, 
      base:{ hp: 12, ac: 13, speed: 7, resourceName:"Astucia", res:3, attrs:{STR:10, DEX:16, CON:12, INT:14, WIS:8, CHA:14} }, 
      actions:[ 
          { key:"ataque_furtivo", name:"Ataque Furtivo", info:"+1d6 si un colega distrae.", cost:1, range:1, use:(ctx, target)=> basicMelee(ctx, target, { requireAllyAdj:true, extraDmgN: 1, extraDmgS: 6 }) }, 
          { 
              key: "bolsillos_ajenos", name: "Bolsillos Ajenos", info: "Roba un 'buff' aleatorio de un enemigo o simplemente le causa daño si no tiene nada que robar. Coste: 2 Astucia", cost: 2, range: 5, 
              use: (ctx, target) => stealBuff(ctx, target) 
          }
      ] 
  },
  CLERIGO: { 
      name:"Clérigo Irreverente", 
      lore: HERO_LORE.CLERIGO, 
      base:{ hp: 12, ac: 14, speed: 6, resourceName:"Fe", res:3, attrs:{STR:14, DEX:8, CON:12, INT:10, WIS:16, CHA:14} }, 
      actions:[ 
          { key:"curar", name:"Sanación", info:"Cura a un aliado.", cost:1, range:6, use:(ctx, target)=> healTarget(ctx, target, { dmgN:2, dmgS:4 }) }, 
          { 
              key: "intervencion_divina", name: "Intervención Divina", info: "Una potente curación sobre un aliado que también le otorga +2 al ataque durante 1 ronda. Coste: 2 Fe", cost: 2, range: 6, 
              use: (ctx, target) => healTarget(ctx, target, { dmgN: 4, dmgS: 8, dmgMod: 5, buff: {key: 'divine_might', attack: 2, rounds: 2, desc: '+2 al ataque'}}) 
          }
      ] 
  }
};

const ENEMIES = {
  GOBLIN_BUROCRATA: { name:"Goblin Burócrata", kind: "GOBLIN_BUROCRATA", base:{hp:10, ac:12, attack:2, dmg:"1d4", speed:5, xp: 15, initBonus: 3, special: "form"} },
  ESQUELETO_DESMOTIVADO: { name:"Esqueleto Desmotivado", kind: "ESQUELETO_DESMOTIVADO", base:{hp:12, ac:13, attack:4, dmg:"1d6+2", speed:4, xp: 20, initBonus: -1, special: "apathy"} },
  ORCO_CHISTOSO: { name:"Orco Chistoso", kind: "ORCO_CHISTOSO", base:{hp:18, ac:12, attack:5, dmg:"1d8+2", speed:6, xp: 30, initBonus: 1, special: "joke"} },
  MIMICO_EXISTENCIAL: { name:"Mímico Existencial", kind: "MIMICO_EXISTENCIAL", base:{hp:25, ac:11, attack:3, dmg:"0", speed:2, xp: 50, initBonus: 0, special: "philosophy"} },
  LIMO_NOSTALGIA: { name: "Limo de la Nostalgia", kind: "LIMO_NOSTALGIA", base:{hp:30, ac:10, attack:4, dmg:"0", speed:3, xp: 60, initBonus: -2, special: "nostalgia"} },
  REY_ORCO_KARAOKE: { name: "Rey Orco del Karaoke", kind: "REY_ORCO_KARAOKE", base:{hp:80, ac:15, attack:7, dmg:"2d8+3", speed:5, xp: 200, initBonus: 2, special: "karaoke_boss"} },
  CAOS_PRIMORDIAL: { name: "Caos Primordial", kind: "CAOS_PRIMORDIAL", base:{hp:100, ac:16, attack:6, dmg:"2d6+2", speed:6, xp: 350, initBonus: 4, special: "chaos_boss"} },
  DEMONIO_FINANZAS: { name: "Demonio de las Finanzas", kind: "DEMONIO_FINANZAS", base:{hp:120, ac:16, attack:8, dmg:"0", speed:6, xp: 500, initBonus: 3, special: "finance_demon_boss"} },
  SOMBRA_NARRADOR: { name: "Sombra del Narrador", kind: "SOMBRA_NARRADOR", base:{hp:150, ac:18, attack:10, dmg:"0", speed:0, xp: 1000, initBonus: 5, special: "narrator_boss"} }
};

const CAMPAIGN_ACTS = [
  { title: "Acto I: La Taberna del Destino Dudoso", synopsis: "Una serie de perturbaciones sonoras os lleva a la guarida de Grimgor 'El Barítono', un rey orco obsesionado con el karaoke cuya voz está doblando la realidad.", faction: "S.A.C. (Sindicato de Aventureros Cansados)", missionDesc: "El Sindicato os contrata para silenciar al 'vecino ruidoso'. Simple, ¿verdad?", missionObj: "Derrota al Rey Orco del Karaoke.", enemies: ["ESQUELETO_DESMOTIVADO", "GOBLIN_BUROCRATA", "ORCO_CHISTOSO"], boss: "REY_ORCO_KARAOKE", mapStyle: "act1" },
  { title: "Acto II: El Caso del Lunes Perdido", synopsis: "El concepto de 'lunes' ha sido robado del Monasterio del Tiempo. La Orden del Sentido Común os contrata para detener al Culto del Caos Entrópico y evitar un bucle eterno de domingos.", faction: "Orden del Sentido Común", missionDesc: "La Orden necesita que restauréis la coherencia temporal. El papeleo se está acumulando.", missionObj: "Derrota al Caos Primordial.", enemies: ["MIMICO_EXISTENCIAL", "LIMO_NOSTALGIA", "ORCO_CHISTOSO"], boss: "CAOS_PRIMORDIAL", mapStyle: "act2" },
  { title: "Acto III: La Auditoría Infernal", synopsis: "Una cláusula en vuestro contrato revela que un alma del grupo pertenece al Infierno de los Contables. Debéis descender y renegociar los términos con el demonio Belphegor.", faction: "S.A.C. (indirectamente)", missionDesc: "Vuestro contrato tenía letra pequeña. Ahora toca una auditoría... infernal.", missionObj: "Derrota al Demonio de las Finanzas.", enemies: ["GOBLIN_BUROCRATA", "ESQUELETO_DESMOTIVADO"], boss: "DEMONIO_FINANZAS", mapStyle: "act3" },
  { title: "Acto IV: La Cuarta Pared Rota", synopsis: "La realidad se desmorona de formas extrañas y personales. Una voz os juzga. La Sombra del Narrador se ha cansado de su juego y quiere un final dramático, cueste lo que cueste.", faction: "Todas", missionDesc: "Todas las facciones se unen. Hay que evitar que el Narrador borre el archivo del mundo.", missionObj: "Derrota a la Sombra del Narrador.", enemies: ["MIMICO_EXISTENCIAL", "ORCO_CHISTOSO", "REY_ORCO_KARAOKE"], boss: "SOMBRA_NARRADOR", mapStyle: "act4" }
];

const state = {
  gridW: 24, gridH: 18, map: [],
  heroes: [], enemies: [], bossObjects: [],
  nextId: 1, fogEnabled: true, 
  mode: { type: 'none' },
  initOrder: [], turnIndex: -1, round: 0,
  initialInitiative: [], 
  revivedThisRound: [],
  dmMode: false, dmTool: 'wall',
  currentAct: 0, dungeonLevel: 0, bossSpawned: false,
  gameOver: false,
  isAnimating: false,
  tutorial: {
    active: false,
    step: 0,
    targetCell: null,
    lastAction: null,
  }
};

const ATTRIBUTE_TIPS = {
  STR: "Fuerza (STR): Aumenta el daño cuerpo a cuerpo y la precisión de los Guerreros.",
  DEX: "Destreza (DEX): Mejora la iniciativa, la armadura y el daño de los Pícaros.",
  CON: "Constitución (CON): Incrementa los puntos de vida máximos.",
  INT: "Inteligencia (INT): Potencia los hechizos y el daño de los Magos.",
  WIS: "Sabiduría (WIS): Mejora la curación y el daño de los Clérigos.",
  CHA: "Carisma (CHA): ¡Para verse fabuloso mientras se combate!"
};

const sounds = {
  characterVoices: {
      GUERRERO: {
          basic_attack: () => new Tone.PluckSynth({attackNoise: 1, dampening: 8000, resonance: 0.7}).triggerAttack("C2"),
          hurt: () => new Tone.MembraneSynth({pitchDecay: 0.1, octaves: 4}).triggerAttackRelease("A1", "8n"),
          golpe_poder: () => new Tone.MetalSynth({frequency: 150, harmonicity: 2, modulationIndex: 15}).triggerAttackRelease("8n"),
          inmortal: () => { const n = new Tone.Noise("white").start(); const f = new Tone.AutoFilter("2n").toDestination().start(); n.connect(f); setTimeout(() => { n.stop(); f.stop(); }, 800); }
      },
      MAGO: {
          basic_attack: () => new Tone.Synth({oscillator: {type: 'triangle8'}}).toDestination().triggerAttackRelease("G4", "16n"),
          hurt: () => new Tone.Synth({oscillator: {type: "triangle"}}).toDestination().triggerAttackRelease("A4", "16n"),
          misil_magico: () => new Tone.FMSynth({harmonicity: 3, modulationIndex: 10, oscillator: {type: "sine"}}).toDestination().triggerAttackRelease("C5", "4n"),
          tormenta_sarcasmo: () => new Tone.NoiseSynth({noise: {type: "pink"}, envelope: {attack: 0.005, decay: 0.5, sustain: 0}}).toDestination().triggerAttackRelease("1n")
      },
      PICARO: {
          basic_attack: () => { const s = new Tone.Synth({oscillator: {type: 'sawtooth'}, envelope: {attack: 0.001, decay: 0.05, sustain: 0, release: 0.1}}).toDestination(); s.triggerAttackRelease('G#4', '16n'); setTimeout(() => s.triggerAttackRelease('A4', '16n'), 50); },
          hurt: () => new Tone.Synth({oscillator: {type: "square"}}).toDestination().triggerAttackRelease("C4", "16n"),
          ataque_furtivo: () => { const s = new Tone.Synth({volume: -10, oscillator: {type: 'triangle'}, envelope: {attack: 0.001, decay: 0.02, sustain: 0, release: 0.1}}).toDestination(); s.triggerAttackRelease('C5', '32n'); setTimeout(() => s.triggerAttackRelease('G5', '32n'), 30); },
          bolsillos_ajenos: () => new Tone.PluckSynth({resonance: 0.9}).toDestination().triggerAttack("A5")
      },
      CLERIGO: {
          basic_attack: () => new Tone.MetalSynth({frequency: 400, envelope: {attack: 0.001, decay: 0.2, release: 0.1}}).toDestination().triggerAttackRelease("8n"),
          hurt: () => new Tone.MembraneSynth({pitchDecay: 0.2, octaves: 2}).triggerAttackRelease("D2", "8n"),
          curar: () => { const s = new Tone.Synth({oscillator:{type:'sine'}}).toDestination(); s.triggerAttackRelease("E5", "8n"); setTimeout(() => s.triggerAttackRelease("G5", "8n"), 120); },
          intervencion_divina: () => { const c = new Tone.Chorus(4, 2.5, 0.5).toDestination().start(); const s = new Tone.PolySynth(Tone.Synth, {oscillator:{type:'fatsawtooth'}}).connect(c); s.triggerAttackRelease(["C4", "E4", "G4"], "1n"); }
      }
  },
  playVoice: (char, actionKey) => {
      if (Tone.context.state !== 'running') { Tone.context.resume(); }
      const voiceSet = sounds.characterVoices[char.cls];
      if (voiceSet && voiceSet[actionKey]) voiceSet[actionKey]();
      else if (voiceSet && voiceSet['basic_attack']) voiceSet['basic_attack']();
  },
  effects: {
    hit: () => new Tone.MembraneSynth().toDestination().triggerAttackRelease('C3', '8n'),
    miss: () => new Tone.NoiseSynth({envelope: {attack: 0.005, decay: 0.1, sustain: 0}}).toDestination().triggerAttackRelease("8n"),
    crit: () => { new Tone.MetalSynth({frequency: 600, harmonicity: 2, modulationIndex: 20}).toDestination().triggerAttackRelease("16n"); },
    heal: () => new Tone.Synth().toDestination().triggerAttackRelease('E5', '8n'),
    click: () => new Tone.Synth({oscillator:{type:'square'}, envelope:{attack:0.001, decay:0.05,sustain:0,release:0.1}}).toDestination().triggerAttackRelease('C5', '16n'),
    levelUp: () => { const s = new Tone.Synth().toDestination(); s.triggerAttackRelease("C5", "8n"); setTimeout(()=>s.triggerAttackRelease("E5", "8n"), 100); setTimeout(()=>s.triggerAttackRelease("G5", "8n"), 200); },
    death: () => new Tone.MembraneSynth().toDestination().triggerAttackRelease('C2', '2n'),
    trap: () => new Tone.MetalSynth({frequency: 200}).toDestination().triggerAttackRelease('8n'),
    defend: () => new Tone.MetalSynth({envelope: {decay:0.4}}).toDestination().triggerAttackRelease("A3", "8n"),
  }
};

let bsoAudio = null; let isMusicPlaying = false;
function toggleMusic() { if (!bsoAudio) { playBSO(state.currentAct); return; } if (isMusicPlaying) { bsoAudio.pause(); document.getElementById('toggleMusic').textContent = '🔇'; } else { bsoAudio.play(); document.getElementById('toggleMusic').textContent = '🎵'; } isMusicPlaying = !isMusicPlaying; }
function playBSO(actIndex) { 
  if (bsoAudio) { bsoAudio.pause(); bsoAudio = null; } 
  const bsoFiles = ['bso/act1.ogg', 'bso/act2.ogg', 'bso/act3.ogg', 'bso/act4.ogg']; 
  const bsoFile = bsoFiles[actIndex]; 
  log(`INFO: La música de fondo está desactivada para evitar errores de carga local.`, 'info'); 
  bsoAudio = new Audio(); bsoAudio.src = bsoFile; bsoAudio.loop = true; bsoAudio.volume = 0.35; 
}

function id() { return state.nextId++; }
function log(msg, type = 'default'){
    const el = document.getElementById('log');
    const line = document.createElement('div');
    line.className = `log-line log-${type}`;
    const isCombat = state.initOrder.length > 0;
    const roundPrefix = isCombat ? `<span class="text-slate-500 mr-1">R${state.round}:</span>` : '';
    line.innerHTML = roundPrefix + msg;
    if (el.firstChild) {
        el.firstChild.style.opacity = '0.7';
        el.firstChild.style.fontWeight = 'normal';
    }
    el.prepend(line);
    el.scrollTop = 0;
}
function showFloatingText(x, y, text, color) { const c = document.getElementById('floatingTextContainer'); const e = document.createElement('div'); e.className = 'floating-text'; e.textContent = text; e.style.color = color; e.style.left = `${x * 32 + 16}px`; e.style.top = `${y * 32}px`; c.appendChild(e); setTimeout(() => e.remove(), 1500); }
function inBounds(x,y){ return x>=0 && y>=0 && x<state.gridW && y<state.gridH; }
function cellAt(x,y){ if (!inBounds(x,y)) return null; return state.map[y*state.gridW + x]; }
function tokenAt(x,y) { return [...state.heroes, ...state.enemies].find(t => t.pos && t.pos.x === x && t.pos.y === y); }
function objectAt(x,y) { return state.bossObjects.find(o => o.pos.x === x && o.pos.y === y); }
function isPassable(x,y, forMove = false){ const c = cellAt(x,y); if (!c) return false; const isOccupiable = c.type ==='floor' || c.type === 'door'; if (forMove) return isOccupiable && !tokenAt(x,y) && !objectAt(x,y); return isOccupiable; }
function dist(a,b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }
function partyAvgLevel(){ if(state.heroes.length===0) return 1; return Math.max(1, Math.round(state.heroes.reduce((s,h)=>s+h.level,0)/state.heroes.length)); }
function blankMap(){ state.map = Array.from({length: state.gridW*state.gridH}, ()=>({type:'wall', fog:true})); state.bossObjects = []; }
function carveRoom(x,y,w,h){ for(let j=0;j<h;j++) for(let i=0;i<w;i++){ const cx = x+i, cy = y+j; if(inBounds(cx,cy)) state.map[cy*state.gridW+cx].type='floor'; } }
function connectRooms(ax,ay,bx,by){ let x=ax, y=ay; while(x!==bx){ x += x<bx?1:-1; if(inBounds(x,y)) cellAt(x,y).type='floor'; } while(y!==by){ y += y<by?1:-1; if(inBounds(x,y)) cellAt(x,y).type='floor'; } }
function revealAround(x,y, radius=4){ for(let j=-radius;j<=radius;j++) for(let i=-radius;i<=radius;i++){ const cx=x+i, cy=y+j; if(inBounds(cx,cy)) cellAt(cx,cy).fog=false; } }
function revealAll(v){ for(const c of state.map) c.fog = !v; renderMap(); }
function queryCellEl(x,y){ return document.querySelector(`#map .cell[data-x="${x}"][data-y="${y}"]`); }
function atkRoll(attacker, bonus, target){
    let finalBonus = bonus;
    if (hasCover(attacker, target)) finalBonus -= 2;
    const r = dice.d(20);
    return {r, total: r + finalBonus, crit: r===20, fumble: r===1, finalBonus};
}

function getAttrMod(attr) { return Math.floor((attr - 10) / 2); }
function getDamageBonus(char) {
  if (!char.cls) return 1;
  const primaryAttr = { GUERRERO: 'STR', MAGO: 'INT', PICARO: 'DEX', CLERIGO: 'WIS' }[char.cls];
  if (!primaryAttr || !char.attrs[primaryAttr]) return 1;
  return Math.max(1, getAttrMod(char.attrs[primaryAttr]));
}
function hasCover(attacker, target) {
    if (!attacker || !target || !attacker.pos || !target.pos) return false;
    const dx = target.pos.x - attacker.pos.x;
    const dy = target.pos.y - attacker.pos.y;
    if (Math.abs(dx) > 0 && Math.abs(dy) > 0) {
        const wall1 = cellAt(attacker.pos.x + Math.sign(dx), attacker.pos.y);
        const wall2 = cellAt(attacker.pos.x, attacker.pos.y + Math.sign(dy));
        if ((wall1 && wall1.type === 'wall') || (wall2 && wall2.type === 'wall')) {
            return true;
        }
    }
    return false;
}

function setupAct(actIndex) {
  state.currentAct = actIndex;
  const act = CAMPAIGN_ACTS[actIndex];
  if (!act) { log("<b>¡FELICIDADES!</b> Habéis completado la campaña.", 'game'); document.getElementById('actTitle').textContent = "FIN"; return; }
  document.getElementById('actTitle').textContent = act.title;
  document.getElementById('actSynopsis').innerHTML = `<div>${act.synopsis}</div>`;
  document.getElementById('missionFaction').textContent = act.faction;
  document.getElementById('missionDescription').textContent = act.missionDesc;
  document.getElementById('missionObjective').textContent = `Objetivo: ${act.missionObj}`;
  state.dungeonLevel = 0; state.bossSpawned = false;
  playBSO(state.currentAct); 
  
  if(state.tutorial.active && state.tutorial.step < 3) {
    generateTutorialDungeon();
  } else {
    generateDungeon();
  }
}

function generateTutorialDungeon() {
    blankMap();
    carveRoom(8, 7, 8, 5);
    
    const throg = state.heroes.find(h => h.cls === 'GUERRERO');
    if (throg) {
      throg.pos = { x: 10, y: 9 };
      throg.lastPos = { ...throg.pos };
    }
    state.heroes.forEach(h => {
      if(h.cls !== 'GUERRERO') h.pos = null;
    });

    state.enemies = [];
    
    revealAll(true);
    state.fogEnabled = false;

    renderUI();
    log(`¡Bienvenido al tutorial! Sigue las instrucciones.`, 'game');
    checkTutorialStep();
}

function generateDungeon(){
  state.dungeonLevel++;
  if (state.dungeonLevel > 1) {
      log("<b>Tomáis un breve respiro entre niveles...</b>", 'game');
      state.heroes.forEach(h => {
          if (h.hp > 0) {
              const hpToHeal = Math.floor((h.hpmax - h.hp) * 0.5);
              const resToRestore = Math.floor((h.resmax - h.res) * 0.5);
              h.hp = Math.min(h.hpmax, h.hp + hpToHeal);
              h.res = Math.min(h.resmax, h.res + resToRestore);
              if (hpToHeal > 0) log(`${h.name} recupera ${hpToHeal} PV.`, 'heal');
              if (resToRestore > 0) log(`${h.name} recupera ${resToRestore} de ${h.resourceName}.`, 'info');
          } else {
              h.hp = Math.floor(h.hpmax * 0.25);
              log(`${h.name} se recupera y se reincorpora con ${h.hp} PV.`, 'heal');
          }
      });
  }

  blankMap();
  const rooms=[]; const R=6+RNG(5);
  for(let r=0;r<R;r++){ const w=4+RNG(5), h=3+RNG(4); const x=1+RNG(state.gridW-w-2), y=1+RNG(state.gridH-h-2); carveRoom(x,y,w,h); rooms.push({x,y,w,h,cx:x+Math.floor(w/2), cy:y+Math.floor(h/2)}); }
  rooms.sort((a,b)=>a.cx-b.cx);
  for(let i=0;i<rooms.length-1;i++) connectRooms(rooms[i].cx, rooms[i].cy, rooms[i+1].cx, rooms[i+1].cy);
  
  state.heroes.forEach((h, i) => { const r=rooms[0]||{cx:12, cy:9}; h.pos = {x:r.cx+i, y:r.cy}; h.lastPos = {...h.pos}; });
  
  state.enemies = [];
  const enemyCount = 2 + state.dungeonLevel + RNG(3);
  for (let i = 0; i < enemyCount; i++) {
      const room = rooms[RNG(rooms.length)]; const x = room.x + RNG(room.w); const y = room.y + RNG(room.h);
      if (!tokenAt(x, y)) {
          const act = CAMPAIGN_ACTS[state.currentAct];
          const enemyKind = act.enemies[RNG(act.enemies.length)];
          spawnEnemyAt(x, y, enemyKind, 'basic');
      }
  }

  if (state.dungeonLevel >= 3 && !state.bossSpawned) {
      const room = rooms[rooms.length - 1]; const x = room.cx; const y = room.cy;
      const act = CAMPAIGN_ACTS[state.currentAct];
      spawnEnemyAt(x, y, act.boss, 'boss'); state.bossSpawned = true;
      log(`<b>¡Una presencia amenazadora aparece en la última sala!</b>`, 'game');
  }

  revealAll(false);
  state.heroes.forEach(h => { if(h.pos) revealAround(h.pos.x, h.pos.y, 5) });
  nextTurn();
  renderUI(); 
  log(`Has entrado en el nivel ${state.dungeonLevel} de la mazmorra.`, 'info');
}

function renderUI() {
  renderMap(); renderHeroes(); renderEnemies();
  const isCombat = state.initOrder.length > 0;
  const currentUnit = isCombat ? state.initOrder[state.turnIndex] : null;

  if (isCombat && currentUnit && currentUnit.kind === 'hero') {
      const hero = state.heroes.find(h => h.id === currentUnit.id);
      const canEndTurn = hero && (hero.hasMoved || hero.hasActed);
      document.getElementById('btnNextTurn').classList.toggle('end-turn-glow', canEndTurn);
  } else {
      document.getElementById('btnNextTurn').classList.remove('end-turn-glow');
  }
  
  const revealedEnemies = state.enemies.some(en => en.pos && !cellAt(en.pos.x, en.pos.y).fog);
  document.getElementById('btnRollInit').disabled = isCombat || state.enemies.length === 0 || !revealedEnemies;
  document.getElementById('btnNextTurn').disabled = false;
  document.getElementById('btnNextTurn').textContent = isCombat ? 'Siguiente Turno' : 'Turno de Grupo';
}

function renderMap(){
  const mapEl = document.getElementById('map');
  const actStyle = CAMPAIGN_ACTS[state.currentAct]?.mapStyle || 'act1';
  
  if (!mapEl.children.length) {
      mapEl.style.gridTemplateColumns = `repeat(${state.gridW}, 32px)`;
      mapEl.innerHTML = '';
      for(let y=0;y<state.gridH;y++){ for(let x=0;x<state.gridW;x++){
          const cellEl = document.createElement('div'); 
          cellEl.className = 'cell'; cellEl.dataset.x=x; cellEl.dataset.y=y;
          cellEl.addEventListener('click', onCellClick);
          cellEl.addEventListener('mouseenter', e => onCellHover(e, true));
          cellEl.addEventListener('mouseleave', e => onCellHover(e, false));
          mapEl.appendChild(cellEl);
      }}
  }

  for(let y=0;y<state.gridH;y++){ for(let x=0;x<state.gridW;x++){
      const cellEl = queryCellEl(x,y); 
      if (!cellEl) continue;
      const cellData = cellAt(x,y);
      cellEl.className = 'cell border-t border-l border-black/20';
      if(cellData) {
        switch(cellData.type) {
            case 'wall': cellEl.classList.add(`wall-${actStyle}`); break;
            case 'floor': cellEl.classList.add(`floor-${actStyle}`); break;
            case 'door': cellEl.classList.add('door'); break;
            case 'trap': cellEl.classList.add(`floor-${actStyle}`, 'trap'); break;
            case 'chest': cellEl.classList.add(`floor-${actStyle}`, 'chest'); break;
            case 'boss_object': cellEl.classList.add(`floor-${actStyle}`, 'boss-object'); break;
            default: cellEl.classList.add(`floor-${actStyle}`); break;
        }
        cellEl.classList.toggle('fog', state.fogEnabled && cellData.fog);
        
        if (cellData.type === 'chest' || cellData.type === 'door' || cellData.type === 'boss_object') {
            const isAdjacentToHero = state.heroes.some(h => h.hp > 0 && h.pos && dist(h.pos, {x, y}) <= 1);
            if (isAdjacentToHero) cellEl.classList.add('interactable');
        }
      }

      let tokenContainer = cellEl.querySelector('.token-container');
      if (!tokenContainer) { tokenContainer = document.createElement('div'); tokenContainer.className = 'token-container relative w-full h-full'; cellEl.appendChild(tokenContainer); }
      
      const characterOnCell = tokenAt(x,y);
      const existingToken = tokenContainer.querySelector('.token');

      if (characterOnCell && !existingToken) {
          tokenContainer.innerHTML = '';
          const tokenEl = document.createElement('div');
          const isHero = !!characterOnCell.cls;
          tokenEl.className = `absolute token ${isHero ? 'hero' : 'enemy'}`;
          tokenEl.dataset.id = characterOnCell.id;
          if (isHero && characterOnCell.hp <= 0) { tokenEl.classList.add('downed'); }
          if (characterOnCell.isFurious) tokenEl.classList.add('boss-furious');
          if (characterOnCell.isInvulnerable) tokenEl.classList.add('boss-invulnerable');
          tokenEl.title = `${characterOnCell.name} (${isHero ? `NV ${characterOnCell.level}` : characterOnCell.tier})`;
          tokenEl.style.left='3px'; tokenEl.style.top='3px'; tokenEl.textContent = characterOnCell.name[0].toUpperCase();
          tokenContainer.appendChild(tokenEl);

          const statusIconsContainer = document.createElement('div');
          statusIconsContainer.className = 'status-icons';
          tokenContainer.appendChild(statusIconsContainer);

          if (characterOnCell.hp > 0) {
              const hpBar = document.createElement('div');
              hpBar.className = 'token-hp-bar';
              const hpFill = document.createElement('div');
              hpFill.className = `token-hp-bar-fill ${isHero ? 'hero' : 'enemy'}`;
              hpBar.appendChild(hpFill);
              tokenContainer.appendChild(hpBar);
          }
           if (!isHero) {
              const advantageIndicator = document.createElement('div');
              advantageIndicator.className = 'advantage-indicator';
              tokenContainer.appendChild(advantageIndicator);
          }
      }

      if (existingToken && !characterOnCell) {
          tokenContainer.innerHTML = '';
      }

      if (characterOnCell) {
          const hpFill = tokenContainer.querySelector('.token-hp-bar-fill');
          if(hpFill) hpFill.style.width = `${(characterOnCell.hp / characterOnCell.hpmax) * 100}%`;

          const statusIconsContainer = tokenContainer.querySelector('.status-icons');
          if(statusIconsContainer) {
              statusIconsContainer.innerHTML = '';
              const allEffects = [...(characterOnCell.buffs || []), ...(characterOnCell.conds || [])];
              allEffects.forEach(effect => {
                  if (STATUS_ICONS[effect.key]) {
                      const iconData = STATUS_ICONS[effect.key];
                      const iconEl = document.createElement('span');
                      iconEl.className = 'status-icon';
                      iconEl.textContent = iconData.icon;
                      iconEl.title = iconData.title;
                      statusIconsContainer.appendChild(iconEl);
                  }
              });
          }
      }
  }}
}

function renderHeroes(){
  const panel = document.getElementById('heroesPanel');
  panel.innerHTML = '';
  const isCombat = state.initOrder.length > 0;
  const alliesDown = state.heroes.some(h => h.hp <= 0);

  state.heroes.forEach(hero => {
    if (!hero.pos && state.tutorial.active) return;

    const tpl = document.getElementById('tpl-hero-card');
    const newCard = tpl.content.cloneNode(true);
    const card = newCard.querySelector('.rounded-lg'); card.dataset.id = `hero-${hero.id}`;
    const isCurrentTurn = isCombat && state.initOrder[state.turnIndex]?.kind === 'hero' && state.initOrder[state.turnIndex]?.id === hero.id;
    
    card.querySelector('.hero-portrait').src = HERO_PORTRAITS[hero.cls];
    card.querySelector('.name').textContent = hero.name;
    card.querySelector('.class').textContent = CLASSES[hero.cls].name;
    card.querySelector('.level').textContent = hero.level;
    card.querySelector('.ac').textContent = effectiveAC(hero);
    card.querySelector('.hp').textContent = hero.hp; card.querySelector('.hpmax').textContent = hero.hpmax;
    card.querySelector('.hp-bar').style.width = `${(hero.hp/hero.hpmax)*100}%`;
    card.querySelector('.res').textContent = hero.res; card.querySelector('.resmax').textContent = hero.resmax;
    card.querySelector('.res-bar').style.width = `${(hero.res/hero.resmax)*100}%`;
    card.querySelector('.res-name').textContent = `${hero.resourceName} ${hero.res}/${hero.resmax}`;

    const btnMove = card.querySelector('.btn-move'); btnMove.onclick = () => setMoveMode(hero.id);
    const btnAttack = card.querySelector('.btn-attack'); btnAttack.onclick = () => setAttackMode(hero.id);
    const btnDefend = card.querySelector('.btn-defend'); btnDefend.onclick = () => defendAction(hero.id);
    const btnRevive = card.querySelector('.btn-revive'); btnRevive.onclick = () => setReviveMode(hero.id);
    const btnUndoMove = card.querySelector('.btn-undo-move'); btnUndoMove.onclick = () => undoMove(hero.id);
    card.querySelector('.btn-details').onclick = () => showHeroDetails(hero);
    card.querySelector('.btn-attrs').onclick = () => showAttributesPanel(hero);
    card.querySelector('.btn-bag').onclick = () => showInventoryPanel(hero);
    
    let canMove = false, canAct = false;
    if (isCombat) {
        if (isCurrentTurn) {
            canMove = !hero.hasMoved;
            canAct = !hero.hasActed;
        }
    } else {
        canMove = !hero.hasMoved;
        canAct = !hero.hasActed;
    }
    
    btnMove.disabled = !canMove || hero.hp <= 0;
    btnAttack.disabled = !canAct || hero.hp <= 0;
    btnDefend.disabled = !canAct || hero.hp <= 0;
    btnRevive.disabled = !canAct || hero.hp <= 0 || !alliesDown;
    btnUndoMove.classList.toggle('hidden', !hero.hasMoved || hero.hasActed || !hero.canUndoMove);
    
    const specialActionsContainer = card.querySelector('.special-actions');
    specialActionsContainer.innerHTML = '';
    hero.actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'bg-purple-700 hover:bg-purple-600 rounded px-2 py-1 text-xs transition-colors';
        btn.textContent = `${action.name} (${action.cost || 0})`; btn.title = action.info; btn.onclick = () => useAbility(hero.id, action.key);
        btn.disabled = !canAct || hero.hp <= 0;
        btn.addEventListener('mouseenter', () => previewAbility(hero, action));
        btn.addEventListener('mouseleave', clearHighlights);
        specialActionsContainer.appendChild(btn);
    });
    
    let xpBar = card.querySelector('.xp-bar');
    if (!xpBar) {
      xpBar = document.createElement('div'); xpBar.className = 'w-full bg-slate-700 rounded-full h-2.5 mt-1 relative xp-bar';
      const fill = document.createElement('div'); fill.className = 'bg-amber-400 h-2.5 rounded-full absolute left-0 top-0';
      fill.style.width = `${Math.min(100, (hero.xp / XP_TABLE[hero.level]) * 100)}%`;
      xpBar.appendChild(fill); card.insertBefore(xpBar, card.querySelector('.action-buttons'));
    } else {
      xpBar.firstChild.style.width = `${Math.min(100, (hero.xp / XP_TABLE[hero.level]) * 100)}%`;
    }
    
    if (hero.hp <= 0) {
      card.style.opacity = '0.6';
      card.style.filter = 'grayscale(80%)';
    }
    panel.appendChild(card);
  });
}

function renderEnemies(){
  const panel = document.getElementById('enemiesList'); panel.innerHTML = '';
  const tpl = document.getElementById('tpl-enemy-card');
  state.enemies.forEach(e => {
      const card = tpl.content.cloneNode(true); 
      const cardRoot = card.querySelector('.rounded-lg');
      cardRoot.dataset.id = `enemy-${e.id}`;
      card.querySelector('.enemy-portrait').src = ENEMY_PORTRAITS[e.kind];
      card.querySelector('.name').textContent = e.name + ` (${e.tier})`;
      card.querySelector('.kind').textContent = ENEMIES[e.kind]?.kind?.replace(/_/g,' ') || '';
      card.querySelector('.hp').textContent = e.hp; card.querySelector('.hpmax').textContent = e.hpmax;
      card.querySelector('.hp-bar').style.width = `${(e.hp/e.hpmax)*100}%`;
      card.querySelector('.ac').textContent = e.ac; card.querySelector('.attack').textContent = `+${e.attack}`;
      card.querySelector('.dmg').textContent = e.dmg; card.querySelector('.speed').textContent = e.speed;
      card.querySelector('.abilities').innerHTML = `<span class="font-bold text-rose-300">Habilidad:</span> ${ENEMY_SPECIAL_ABILITIES[e.special]?.desc || 'Ninguna.'}`;
      card.querySelector('.btn-details').addEventListener('click', () => showEnemyDetails(e));
      const current = state.initOrder[state.turnIndex];
      if (current && current.kind === 'enemy' && current.id === e.id) cardRoot.classList.add('current-turn');
      panel.appendChild(card);
  });
}

function updateStatusPanel(text) { document.getElementById('statusPanel').textContent = text; }

function addHero(name, clsKey){
  const cls = CLASSES[clsKey]; if(!name) name = cls.lore.name;
  const base = structuredClone(cls.base);
  const h = { 
      id: id(), name, cls: clsKey, level:1, xp: 0, 
      hp: base.hp, hpmax: base.hp, ac: base.ac, speed: base.speed, 
      res: base.res, resmax: base.res, resourceName: base.resourceName, 
      attrs: base.attrs, pos: null, lastPos: null, buffs:[], conds:[], actions: cls.actions,
      attributePoints: 1,
      inventory: [{ name: "Poción de Curación", type: "potion", effect: () => { h.hp = Math.min(h.hpmax, h.hp + 10); log(`${h.name} usa una poción y recupera 10 PV.`, 'heal'); renderUI(); } }],
      hasMoved: false, hasActed: false,
      usedInmortalThisCombat: false,
      canUndoMove: true
  };
  state.heroes.push(h);
}

function levelUp(hero){
  hero.level++; sounds.effects.levelUp();
  log(`<b>¡${hero.name} sube a nivel ${hero.level}! ¡Más poder para más caos!</b>`, 'game');
  hero.hpmax += dice.d(6) + getAttrMod(hero.attrs.CON);
  hero.hp = hero.hpmax; hero.resmax += 1; hero.res = hero.resmax;
  hero.attributePoints = (hero.attributePoints || 0) + 1;
  log(`<b>${hero.name} ha ganado un punto de atributo para gastar.</b>`, 'info');
  renderUI();
}

function effectiveAC(char){
    let ac = char.ac;
    for(const b of char.buffs){ if(b.ac) ac+=b.ac; }
    return ac;
}

function scaleEnemy(kindKey, tier){
  const def = ENEMIES[kindKey]; const base = def.base; const lvl = partyAvgLevel();
  let mult = 1; if(tier==='elite') mult=1.5; if(tier==='boss') mult=2.25;
  const e = { id: id(), name: def.name, kind: kindKey, tier, level:lvl, hpmax: Math.round(base.hp * (0.8+0.4*lvl) * mult), ac: base.ac + Math.floor((lvl-1)/2), attack: base.attack + Math.floor((lvl-1)/2), dmg: base.dmg, speed: base.speed, xp: Math.round(base.xp * mult * (1+lvl*0.1)), special: base.special, pos:null, buffs:[], conds:[], isFurious: false, isInvulnerable: false };
  e.hp = e.hpmax; if (e.kind === 'DEMONIO_FINANZAS') e.isInvulnerable = true;
  return e;
}

function spawnEnemyAt(x,y, kind, tier){ const e = scaleEnemy(kind, tier); e.pos={x,y}; state.enemies.push(e);
  if (e.kind === 'DEMONIO_FINANZAS') {
      log(`<b>¡El Demonio invoca Cláusulas Abusivas!</b>`, 'game');
      for (let i = 0; i < 4; i++) {
          const ox = x + (dice.d(5) - 3), oy = y + (dice.d(5) - 3);
          if (inBounds(ox, oy) && isPassable(ox, oy, true)) {
              state.bossObjects.push({id: id(), name: 'Cláusula Abusiva', pos: {x: ox, y: oy}, hp: 10});
              cellAt(ox, oy).type = 'boss_object';
          }
      }
  }
  renderUI();
}

function killEnemy(e, killerHero){
  log(`<b>${e.name}</b> ha sido derrotado.`, 'damage'); sounds.effects.death(); showDeathEffect(e.pos.x, e.pos.y);
  state.enemies = state.enemies.filter(x=>x.id!==e.id);
  state.heroes.forEach(h => { if(h.hp > 0) { h.xp += e.xp; log(`${h.name} gana ${e.xp} XP.`, 'info'); if(h.xp >= XP_TABLE[h.level]) levelUp(h); } });
  
  const oldTurnIndex = state.turnIndex;
  const removedUnitIndex = state.initOrder.findIndex(unit => unit.id === e.id);
  state.initOrder = state.initOrder.filter(unit => !(unit.kind === 'enemy' && unit.id === e.id));
  
  if (removedUnitIndex !== -1 && removedUnitIndex < oldTurnIndex) {
      state.turnIndex--;
  }
  if (state.turnIndex >= state.initOrder.length) {
      state.turnIndex = state.initOrder.length - 1;
  }
  
  if (e.tier === 'boss' && killerHero) {
      showKillCam(killerHero);
  }

  if (state.enemies.length === 0 && state.initOrder.length > 0) {
      log('<b>¡El último enemigo ha caído!</b> El combate ha terminado.', 'game');
      state.heroes.forEach(h => { if(h.cls === 'GUERRERO') h.usedInmortalThisCombat = false; });
      state.initOrder = [];
      state.initialInitiative = [];
      state.turnIndex = -1;
      state.round = 0;
      updateStatusPanel('Explora la mazmorra. Pulsa "Siguiente Turno" para avanzar.');
      document.getElementById('currentTurn').textContent = '—';
      renderInitiative();
  }

  const act = CAMPAIGN_ACTS[state.currentAct];
  if (act && e.kind === act.boss) { log(`<b>¡Has derrotado a ${e.name} y completado el ${act.title}!</b>`, 'game'); setTimeout(() => setupAct(state.currentAct + 1), 3000); }
  renderUI();
  
  advanceTutorial({ type: 'enemy_killed', enemy: e });
}

function setMoveMode(heroId) {
  if (state.isAnimating) return;
  sounds.effects.click();
  const hero = state.heroes.find(h => h.id === heroId);
  if (!hero || hero.hp <= 0 || hero.hasMoved) return;
  const isCombat = state.initOrder.length > 0;
  if (isCombat) {
      const current = state.initOrder[state.turnIndex];
      if (!current || current.kind !== 'hero' || current.id !== heroId) { 
          updateStatusPanel('Solo puedes mover en tu turno de combate.'); 
          return; 
      }
  }
  // REEMPLAZA CON ESTE BLOQUE
const reachable = findReachableCells(hero, hero.speed);
highlightReachable(reachable);
state.mode = { type: 'move', actorId: heroId, reachable };
updateStatusPanel(`Mueve a ${hero.name}.`);

// CORRECCIÓN: Volvemos a aplicar el resaltado del tutorial después de que
// highlightReachable() lo haya borrado.
if (state.tutorial.active && state.tutorial.step === 0) {
    queryCellEl(state.tutorial.targetCell.x, state.tutorial.targetCell.y)?.classList.add('tutorial-highlight');
}
}

function setAttackMode(heroId){
  if (state.isAnimating) return;
  sounds.effects.click();
  const hero = state.heroes.find(x=>x.id===heroId);
  if(!hero || hero.hp <= 0) return;
  let canAct = false;
  const isCombat = state.initOrder.length > 0;
  if(isCombat) canAct = !hero.hasActed && state.initOrder[state.turnIndex]?.id === hero.id;
  else canAct = !hero.hasActed;
  if(!canAct) return;

  state.mode = {type:'attack', actorId:heroId};
  clearHighlights();
  for(const e of state.enemies){ if(e.pos && dist(hero.pos,e.pos)<=1) queryCellEl(e.pos.x, e.pos.y)?.classList.add('targetable'); }
  for(const o of state.bossObjects){ if(o.pos && dist(hero.pos,o.pos)<=1) queryCellEl(o.pos.x, o.pos.y)?.classList.add('targetable'); }
  updateAdvantageIndicators(hero);
  updateStatusPanel(`${hero.name} listo para atacar. Selecciona un objetivo adyacente.`);
}

function setReviveMode(heroId) {
  if (state.isAnimating) return;
  sounds.effects.click();
  const hero = state.heroes.find(h => h.id === heroId);
  if (!hero || hero.hp <= 0) return;
  let canAct = false;
  const isCombat = state.initOrder.length > 0;
  if(isCombat) canAct = !hero.hasActed && state.initOrder[state.turnIndex]?.id === hero.id;
  else canAct = !hero.hasActed;
  if(!canAct) return;

  state.mode = { type: 'revive', actorId: heroId };
  clearHighlights();
  state.heroes.forEach(h => {
      if (h.hp <= 0 && h.pos && dist(hero.pos, h.pos) <= 1) {
          queryCellEl(h.pos.x, h.pos.y)?.classList.add('targetable-ally');
      }
  });
  updateStatusPanel(`${hero.name} va a reanimar a un aliado. Selecciona a un compañero caído adyacente.`);
}

function performBasicAttack(heroId, enemyId){
  const h = state.heroes.find(x=>x.id===heroId); const e = state.enemies.find(x=>x.id===enemyId); if(!h||!e) return;
  
  h.hasActed = true; h.canUndoMove = false;
  sounds.playVoice(h, 'basic_attack');
  
  if (h.cls === 'GUERRERO') { h.res = Math.min(h.resmax, h.res + 1); log(`${h.name} gana 1 de Furia!`, 'info'); }
  if (e.isInvulnerable) { log(`<b>${e.name}</b> es invulnerable a los ataques!`, 'info'); renderUI(); return; }
  
  const attackBonus = getAttrMod(h.attrs.STR);
  let hit = atkRoll(h, attackBonus, e);

  showRollResult({ roller: h.name, target: e.name, roll: hit.r, bonus: hit.finalBonus, total: hit.total, targetAC: effectiveAC(e), crit: hit.crit, fumble: hit.fumble });
  
  if(hit.fumble){ sounds.effects.miss(); log(`${h.name} pifia estrepitosamente.`, 'damage'); }
  else if(hit.crit){ 
      sounds.effects.crit(); 
      const dmg = (dice.d(8) + getDamageBonus(h)) * 2; 
      e.hp -= dmg; 
      log(`<b>${h.name}</b> CRÍTICO (${hit.total}) a ${e.name}: ${dmg} daño!`, 'crit'); 
      showFloatingText(e.pos.x, e.pos.y, dmg, '#f59e0b'); 
      showDamageEffect(e.pos.x, e.pos.y, '#f59e0b', e, true); 
  }
  else if(hit.total >= effectiveAC(e)){ 
      sounds.effects.hit(); 
      const dmg = dice.d(8) + getDamageBonus(h); 
      e.hp -= dmg; 
      log(`${h.name} impacta (${hit.total}) a ${e.name}: ${dmg} daño.`, 'damage'); 
      showFloatingText(e.pos.x, e.pos.y, dmg, '#ffffff'); 
      showDamageEffect(e.pos.x, e.pos.y, '#ffffff', e); 
  }
  else { sounds.effects.miss(); log(`${h.name} falla (${hit.total}).`); showFloatingText(e.pos.x, e.pos.y, 'Falla', '#9ca3af'); }
  
  if (e.hp <= 0) killEnemy(e, h); else checkBossMechanics(e);
  state.mode = { type: 'none' }; clearHighlights(); renderUI();
  advanceTutorial({ type: 'attack', success: hit.total >= effectiveAC(e) });
}

function defendAction(heroId) {
  if (state.isAnimating) return;
  const hero = state.heroes.find(h => h.id === heroId);
  if (!hero) return;
  
  let canAct = false;
  const isCombat = state.initOrder.length > 0;
  if(isCombat) canAct = !hero.hasActed && state.initOrder[state.turnIndex]?.id === hero.id;
  else canAct = !hero.hasActed;
  if(!canAct) return;

  hero.hasActed = true; hero.canUndoMove = false;
  sounds.effects.defend();
  hero.buffs.push({ key: 'defending', ac: 4, rounds: 2, desc: '+4 a la CA' });
  log(`<b>${hero.name}</b> adopta una postura defensiva.`, 'info');
  renderUI();
}

function undoMove(heroId) {
    if (state.isAnimating || state.tutorial.active) return;
    const hero = state.heroes.find(h => h.id === heroId);
    if (hero && hero.hasMoved && !hero.hasActed && hero.canUndoMove) {
        animateAndMoveToken(hero, hero.lastPos, () => {
            hero.hasMoved = false;
            log(`${hero.name} deshace su movimiento.`, 'info');
            renderUI();
        });
    }
}

function useAbility(heroId, key){
  if (state.isAnimating) return;
  sounds.effects.click();
  const h = state.heroes.find(x=>x.id===heroId); if(!h) return;
  
  let canAct = false;
  const isCombat = state.initOrder.length > 0;
  if(isCombat) canAct = !h.hasActed && state.initOrder[state.turnIndex]?.id === h.id;
  else canAct = !h.hasActed;
  if(!canAct) return;

  const ability = h.actions.find(a=>a.key===key);
  if(!ability){ log('Habilidad no encontrada.', 'info'); return; }
  if(h.res < (ability.cost||0)){ log('No tienes recursos suficientes.', 'info'); return; }
  
  sounds.playVoice(h, key);
  
  if (ability.range === 0) {
      ability.use({ self: h, ability });
  } else {
      if (ability.radius !== undefined) { 
          state.mode = { type: 'ability-aoe', actorId: heroId, ability: ability }; 
          updateStatusPanel(`${h.name} prepara ${ability.name}. Selecciona el centro del área.`); 
      } else if (ability.range > 0) {
          const targetType = ability.key.includes('curar') || ability.key.includes('divina') ? 'hero' : 'enemy'; 
          state.mode = { type: 'ability-target', actorId: heroId, ability: ability, targetType: targetType }; 
          highlightTargets(h, ability.range, targetType); 
          updateAdvantageIndicators(h);
          updateStatusPanel(`${h.name} prepara ${ability.name}. Selecciona un objetivo.`); 
      }
  }
  renderUI();
}

function rollInitiative(){
  if (state.isAnimating) return;
  if (state.initOrder.length > 0 || state.enemies.length === 0) return;
  const order=[];
  for(const h of state.heroes){ if(h.hp > 0 && h.pos) order.push({kind:'hero', id:h.id, name:h.name, roll: dice.d(20)+ getAttrMod(h.attrs.DEX)}); }
  for(const e of state.enemies){ 
      const initBonus = ENEMIES[e.kind].base.initBonus || 1;
      order.push({kind:'enemy', id:e.id, name:e.name, roll: dice.d(20) + initBonus}); 
  }
  order.sort((a,b)=> b.roll-a.roll);
  state.initOrder = order;
  state.initialInitiative = structuredClone(order);
  state.turnIndex = -1; 
  state.round = 0; 
  log('¡Enemigos a la vista! <b>¡Que comience el caos!</b>', 'game');
  updateStatusPanel("¡Combate iniciado!");
  nextTurn();
}

function renderInitiative(){
  const wrap = document.getElementById('initOrder'); wrap.innerHTML='';
  state.initOrder.forEach((u,idx)=>{ const b = document.createElement('div'); b.className = 'px-2 py-1 rounded bg-slate-700 text-xs'; b.textContent = `${idx+1}. ${u.name}`; if(idx===state.turnIndex) b.classList.add('bg-indigo-500'); wrap.appendChild(b); });
  document.getElementById('roundCounter').textContent = state.round;
}

function processTurn(){
  if (state.gameOver) return;
  const current = state.initOrder[state.turnIndex];
  if (!current) return; 
  
  if (current.kind === 'hero') {
      const hero = state.heroes.find(h => h.id === current.id);
      if (hero) { 
          hero.hasMoved = false; 
          hero.hasActed = false; 
          hero.lastPos = {...hero.pos};
          hero.canUndoMove = true;
      }
  }
  document.getElementById('currentTurn').textContent = current.name;
  updateStatusPanel(`Turno de ${current.name}.`);
  renderUI();
  if(current.kind==='enemy') { enemyAI(current.id); }
}

function nextTurn(){
  if (state.isAnimating) return;
  const isCombat = state.initOrder.length > 0;

  if (isCombat) {
      const currentUnitRef = state.initOrder[state.turnIndex];
      if(currentUnitRef) {
          let char = currentUnitRef.kind === 'hero' ? state.heroes.find(h=>h.id===currentUnitRef.id) : state.enemies.find(e=>e.id===currentUnitRef.id);
          if(char) {
              char.buffs = char.buffs.filter(b => --b.rounds > 0);
              char.conds = char.conds.filter(c => --c.rounds > 0);
          }
      }
      state.turnIndex++; 
      if(state.turnIndex >= state.initOrder.length){ 
          state.turnIndex = 0; 
          state.round++;
          log(`Comienza la Ronda ${state.round}.`, 'game');
          if (state.revivedThisRound.length > 0) {
              log("¡Los héroes reanimados se unen a la refriega!", 'heal');
              state.initOrder.push(...state.revivedThisRound);
              state.initOrder.sort((a,b) => b.roll - a.roll);
              state.revivedThisRound = [];
          }
      }
      renderInitiative(); 
      processTurn();
  } else {
      log("Turno de exploración del grupo.");
      state.round++;
      document.getElementById('roundCounter').textContent = state.round;
      state.heroes.forEach(h => {
          if (h.hp > 0) {
              h.hasMoved = false;
              h.hasActed = false;
              h.lastPos = {...h.pos};
              h.canUndoMove = true;
          }
      });
      updateStatusPanel("Turno de exploración. Mueve a tus héroes.");
      renderUI();
  }
}

const ENEMY_SPECIAL_ABILITIES = {
  'form': { desc: 'Puede paralizar con burocracia.', execute: (e, target) => { if (dist(e.pos, target.pos) <= 5 && RNG(2) === 0) { log(`El ${e.name} te presenta el Formulario 27B/6.`); target.conds.push({key: 'stun', rounds: 2, desc: 'Paralizado'}); log(`<b>${target.name}</b> queda paralizado.`, 'damage'); return true; } return false; } },
  'apathy': { desc: 'A veces pasa turno por desmotivación.', execute: (e) => { if (RNG(3) === 0) { log(`El ${e.name} suspira. Pasa de turno.`); return true; } return false; } },
  'joke': { desc: 'Cuenta chistes malos, alterando su ataque.', execute: (e) => { const jokes = ["¿Qué le dice un techo a otro? Techo de menos."]; log(`El ${e.name}: "${jokes[RNG(jokes.length)]}"`); if (RNG(2) === 0) { log(`Ataca con desventaja.`); e.attack -= 2; } else { log(`Ataca con ventaja.`); e.attack += 2; } return false; } },
  'philosophy': { desc: 'Drena recursos con preguntas existenciales.', execute: (e, target) => { log(`El ${e.name}: "¿Qué es un 'tesoro' sino un constructo?"`); target.res = Math.max(0, target.res - dice.d(4)); target.conds.push({key: 'confused', rounds: 2, desc: 'Confuso'}); log(`<b>${target.name}</b> pierde ${target.resourceName} y queda confuso.`, 'damage'); renderUI(); return true; } },
  'nostalgia': { desc: 'Induce melancolía, reduciendo el ataque.', execute: (e, target) => { log(`El ${e.name} envuelve a ${target.name} en recuerdos.`); target.buffs.push({key: 'melancholy', attack: -2, rounds: 3, desc: '-2 al ataque'}); log(`<b>${target.name}</b> sufre melancolía (-2 ataque).`, 'damage'); renderUI(); return true; } },
  'karaoke_boss': { desc: 'Lanza un "Solo de Gritos" (daño en área).', execute: (e) => { const targets = state.heroes.filter(h => h.hp > 0 && dist(e.pos, h.pos) < 5); if (targets.length >= (e.isFurious ? 1 : 2)) { log(`<b>${e.name}</b> canta un "Solo de Gritos"!`, 'crit'); targets.forEach(h => { const dmg = dice.d(10); h.hp -= dmg; log(`${h.name} sufre ${dmg} de daño sónico.`, 'damage'); showFloatingText(h.pos.x, h.pos.y, dmg, '#a78bfa'); showDamageEffect(h.pos.x, h.pos.y, '#a78bfa', h); }); renderUI(); return true; } return false; } },
  'chaos_boss': { desc: 'Altera el tiempo y el espacio.', execute: (e, target) => {
      const actionRoll = dice.d(3);
      if (actionRoll === 1 && RNG(2) === 0) {
          const randomHero = state.heroes.filter(h => h.hp > 0)[RNG(state.heroes.filter(h => h.hp > 0).length)];
          if (randomHero) { log(`<b>¡El Caos Primordial crea una Paradoja Temporal!</b>`, 'game'); const tempPos = e.pos; e.pos = randomHero.pos; randomHero.pos = tempPos; log(`${e.name} y ${randomHero.name} intercambian posiciones.`); renderUI(); return true; }
      } else if (actionRoll === 2 && state.enemies.length < 6) {
           log(`<b>¡El Caos invoca un Eco del Ayer!</b>`, 'game');
           const spawnPos = {x: e.pos.x + (RNG(3)-1), y: e.pos.y + (RNG(3)-1) };
           if(isPassable(spawnPos.x, spawnPos.y, true)) { spawnEnemyAt(spawnPos.x, spawnPos.y, 'LIMO_NOSTALGIA', 'basic'); return true; }
      }
      return false;
  }},
  'finance_demon_boss': { desc: 'Impone "Recargos" que drenan recursos.', execute: (e, target) => { log(`El ${e.name} impone un 'Recargo' a ${target.name}.`); const psychicDmg = dice.d(6); target.res = Math.max(0, target.res - psychicDmg); log(`<b>${target.name}</b> pierde ${psychicDmg} de ${target.resourceName}.`, 'damage'); renderUI(); return true; } },
  'narrator_boss': { desc: 'Reescribe la realidad.', execute: (e, target) => { log(`La ${e.name} reescribe la realidad...`); const metaActions = ['edit_map', 'steal_turn', 'retcon']; const action = metaActions[RNG(metaActions.length)]; if (action === 'edit_map') { const {x, y} = target.pos; const newX = x + (RNG(3) - 1), newY = y + (RNG(3) - 1); if (inBounds(newX, newY)) { log(`...y teletransporta a ${target.name}!`); target.pos = {x: newX, y: newY}; renderUI(); } } else if (action === 'steal_turn') { log(`...y declara que el turno de ${target.name} es irrelevante.`); target.conds.push({key: 'stun', rounds: 2, desc: 'Paralizado'}); } else { log(`...y decide que 'necesitaba más desarrollo'.`); const heal = dice.d(20); e.hp = Math.min(e.hpmax, e.hp + heal); log(`La Sombra se cura ${heal} PV.`, 'heal'); renderUI(); } return true; } },
};

function enemyAI(enemyId){
  const e = state.enemies.find(x=>x.id===enemyId); if(!e || e.hp <= 0) { nextTurn(); return; }
  
  let potentialTargets = state.heroes.filter(h => h.hp > 0 && h.pos)
    .map(h => {
      let score = 0;
      score += (h.hpmax - h.hp) * 1.5;
      score -= dist(e.pos, h.pos);
      if(h.cls === 'MAGO') score += 10;
      if(h.cls === 'CLERIGO') score += 8;
      if(h.cls === 'PICARO') score += 5;
      return { hero: h, score: score };
    })
    .sort((a,b) => b.score - a.score);

  if(potentialTargets.length === 0){ nextTurn(); return; }
  let target = potentialTargets[0].hero;

  showAiIntent(e, target);
  
  setTimeout(() => {
      const currentDist = dist(e.pos, target.pos);
      if(currentDist > 1){
          const reachable = findReachableCells(e, e.speed);
          let bestMove = e.pos, closestDist = currentDist, bestCover = hasCover(e, target);
          for (const cell in reachable) {
              const [x,y] = cell.split(',').map(Number);
              const d = dist({x,y}, target.pos);
              const hasC = hasCover({pos:{x,y}}, target);
              if ((hasC && !bestCover) || (hasC && bestCover && d < closestDist) || (!hasC && !bestCover && d < closestDist)) {
                  closestDist = d; 
                  bestMove = {x,y}; 
                  bestCover = hasC;
              }
          }
          if (bestMove.x !== e.pos.x || bestMove.y !== e.pos.y) {
              animateAndMoveToken(e, bestMove, () => {
                  log(`${e.name} avanza hacia ${target.name}${bestCover ? ' y se pone a cubierto' : ''}.`);
                  performAIAttack(e, target);
              });
              return;
          }
      }
      performAIAttack(e, target);
  }, 700);
}

function performAIAttack(e, target) {
    const special = ENEMY_SPECIAL_ABILITIES[e.special];
    if (special && special.execute(e, target)) {
        // Special executed
    } else if(dist(e.pos, target.pos) <= 1) {
        if(e.isInvulnerable) { log(`${e.name} es invulnerable y se regodea.`); }
        else {
            let hit = atkRoll(e, e.attack, target);
            showRollResult({ roller: e.name, target: target.name, roll: hit.r, bonus: hit.finalBonus, total: hit.total, targetAC: effectiveAC(target), crit: hit.crit, fumble: hit.fumble });
            
            if(hit.crit){ 
                sounds.effects.crit(); 
                let d=dice.d(8)*2; target.hp-=d; 
                log(`<b>${e.name}</b> CRITICA a ${target.name}: ${d}`, 'crit'); 
                showFloatingText(target.pos.x, target.pos.y, d, '#f59e0b'); 
                showDamageEffect(target.pos.x, target.pos.y, '#f59e0b', target, true); 
            }
            else if(hit.total>= effectiveAC(target)){ 
                sounds.effects.hit(); 
                let d=dice.d(8); target.hp-=d; 
                log(`${e.name} golpea a ${target.name}: ${d}`, 'damage'); 
                showFloatingText(target.pos.x, target.pos.y, d, '#ffffff'); 
                showDamageEffect(target.pos.x, target.pos.y, '#ffffff', target); 
            }
            else { sounds.effects.miss(); log(`${e.name} falla.`); showFloatingText(target.pos.x, target.pos.y, 'Falla', '#9ca3af'); }
            
            if(target.cls === 'GUERRERO') { target.res = Math.min(target.resmax, target.res + 1); log(`${target.name} gana 1 de Furia al ser golpeado!`, 'info'); }
        }

        if(target.hp<=0){
            target.hp=0; log(`<b>${target.name} cae incapacitado!</b>`, 'damage');
            state.initOrder = state.initOrder.filter(unit => !(unit.kind === 'hero' && unit.id === target.id));
            if (state.heroes.every(h => h.hp <= 0)) { state.gameOver = true; log("<b>GAME OVER...</b>", 'game'); updateStatusPanel("GAME OVER"); }
        }
    } else {
        log(`${e.name} no puede alcanzar a su objetivo y espera.`);
    }
    
    renderUI();
    if (e.special === 'joke') { e.attack = ENEMIES[e.kind].base.attack + Math.floor((e.level-1)/2); }
    nextTurn();
}

function checkBossMechanics(boss) {
      if (boss.kind === 'REY_ORCO_KARAOKE' && !boss.isFurious && boss.hp < boss.hpmax / 2) {
          boss.isFurious = true; boss.attack += 2;
          log(`<b>¡El Rey Orco entra en Furia! ¡Su voz es aún más estridente!</b>`, 'game');
      }
  }

  function basicMelee(ctx, target, opts) { performAbility(ctx.self.id, target.id, {kind: 'basicMelee', opts, name: ctx.ability.name, cost: ctx.ability.cost }); }
  function autoDamage(ctx, target, opts) { performAbility(ctx.self.id, target.id, {kind: 'autoDamage', opts, name: ctx.ability.name, cost: ctx.ability.cost }); }
  function healTarget(ctx, target, opts) { performAbility(ctx.self.id, target.id, {kind: 'heal', opts, name: ctx.ability.name, cost: ctx.ability.cost }); }
  function fireball(ctx, targetPos, opts) { performAbilityAOE(ctx.self.id, targetPos, {kind: 'fireball', opts, name: ctx.ability.name, cost: ctx.ability.cost }); }
  function stealBuff(ctx, target) { performAbility(ctx.self.id, target.id, {kind: 'stealBuff', name: ctx.ability.name, cost: ctx.ability.cost }); }

  function highlightTargets(actor, range, targetType) {
      clearHighlights();
      const targets = targetType === 'hero' ? state.heroes.filter(h => h.hp > 0) : state.enemies;
      const targetClass = targetType === 'hero' ? 'targetable-ally' : 'targetable';
      for (const target of targets) {
          if (target.pos && dist(actor.pos, target.pos) <= range) {
              queryCellEl(target.pos.x, target.pos.y)?.classList.add(targetClass);
          }
      }
  }

  function performAbility(actorId, targetId, ability) {
      const actor = state.heroes.find(h => h.id === actorId);
      const target = state.heroes.find(h => h.id === targetId) || state.enemies.find(e => e.id === targetId);
      if (!actor || !target) return;

      actor.hasActed = true;      // <-- LÍNEA AÑADIDA
      actor.canUndoMove = false;  // <-- LÍNEA AÑADIDA

      
      actor.res -= (ability.cost || 0);
      log(`<b>${actor.name}</b> usa <b>${ability.name}</b> sobre <b>${target.name}</b>!`, 'info');
      let bonus = getDamageBonus(actor);
      if (target.isInvulnerable) { log(`¡Pero <b>${target.name}</b> es invulnerable!`, 'info'); renderUI(); return; }

      let success = false;
      switch (ability.kind) {
          case 'basicMelee':
              if (actor.cls === 'GUERRERO') { actor.res = Math.min(actor.resmax, actor.res + 1); log(`${actor.name} gana 1 de Furia!`, 'info'); }
              const hit = atkRoll(actor, getAttrMod(actor.attrs.STR), target);
              success = hit.total >= effectiveAC(target);
              showRollResult({ roller: actor.name, target: target.name, roll: hit.r, bonus: hit.finalBonus, total: hit.total, targetAC: effectiveAC(target), crit: hit.crit, fumble: hit.fumble });
              if (success) { 
                  let totalDmg = dice.d(8) + bonus + (ability.opts.extraDamage || 0);
                  if (ability.opts.requireAllyAdj) {
                      const isAllyAdjacent = state.heroes.some(h => h.id !== actor.id && h.hp > 0 && h.pos && dist(h.pos, target.pos) <= 1);
                      if (isAllyAdjacent) {
                          log(`¡Ataque Furtivo! Un aliado distrae al objetivo.`);
                          if (ability.opts.extraDmgN) { 
                              for(let i = 0; i < ability.opts.extraDmgN; i++) totalDmg += dice.d(ability.opts.extraDmgS); 
                          }
                      }
                  }
                  target.hp -= totalDmg; 
                  log(`Impacta, causando ${totalDmg} de daño.`, 'damage'); 
                  showFloatingText(target.pos.x, target.pos.y, totalDmg, '#ffffff'); 
                  showDamageEffect(target.pos.x, target.pos.y, '#ffffff', target, hit.crit);
              } else { log('Falla miserablemente.'); }
              break;
          case 'autoDamage':
              let totalDmg = bonus; for(let i = 0; i < ability.opts.dmgN; i++) totalDmg += dice.d(ability.opts.dmgS); target.hp -= totalDmg; log(`El hechizo impacta, causando ${totalDmg} de daño.`, 'damage'); showFloatingText(target.pos.x, target.pos.y, totalDmg, '#818cf8'); showDamageEffect(target.pos.x, target.pos.y, '#818cf8', target);
              if (ability.opts.effect === 'confused') { target.conds.push({ key: 'confused', rounds: 2, desc: 'Confuso' }); log(`${target.name} queda confundido.`, 'damage'); }
              success = true;
              break;
          case 'heal':
              let totalHeal = getAttrMod(actor.attrs.WIS); for(let i = 0; i < ability.opts.dmgN; i++) totalHeal += dice.d(ability.opts.dmgS); target.hp = Math.min(target.hpmax, target.hp + totalHeal); log(`${target.name} recupera ${totalHeal} PV.`, 'heal'); showFloatingText(target.pos.x, target.pos.y, `+${totalHeal}`, '#22c55e'); if (ability.opts.buff) { target.buffs.push(ability.opts.buff); log(`${target.name} se siente fortalecido!`, 'heal'); showBuffEffect(target.pos.x, target.pos.y); }
              success = true;
              break;
          case 'stealBuff':
              if (target.buffs && target.buffs.length > 0) {
                  const stolenIndex = RNG(target.buffs.length);
                  const stolenBuff = target.buffs.splice(stolenIndex, 1)[0];
                  actor.buffs.push(stolenBuff); log(`¡${actor.name} roba el efecto '${stolenBuff.desc}' de ${target.name}!`, 'info');
              } else { const dmg = dice.d(6) + getAttrMod(actor.attrs.DEX); target.hp -= dmg; log(`No había nada que robar, así que le da un coscorrón por ${dmg} de daño.`, 'damage'); showFloatingText(target.pos.x, target.pos.y, dmg, '#eab308'); showDamageEffect(target.pos.x, target.pos.y, '#eab308', target); }
              success = true;
              break;
      }
      if (target.hp <= 0 && target.cls === undefined) killEnemy(target, actor); else checkBossMechanics(target);
      state.mode = { type: 'none' }; clearHighlights(); renderUI();
      advanceTutorial({ type: 'ability', success, ability });
  }
  
  function performAbilityAOE(actorId, center, ability) {
      const actor = state.heroes.find(h => h.id === actorId); if (!actor) return;
      actor.hasActed = true;      // <-- LÍNEA AÑADIDA
      actor.canUndoMove = false;  // <-- LÍNEA AÑADIDA

      actor.res -= (ability.cost || 0);
      log(`<b>${actor.name}</b> desata <b>${ability.name}</b> en {${center.x}, ${center.y}}!`, 'crit');
      
      let enemiesHit = 0;
      state.enemies.forEach(e => {
          if (e.hp > 0 && e.pos && dist(e.pos, center) <= ability.opts.radius) {
              enemiesHit++;
              if(e.isInvulnerable) { log(`<b>${e.name}</b> es invulnerable y no sufre daño.`, 'info'); return; }
              let totalDmg = getDamageBonus(actor); for(let i = 0; i < ability.opts.dmgN; i++) totalDmg += dice.d(ability.opts.dmgS);
              e.hp -= totalDmg;
              log(`${e.name} es alcanzado, sufriendo ${totalDmg} de daño.`, 'damage');
              showFloatingText(e.pos.x, e.pos.y, totalDmg, '#f97316'); showDamageEffect(e.pos.x, e.pos.y, '#f97316', e);
              if (ability.opts.effect === 'confused') { e.conds.push({key: 'confused', rounds: 2, desc: 'Confuso'}); log(`${e.name} parece muy confundido.`, 'damage'); }
              if (e.hp <= 0) killEnemy(e, actor); else checkBossMechanics(e);
          }
      });
      if (enemiesHit > 0) showDamageEffect(center.x, center.y, '#f97316', null, true);
      state.mode = { type: 'none' }; clearHighlights(); renderUI();
  }

function animateAndMoveToken(character, newPos, onComplete) {
    if (!character.pos) {
        character.pos = newPos;
        renderMap();
        if (onComplete) onComplete();
        return;
    }

    const tokenEl = document.querySelector(`.token[data-id="${character.id}"]`);
    if (!tokenEl) {
        character.pos = newPos;
        renderMap();
        if (onComplete) onComplete();
        return;
    }

    state.isAnimating = true;
    const oldPos = character.pos;
    const deltaX = (newPos.x - oldPos.x) * 32;
    const deltaY = (newPos.y - oldPos.y) * 32;

    tokenEl.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    setTimeout(() => {
        tokenEl.style.transition = 'none';
        tokenEl.style.transform = '';
        
        character.pos = newPos;
        
        renderMap(); 

        setTimeout(() => {
            const freshTokenEl = document.querySelector(`.token[data-id="${character.id}"]`);
            if (freshTokenEl) freshTokenEl.style.transition = 'all 0.2s ease, transform 0.3s ease-in-out';
            state.isAnimating = false;
            if (onComplete) onComplete();
        }, 20);

    }, 300);
}

function findReachableCells(actor, maxDist) {
    const startPos = actor.pos;
    if (!startPos) return {};
    const reachable = {};
    const queue = [{ pos: startPos, cost: 0 }];
    const visited = new Set([`${startPos.x},${startPos.y}`]);
    const isActorHero = !!actor.cls;

    while (queue.length > 0) {
        const { pos, cost } = queue.shift();

        if (cost >= maxDist) continue;

        [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(n => {
            const neighbor = { x: pos.x + n[0], y: pos.y + n[1] };
            const neighborKey = `${neighbor.x},${neighbor.y}`;

            if (inBounds(neighbor.x, neighbor.y) && !visited.has(neighborKey) && isPassable(neighbor.x, neighbor.y)) {
                visited.add(neighborKey);
                const tokenOnCell = tokenAt(neighbor.x, neighbor.y);
                
                if (!tokenOnCell || tokenOnCell.hp <= 0) {
                    reachable[neighborKey] = cost + 1;
                    queue.push({ pos: neighbor, cost: cost + 1 });
                } else {
                    const isTokenHero = !!tokenOnCell.cls;
                    if (isActorHero === isTokenHero) {
                        queue.push({ pos: neighbor, cost: cost + 1 });
                    }
                }
            }
        });
    }
    return reachable;
}

function highlightReachable(reachableCells) {
  clearHighlights();
  for (const cellKey in reachableCells) {
    const [x, y] = cellKey.split(',').map(Number);
    queryCellEl(x, y)?.classList.add('reachable');
  }
}

function clearHighlights() {
  document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
  document.querySelectorAll('#map .cell').forEach(c => c.classList.remove('reachable', 'targetable', 'targetable-ally', 'in-range', 'aoe-preview'));
  clearAdvantageIndicators();
}

// CORRECCIÓN BUG TUTORIAL: onCellClick refactorizada para llamar a advanceTutorial en el callback de la animación.
function onCellClick(e) {
    if (state.gameOver || state.isAnimating) return;
    const x = parseInt(e.currentTarget.dataset.x);
    const y = parseInt(e.currentTarget.dataset.y);
    const mode = state.mode;

    if (state.dmMode) {
        if (mode.type === 'spawn-enemy') { 
            spawnEnemyAt(x, y, mode.kind, mode.tier); 
            state.mode = { type: 'none' }; 
            log(`Invocado: ${ENEMIES[mode.kind].name} en [${x},${y}]`);
            if (state.initOrder.length === 0) rollInitiative();
            return; 
        }
        const cell = cellAt(x,y); if(cell) { cell.type = state.dmTool; log(`Pintado: ${state.dmTool} en [${x},${y}]`); }
        renderMap(); return;
    }

    if(mode.type==='move'){
        const hero = state.heroes.find(h => h.id === mode.actorId);
        if (hero && mode.reachable[`${x},${y}`]) {
            sounds.effects.click();
            hero.hasMoved = true;
            const enemiesBeforeMove = state.enemies.filter(en => en.pos && !cellAt(en.pos.x, en.pos.y).fog).length;
            
            // La lógica del tutorial se comprueba DENTRO del callback, una vez el movimiento se ha completado.
            animateAndMoveToken(hero, {x, y}, () => {
                revealAround(x,y,5); 
                const enemiesAfterMove = state.enemies.filter(en => en.pos && !cellAt(en.pos.x, en.pos.y).fog).length;
                if (enemiesAfterMove > enemiesBeforeMove) {
                    log("¡Has revelado nuevos enemigos! No puedes deshacer este movimiento.", 'info');
                    hero.canUndoMove = false;
                }
                triggerCellEffects(hero, x, y);
                const isCombat = state.initOrder.length > 0;
                if (!isCombat && enemiesAfterMove > 0 && !state.tutorial.active) {
                    rollInitiative();
                    hero.hasActed = true; 
                }
                renderUI();
                
                // ¡AQUÍ ESTÁ LA CORRECCIÓN!
                // Llamamos a advanceTutorial DESPUÉS de que el héroe se ha movido.
                advanceTutorial({ type: 'move', hero });
            });
            clearHighlights(); 
            state.mode = {type: 'none'};
        }
    } else if(mode.type==='attack'){
        let target = tokenAt(x,y) || objectAt(x,y);
        if(!target){ log('Apuntas a la nada.'); return; }
        if (target.kind) performBasicAttack(mode.actorId, target.id);
        else if (target.name === 'Cláusula Abusiva') {
            const hero = state.heroes.find(h => h.id === mode.actorId); 
            hero.hasActed = true; hero.canUndoMove = false;
            log(`${hero.name} ataca la ${target.name}!`); target.hp -= dice.d(8) + getDamageBonus(hero);
            if (target.hp <= 0) {
                log(`¡Una ${target.name} ha sido destruida!`, 'game'); state.bossObjects = state.bossObjects.filter(o => o.id !== target.id); cellAt(x,y).type = 'floor';
                const demon = state.enemies.find(e => e.kind === 'DEMONIO_FINANZAS');
                if (demon && state.bossObjects.length === 0) { demon.isInvulnerable = false; log(`<b>¡El Demonio es vulnerable!</b>`, 'game'); }
            }
            state.mode = {type: 'none'}; renderUI();
        }
    } else if (mode.type === 'revive') {
        const target = state.heroes.find(h => h.hp <= 0 && h.pos && h.pos.x === x && h.pos.y === y);
        if (target) {
            const actor = state.heroes.find(h => h.id === mode.actorId);
            actor.hasActed = true; actor.canUndoMove = false;
            target.hp = 1;
            log(`<b>${actor.name}</b> reanima a <b>${target.name}</b>.`, 'heal');
            if (state.initOrder.length > 0) {
                const originalInit = state.initialInitiative.find(u => u.id === target.id);
                const initRoll = originalInit ? originalInit.roll : dice.d(20);
                state.revivedThisRound.push({ kind: 'hero', id: target.id, name: target.name, roll: initRoll });
            }
            state.mode = { type: 'none' };
            clearHighlights();
            renderUI();
        } else {
            log('No hay un aliado caído válido en esa casilla.');
        }
// REEMPLAZA EL BLOQUE ANTERIOR CON ESTE:
} else if (mode.type === 'ability-target') {
    const target = (mode.targetType === 'hero' ? state.heroes : state.enemies).find(t => t.pos && t.pos.x === x && t.pos.y === y);
    if (!target) { 
        log('No hay un objetivo válido ahí.'); 
        return; 
    }

    // --- INICIO DE LA CORRECCIÓN DEFINITIVA ---
    // En lugar de llamar a performAbility directamente (que es incorrecto),
    // llamamos a la función 'use' definida en el objeto de la habilidad.
    // Esta función 'use' ya sabe cómo llamar a performAbility con los parámetros correctos.
    const actor = state.heroes.find(h => h.id === mode.actorId);
    if (actor && mode.ability.use) {
        const context = { self: actor, ability: mode.ability };
        mode.ability.use(context, target);
    } else {
        log('Error: La habilidad no se pudo ejecutar.', 'damage');
    }
    // --- FIN DE LA CORRECCIÓN DEFINITIVA ---
}
}


function triggerCellEffects(hero, x, y) {
    const cell = cellAt(x, y);
    if (cell.type === 'trap') {
        sounds.effects.trap(); const damage = dice.d(6); hero.hp -= damage;
        log(`<b>${hero.name}</b> pisa una trampa y recibe ${damage} de daño!`, 'damage');
        showFloatingText(x, y, damage, '#ef4444'); showDamageEffect(x, y, '#ef4444', hero);
        cell.type = 'floor'; renderUI();
    }
}

function interactWithCell(hero, x, y) {
    const cell = cellAt(x, y);
    if (cell.type === 'chest') { 
        sounds.effects.click(); log(`<b>${hero.name}</b> abre un cofre.`, 'info'); 
        hero.inventory.push({ name: "Poción de Curación", type: "potion", effect: () => { hero.hp = Math.min(hero.hpmax, hero.hp + 10); log(`${hero.name} usa una poción y recupera 10 PV.`, 'heal'); renderUI(); } }); 
        log("¡Ha encontrado una Poción de Curación!", 'heal'); cell.type = 'floor'; renderUI(); 
    } else if (cell.type === 'door') { sounds.effects.click(); log(`${hero.name} examina la puerta.`); }
}

function showBuffEffect(x, y) { const cell = queryCellEl(x, y); if (cell) { cell.style.boxShadow = '0 0 24px 8px #fbbf24'; setTimeout(() => cell.style.boxShadow = '', 700); } }

function showDeathEffect(x, y) { const cell = queryCellEl(x, y); if (cell) { const smoke = document.createElement('div'); smoke.style.cssText = `position:absolute; left:0; top:0; width:32px; height:32px; border-radius:50%; background:radial-gradient(circle, #fff 0%, #888 60%, transparent 100%); opacity:0.7; pointer-events:none; z-index:10; animation:fade-smoke 0.8s forwards;`; cell.appendChild(smoke); setTimeout(() => smoke.remove(), 800); } }

function openModal() { document.getElementById('heroModal').classList.remove('opacity-0', 'pointer-events-none'); }
function closeModal() { document.getElementById('heroModal').classList.add('opacity-0', 'pointer-events-none'); }

function showHeroDetails(hero) {
  const lore = CLASSES[hero.cls].lore; const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `<button id="closeModalBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white text-3xl">&times;</button><div class="flex flex-col md:flex-row gap-6"><div class="md:w-1/3 flex-shrink-0"><img src="${HERO_PORTRAITS[hero.cls]}" class="w-full h-auto rounded-lg" alt="Retrato de ${lore.name}"></div><div class="md:w-2/3"><h2 class="text-3xl font-bold font-title text-amber-300">${lore.name}</h2><h3 class="text-lg text-slate-300 font-title -mt-1">${CLASSES[hero.cls].name}</h3><p class="text-sm mt-4 leading-relaxed">${lore.history}</p><div class="mt-4"><h4 class="font-semibold text-slate-300">Atributos Clave</h4><p class="text-sm mt-1">Nivel: ${hero.level} | XP: ${hero.xp}/${XP_TABLE[hero.level]} | ${Object.entries(hero.attrs).map(([k,v])=>`${k}: ${v} (${getAttrMod(v) >= 0 ? '+' : ''}${getAttrMod(v)})`).join(' | ')}</p></div></div></div><div class="mt-6"><h3 class="text-xl font-bold font-title text-center">Habilidades</h3><div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">${hero.actions.map(action => `<div class="bg-slate-700 p-3 rounded-lg"><h5 class="font-semibold text-amber-200">${action.name}</h5><p class="text-xs mt-1">${action.info}</p></div>`).join('')}</div></div>`;
  modalContent.querySelector('#closeModalBtn').onclick = closeModal; openModal();
}

function showEnemyDetails(enemy) {
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = `<button id="closeModalBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white text-3xl">&times;</button><div class="flex flex-col md:flex-row gap-6"><div class="md:w-1/3 flex-shrink-0"><img src="${ENEMY_PORTRAITS[enemy.kind]}" class="w-full h-auto rounded-lg" alt="Retrato de ${enemy.name}"></div><div class="md:w-2/3"><h2 class="text-3xl font-bold font-title text-rose-300">${enemy.name}</h2><h3 class="text-lg text-slate-300 font-title -mt-1">${ENEMIES[enemy.kind]?.kind?.replace(/_/g,' ') || ''}</h3><div class="mt-4"><h4 class="font-semibold text-slate-300">Estadísticas</h4><p class="text-sm mt-1">CA: ${enemy.ac} | Ataque: +${enemy.attack} | Daño: ${enemy.dmg} | Velocidad: ${enemy.speed} | PV: ${enemy.hpmax}</p></div></div></div><div class="mt-6"><h3 class="text-xl font-bold font-title text-center">Habilidades</h3><div class="mt-3 grid grid-cols-1 gap-3"><div class="bg-slate-700 p-3 rounded-lg"><h5 class="font-semibold text-rose-300">Habilidad especial</h5><p class="text-xs mt-1">${ENEMY_SPECIAL_ABILITIES[enemy.special]?.desc || 'Sin habilidad especial destacada.'}</p></div></div></div>`;
  modalContent.querySelector('#closeModalBtn').onclick = closeModal; openModal();
}

function showAttributesPanel(hero) {
  const modalContent = document.getElementById('modalContent');
  const renderPanel = () => {
      const canUpgrade = hero.attributePoints > 0;
      modalContent.innerHTML = `<button id="closeModalBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white text-3xl">&times;</button><h2 class="text-2xl font-bold font-title text-amber-300 text-center">Atributos de ${hero.name}</h2><p class="text-center text-sm mt-2">Puntos disponibles: <span class="font-bold text-xl">${hero.attributePoints}</span></p><div id="attributeList" class="mt-4 space-y-2">${Object.entries(hero.attrs).map(([key, value]) => `<div class="flex justify-between items-center bg-slate-700 p-2 rounded-lg" data-tooltip="${ATTRIBUTE_TIPS[key]}"><span class="font-semibold">${key}</span><div class="flex items-center gap-3"><span class="font-bold text-lg w-8 text-center">${value}</span>${canUpgrade ? `<button data-attr="${key}" class="attr-upgrade-btn bg-emerald-600 hover:bg-emerald-500 rounded-full h-7 w-7 text-lg">+</button>` : ''}</div></div>`).join('')}</div>`;
      modalContent.querySelector('#closeModalBtn').onclick = closeModal;
      modalContent.querySelectorAll('.attr-upgrade-btn').forEach(btn => { btn.onclick = () => { const attrKey = btn.dataset.attr; if (hero.attributePoints > 0) { hero.attrs[attrKey]++; hero.attributePoints--; log(`${hero.name} ha mejorado su ${attrKey}.`, 'info'); renderPanel(); renderUI(); } }; });
      modalContent.querySelectorAll('[data-tooltip]').forEach(el => { el.addEventListener('mouseenter', e => showTooltip(e.currentTarget.dataset.tooltip, e)); el.addEventListener('mouseleave', hideTooltip); });
  };
  renderPanel(); openModal();
}

function showInventoryPanel(hero) {
  const modalContent = document.getElementById('modalContent');
  const renderPanel = () => {
      let canAct = false;
      const isCombat = state.initOrder.length > 0;
      if(isCombat) canAct = !hero.hasActed && state.initOrder[state.turnIndex]?.id === hero.id;
      else canAct = !hero.hasActed;

      modalContent.innerHTML = `<button id="closeModalBtn" class="absolute top-4 right-4 text-slate-400 hover:text-white text-3xl">&times;</button><h2 class="text-2xl font-bold font-title text-lime-300 text-center">Bolsa de ${hero.name}</h2><div id="inventoryList" class="mt-4 space-y-2">${hero.inventory.length > 0 ? hero.inventory.map((item, index) => `<div class="flex justify-between items-center bg-slate-700 p-2 rounded-lg"><span>${item.name}</span><button data-index="${index}" class="item-use-btn bg-sky-600 hover:bg-sky-500 rounded px-3 py-1 text-xs" ${!canAct ? 'disabled' : ''}>Usar</button></div>`).join('') : '<p class="text-center text-slate-400">La bolsa está vacía.</p>'}</div>`;
      modalContent.querySelector('#closeModalBtn').onclick = closeModal;
      modalContent.querySelectorAll('.item-use-btn').forEach(btn => { btn.onclick = () => { const itemIndex = parseInt(btn.dataset.index); const item = hero.inventory[itemIndex]; if (item && item.effect) { hero.hasActed = true; hero.canUndoMove = false; item.effect(); hero.inventory.splice(itemIndex, 1); renderPanel(); renderUI(); } }; });
  };
  renderPanel(); openModal();
}

function saveGame() {
    try {
        const stateToSave = { ...state };
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem('calabozosYBufonesSave', serializedState);
        log('<b>Partida guardada con éxito.</b>', 'game');
    } catch (error) {
        console.error("Error al guardar la partida:", error);
        log('<b>Error: No se pudo guardar la partida.</b>', 'damage');
    }
}

function loadGame() {
    const savedState = localStorage.getItem('calabozosYBufonesSave');
    if (savedState) {
        try {
            const parsedState = JSON.parse(savedState);
            Object.keys(parsedState).forEach(key => {
                state[key] = parsedState[key];
            });
            log('<b>Partida cargada con éxito.</b>', 'game');
            document.getElementById('actSelector').value = state.currentAct;
            document.getElementById('actTitle').textContent = CAMPAIGN_ACTS[state.currentAct].title;
            renderUI();
            renderInitiative();
        } catch (error) {
            console.error("Error al cargar la partida:", error);
            log('<b>Error: El archivo de guardado está corrupto.</b>', 'damage');
        }
    } else {
        log('No se encontró ninguna partida guardada.', 'info');
    }
}

function initUI(){
  document.getElementById('btnGenDungeon').addEventListener('click', ()=>{ sounds.effects.click(); generateDungeon(); });
  document.getElementById('btnRollInit').addEventListener('click', ()=>{ sounds.effects.click(); rollInitiative(); });
  document.getElementById('btnNextTurn').addEventListener('click', ()=>{ sounds.effects.click(); nextTurn(); });
  document.getElementById('toggleMusic').addEventListener('click', toggleMusic);
  
  document.getElementById('btnSaveGame').addEventListener('click', () => { sounds.effects.click(); saveGame(); });
  document.getElementById('btnLoadGame').addEventListener('click', () => { sounds.effects.click(); loadGame(); });

  const actSelector = document.getElementById('actSelector'); CAMPAIGN_ACTS.forEach((act, index) => { const option = document.createElement('option'); option.value = index; option.textContent = act.title; actSelector.appendChild(option); });
  actSelector.addEventListener('change', (e) => setupAct(parseInt(e.target.value)));
  const enemySpawner = document.getElementById('enemySpawner'); Object.entries(ENEMIES).forEach(([key, value]) => { const option = document.createElement('option'); option.value = key; option.textContent = value.name; enemySpawner.appendChild(option); });
  document.querySelectorAll('.djtool').forEach(button => button.addEventListener('click', () => { state.dmTool = button.dataset.tool; log(`Herramienta DJ seleccionada: ${state.dmTool}`); }));
  document.getElementById('btnSpawnEnemy').addEventListener('click', () => { const enemyKind = document.getElementById('enemySpawner').value; const enemyTier = document.getElementById('enemyTier').value; state.mode = { type: 'spawn-enemy', kind: enemyKind, tier: enemyTier }; log(`Selecciona una casilla para invocar a ${ENEMIES[enemyKind].name} (${enemyTier}).`); });
  document.getElementById('btnDM').addEventListener('click', () => { state.dmMode = !state.dmMode; document.getElementById('djPanel').classList.toggle('hidden', !state.dmMode); log(`Modo Director del Caos: ${state.dmMode ? 'ACTIVADO' : 'DESACTIVADO'}`, 'game'); if (!state.dmMode) state.mode = {type:'none'}; });
  const fogCheckbox = document.getElementById('toggleFog'); fogCheckbox.checked = !state.fogEnabled; fogCheckbox.addEventListener('change', () => { state.fogEnabled = !fogCheckbox.checked; renderMap(); });
  document.addEventListener('keydown', (e) => { if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT' || state.isAnimating) return; if (e.key === 'n' || e.key === 'N') { sounds.effects.click(); nextTurn(); } if (e.key === 'i' || e.key === 'I') { sounds.effects.click(); rollInitiative(); } if (e.key === 'm' || e.key === 'M') { toggleMusic(); } });
  document.body.addEventListener('mousemove', e => { const tooltip = document.getElementById('tooltip'); tooltip.style.left = e.pageX + 15 + 'px'; tooltip.style.top = e.pageY + 15 + 'px'; });
}

function showTooltip(text, event) { const tooltip = document.getElementById('tooltip'); tooltip.innerHTML = text; tooltip.style.opacity = 1; }
function hideTooltip() { document.getElementById('tooltip').style.opacity = 0; }

function onCellHover(event, isEntering) {
  if (isEntering) {
      const x = parseInt(event.currentTarget.dataset.x); const y = parseInt(event.currentTarget.dataset.y);
      const char = tokenAt(x, y);
      if (char) {
          let tooltipText = `<b>${char.name}</b><br>PV: ${char.hp}/${char.hpmax}`;
          if (char.hp <= 0 && char.cls) tooltipText += `<br><span class="text-red-400">¡INCAPACITADO!</span>`;
          if (char.buffs?.length > 0) tooltipText += `<br><b>Buffs:</b> ${char.buffs.map(b => `${b.desc} (${b.rounds}t)`).join(', ')}`;
          if (char.conds?.length > 0) tooltipText += `<br><b>Condiciones:</b> ${char.conds.map(c => `${c.desc} (${c.rounds}t)`).join(', ')}`;
          showTooltip(tooltipText, event);
      }
      if (state.mode.type === 'attack' || (state.mode.type === 'ability-target' && state.mode.targetType === 'enemy')) {
          const target = tokenAt(x, y);
          const actor = state.heroes.find(h => h.id === state.mode.actorId);
          if (actor && target && target.kind) {
              const indicator = queryCellEl(x,y)?.querySelector('.advantage-indicator');
              if (indicator) {
                  if (hasAdvantage(actor, target)) indicator.textContent = '⬆️';
                  else if (hasDisadvantage(actor, target)) indicator.textContent = '⬇️';
              }
          }
      }
      if (state.mode.type === 'ability-aoe') {
          const radius = state.mode.ability.radius || 0;
          for (let i = -radius; i <= radius; i++) for (let j = -radius; j <= radius; j++) { if (dist({x:0, y:0}, {x:i, y:j}) <= radius) { queryCellEl(x + i, y + j)?.classList.add('aoe-preview'); } }
      }
  } else {
      hideTooltip(); 
      if (state.mode.type === 'attack' || state.mode.type === 'ability-target') {
          clearAdvantageIndicators();
      }
      if (state.mode.type === 'ability-aoe') document.querySelectorAll('.aoe-preview').forEach(c => c.classList.remove('aoe-preview'));
  }
}

function previewAbility(hero, ability) {
    clearHighlights();
    if(hero.pos) {
      for (let y = 0; y < state.gridH; y++) for (let x = 0; x < state.gridW; x++) { if (isPassable(x,y) && dist(hero.pos, {x,y}) <= ability.range) queryCellEl(x,y).classList.add('in-range'); }
    }
}

function hasAdvantage(attacker, defender) {
  if (attacker.cls === 'GUERRERO' && defender.kind === 'ESQUELETO_DESMOTIVADO') return true;
  if (attacker.cls === 'MAGO' && defender.kind === 'LIMO_NOSTALGIA') return true;
  if (attacker.cls === 'PICARO' && defender.kind === 'GOBLIN_BUROCRATA') return true;
  if (attacker.cls === 'CLERIGO' && defender.kind === 'SOMBRA_NARRADOR') return true;
  return false;
}
function hasDisadvantage(attacker, defender) {
  if (attacker.cls === 'MAGO' && defender.kind === 'DEMONIO_FINANZAS') return true;
  return false;
}

function updateAdvantageIndicators(actor) {
    if (!actor) return;
    document.querySelectorAll('.token.enemy').forEach(tokenEl => {
        const cellEl = tokenEl.closest('.cell');
        if (!cellEl) return;
        const x = parseInt(cellEl.dataset.x), y = parseInt(cellEl.dataset.y);
        const target = tokenAt(x, y);
        if (target) {
            const indicator = cellEl.querySelector('.advantage-indicator');
            if (indicator) {
                if (hasAdvantage(actor, target)) indicator.textContent = '⬆️';
                else if (hasDisadvantage(actor, target)) indicator.textContent = '⬇️';
                else indicator.textContent = '';
            }
        }
    });
}
function clearAdvantageIndicators() {
    document.querySelectorAll('.advantage-indicator').forEach(i => i.textContent = '');
}

function showAiIntent(source, target) {
    const canvas = document.getElementById('ai-intent-canvas');
    const mapContainer = document.getElementById('mapContainer');
    canvas.width = mapContainer.scrollWidth; canvas.height = mapContainer.scrollHeight;
    const ctx = canvas.getContext('2d');
    if (!source.pos || !target.pos) return;
    
    const startX = source.pos.x * 32 + 16, startY = source.pos.y * 32 + 16;
    const endX = target.pos.x * 32 + 16, endY = target.pos.y * 32 + 16;

    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)'; ctx.lineWidth = 3; ctx.setLineDash([5, 5]);
    
    let dashOffset = 0;
    function animate() {
        dashOffset += 0.5; ctx.lineDashOffset = -dashOffset;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(endX, endY); ctx.stroke();
        if (dashOffset < 50) requestAnimationFrame(animate);
        else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    animate();
}

function showDamageEffect(x, y, color, target, isCrit = false) {
    if (isCrit) {
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 300);
    }
    const cell = queryCellEl(x, y);
    if (cell) cell.classList.add('shake');
    setTimeout(() => cell?.classList.remove('shake'), 500);
    if(target?.cls) sounds.playVoice(target, 'hurt');
}

function showKillCam(hero) {
    const overlay = document.getElementById('kill-cam-overlay');
    const img = document.getElementById('kill-cam-image');
    img.src = HERO_PORTRAITS[hero.cls];
    
    state.isAnimating = true;
    overlay.style.display = 'flex';
    setTimeout(() => {
        overlay.style.opacity = '1';
        img.style.transform = 'scale(1)';
    }, 10);

    setTimeout(() => {
        overlay.style.opacity = '0';
        img.style.transform = 'scale(0.5)';
        setTimeout(() => {
            overlay.style.display = 'none';
            state.isAnimating = false;
        }, 500);
    }, 2500);
}

function showRollResult(data) {
  const visualizer = document.getElementById('roll-visualizer');
  const { roller, roll, bonus, total, targetAC, crit, fumble } = data;
  let rollClass = '', resultClass = '', resultText = '';
  
  if (crit) { rollClass = 'roll-crit'; resultClass = 'roll-success'; resultText = '¡CRÍTICO!'; }
  else if (fumble) { rollClass = 'roll-fumble'; resultClass = 'roll-fail'; resultText = '¡PIFIA!'; }
  else if (total >= targetAC) { resultClass = 'roll-success'; resultText = '¡Impacto!'; }
  else { resultClass = 'roll-fail'; resultText = 'Fallo'; }

  visualizer.innerHTML = `
      <div class="text-lg">${roller} ataca...</div>
      <div class="text-4xl my-2">
          <span class="${rollClass}">${roll}</span> 
          <span class="text-2xl text-slate-400"> ${bonus >= 0 ? '+' : ''} ${bonus} = </span> 
          <span class="font-bold">${total}</span>
      </div>
      <div class="text-sm text-slate-300">vs CA ${targetAC}</div>
      <div class="text-xl mt-2 ${resultClass}">${resultText}</div>
  `;

  state.isAnimating = true;
  visualizer.style.display = 'block';
  setTimeout(() => visualizer.style.opacity = '1', 10);
  setTimeout(() => {
      visualizer.style.opacity = '0';
      setTimeout(() => {
          visualizer.style.display = 'none';
          state.isAnimating = false;
      }, 300);
  }, 2000);
}

// CORRECCIÓN BUG TUTORIAL: Nueva lógica de tutorial
// REEMPLAZAR CON ESTE CÓDIGO
// REEMPLAZA TU FUNCIÓN advanceTutorial COMPLETA CON ESTA:
function advanceTutorial(action) {
    if (!state.tutorial.active) return;

    const throg = state.heroes.find(h => h.cls === 'GUERRERO');
    
    switch(state.tutorial.step) {
        case 0: // Esperando movimiento
            if (action.type === 'move' && action.hero.id === throg.id &&
                action.hero.pos.x === state.tutorial.targetCell.x &&
                action.hero.pos.y === state.tutorial.targetCell.y) {
                
                if (state.enemies.length === 0) {
                    // CORRECCIÓN: El goblin ahora aparece en una casilla adyacente.
                    spawnEnemyAt(14, 9, 'GOBLIN_BUROCRATA', 'basic');
                    renderUI();
                }

                state.tutorial.step++;
                checkTutorialStep();
            }
            break;

        case 1: // Esperando ataque básico
            if (action.type === 'attack' && action.success) {
                state.tutorial.step++;
                checkTutorialStep();
            } 
            else if (action.type === 'enemy_killed') {
                log("<b>TUTORIAL:</b> ¡Vaya! Ni siquiera necesitaste tu ataque especial. Impresionante.", 'game');
                state.tutorial.step = 3; 
                checkTutorialStep();
            }
            break;

        case 2: // Esperando ataque de habilidad
            if (action.type === 'ability' && action.ability.key === 'golpe_poder' && action.success) {
                state.tutorial.step++;
                checkTutorialStep();
            }
            else if (action.type === 'enemy_killed') {
                log("<b>TUTORIAL:</b> El objetivo ha sido eliminado. ¡Buen trabajo!", 'game');
                state.tutorial.step++;
                checkTutorialStep();
            }
            break;
    }
}
// REEMPLAZA TU FUNCIÓN checkTutorialStep COMPLETA CON ESTA:
// REEMPLAZA TU FUNCIÓN checkTutorialStep COMPLETA CON ESTA:
function checkTutorialStep() {
    if (!state.tutorial.active) return;
    const throg = state.heroes.find(h => h.cls === 'GUERRERO');
    const throgCard = document.querySelector(`[data-id="hero-${throg.id}"]`);
    
    switch(state.tutorial.step) {
        case 0:
            clearHighlights();
            state.tutorial.targetCell = { x: 13, y: 9 };
            showTutorialMessage("¡Bienvenido! Empecemos con lo básico. Usa el botón <b>Mover</b> y haz clic en la casilla resaltada.");
            queryCellEl(state.tutorial.targetCell.x, state.tutorial.targetCell.y).classList.add('tutorial-highlight');
            if (throgCard) {
                throgCard.querySelector('.btn-move').classList.add('tutorial-highlight');
                setTutorialUIState(throgCard, ['.btn-move']);
            }
            break;
        case 1:
            clearHighlights();
            showTutorialMessage("¡Excelente! Ahora, un enemigo. Usa el botón <b>Atacar</b> y haz clic sobre el Goblin para golpearlo.");
            queryCellEl(14, 9).classList.add('tutorial-highlight');
            if (throgCard) {
                throgCard.querySelector('.btn-attack').classList.add('tutorial-highlight');
                setTutorialUIState(throgCard, ['.btn-attack']);
            }
            break;
        case 2:
            // --- INICIO DE LA SOLUCIÓN DEFINITIVA ---
            // Reiniciamos el estado de acción de Throg para que PUEDA realizar la segunda acción.
            if(throg) {
                throg.hasActed = false;
            }
            renderUI(); // Actualizamos la UI para que los botones se reactiven.
            // --- FIN DE LA SOLUCIÓN DEFINITIVA ---

            clearHighlights();
            showTutorialMessage("¡Buen golpe! Acaba con él usando tu habilidad <b>Golpe Poderoso</b> para causar daño extra.");
            queryCellEl(14, 9).classList.add('tutorial-highlight');
            if (throgCard) {
                const abilityBtn = throgCard.querySelector('.special-actions button');
                abilityBtn.classList.add('tutorial-highlight');
                setTutorialUIState(throgCard, ['.special-actions button']);
            }
            break;
        case 3:
            clearHighlights();
            showTutorialMessage("¡Perfecto! Has aprendido lo básico. Ahora, el resto de tu equipo se une a la aventura. ¡Buena suerte!");
            state.tutorial.active = false;
            setTimeout(() => {
                document.getElementById('tutorialBox').classList.add('hidden');
                setTutorialUIState(throgCard, [], true);
                state.heroes.forEach((h, i) => {
                    if (h.cls !== 'GUERRERO') h.pos = { x: 10 + i, y: 10 };
                });
                state.fogEnabled = true;
                generateDungeon();
            }, 4000);
            break;
    }
}

function showTutorialMessage(text) {
    const box = document.getElementById('tutorialBox');
    const p = document.getElementById('tutorialText');
    p.innerHTML = text;
    box.classList.remove('hidden');
}

function setTutorialUIState(card, enabledSelectors, enableAll = false) {
    if (!card) return;
    card.querySelectorAll('button').forEach(btn => {
        btn.disabled = !enableAll;
        btn.classList.remove('tutorial-highlight');
    });
    if (enableAll) return;
    enabledSelectors.forEach(selector => {
        const btn = card.querySelector(selector);
        if(btn) btn.disabled = false;
    });
}

function initMenu() {
    document.getElementById('btnNewGame').addEventListener('click', showCharSelect);
    document.getElementById('btnContinueGame').addEventListener('click', continueGame);
    document.getElementById('btnCredits').addEventListener('click', () => alert('Creado con caos y café por un desarrollador audaz.'));

    if (localStorage.getItem('calabozosYBufonesSave')) {
        document.getElementById('btnContinueGame').disabled = false;
    }
}

function showCharSelect() {
    document.getElementById('startScreen').classList.add('hidden');
    const charScreen = document.getElementById('charSelectScreen');
    charScreen.classList.remove('hidden');
    charScreen.classList.add('flex');

    const container = document.getElementById('heroSelectionContainer');
    container.innerHTML = '';
    Object.keys(CLASSES).forEach(clsKey => {
        const heroData = CLASSES[clsKey];
        const card = document.createElement('div');
        card.className = 'char-select-card';
        card.innerHTML = `
            <img src="${HERO_PORTRAITS[clsKey]}" class="w-full h-auto rounded-md object-cover aspect-[3/4] mb-4">
            <h3 class="font-title text-xl text-amber-200">${heroData.lore.name}</h3>
            <h4 class="text-sm text-slate-400">${heroData.name}</h4>
            <p class="text-xs mt-2 text-slate-300 h-24 overflow-y-auto scroll-slim">${heroData.lore.history}</p>
        `;
        container.appendChild(card);
    });

    document.getElementById('btnStartAdventure').addEventListener('click', () => {
        charScreen.classList.add('hidden');
        startGame(true);
    });
}

function continueGame() {
    document.getElementById('startScreen').classList.add('hidden');
    startGame(false);
    loadGame();
}

function startGame(withTutorial) {
    document.getElementById('game-ui').classList.remove('hidden');
    initUI();
    if (withTutorial) {
        state.tutorial.active = true;
        state.tutorial.step = 0;
    }
    if (state.heroes.length === 0) {
        const heroes = [ { name: 'Throg', class: 'GUERRERO' }, { name: 'Elowen', class: 'MAGO' }, { name: 'Grimble', class: 'PICARO' }, { name: 'Beryl', class: 'CLERIGO' } ];
        heroes.forEach(h => addHero(h.name, h.class));
    }
    setupAct(0);
}

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
});