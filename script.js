/* ───────────────  state & persistence  ─────────────── */
const STORAGE_KEY = 'pointcity';
let state = {
  teamA: { name: '', color: '#FF8A00', players: [] },
  teamB: { name: '', color: '#3884ff', players: [] },
  gameStarted: false,
};

const saveState = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
const loadState = () => {
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) state = JSON.parse(s);
};
const clearStorage = () => { localStorage.removeItem(STORAGE_KEY); location.reload(); };

/* ───────────────  setup helpers  ─────────────── */
function addPlayer(team) {
  const nameInp = document.getElementById(`team${team}PlayerName`);
  const numInp  = document.getElementById(`team${team}PlayerNumber`);
  const name    = nameInp.value.trim();
  const number  = parseInt(numInp.value);

  if (!name || isNaN(number)) return;

  state[`team${team}`].players.push({
    name, number,
    stats: { points:0, assists:0, rebounds:0, fouls:0, steals:0, blocks:0 }
  });

  nameInp.value = '';  numInp.value = '';
  renderPlayerList(team);
  saveState();
}

function renderPlayerList(team) {
  const ul = document.getElementById(`team${team}PlayerList`);
  ul.innerHTML = '';
  state[`team${team}`].players.forEach(p =>
    ul.insertAdjacentHTML('beforeend', `<li>#${p.number} – ${p.name}</li>`)
  );
}

/* ───────────────  navigation  ─────────────── */
function startGame() {
  state.teamA.name  = document.getElementById('teamAName').value || 'Team A';
  state.teamB.name  = document.getElementById('teamBName').value || 'Team B';
  state.teamA.color = document.getElementById('teamAColor').value || '#FF8A00';
  state.teamB.color = document.getElementById('teamBColor').value || '#3884ff';
  state.gameStarted = true;
  saveState();
  showGameScreen();
}

const backToSetup = () => {
  document.getElementById('gameScreen').classList.add('hidden');
  document.getElementById('setupScreen').classList.remove('hidden');
  document.getElementById('scoreboard').classList.add('hidden');
  renderPlayerList('A'); renderPlayerList('B');
};

const resetGame = () => clearStorage();

/* ───────────────  game rendering  ─────────────── */
function showGameScreen() {
  document.getElementById('setupScreen').classList.add('hidden');
  document.getElementById('gameScreen').classList.remove('hidden');
  document.getElementById('scoreboard').classList.remove('hidden');

  document.getElementById('gameTitle').textContent =
    `${state.teamA.name} vs ${state.teamB.name}`;

  renderTeamStats('A'); renderTeamStats('B');
  updateScoreboard();
}

const calcTotal = (team, stat) =>
  state[`team${team}`].players.reduce((sum, p) => sum + p.stats[stat], 0);

function updateScoreboard() {
  const scoreA = document.getElementById('scoreA');
  const scoreB = document.getElementById('scoreB');

  const newA = calcTotal('A', 'points');
  const newB = calcTotal('B', 'points');

  if (+scoreA.textContent !== newA) {
    scoreA.textContent = newA;
    scoreA.classList.add('score-transition');
    scoreA.addEventListener('animationend',
      () => scoreA.classList.remove('score-transition'), { once:true });
  }
  if (+scoreB.textContent !== newB) {
    scoreB.textContent = newB;
    scoreB.classList.add('score-transition');
    scoreB.addEventListener('animationend',
      () => scoreB.classList.remove('score-transition'), { once:true });
  }
  scoreA.style.color = state.teamA.color;
  scoreB.style.color = state.teamB.color;
}

function renderTeamStats(team) {
  const c = document.getElementById(`team${team}Stats`);
  const t = state[`team${team}`];
  let html = `<div class="rounded-xl p-6 bg-white/10 backdrop-blur-md shadow-lg
                       border border-[${t.color}] space-y-6">
                <h3 class="text-2xl font-bold" style="color:${t.color}">${t.name}</h3>`;

  t.players.forEach((p,i) => {
    html += `<div class="space-y-2">
               <h4 class="font-semibold">#${p.number} ${p.name}</h4>`;
    for (const s in p.stats) {
      html += `<div class="flex items-center justify-between gap-3 text-sm flex-wrap">
                 <span class="capitalize w-24">${s}</span>
                 <div class="flex items-center gap-2">
                   <button onclick="changeStat('${team}',${i},'${s}',-1)"
                           class="px-2 rounded bg-red-500 hover:bg-red-600 text-white transition">−</button>
                   <span class="w-8 text-center" id="val-${team}-${i}-${s}">${p.stats[s]}</span>
                   <button onclick="changeStat('${team}',${i},'${s}',1)"
                           class="px-2 rounded bg-green-500 hover:bg-green-600 text-white transition">+</button>
                 </div>
               </div>`;
    }
    html += '</div>';
  });

  const totals = { assists:0, rebounds:0, fouls:0, steals:0, blocks:0 };
  t.players.forEach(p => { for (const s in totals) totals[s]+=p.stats[s]; });

  html += `<div class="font-bold pt-4 border-t border-white/20 space-y-1 text-sm">
             <p>Team Totals</p>`;
  for (const s in totals)
    html += `<span class="mr-4">${s[0].toUpperCase()+s.slice(1)}: ${totals[s]}</span>`;
  html += '</div></div>';

  c.innerHTML = html;
}

/* change stat (+/–) */
function changeStat(team, idx, stat, d) {
  const p = state[`team${team}`].players[idx];
  p.stats[stat] = Math.max(0, p.stats[stat] + d);
  saveState();
  document.getElementById(`val-${team}-${idx}-${stat}`).textContent = p.stats[stat];
  renderTeamStats(team);
  updateScoreboard();
}

/* ───────────────  first paint  ─────────────── */
loadState();
renderPlayerList('A'); renderPlayerList('B');
state.gameStarted ? showGameScreen()
                  : document.getElementById('scoreboard').classList.add('hidden');
