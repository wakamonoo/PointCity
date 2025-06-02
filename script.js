//──────────────── State & Storage
const STORAGE_KEY = "pointcity";
let state = {
  teamA: { name: "", color: "#FF8A00", players: [] },
  teamB: { name: "", color: "#3884ff", players: [] },
  gameStarted: false,
};

//──────────────── Saves the current application state to localStorage.
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

//──────────────── Loads the application state from localStorage.
function loadState() {
  const s = localStorage.getItem(STORAGE_KEY);
  if (s) state = JSON.parse(s);
}

//──────────────── Clears all stored data and reloads the page.
function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

//──────────────── Setup Functions
//──────────────── Adds a player to the specified team.
function addPlayer(team) {
  const nameInp = document.getElementById(`team${team}PlayerName`);
  const numInp = document.getElementById(`team${team}PlayerNumber`);
  const name = nameInp.value.trim();
  const number = parseInt(numInp.value);
  if (!name || isNaN(number)) {
    console.error("Player name or number is invalid.");
    return;
  }

  state[`team${team}`].players.push({
    name,
    number,
    stats: {
      points: 0,
      assists: 0,
      rebounds: 0,
      fouls: 0,
      steals: 0,
      blocks: 0,
    },
  });
  nameInp.value = "";
  numInp.value = "";
  renderPlayerList(team);
  saveState();
}

//──────────────── Renders the list of players for a given team.
function renderPlayerList(team) {
  const ul = document.getElementById(`team${team}PlayerList`);
  if (!ul) {
    console.error(`Player list element for team ${team} not found.`);
    return;
  }
  ul.innerHTML = "";
  state[`team${team}`].players.forEach((p) => {
    ul.insertAdjacentHTML("beforeend", `<li>#${p.number} – ${p.name}</li>`);
  });
}

//──────────────── Navigation
//──────────────── Initiates the game, updates team names/colors, and switches to the game screen.
function startGame() {
  state.teamA.name = document.getElementById("teamAName").value || "Team A";
  state.teamB.name = document.getElementById("teamBName").value || "Team B";
  state.teamA.color = document.getElementById("teamAColor").value || "#FF8A00";
  state.teamB.color = document.getElementById("teamBColor").value || "#3884ff";
  state.gameStarted = true;
  saveState();
  showGameScreen();
}

//──────────────── Navigates back to the setup screen.
function backToSetup() {
  document.getElementById("gameScreen").classList.add("hidden");
  document.getElementById("setupScreen").classList.remove("hidden");
  document.getElementById("scoreboard").classList.add("hidden");
  renderPlayerList("A");
  renderPlayerList("B");
}

//──────────────── Resets the entire game by clearing storage and reloading.
function resetGame() {
  clearStorage();
}

//──────────────── Game Rendering
//──────────────── Displays the game screen and hides the setup screen.
function showGameScreen() {
  document.getElementById("setupScreen").classList.add("hidden");
  document.getElementById("gameScreen").classList.remove("hidden");
  document.getElementById("scoreboard").classList.remove("hidden");

  const gameTitleElement = document.getElementById("gameTitle");
  if (gameTitleElement) {
    gameTitleElement.textContent = `${state.teamA.name} vs ${state.teamB.name}`;
  } else {
    console.error("Game title element not found.");
  }

  renderTeamStats("A");
  renderTeamStats("B");
  updateScoreboard();
}

//──────────────── Calculates the total for a specific stat for a given team.
function calcTotal(team, stat) {
  return state[`team${team}`].players.reduce(
    (sum, p) => sum + p.stats[stat],
    0
  );
}

//──────────────── Updates the scoreboard display with current team points and applies a transition.
function updateScoreboard() {
  const scoreAElement = document.getElementById("scoreA");
  const scoreBElement = document.getElementById("scoreB");

  if (!scoreAElement || !scoreBElement) {
    console.error("Scoreboard elements not found.");
    return;
  }

  const newScoreA = calcTotal("A", "points");
  const newScoreB = calcTotal("B", "points");

  if (parseInt(scoreAElement.textContent) !== newScoreA) {
    scoreAElement.textContent = newScoreA;
    scoreAElement.classList.add("score-transition");
    scoreAElement.addEventListener(
      "animationend",
      () => {
        scoreAElement.classList.remove("score-transition");
      },
      { once: true }
    );
  }

  if (parseInt(scoreBElement.textContent) !== newScoreB) {
    scoreBElement.textContent = newScoreB;
    scoreBElement.classList.add("score-transition");
    scoreBElement.addEventListener(
      "animationend",
      () => {
        scoreBElement.classList.remove("score-transition");
      },
      { once: true }
    );
  }

  scoreAElement.style.color = state.teamA.color;
  scoreBElement.style.color = state.teamB.color;
}

//──────────────── Renders the statistics card for a specific team, including player stats and team totals.
function renderTeamStats(team) {
  const container = document.getElementById(`team${team}Stats`);
  if (!container) {
    console.error(`Team stats container for team ${team} not found.`);
    return;
  }
  const t = state[`team${team}`];
  container.innerHTML = "";

  let html = `<div class="rounded-xl p-6 bg-white/10 backdrop-blur-md shadow-lg border border-[${t.color}]
                      space-y-6">
            <h3 class="text-2xl font-bold" style="color:${t.color}">${t.name}</h3>`;

  t.players.forEach((p, idx) => {
    html += `<div class="space-y-2">
                      <h4 class="font-semibold">#${p.number} ${p.name}</h4>`;
    for (const s in p.stats) {
      html += `<div class="flex items-center justify-between gap-3 text-sm flex-wrap">
              <span class="capitalize w-24">${s}</span>
              <div class="flex items-center gap-2">
                <button onclick="changeStat('${team}',${idx},'${s}',-1)"
                        class="px-2 rounded bg-red-500 hover:bg-red-600 text-white transition">−</button>
                <span class="w-8 text-center" id="val-${team}-${idx}-${s}">
                  ${p.stats[s]}
                </span>
                <button onclick="changeStat('${team}',${idx},'${s}',1)"
                        class="px-2 rounded bg-green-500 hover:bg-green-600 text-white transition">+</button>
              </div>
            </div>`;
    }
    html += "</div>";
  });

  const totals = {
    assists: 0,
    rebounds: 0,
    fouls: 0,
    steals: 0,
    blocks: 0,
  };
  t.players.forEach((p) => {
    for (const s in totals) {
      totals[s] += p.stats[s];
    }
  });

  html += `<div class="font-bold pt-4 border-t border-white/20 space-y-1 text-sm">
             <p>Team Totals</p>`;
  for (const s in totals) {
    html += `<span class="mr-4">${s[0].toUpperCase() + s.slice(1)}: ${
      totals[s]
    }</span>`;
  }
  html += "</div></div>";

  container.innerHTML = html;
}

//──────────────── Changes a player's stat by a given delta (+1 or -1).
function changeStat(team, playerIdx, stat, delta) {
  const player = state[`team${team}`].players[playerIdx];
  if (!player) {
    console.error(`Player at index ${playerIdx} for team ${team} not found.`);
    return;
  }
  player.stats[stat] = Math.max(0, player.stats[stat] + delta);
  saveState();

  const statElement = document.getElementById(
    `val-${team}-${playerIdx}-${stat}`
  );
  if (statElement) {
    statElement.textContent = player.stats[stat];
  } else {
    console.error(`Stat element for ${stat} not found.`);
  }

  renderTeamStats(team);
  updateScoreboard();
}

//──────────────── Service Worker Registration
//──────────────── Checks if the browser supports Service Workers and registers the service worker.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log(
          "ServiceWorker registration successful with scope: ",
          registration.scope
        );
      })
      .catch((err) => {
        console.log("ServiceWorker registration failed: ", err);
      });
  });
}

//──────────────── Initial Page Load
//──────────────── Loads saved state, renders player lists, and displays the appropriate screen on page load.
loadState();
renderPlayerList("A");
renderPlayerList("B");

if (state.gameStarted) {
  showGameScreen();
} else {
  document.getElementById("scoreboard").classList.add("hidden");
}