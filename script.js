const mechanics = {
  minesweeper: {
    name: "Minesweeper", formula: "MINESWEEPER", title: "Faultline Survey", mark: "⚑",
    character: "Mara Quill", story: "The survey grid is unstable. Mark every fault before the signal breaks.",
    currency: "SURVEY TOKENS", currencyValue: 1840, gacha: "MARA / DEEP SCAN",
    mission: "Reveal safe survey tiles", rewards: [["⚑", "Flag"], ["◇", "Core"], ["◆", "Lumen"]],
  },
  tetris: {
    name: "Tetris", formula: "TETRIS", title: "Stackfall Circuit", mark: "▦",
    character: "Tess Rho", story: "Cargo fragments are dropping faster. Complete the rows before the stack locks.",
    currency: "STACK CHIPS", currencyValue: 960, gacha: "TESS / PERFECT CLEAR",
    mission: "Clear two complete lines", rewards: [["▦", "Block"], ["⌁", "Key"], ["✦", "Aster"]],
  },
  pacman: {
    name: "Pac-Man", formula: "PAC-MAN", title: "Signal Maze Relay", mark: "◆",
    character: "Pax Orbit", story: "Collect every signal bead while the roaming echoes rewrite the route.",
    currency: "MAZE BEADS", currencyValue: 2215, gacha: "PAX / AFTERGLOW",
    mission: "Collect maze signal beads", rewards: [["◆", "Trail"], ["◉", "Badge"], ["✦", "Aster"]],
  },
};

const layerNames = {
  character: "CHARACTER",
  story: "STORY",
  currency: "CURRENCY",
  missions: "MISSIONS",
  rewards: "REWARDS",
  gacha: "GACHA UI",
};

const layerOrder = Object.keys(layerNames);
const mechanicOrder = Object.keys(mechanics);
const storageKey = "shanzhai-event-generator:factory-state";

const saved = loadState();
const state = {
  mechanic: saved?.mechanic || null,
  layers: new Set(saved?.layers || []),
  layout: saved?.layout || 0,
  step: saved?.step || 1,
  run: null,
};

let toastTimer;
let gameLoopTimer;
const $ = (selector) => document.querySelector(selector);
const elements = {
  templateStep: $("#step-template"), assetsStep: $("#step-assets"), runStep: $("#step-run"),
  continueButton: $("#continue-button"), backButton: $("#back-button"), buildButton: $("#build-button"),
  backToBuilder: $("#back-to-builder"), restartGame: $("#restart-game"),
  selectedTemplateName: $("#selected-template-name"), formulaPreview: $("#formula-preview"), formulaNumber: $("#formula-number"),
  gameFrame: $("#game-frame"), gameStage: $("#game-stage"), eventMark: $("#event-mark"), eventTitle: $("#event-title"),
  characterName: $("#character-name"), storySpeaker: $("#story-speaker"), storyText: $("#story-text"),
  packagingPanel: $("#packaging-panel"), currencyValue: $("#currency-value"), currencyName: $("#currency-name"),
  missionName: $("#mission-name"), missionBar: $("#mission-bar"), missionValue: $("#mission-value"),
  rewardRow: $("#reward-row"), gachaTitle: $("#gacha-title"), gachaPull: $("#gacha-pull"), gachaStatus: $("#gacha-status"),
  toast: $("#toast"),
};

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey) || localStorage.getItem("shanzhai-event-generator:last-generation");
    const parsed = JSON.parse(raw);
    if (!parsed || !mechanics[parsed.mechanic]) return null;
    const layers = layerOrder.filter((layer) => Array.isArray(parsed.layers) && parsed.layers.includes(layer));
    let step = Number.isInteger(parsed.step) ? parsed.step : 1;
    if (step < 1 || step > 3 || (step > 1 && !parsed.mechanic) || (step === 3 && !layers.length)) step = 1;
    const previousLayout = Number.isInteger(parsed.layout) ? parsed.layout : parsed.variant;
    return { mechanic: parsed.mechanic, layers, layout: Number.isInteger(previousLayout) ? previousLayout % 3 : 0, step };
  } catch {
    return null;
  }
}

function persistState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ mechanic: state.mechanic, layers: orderedLayers(), layout: state.layout, step: state.step }));
  } catch { /* Local file previews may restrict storage. */ }
}

function orderedLayers() {
  return layerOrder.filter((layer) => state.layers.has(layer));
}

function formulaText() {
  if (!state.mechanic) return "";
  return [mechanics[state.mechanic].formula, ...orderedLayers().map((layer) => layerNames[layer])].join(" + ");
}

function formulaCode() {
  const mechanicValue = mechanicOrder.indexOf(state.mechanic) + 1;
  const mask = orderedLayers().reduce((total, layer) => total + (1 << layerOrder.indexOf(layer)), 0);
  const code = 100 + ((mechanicValue * 97 + mask * 11 + state.layout * 37) % 900);
  return `FORMULA NO. SZ-${String(code).padStart(3, "0")}`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 1300);
}

function syncBuilder() {
  document.querySelectorAll(".choice-card[data-mechanic]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mechanic === state.mechanic));
  });
  document.querySelectorAll(".asset-card[data-layer]").forEach((button) => {
    button.setAttribute("aria-pressed", String(state.layers.has(button.dataset.layer)));
  });
  elements.continueButton.disabled = !state.mechanic;
  elements.buildButton.disabled = !state.mechanic || state.layers.size === 0;
  elements.selectedTemplateName.textContent = state.mechanic ? mechanics[state.mechanic].name : "—";
  elements.formulaPreview.textContent = state.layers.size ? formulaText() : "Choose at least one asset.";
  elements.formulaPreview.classList.toggle("is-ready", state.layers.size > 0);
  document.querySelectorAll("[data-progress]").forEach((item) => {
    const value = Number(item.dataset.progress);
    item.classList.toggle("is-current", value === state.step);
    item.classList.toggle("is-complete", value < state.step);
  });
}

function showStep(step, pushHistory = true) {
  if (step === 2 && !state.mechanic) step = 1;
  if (step === 3 && (!state.mechanic || state.layers.size === 0)) step = state.mechanic ? 2 : 1;
  state.step = step;
  elements.templateStep.hidden = step !== 1;
  elements.assetsStep.hidden = step !== 2;
  elements.runStep.hidden = step !== 3;
  document.body.classList.toggle("is-running", step === 3);
  if (step === 3) {
    if (!state.run) state.run = createRunState();
    renderEvent();
    startGameLoop();
  } else {
    stopGameLoop();
  }
  syncBuilder();
  persistState();
  if (pushHistory) history.pushState({ factoryStep: step }, "", location.pathname + location.search);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function createRunState() {
  const coreStates = {
    minesweeper: createMinesweeperState(),
    tetris: createTetrisState(),
    pacman: createPacmanState(),
  };
  return { core: coreStates[state.mechanic], progress: 0, gachaPulls: 0, lastDraw: "" };
}

function eventTitle(data) {
  let title = data.title;
  if (state.layers.has("character")) title = `${data.character.split(" ")[0]} · ${title}`;
  if (state.layers.has("gacha")) title = `Limited ${title}`;
  return title;
}

function renderEvent() {
  const data = mechanics[state.mechanic];
  const commercialLayers = ["currency", "missions", "rewards", "gacha"];
  const hasPackaging = commercialLayers.some((layer) => state.layers.has(layer));
  elements.gameFrame.dataset.mechanic = state.mechanic;
  elements.gameFrame.dataset.layout = String(state.layout);
  layerOrder.forEach((layer) => elements.gameFrame.classList.toggle(`asset-${layer}`, state.layers.has(layer)));
  elements.gameFrame.classList.toggle("has-character", state.layers.has("character"));
  elements.gameFrame.classList.toggle("has-packaging", hasPackaging);
  elements.eventMark.textContent = data.mark;
  elements.eventTitle.textContent = eventTitle(data);
  elements.characterName.textContent = data.character;
  elements.storySpeaker.textContent = state.layers.has("character") ? data.character : "EVENT SYSTEM";
  elements.storyText.textContent = data.story;
  elements.formulaNumber.textContent = formulaCode();
  document.querySelectorAll("[data-run-layer]").forEach((module) => {
    module.hidden = !state.layers.has(module.dataset.runLayer);
  });
  elements.packagingPanel.hidden = !hasPackaging;
  renderCore();
  renderPackaging();
}

const mineBoardSize = 9;
const mineCount = 10;

function createMinesweeperState() {
  return { size: mineBoardSize, mineCount, mines: null, revealed: new Set(), flags: new Set(), phase: "playing", status: "Left-click to reveal. Right-click to mark a mine." };
}

function mineNeighbors(index, size) {
  const row = Math.floor(index / size);
  const column = index % size;
  const neighbors = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      const nextRow = row + rowOffset;
      const nextColumn = column + columnOffset;
      if (nextRow >= 0 && nextRow < size && nextColumn >= 0 && nextColumn < size) neighbors.push(nextRow * size + nextColumn);
    }
  }
  return neighbors;
}

function seedMines(run, safeIndex) {
  const protectedTiles = new Set([safeIndex, ...mineNeighbors(safeIndex, run.size)]);
  const available = Array.from({ length: run.size * run.size }, (_, index) => index).filter((index) => !protectedTiles.has(index));
  for (let index = available.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [available[index], available[swapIndex]] = [available[swapIndex], available[index]];
  }
  run.mines = new Set(available.slice(0, run.mineCount));
}

function adjacentMineCount(run, index) {
  if (!run.mines) return 0;
  return mineNeighbors(index, run.size).filter((neighbor) => run.mines.has(neighbor)).length;
}

function revealMineTile(index) {
  const run = state.run.core;
  if (run.phase !== "playing" || run.flags.has(index) || run.revealed.has(index)) return;
  if (!run.mines) seedMines(run, index);
  if (run.mines.has(index)) {
    run.phase = "lost";
    run.status = "Mine triggered — survey failed.";
    run.mines.forEach((mine) => run.revealed.add(mine));
  } else {
    const queue = [index];
    while (queue.length) {
      const current = queue.shift();
      if (run.revealed.has(current) || run.flags.has(current) || run.mines.has(current)) continue;
      run.revealed.add(current);
      if (adjacentMineCount(run, current) === 0) mineNeighbors(current, run.size).forEach((neighbor) => queue.push(neighbor));
    }
    const safeTotal = run.size * run.size - run.mineCount;
    if (run.revealed.size === safeTotal) {
      run.phase = "won";
      run.status = "Board cleared — survey complete.";
    } else {
      run.status = "Safe tile revealed.";
    }
  }
  state.run.progress = Math.round((run.revealed.size / (run.size * run.size - run.mineCount)) * 100);
  renderCore();
  renderPackaging();
}

function toggleMineFlag(index) {
  const run = state.run.core;
  if (run.phase !== "playing" || run.revealed.has(index)) return;
  if (run.flags.has(index)) run.flags.delete(index);
  else if (run.flags.size < run.mineCount) run.flags.add(index);
  run.status = run.flags.has(index) ? "Mine marker placed." : "Mine marker removed.";
  renderCore();
}

function minesweeperMarkup() {
  const run = state.run.core;
  const remaining = Math.max(0, run.mineCount - run.flags.size);
  const tiles = Array.from({ length: run.size * run.size }, (_, index) => {
    const revealed = run.revealed.has(index);
    const flagged = run.flags.has(index);
    const isMine = Boolean(run.mines?.has(index));
    const nearby = revealed && !isMine ? adjacentMineCount(run, index) : 0;
    const classes = ["mine-cell"];
    if (revealed) classes.push("is-revealed");
    if (flagged) classes.push("is-flagged");
    if (revealed && isMine) classes.push("is-mine");
    if (nearby) classes.push(`mine-count-${nearby}`);
    const label = flagged ? "Flagged tile" : revealed && isMine ? "Mine" : revealed ? `${nearby} nearby mines` : "Covered tile";
    const content = flagged ? "⚑" : revealed && isMine ? "✹" : nearby || "";
    return `<button class="${classes.join(" ")}" type="button" data-action="mine-reveal" data-index="${index}" data-has-mine="${isMine}" aria-label="${label}" ${revealed || run.phase !== "playing" ? "disabled" : ""}>${content}</button>`;
  }).join("");
  return `<div class="minesweeper-game">
    <div class="game-hud"><span>MINES ${remaining}</span><span>SAFE ${run.revealed.size}</span><span>${run.phase.toUpperCase()}</span></div>
    <div class="mine-board" aria-label="Minesweeper board">${tiles}</div>
    <p class="game-status">${run.status}</p>
  </div>`;
}

const tetrisPieces = [
  { name: "I", color: 1, shape: [[1, 1, 1, 1]] },
  { name: "O", color: 2, shape: [[1, 1], [1, 1]] },
  { name: "T", color: 3, shape: [[0, 1, 0], [1, 1, 1]] },
  { name: "L", color: 4, shape: [[1, 0], [1, 0], [1, 1]] },
  { name: "J", color: 5, shape: [[0, 1], [0, 1], [1, 1]] },
  { name: "S", color: 6, shape: [[0, 1, 1], [1, 1, 0]] },
  { name: "Z", color: 7, shape: [[1, 1, 0], [0, 1, 1]] },
];

function emptyTetrisBoard() {
  return Array.from({ length: 20 }, () => Array(10).fill(0));
}

function createTetrisState() {
  const run = { board: emptyTetrisBoard(), current: null, score: 0, lines: 0, phase: "playing", status: "Use arrow keys. Space performs a hard drop." };
  spawnTetrisPiece(run);
  return run;
}

function tetrisCanPlace(run, piece, offsetX = piece.x, offsetY = piece.y, shape = piece.shape) {
  return shape.every((row, rowIndex) => row.every((cell, columnIndex) => {
    if (!cell) return true;
    const x = offsetX + columnIndex;
    const y = offsetY + rowIndex;
    return x >= 0 && x < 10 && y >= 0 && y < 20 && run.board[y][x] === 0;
  }));
}

function spawnTetrisPiece(run) {
  const source = tetrisPieces[Math.floor(Math.random() * tetrisPieces.length)];
  run.current = { name: source.name, color: source.color, shape: source.shape.map((row) => [...row]), x: Math.floor((10 - source.shape[0].length) / 2), y: 0 };
  if (!tetrisCanPlace(run, run.current)) {
    run.phase = "lost";
    run.status = "Stack reached the top — run failed.";
  }
}

function rotateTetrisShape(shape) {
  return shape[0].map((_, columnIndex) => shape.map((row) => row[columnIndex]).reverse());
}

function lockTetrisPiece(run) {
  run.current.shape.forEach((row, rowIndex) => row.forEach((cell, columnIndex) => {
    if (cell) run.board[run.current.y + rowIndex][run.current.x + columnIndex] = run.current.color;
  }));
  const remainingRows = run.board.filter((row) => row.some((cell) => cell === 0));
  const cleared = 20 - remainingRows.length;
  while (remainingRows.length < 20) remainingRows.unshift(Array(10).fill(0));
  run.board = remainingRows;
  if (cleared) {
    const rewards = [0, 100, 300, 500, 800];
    run.lines += cleared;
    run.score += rewards[cleared];
    run.status = `${cleared} line${cleared > 1 ? "s" : ""} cleared.`;
  } else {
    run.status = "Block locked.";
  }
  spawnTetrisPiece(run);
  state.run.progress = Math.min(100, run.lines * 50);
  if (run.phase === "lost") stopGameLoop();
}

function stepTetris(softDrop = false) {
  const run = state.run.core;
  if (run.phase !== "playing") return;
  if (tetrisCanPlace(run, run.current, run.current.x, run.current.y + 1)) {
    run.current.y += 1;
    if (softDrop) run.score += 1;
  } else {
    lockTetrisPiece(run);
  }
  renderCore();
  renderPackaging();
}

function moveTetris(horizontal) {
  const run = state.run.core;
  if (run.phase !== "playing") return;
  if (tetrisCanPlace(run, run.current, run.current.x + horizontal, run.current.y)) run.current.x += horizontal;
  renderCore();
}

function rotateTetris() {
  const run = state.run.core;
  if (run.phase !== "playing") return;
  const rotated = rotateTetrisShape(run.current.shape);
  const kick = [0, -1, 1, -2, 2].find((offset) => tetrisCanPlace(run, run.current, run.current.x + offset, run.current.y, rotated));
  if (kick !== undefined) {
    run.current.shape = rotated;
    run.current.x += kick;
    run.status = "Block rotated.";
  }
  renderCore();
}

function hardDropTetris() {
  const run = state.run.core;
  if (run.phase !== "playing") return;
  let distance = 0;
  while (tetrisCanPlace(run, run.current, run.current.x, run.current.y + 1)) {
    run.current.y += 1;
    distance += 1;
  }
  run.score += distance * 2;
  lockTetrisPiece(run);
  renderCore();
  renderPackaging();
}

function tetrisMarkup() {
  const run = state.run.core;
  const controlsDisabled = run.phase === "playing" ? "" : "disabled";
  const active = new Map();
  if (run.current && run.phase === "playing") run.current.shape.forEach((row, rowIndex) => row.forEach((cell, columnIndex) => {
    if (cell) active.set(`${run.current.x + columnIndex},${run.current.y + rowIndex}`, run.current.color);
  }));
  const cells = run.board.flatMap((row, y) => row.map((value, x) => {
    const activeValue = active.get(`${x},${y}`);
    const color = activeValue || value;
    return `<span class="tetris-cell${color ? ` block-${color}` : ""}${activeValue ? " is-active" : ""}" data-position="${x},${y}"></span>`;
  })).join("");
  return `<div class="tetris-game">
    <div class="game-hud"><span>SCORE ${run.score}</span><span>LINES ${run.lines}</span><span>${run.phase.toUpperCase()}</span></div>
    <div class="tetris-playfield"><div class="tetris-board" aria-label="Tetris board">${cells}</div><aside class="tetris-info"><strong>${run.current?.name || "—"}</strong><span>CURRENT BLOCK</span><p class="game-status">${run.status}</p></aside></div>
    <div class="tetris-controls" aria-label="Tetris controls"><button class="core-button" data-action="tetris-left" aria-label="Move block left" ${controlsDisabled}>←</button><button class="core-button" data-action="tetris-rotate" aria-label="Rotate block" ${controlsDisabled}>↻</button><button class="core-button" data-action="tetris-right" aria-label="Move block right" ${controlsDisabled}>→</button><button class="core-button" data-action="tetris-down" aria-label="Soft drop" ${controlsDisabled}>↓</button><button class="core-button" data-action="tetris-drop" ${controlsDisabled}>Drop</button></div>
  </div>`;
}

const mazeLayout = [
  "#################",
  "#P......#.......#",
  "#.###.#.#.###.#.#",
  "#.....#.....#...#",
  "###.#.#####.#.#.#",
  "#...#.......#...#",
  "#.#.###.#.###.#.#",
  "#.#.....G.....#.#",
  "#.#####.#.#####.#",
  "#.......#.......#",
  "#.###.#####.###.#",
  "#...............#",
  "#################",
];
const mazeWidth = mazeLayout[0].length;
const mazeHeight = mazeLayout.length;
const mazeDirections = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function createPacmanState() {
  const walls = new Set();
  const dots = new Set();
  let playerStart = 0;
  let enemyStart = 0;
  mazeLayout.forEach((row, y) => [...row].forEach((cell, x) => {
    const index = y * mazeWidth + x;
    if (cell === "#") walls.add(index);
    if (cell === ".") dots.add(index);
    if (cell === "P") playerStart = index;
    if (cell === "G") enemyStart = index;
  }));
  return { walls, dots, totalDots: dots.size, player: playerStart, enemy: enemyStart, playerStart, enemyStart, score: 0, lives: 3, phase: "playing", status: "Use arrow keys or WASD to collect every signal bead." };
}

function mazeTarget(index, direction) {
  const [offsetX, offsetY] = mazeDirections[direction];
  const x = index % mazeWidth;
  const y = Math.floor(index / mazeWidth);
  return (y + offsetY) * mazeWidth + x + offsetX;
}

function availableMazeNeighbors(run, index) {
  return Object.values(mazeDirections).map(([offsetX, offsetY]) => {
    const x = index % mazeWidth;
    const y = Math.floor(index / mazeWidth);
    return (y + offsetY) * mazeWidth + x + offsetX;
  }).filter((target) => !run.walls.has(target));
}

function resolveMazeCollision(run) {
  if (run.player !== run.enemy) return;
  run.lives -= 1;
  if (run.lives <= 0) {
    run.phase = "lost";
    run.status = "All lives lost — relay failed.";
    stopGameLoop();
  } else {
    run.player = run.playerStart;
    run.enemy = run.enemyStart;
    run.status = `Echo collision — ${run.lives} lives remain.`;
  }
}

function movePacman(direction) {
  const run = state.run.core;
  if (run.phase !== "playing") return;
  const target = mazeTarget(run.player, direction);
  if (run.walls.has(target)) {
    run.status = "That route is blocked.";
  } else {
    run.player = target;
    if (run.dots.delete(target)) run.score += 10;
    run.status = "Signal bead collected.";
    resolveMazeCollision(run);
    if (run.phase === "playing" && run.dots.size === 0) {
      run.phase = "won";
      run.status = "Maze cleared — relay complete.";
      stopGameLoop();
    }
  }
  state.run.progress = Math.round(((run.totalDots - run.dots.size) / run.totalDots) * 100);
  renderCore();
  renderPackaging();
}

function moveMazeEnemy() {
  if (state.step !== 3 || state.mechanic !== "pacman" || !state.run || state.run.core.phase !== "playing") return;
  const run = state.run.core;
  const playerX = run.player % mazeWidth;
  const playerY = Math.floor(run.player / mazeWidth);
  const options = availableMazeNeighbors(run, run.enemy).sort((first, second) => {
    const distance = (index) => Math.abs((index % mazeWidth) - playerX) + Math.abs(Math.floor(index / mazeWidth) - playerY);
    return distance(first) - distance(second);
  });
  run.enemy = Math.random() < 0.72 ? options[0] : options[Math.floor(Math.random() * options.length)];
  resolveMazeCollision(run);
  renderCore();
  renderPackaging();
}

function pacmanMarkup() {
  const run = state.run.core;
  const controlsDisabled = run.phase === "playing" ? "" : "disabled";
  const cells = Array.from({ length: mazeWidth * mazeHeight }, (_, index) => {
    const contents = [run.dots.has(index) ? '<i class="maze-dot"></i>' : "", run.player === index ? `<i class="maze-player" data-index="${index}"></i>` : "", run.enemy === index ? `<i class="maze-enemy" data-index="${index}"></i>` : ""].join("");
    return `<span class="maze-cell${run.walls.has(index) ? " is-wall" : ""}">${contents}</span>`;
  }).join("");
  return `<div class="pacman-game">
    <div class="game-hud"><span>SCORE ${run.score}</span><span>LIVES ${run.lives}</span><span>DOTS ${run.dots.size}</span></div>
    <div class="maze-board" style="--maze-columns:${mazeWidth}" aria-label="Collectible maze">${cells}</div>
    <div class="maze-controls"><div class="move-pad" aria-label="Maze movement controls"><button class="core-button up" data-action="maze-move" data-direction="up" aria-label="Move up" ${controlsDisabled}>↑</button><button class="core-button left" data-action="maze-move" data-direction="left" aria-label="Move left" ${controlsDisabled}>←</button><button class="core-button down" data-action="maze-move" data-direction="down" aria-label="Move down" ${controlsDisabled}>↓</button><button class="core-button right" data-action="maze-move" data-direction="right" aria-label="Move right" ${controlsDisabled}>→</button></div><p class="game-status">${run.status}</p></div>
  </div>`;
}

const coreBuilders = { minesweeper: minesweeperMarkup, tetris: tetrisMarkup, pacman: pacmanMarkup };

function renderCore() {
  elements.gameStage.innerHTML = coreBuilders[state.mechanic]();
  elements.gameStage.querySelectorAll("button[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "mine-reveal") revealMineTile(Number(button.dataset.index));
      if (action === "tetris-left") moveTetris(-1);
      if (action === "tetris-right") moveTetris(1);
      if (action === "tetris-rotate") rotateTetris();
      if (action === "tetris-down") stepTetris(true);
      if (action === "tetris-drop") hardDropTetris();
      if (action === "maze-move") movePacman(button.dataset.direction);
    });
  });
  elements.gameStage.querySelectorAll('[data-action="mine-reveal"]').forEach((button) => {
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      toggleMineFlag(Number(button.dataset.index));
    });
  });
}

function renderPackaging() {
  const data = mechanics[state.mechanic];
  elements.currencyValue.textContent = Math.max(0, data.currencyValue - state.run.gachaPulls * 120).toLocaleString("en-US");
  elements.currencyName.textContent = data.currency;
  elements.missionName.textContent = data.mission;
  elements.missionBar.style.width = `${state.run.progress}%`;
  elements.missionValue.textContent = `${state.run.progress}%`;
  elements.rewardRow.innerHTML = data.rewards.map(([icon, name]) => `<span class="reward-item"><b>${icon}</b><small>${name}</small></span>`).join("");
  elements.gachaTitle.textContent = data.gacha;
  const pity = 18 + state.run.gachaPulls;
  elements.gachaStatus.textContent = state.run.lastDraw ? `${state.run.lastDraw} · Guarantee ${pity} / 80` : `Guarantee ${pity} / 80`;
}

function stopGameLoop() {
  clearInterval(gameLoopTimer);
  gameLoopTimer = null;
}

function startGameLoop() {
  stopGameLoop();
  if (state.mechanic === "tetris" && state.run?.core.phase === "playing") gameLoopTimer = setInterval(() => stepTetris(), 650);
  if (state.mechanic === "pacman" && state.run?.core.phase === "playing") gameLoopTimer = setInterval(moveMazeEnemy, 620);
}

document.querySelectorAll(".choice-card[data-mechanic]").forEach((button) => {
  button.addEventListener("click", () => {
    state.mechanic = button.dataset.mechanic;
    state.run = null;
    syncBuilder();
    persistState();
  });
});

document.querySelectorAll(".asset-card[data-layer]").forEach((button) => {
  button.addEventListener("click", () => {
    const layer = button.dataset.layer;
    if (state.layers.has(layer)) state.layers.delete(layer); else state.layers.add(layer);
    state.run = null;
    syncBuilder();
    persistState();
  });
});

elements.continueButton.addEventListener("click", () => { if (state.mechanic) showStep(2); });
elements.backButton.addEventListener("click", () => showStep(1));
elements.buildButton.addEventListener("click", () => {
  if (!state.mechanic || state.layers.size === 0) return;
  state.layout = Math.floor(Math.random() * 3);
  state.run = createRunState();
  showStep(3);
});
elements.backToBuilder.addEventListener("click", () => showStep(2));
elements.restartGame.addEventListener("click", () => {
  const gachaPulls = state.run?.gachaPulls || 0;
  const lastDraw = state.run?.lastDraw || "";
  stopGameLoop();
  state.run = createRunState();
  state.run.gachaPulls = gachaPulls;
  state.run.lastDraw = lastDraw;
  renderCore();
  renderPackaging();
  startGameLoop();
  showToast("Game state restarted");
});

elements.gachaPull.addEventListener("click", () => {
  if (!state.run || !state.layers.has("gacha")) return;
  state.run.gachaPulls += 1;
  const outcomes = ["Signal Fragment", "Event Token", "Rare Echo"];
  state.run.lastDraw = outcomes[(state.run.gachaPulls - 1) % outcomes.length];
  renderPackaging();
  showToast(`${state.run.lastDraw} obtained`);
});

document.addEventListener("keydown", (event) => {
  if (state.step !== 3 || !state.run) return;
  if (state.mechanic === "tetris") {
    const tetrisKeys = {
      ArrowLeft: () => moveTetris(-1), ArrowRight: () => moveTetris(1), ArrowDown: () => stepTetris(true), ArrowUp: rotateTetris,
    };
    const action = event.code === "Space" ? hardDropTetris : tetrisKeys[event.key];
    if (!action) return;
    event.preventDefault();
    action();
  }
  if (state.mechanic === "pacman") {
    const mazeKeys = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right" };
    const direction = mazeKeys[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (!direction) return;
    event.preventDefault();
    movePacman(direction);
  }
});

window.addEventListener("popstate", (event) => {
  showStep(Number(event.state?.factoryStep) || 1, false);
});

history.replaceState({ factoryStep: state.step }, "", location.pathname + location.search);
showStep(state.step, false);
