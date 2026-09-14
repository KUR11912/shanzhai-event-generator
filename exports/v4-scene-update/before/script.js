const mechanics = {
  minesweeper: {
    name: "Minesweeper", formula: "MINESWEEPER", title: "Faultline Survey", mark: "⚑",
    coreLoop: "Reveal Tiles → Identify Mines → Mark Mines → Clear the Board",
  },
  tetris: {
    name: "Tetris", formula: "TETRIS", title: "Stackfall Circuit", mark: "▦",
    coreLoop: "Falling Blocks → Move and Rotate → Complete Lines → Clear Lines",
  },
  pacman: {
    name: "Maze Chase", formula: "MAZE CHASE", title: "Signal Maze Relay", mark: "◆",
    coreLoop: "Navigate the Maze → Collect Dots → Avoid or Chase Enemies",
  },
};

const packagingCatalog = [
  { key: "visualSkin", icon: "✦", label: "Visual Skin", description: "Replaces colors, scenery, icons, and effects.", options: [["fantasy", "Fantasy"], ["cyber", "Cyber"], ["military", "Military"]] },
  { key: "characterPackage", icon: "◇", label: "Character Package", description: "Adds an original branded event host.", options: [["animeHero", "Anime Hero"], ["cuteMascot", "Cute Mascot"], ["tacticalOperator", "Tactical Operator"]] },
  { key: "eventStory", icon: "≋", label: "Event Story", description: "Rewrites the event title and premise.", options: [["summerFestival", "Summer Festival"], ["worldCrisis", "World Crisis"], ["limitedTournament", "Limited Tournament"]] },
  { key: "rewardSystem", icon: "◆", label: "Reward System", description: "Adds rewards around the unchanged game.", options: [["eventCurrency", "Event Currency"], ["dailyMissions", "Daily Missions"], ["limitedRewards", "Limited Rewards"]] },
  { key: "monetizationLayer", icon: "✧", label: "Monetization Layer", description: "Adds a commercial live-service frame.", options: [["gachaBanner", "Gacha Banner"], ["battlePass", "Battle Pass"], ["countdownOffer", "Countdown Offer"]] },
];

const packageContent = {
  characterPackage: {
    animeHero: { name: "Astra Vale", role: "Limited Event Hero" },
    cuteMascot: { name: "Pip-03", role: "Festival Mascot" },
    tacticalOperator: { name: "Commander Rook", role: "Operations Guide" },
  },
  eventStory: {
    summerFestival: {
      titles: { minesweeper: "Sunlit Relic Hunt", tetris: "Starlight Stack Festival", pacman: "Firefly Maze Parade" },
      copy: "A seasonal celebration transforms a familiar challenge into a limited-time attraction.",
    },
    worldCrisis: {
      titles: { minesweeper: "Faultline Emergency", tetris: "Last Stack Protocol", pacman: "Signal Maze Crisis" },
      copy: "The world is ending again. Complete the proven activity loop before the warning reaches zero.",
    },
    limitedTournament: {
      titles: { minesweeper: "Survey Masters Cup", tetris: "Grand Stack Championship", pacman: "Neon Relay Tournament" },
      copy: "A ranked event reframes the same mechanic as an exclusive competitive season.",
    },
  },
};

const eventDialogueCopy = {
  minesweeper: "Reveal the sealed tiles and locate the hidden crystal traps.",
  tetris: "Arrange the falling crystal blocks and complete each energy line.",
  pacman: "Explore the enchanted maze, collect the energy shards, and avoid the guardians.",
};

const mechanicOrder = Object.keys(mechanics);
const storageKey = "shanzhai-event-generator:factory-state";

const saved = loadState();
const state = {
  mechanic: saved?.mechanic || null,
  assets: saved?.assets || {},
  layout: saved?.layout || 0,
  step: saved?.step || 1,
  run: null,
  uiMode: "core",
  eventReady: false,
  packagingHidden: false,
};

let toastTimer;
let gameLoopTimer;
let gameClockTimer;
let productionTimer;
let isProducing = false;
let modeConversionTimer;
let isConvertingMode = false;
const $ = (selector) => document.querySelector(selector);
const elements = {
  templateStep: $("#step-template"), assetsStep: $("#step-assets"), runStep: $("#step-run"),
  continueButton: $("#continue-button"), backButton: $("#back-button"), buildButton: $("#build-button"),
  backToBuilder: $("#back-to-builder"), restartGame: $("#restart-game"),
  revealMechanic: $("#reveal-mechanic"), anotherSkin: $("#another-skin"),
  selectedTemplateName: $("#selected-template-name"), assetGrid: $("#asset-grid"), formulaPreview: $("#formula-preview"), formulaNumber: $("#formula-number"),
  coreMechanicSummary: $("#core-mechanic-summary"), addedElementsSummary: $("#added-elements-summary"),
  gameFrame: $("#game-frame"), gameStage: $("#game-stage"), eventShellBackground: $("#event-shell-background"), eventMark: $("#event-mark"), eventTitle: $("#event-title"),
  eventDialogue: $("#event-dialogue"), packagingPanel: $("#packaging-panel"),
  modeConversion: $("#mode-conversion"), modeConversionStatus: $("#mode-conversion-status"), modeConversionBar: $("#mode-conversion-bar"),
  templateFeedback: $("#template-feedback"), productionProcess: $("#production-process"), productionStatus: $("#production-status"), productionBar: $("#production-bar"),
  toast: $("#toast"),
};

function normalizeAssets(mechanic, rawAssets) {
  const normalized = {};
  if (!mechanic || !rawAssets || typeof rawAssets !== "object") return normalized;
  packagingCatalog.forEach((group) => {
    if (group.options.some(([value]) => value === rawAssets[group.key])) normalized[group.key] = rawAssets[group.key];
  });
  return normalized;
}

function loadState() {
  try {
    const raw = localStorage.getItem(storageKey) || localStorage.getItem("shanzhai-event-generator:last-generation");
    const parsed = JSON.parse(raw);
    if (!parsed || !mechanics[parsed.mechanic]) return null;
    const assets = normalizeAssets(parsed.mechanic, parsed.assets);
    let step = Number.isInteger(parsed.step) ? parsed.step : 1;
    if (step < 1 || step > 3 || (step > 1 && !parsed.mechanic)) step = 1;
    if (step === 3 && Object.keys(assets).length === 0) step = 2;
    const previousLayout = Number.isInteger(parsed.layout) ? parsed.layout : parsed.variant;
    return { mechanic: parsed.mechanic, assets, layout: Number.isInteger(previousLayout) ? previousLayout % 3 : 0, step };
  } catch {
    return null;
  }
}

function persistState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ mechanic: state.mechanic, assets: state.assets, layout: state.layout, step: state.step }));
  } catch { /* Local file previews may restrict storage. */ }
}

function assetValue(key, fallback = null) {
  return state.assets[key] || fallback;
}

function selectedAssetEntries() {
  if (!state.mechanic) return [];
  return packagingCatalog.flatMap((group) => {
    const value = state.assets[group.key];
    const option = group.options.find(([optionValue]) => optionValue === value);
    return option ? [{ key: group.key, group: group.label, value, label: option[1], icon: group.icon }] : [];
  });
}

function formulaText() {
  if (!state.mechanic) return "";
  return [mechanics[state.mechanic].formula, ...selectedAssetEntries().map((entry) => entry.label.toUpperCase())].join(" + ");
}

function formulaCode() {
  const mechanicValue = mechanicOrder.indexOf(state.mechanic) + 1;
  const signature = selectedAssetEntries().map((entry) => entry.key + entry.value).join("");
  const assetValueTotal = [...signature].reduce((total, character) => total + character.charCodeAt(0), 0);
  const code = 100 + ((mechanicValue * 97 + assetValueTotal * 11 + state.layout * 37) % 900);
  return `FORMULA NO. SZ-${String(code).padStart(3, "0")}`;
}

function eventSpritePath(mechanic, spriteName) {
  return window.EVENT_UI_ASSETS?.[mechanic]?.sprites?.[spriteName] || "";
}

function eventSpriteMarkup(mechanic, spriteName, className = "") {
  const path = eventSpritePath(mechanic, spriteName);
  return path ? `<img class="event-sprite ${className}" src="${path}" alt="" aria-hidden="true" />` : "";
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = setTimeout(() => elements.toast.classList.remove("is-visible"), 1300);
}

function renderAssetGrid() {
  if (!state.mechanic) {
    elements.assetGrid.innerHTML = "";
    return;
  }
  elements.assetGrid.innerHTML = packagingCatalog.map((group) => {
    const selected = state.assets[group.key] || "";
    const options = group.options.map(([value, label]) => `<button class="asset-option" type="button" data-asset-group="${group.key}" data-asset-value="${value}" aria-pressed="${selected === value}">${label}</button>`).join("");
    return `<article class="choice-card asset-card asset-group" data-selected="${Boolean(selected)}">
      <span class="choice-icon" aria-hidden="true">${group.icon}</span><strong>${group.label}</strong><small>${group.description}</small>
      <div class="asset-options" role="group" aria-label="${group.label} options">${options}</div><i aria-hidden="true">✓</i>
    </article>`;
  }).join("");
}

function syncBuilder() {
  document.querySelectorAll(".choice-card[data-mechanic]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mechanic === state.mechanic));
  });
  renderAssetGrid();
  const selectedAssets = selectedAssetEntries();
  elements.continueButton.disabled = !state.mechanic;
  elements.buildButton.disabled = !state.mechanic || selectedAssets.length === 0 || isProducing;
  elements.backButton.disabled = isProducing;
  elements.templateFeedback.hidden = !state.mechanic;
  elements.selectedTemplateName.textContent = state.mechanic ? mechanics[state.mechanic].name : "—";
  elements.formulaPreview.textContent = selectedAssets.length ? formulaText() : "Choose at least one packaging module.";
  elements.formulaPreview.classList.toggle("is-ready", selectedAssets.length > 0);
  document.querySelectorAll("[data-progress]").forEach((item) => {
    const value = Number(item.dataset.progress);
    item.classList.toggle("is-current", value === state.step);
    item.classList.toggle("is-complete", value < state.step);
  });
}

function showStep(step, pushHistory = true) {
  if (step !== 3 && isConvertingMode) cancelModeConversion();
  if (step === 2 && !state.mechanic) step = 1;
  if (step === 3 && (!state.mechanic || selectedAssetEntries().length === 0)) step = state.mechanic ? 2 : 1;
  state.step = step;
  elements.templateStep.hidden = step !== 1;
  elements.assetsStep.hidden = step !== 2;
  elements.runStep.hidden = step !== 3;
  document.body.classList.toggle("is-running", step === 3);
  if (step === 3) {
    const needsInitialRender = !state.run || !elements.gameStage.firstElementChild;
    if (!state.run) state.run = createRunState();
    if (needsInitialRender) renderCore();
    renderPackaging();
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
  const coreStateBuilders = {
    minesweeper: createMinesweeperState,
    tetris: createTetrisState,
    pacman: createPacmanState,
  };
  return {
    core: coreStateBuilders[state.mechanic](),
    progress: 0,
    elapsedSeconds: 0,
    packageRemaining: assetValue("monetizationLayer") === "countdownOffer" ? 900 : null,
  };
}

function currentEventTitle() {
  const story = packageContent.eventStory[assetValue("eventStory")];
  return story?.titles[state.mechanic] || mechanics[state.mechanic].title;
}

function renderEventShell() {
  const eventMode = state.uiMode === "event";
  if (!eventMode || !state.run) {
    elements.eventDialogue.textContent = "";
    elements.eventDialogue.setAttribute("aria-hidden", "true");
    return;
  }
  const character = packageContent.characterPackage[assetValue("characterPackage")];
  elements.eventDialogue.textContent = character ? `${character.name}: ${eventDialogueCopy[state.mechanic]}` : eventDialogueCopy[state.mechanic];
  elements.eventDialogue.setAttribute("aria-hidden", "false");
}

function renderEvent() {
  const data = mechanics[state.mechanic];
  const packaged = state.uiMode === "event";
  const packagingEntries = selectedAssetEntries();
  const hasPackaging = packagingEntries.length > 0;
  state.packagingHidden = false;
  elements.gameFrame.dataset.mechanic = state.mechanic;
  elements.gameFrame.dataset.layout = String(state.layout);
  elements.gameFrame.dataset.mode = packaged ? "event" : "core";
  elements.gameFrame.dataset.theme = hasPackaging ? assetValue("visualSkin", "default") : "default";
  elements.gameFrame.dataset.story = hasPackaging ? assetValue("eventStory", "none") : "none";
  elements.gameFrame.classList.toggle("has-packaging", hasPackaging);
  elements.gameFrame.classList.toggle("is-unpackaged", !hasPackaging);
  elements.gameFrame.classList.toggle("is-event-mode", packaged);
  elements.gameFrame.classList.toggle("is-core-mode", !packaged);
  const eventBackground = state.mechanic === "minesweeper"
    ? window.EVENT_UI_ASSETS?.common?.background
    : window.EVENT_UI_ASSETS?.shell?.path;
  if (eventBackground && elements.eventShellBackground.getAttribute("src") !== eventBackground) {
    elements.eventShellBackground.setAttribute("src", eventBackground);
  }
  elements.eventMark.textContent = data.mark;
  elements.eventTitle.textContent = hasPackaging ? currentEventTitle() : `${data.name} / CORE BUILD`;
  elements.formulaNumber.textContent = formulaCode();
  elements.coreMechanicSummary.textContent = data.coreLoop;
  elements.addedElementsSummary.textContent = hasPackaging ? packagingEntries.map((entry) => `${entry.group}: ${entry.label}`).join(" · ") : "No packaging modules selected.";
  elements.packagingPanel.classList.toggle("is-concealed", !hasPackaging);
  elements.packagingPanel.setAttribute("aria-hidden", String(!hasPackaging));
  elements.revealMechanic.textContent = packaged ? "Reveal the Original Mechanic" : state.eventReady ? "Restore Event Packaging" : "Convert to Event Version";
  elements.revealMechanic.classList.toggle("button-primary", !packaged);
  elements.revealMechanic.classList.toggle("button-secondary", packaged);
  elements.revealMechanic.disabled = isConvertingMode;
  elements.backToBuilder.disabled = isConvertingMode;
  elements.anotherSkin.disabled = isConvertingMode;
  elements.restartGame.disabled = isConvertingMode;
  renderPackaging();
  renderEventShell();
}

const mineSizes = { small: 7, medium: 9, large: 12 };
const mineDensityRatios = { low: 0.12, normal: 0.16, high: 0.22 };

function createMinesweeperState() {
  const size = mineSizes[assetValue("boardSize", "medium")];
  const mineCount = Math.max(6, Math.round(size * size * mineDensityRatios[assetValue("mineDensity", "normal")]));
  const gameMode = assetValue("gameMode", "classic");
  return {
    size, mineCount, gameMode, mines: null, revealed: new Set(), flags: new Set(), triggeredMines: new Set(),
    phase: "playing", lives: gameMode === "limitedLives" ? 3 : null,
    timeRemaining: gameMode === "timeLimit" ? ({ 7: 60, 9: 90, 12: 120 }[size]) : null,
    shield: assetValue("specialTile") === "safetyShield", chainUsed: false,
    status: "Left-click to reveal. Right-click to mark a mine.",
  };
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
  if (run.phase !== "playing" || run.flags.has(index) || run.revealed.has(index) || run.triggeredMines.has(index)) return;
  if (!run.mines) seedMines(run, index);
  if (run.mines.has(index)) {
    if (run.shield) {
      run.shield = false;
      run.flags.add(index);
      run.status = "Safety Shield absorbed a mine.";
    } else if (run.gameMode === "limitedLives" && run.lives > 1) {
      run.lives -= 1;
      run.triggeredMines.add(index);
      run.status = `Mine triggered — ${run.lives} lives remain.`;
    } else {
      if (run.gameMode === "limitedLives") run.lives = 0;
      run.phase = "lost";
      run.status = "Mine triggered — survey failed.";
      run.mines.forEach((mine) => run.triggeredMines.add(mine));
      stopGameLoop();
    }
  } else {
    const chainReveal = assetValue("specialTile") === "chainReveal" && !run.chainUsed;
    const queue = chainReveal ? [index, ...mineNeighbors(index, run.size)] : [index];
    if (chainReveal) run.chainUsed = true;
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
      run.status = chainReveal ? "Chain Reveal opened a safe cluster." : "Safe tile revealed.";
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
  const scoreMultiplier = assetValue("specialTile") === "scoreMultiplier" ? 2 : 1;
  const score = run.revealed.size * 10 * scoreMultiplier;
  const tiles = Array.from({ length: run.size * run.size }, (_, index) => {
    const revealed = run.revealed.has(index);
    const flagged = run.flags.has(index);
    const isMine = Boolean(run.mines?.has(index));
    const triggered = run.triggeredMines.has(index);
    const nearby = revealed && !isMine ? adjacentMineCount(run, index) : 0;
    const classes = ["mine-cell"];
    if (revealed) classes.push("is-revealed");
    if (flagged) classes.push("is-flagged");
    if (triggered) classes.push("is-revealed", "is-mine");
    if (nearby) classes.push(`mine-count-${nearby}`);
    const label = flagged ? "Flagged tile" : triggered ? "Mine" : revealed ? `${nearby} nearby mines` : "Covered tile";
    const content = flagged ? "⚑" : triggered ? "✹" : nearby || "";
    const spriteName = flagged ? "flag" : triggered ? "mine" : revealed ? (nearby > 0 && nearby <= 4 ? `number${nearby}` : "cellOpen") : "cellClosed";
    classes.push(`event-mine-${spriteName}`);
    return `<button class="${classes.join(" ")}" type="button" data-action="mine-reveal" data-index="${index}" aria-label="${label}" ${revealed || triggered || run.phase !== "playing" ? "disabled" : ""}>${content}</button>`;
  }).join("");
  const modeValue = run.timeRemaining !== null ? `<span>TIME ${run.timeRemaining}</span>` : run.lives !== null ? `<span>LIVES ${run.lives}</span>` : "";
  const abilityValue = assetValue("specialTile") === "safetyShield" ? (run.shield ? "SHIELD READY" : "SHIELD USED") : scoreMultiplier === 2 ? "SCORE ×2" : assetValue("specialTile") === "chainReveal" ? (run.chainUsed ? "CHAIN USED" : "CHAIN READY") : "CLASSIC RULES";
  const board = `<div class="mine-board" style="--board-size:${run.size}" aria-label="Minesweeper board">${tiles}</div>`;
  const boardMarkup = `<div class="game-board-shell mine-board-shell">${board}</div>`;
  const outcome = run.phase === "won"
    ? eventSpriteMarkup("minesweeper", "victory", "event-mine-outcome event-mine-victory")
    : run.phase === "lost"
      ? `${eventSpriteMarkup("minesweeper", "explosion", "event-mine-impact")}${eventSpriteMarkup("minesweeper", "failure", "event-mine-outcome event-mine-failure")}`
      : "";
  return `<div class="minesweeper-game">
    <div class="game-hud"><span>MINES ${remaining}</span><span>SCORE ${score}</span>${modeValue}<span>${abilityValue}</span><span>${run.phase.toUpperCase()}</span></div>
    ${boardMarkup}
    <p class="game-status">${run.status}</p>
    ${outcome}
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

function randomTetrisPieceName() {
  return tetrisPieces[Math.floor(Math.random() * tetrisPieces.length)].name;
}

function createTetrisState() {
  const run = {
    board: emptyTetrisBoard(), current: null, score: 0, lines: 0, phase: "playing",
    status: "Use arrow keys. Space performs a hard drop.", nextName: randomTetrisPieceName(), holdName: null,
    canHold: true, spawnedCount: 0, lockedCount: 0, combo: 0,
    timeRemaining: assetValue("boardRule") === "timeAttack" ? 90 : null,
  };
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

function spawnTetrisPiece(run, forcedName = null) {
  const sourceName = forcedName || run.nextName || randomTetrisPieceName();
  const source = tetrisPieces.find((piece) => piece.name === sourceName);
  if (!forcedName) run.nextName = randomTetrisPieceName();
  run.spawnedCount += 1;
  const special = assetValue("specialBlock") && run.spawnedCount % 4 === 0 ? assetValue("specialBlock") : null;
  run.current = {
    name: source.name, color: source.color, shape: source.shape.map((row) => [...row]),
    x: Math.floor((10 - source.shape[0].length) / 2), y: 0, special,
  };
  if (!tetrisCanPlace(run, run.current)) {
    run.phase = "lost";
    run.status = "Stack reached the top — run failed.";
  }
}

function rotateTetrisShape(shape) {
  return shape[0].map((_, columnIndex) => shape.map((row) => row[columnIndex]).reverse());
}

function lockTetrisPiece(run) {
  const occupiedCells = [];
  run.current.shape.forEach((row, rowIndex) => row.forEach((cell, columnIndex) => {
    if (cell) {
      const y = run.current.y + rowIndex;
      const x = run.current.x + columnIndex;
      run.board[y][x] = run.current.color;
      occupiedCells.push([x, y]);
    }
  }));
  if (run.current.special === "bombBlock") {
    occupiedCells.forEach(([centerX, centerY]) => {
      for (let y = Math.max(0, centerY - 1); y <= Math.min(19, centerY + 1); y += 1) {
        for (let x = Math.max(0, centerX - 1); x <= Math.min(9, centerX + 1); x += 1) run.board[y][x] = 0;
      }
    });
    run.status = "Bomb Block cleared its landing zone.";
  }
  if (run.current.special === "scoreBlock") {
    run.score += 250;
    run.status = "Score Block awarded 250 points.";
  }
  const remainingRows = run.board.filter((row) => row.some((cell) => cell === 0));
  const cleared = 20 - remainingRows.length;
  while (remainingRows.length < 20) remainingRows.unshift(Array(10).fill(0));
  run.board = remainingRows;
  if (cleared) {
    run.lastClearAt = Date.now();
    const rewards = [0, 100, 300, 500, 800];
    run.lines += cleared;
    run.combo += 1;
    const comboBonus = assetValue("extraFeature") === "comboBonus" ? Math.max(0, run.combo - 1) * 100 : 0;
    run.score += rewards[cleared] + comboBonus;
    run.status = `${cleared} line${cleared > 1 ? "s" : ""} cleared.`;
  } else {
    run.combo = 0;
    if (!run.current.special) run.status = "Block locked.";
  }
  run.lockedCount += 1;
  if (assetValue("boardRule") === "risingFloor" && run.lockedCount % 5 === 0) {
    if (run.board[0].some(Boolean)) {
      run.phase = "lost";
      run.status = "Rising floor reached the top.";
    } else {
      run.board.shift();
      const hole = Math.floor(Math.random() * 10);
      run.board.push(Array.from({ length: 10 }, (_, index) => index === hole ? 0 : 8));
      run.status = "The floor rose by one row.";
    }
  }
  run.canHold = true;
  if (run.phase === "playing") spawnTetrisPiece(run);
  state.run.progress = Math.min(100, run.lines * 50);
  if (run.phase === "lost") stopGameLoop();
}

function holdTetris() {
  const run = state.run.core;
  if (run.phase !== "playing" || assetValue("extraFeature") !== "holdBlock" || !run.canHold) return;
  const currentName = run.current.name;
  if (run.holdName) {
    const heldName = run.holdName;
    run.holdName = currentName;
    spawnTetrisPiece(run, heldName);
  } else {
    run.holdName = currentName;
    spawnTetrisPiece(run);
  }
  run.canHold = false;
  run.status = `Held ${currentName} block.`;
  renderCore();
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
  if (run.current.special === "lockedBlock") {
    run.status = "Locked Block cannot rotate.";
    renderCore();
    return;
  }
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
  const timedHud = run.timeRemaining !== null ? `<span>TIME ${run.timeRemaining}</span>` : "";
  const featureInfo = assetValue("extraFeature") === "holdBlock" ? `<span>HOLD ${run.holdName || "—"}</span>` : assetValue("extraFeature") === "nextPreview" ? `<span>NEXT ${run.nextName}</span>` : assetValue("extraFeature") === "comboBonus" ? `<span>COMBO ×${run.combo}</span>` : "";
  const specialInfo = run.current?.special ? `<span class="special-block-label">${run.current.special.replace(/([A-Z])/g, " $1").toUpperCase()}</span>` : "";
  const holdButton = assetValue("extraFeature") === "holdBlock" ? `<button class="core-button" data-action="tetris-hold" ${controlsDisabled || (!run.canHold ? "disabled" : "")}>Hold</button>` : "";
  const clearEffect = run.lastClearAt && Date.now() - run.lastClearAt < 550 ? eventSpriteMarkup("tetris", "lineClear", "event-line-clear") : "";
  const boardMarkup = `<div class="game-board-shell tetris-board-shell">${eventSpriteMarkup("tetris", "boardFrame", "event-board-frame")}${eventSpriteMarkup("tetris", "grid", "event-board-grid")}<div class="tetris-board" aria-label="Tetris board">${cells}</div>${clearEffect}</div>`;
  const infoMarkup = `<aside class="tetris-info"><strong>${run.current?.name || "—"}</strong><span>CURRENT BLOCK</span>${specialInfo}${featureInfo}<p class="game-status">${run.status}</p></aside>`;
  return `<div class="tetris-game">
    <div class="game-hud"><span>SCORE ${run.score}</span><span>LINES ${run.lines}</span>${timedHud}<span>${run.phase.toUpperCase()}</span></div>
    <div class="tetris-playfield">${boardMarkup}${infoMarkup}</div>
    <div class="tetris-controls" aria-label="Tetris controls"><button class="core-button" data-action="tetris-left" aria-label="Move block left" ${controlsDisabled}>←</button><button class="core-button" data-action="tetris-rotate" aria-label="Rotate block" ${controlsDisabled}>↻</button><button class="core-button" data-action="tetris-right" aria-label="Move block right" ${controlsDisabled}>→</button><button class="core-button" data-action="tetris-down" aria-label="Soft drop" ${controlsDisabled}>↓</button><button class="core-button" data-action="tetris-drop" ${controlsDisabled}>Drop</button>${holdButton}</div>
  </div>`;
}

const mazeLayouts = {
  classic: [
    "#################", "#P......#.......#", "#.###.#.#.###.#.#", "#.....#.....#...#", "###.#.#####.#.#.#",
    "#...#.......#...#", "#.#.###.#.###.#.#", "#.#.....G.....#.#", "#.#####.#.#####.#", "#.......#.......#",
    "#.###.#####.###.#", "#...............#", "#################",
  ],
  symmetrical: [
    "#################", "#P......#......G#", "#.###.#.#.#.###.#", "#.....#...#.....#", "###.#.#####.#.###",
    "#...#.......#...#", "#.#.###.#.###.#.#", "#.......#.......#", "#.#.###.#.###.#.#", "#...#.......#...#",
    "#.###.#####.###.#", "#...............#", "#################",
  ],
  multipleRooms: [
    "#################", "#P....#.....#...#", "#.##..#.###.#.#.#", "#.....#...#.....#", "#####.###.###.###",
    "#.....#.....#...#", "#.###...###...#.#", "#...#..G..#.....#", "###.###.###.###.#", "#...#.....#.....#",
    "#.#.#.###.#.##..#", "#...#.....#.....#", "#################",
  ],
};
const mazeDirections = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function createPacmanState() {
  const layout = mazeLayouts[assetValue("mazeLayout", "classic")];
  const width = layout[0].length;
  const height = layout.length;
  const walls = new Set();
  const dots = new Set();
  let playerStart = 0;
  let enemyStart = 0;
  layout.forEach((row, y) => [...row].forEach((cell, x) => {
    const index = y * width + x;
    if (cell === "#") walls.add(index);
    if (cell === ".") dots.add(index);
    if (cell === "P") playerStart = index;
    if (cell === "G") enemyStart = index;
  }));
  const gameMode = assetValue("gameMode", "classic");
  const specialItem = assetValue("specialItem");
  const dotList = [...dots];
  return {
    width, height, walls, dots, totalDots: dots.size, player: playerStart, enemy: enemyStart, playerStart, enemyStart,
    score: 0, lives: gameMode === "limitedLives" ? 2 : 3, phase: "playing",
    timeRemaining: gameMode === "timeLimit" ? 90 : null,
    specialItem, specialPosition: specialItem ? dotList[Math.floor(dotList.length * 0.65)] : null,
    powerTicks: 0, speedTicks: 0, shieldActive: false, patrolIndex: 0,
    status: "Use arrow keys or WASD to collect every signal bead.",
  };
}

function mazeTarget(run, index, direction) {
  const [offsetX, offsetY] = mazeDirections[direction];
  const x = index % run.width;
  const y = Math.floor(index / run.width);
  return (y + offsetY) * run.width + x + offsetX;
}

function availableMazeNeighbors(run, index) {
  return Object.values(mazeDirections).map(([offsetX, offsetY]) => {
    const x = index % run.width;
    const y = Math.floor(index / run.width);
    return (y + offsetY) * run.width + x + offsetX;
  }).filter((target) => !run.walls.has(target));
}

function resolveMazeCollision(run) {
  if (run.player !== run.enemy) return;
  if (run.powerTicks > 0) {
    run.score += 200;
    run.enemy = run.enemyStart;
    run.status = "Powered collision — echo dispersed.";
    return;
  }
  if (run.shieldActive) {
    run.shieldActive = false;
    run.enemy = run.enemyStart;
    run.status = "Temporary Shield absorbed the collision.";
    return;
  }
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
  const steps = run.speedTicks > 0 ? 2 : 1;
  let moved = false;
  for (let step = 0; step < steps && run.phase === "playing"; step += 1) {
    const target = mazeTarget(run, run.player, direction);
    if (run.walls.has(target)) break;
    moved = true;
    run.player = target;
    if (run.dots.delete(target)) run.score += 10;
    if (run.specialPosition === target) {
      run.specialPosition = null;
      if (run.specialItem === "powerPellet") run.powerTicks = 18;
      if (run.specialItem === "speedBoost") run.speedTicks = 18;
      if (run.specialItem === "temporaryShield") run.shieldActive = true;
      run.status = `${selectedAssetEntries().find((entry) => entry.key === "specialItem")?.label || "Special item"} activated.`;
    }
    resolveMazeCollision(run);
  }
  if (run.speedTicks > 0) run.speedTicks -= 1;
  if (!moved) run.status = "That route is blocked.";
  else if (!run.status.includes("activated") && !run.status.includes("collision")) run.status = "Signal bead collected.";
  if (run.phase === "playing" && run.dots.size === 0) {
    run.phase = "won";
    run.status = "Maze cleared — relay complete.";
    stopGameLoop();
  }
  state.run.progress = Math.round(((run.totalDots - run.dots.size) / run.totalDots) * 100);
  renderCore();
  renderPackaging();
}

function moveMazeEnemy() {
  if (state.step !== 3 || state.mechanic !== "pacman" || !state.run || state.run.core.phase !== "playing") return;
  const run = state.run.core;
  const options = availableMazeNeighbors(run, run.enemy);
  const behaviour = assetValue("enemyBehaviour", "chase");
  if (behaviour === "random") {
    run.enemy = options[Math.floor(Math.random() * options.length)];
  } else if (behaviour === "patrol") {
    const patrolDirections = ["right", "down", "left", "up"];
    let target = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const direction = patrolDirections[(run.patrolIndex + attempt) % patrolDirections.length];
      const candidate = mazeTarget(run, run.enemy, direction);
      if (!run.walls.has(candidate)) {
        target = candidate;
        run.patrolIndex = (run.patrolIndex + attempt + 1) % 4;
        break;
      }
    }
    run.enemy = target ?? options[0];
  } else {
    const playerX = run.player % run.width;
    const playerY = Math.floor(run.player / run.width);
    run.enemy = options.sort((first, second) => {
      const distance = (index) => Math.abs((index % run.width) - playerX) + Math.abs(Math.floor(index / run.width) - playerY);
      return distance(first) - distance(second);
    })[0];
  }
  if (run.powerTicks > 0) run.powerTicks -= 1;
  resolveMazeCollision(run);
  renderCore();
  renderPackaging();
}

function mazeWallVisual(run, index) {
  const x = index % run.width;
  const y = Math.floor(index / run.width);
  const wallAt = (nextX, nextY) => nextX >= 0 && nextX < run.width && nextY >= 0 && nextY < run.height && run.walls.has(nextY * run.width + nextX);
  const connections = [wallAt(x, y - 1), wallAt(x + 1, y), wallAt(x, y + 1), wallAt(x - 1, y)];
  const count = connections.filter(Boolean).length;
  if (count >= 4) return { sprite: "wallCross", rotation: 0 };
  if (count === 3) return { sprite: "wallT", rotation: connections[0] && connections[1] && connections[2] ? 90 : connections[1] && connections[2] && connections[3] ? 180 : connections[2] && connections[3] && connections[0] ? 270 : 0 };
  if (count === 2 && connections[1] && connections[3]) return { sprite: "wallHorizontal", rotation: 0 };
  if (count === 2 && connections[0] && connections[2]) return { sprite: "wallVertical", rotation: 0 };
  if (count === 2) {
    const rotation = connections[0] && connections[1] ? 0 : connections[1] && connections[2] ? 90 : connections[2] && connections[3] ? 180 : 270;
    return { sprite: "wallCorner", rotation };
  }
  return { sprite: connections[0] || connections[2] ? "wallVertical" : "wallHorizontal", rotation: 0 };
}

function pacmanMarkup() {
  const run = state.run.core;
  const controlsDisabled = run.phase === "playing" ? "" : "disabled";
  const cells = Array.from({ length: run.width * run.height }, (_, index) => {
    const isWall = run.walls.has(index);
    const wallVisual = isWall ? mazeWallVisual(run, index) : null;
    const wallClass = wallVisual ? ` maze-${wallVisual.sprite.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}` : "";
    const dot = run.dots.has(index) ? '<i class="maze-dot" aria-label="Collectible"></i>' : "";
    const special = run.specialPosition === index ? `<i class="maze-special ${run.specialItem}" aria-label="Special item"></i>` : "";
    const player = run.player === index ? `<i class="maze-player${run.powerTicks > 0 ? " is-powered" : ""}${run.shieldActive ? " has-shield" : ""}" data-index="${index}" aria-label="Player"></i>` : "";
    const enemy = run.enemy === index ? `<i class="maze-enemy" data-index="${index}" aria-label="Guardian"></i>` : "";
    return `<span class="maze-cell${isWall ? " is-wall" : ""}${wallClass}">${dot}${special}${player}${enemy}</span>`;
  }).join("");
  const modeHud = run.timeRemaining !== null ? `<span>TIME ${run.timeRemaining}</span>` : `<span>LIVES ${run.lives}</span>`;
  const abilityHud = run.powerTicks > 0 ? `POWER ${run.powerTicks}` : run.speedTicks > 0 ? `BOOST ${run.speedTicks}` : run.shieldActive ? "SHIELD READY" : "";
  const board = `<div class="maze-board" style="--maze-columns:${run.width};--maze-rows:${run.height}" aria-label="Collectible maze">${cells}</div>`;
  const boardMarkup = `<div class="game-board-shell maze-board-shell">${eventSpriteMarkup("pacman", "boardFrame", "event-board-frame")}${board}</div>`;
  return `<div class="pacman-game">
    <div class="game-hud"><span>SCORE ${run.score}</span>${modeHud}<span>DOTS ${run.dots.size}</span>${abilityHud ? `<span>${abilityHud}</span>` : ""}</div>
    ${boardMarkup}
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
      if (action === "tetris-hold") holdTetris();
      if (action === "maze-move") movePacman(button.dataset.direction);
    });
  });
  elements.gameStage.querySelectorAll('[data-action="mine-reveal"]').forEach((button) => {
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      toggleMineFlag(Number(button.dataset.index));
    });
  });
  renderEventShell();
}

function renderPackaging() {
  const modules = [];
  const visualSkin = assetValue("visualSkin");
  const characterPackage = assetValue("characterPackage");
  const eventStory = assetValue("eventStory");
  const rewardSystem = assetValue("rewardSystem");
  const monetizationLayer = assetValue("monetizationLayer");

  if (visualSkin) {
    const label = packagingCatalog[0].options.find(([value]) => value === visualSkin)?.[1];
    modules.push(`<article class="package-module extension-module skin-module"><span>✦</span><small>Visual Skin</small><strong>${label}</strong></article>`);
  }

  if (characterPackage) {
    const character = packageContent.characterPackage[characterPackage];
    modules.push(`<article class="package-module character-package">
      <span class="abstract-portrait ${characterPackage}" aria-hidden="true"><i></i><b></b></span>
      <small>Character Package</small><strong>${character.name}</strong><em>${character.role}</em>
    </article>`);
  }

  if (eventStory) {
    const story = packageContent.eventStory[eventStory];
    const storyLabel = packagingCatalog[2].options.find(([value]) => value === eventStory)?.[1];
    modules.push(`<article class="package-module story-package"><small>${storyLabel}</small><strong>${story.titles[state.mechanic]}</strong><p>${story.copy}</p></article>`);
  }

  if (rewardSystem === "eventCurrency") {
    const amounts = { minesweeper: 1280, tetris: 1840, pacman: 960 };
    modules.push(`<article class="package-module currency-module"><span class="module-icon">◆</span><div><small>Event Currency</small><strong>${amounts[state.mechanic].toLocaleString()}</strong><span>EVENT TOKENS</span></div></article>`);
  }
  if (rewardSystem === "dailyMissions") {
    modules.push(`<article class="package-module mission-module"><small>Daily Mission</small><strong>Complete the core activity</strong><div class="progress-bar"><i style="width:${state.run?.progress || 0}%"></i></div><small>${state.run?.progress || 0}%</small></article>`);
  }
  if (rewardSystem === "limitedRewards") {
    modules.push(`<article class="package-module reward-module"><small>Limited Rewards</small><div class="reward-row"><span class="reward-item">✦<small>Badge</small></span><span class="reward-item">◇<small>Frame</small></span><span class="reward-item">◆<small>Tokens</small></span></div></article>`);
  }

  if (monetizationLayer === "gachaBanner") {
    modules.push(`<article class="package-module monetization-module gacha-module"><small>Limited Signal Banner</small><strong>FEATURED PACKAGE UP</strong><span>Display rate 1.5% · Guarantee 80</span></article>`);
  }
  if (monetizationLayer === "battlePass") {
    modules.push(`<article class="package-module monetization-module mission-module"><small>Premium Event Pass</small><strong>Tier 07 / 30</strong><div class="progress-bar"><i style="width:23%"></i></div><span>Premium track available</span></article>`);
  }
  if (monetizationLayer === "countdownOffer") {
    const seconds = Math.max(0, state.run?.packageRemaining ?? 900);
    const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
    const remainder = String(seconds % 60).padStart(2, "0");
    modules.push(`<article class="package-module monetization-module countdown-module"><small>Countdown Offer</small><strong>${minutes}:${remainder}</strong><span>Limited package window</span></article>`);
  }

  const renderKey = JSON.stringify({
    mechanic: state.mechanic,
    assets: state.assets,
    progress: state.run?.progress || 0,
    packageRemaining: state.run?.packageRemaining ?? null,
  });
  if (elements.packagingPanel.dataset.renderKey !== renderKey) {
    elements.packagingPanel.innerHTML = modules.join("");
    elements.packagingPanel.dataset.renderKey = renderKey;
  }
}

function stopGameLoop() {
  clearInterval(gameLoopTimer);
  clearInterval(gameClockTimer);
  gameLoopTimer = null;
  gameClockTimer = null;
}

function tickGameClock() {
  if (state.step !== 3 || !state.run) return;
  let coreChanged = false;
  let packageChanged = false;
  const run = state.run.core;

  if (run.phase === "playing") state.run.elapsedSeconds += 1;

  if (state.run.packageRemaining !== null && state.run.packageRemaining > 0) {
    state.run.packageRemaining -= 1;
    packageChanged = true;
  }

  if (run.phase === "playing" && run.timeRemaining !== null) {
    run.timeRemaining -= 1;
    coreChanged = true;
    if (run.timeRemaining <= 0) {
      run.timeRemaining = 0;
      run.phase = state.mechanic === "tetris" && run.lines > 0 ? "won" : "lost";
      run.status = state.mechanic === "tetris" && run.lines > 0 ? "Time attack complete." : "Time expired.";
      clearInterval(gameLoopTimer);
      gameLoopTimer = null;
    }
  }
  if (coreChanged) renderCore();
  if (packageChanged && !state.packagingHidden) renderPackaging();
  if (!coreChanged && state.uiMode === "event") renderEventShell();
}

function startGameLoop() {
  stopGameLoop();
  const tetrisIntervals = { slow: 900, normal: 650, fast: 350 };
  if (state.mechanic === "tetris" && state.run?.core.phase === "playing") gameLoopTimer = setInterval(() => stepTetris(), tetrisIntervals[assetValue("fallingSpeed", "normal")]);
  if (state.mechanic === "pacman" && state.run?.core.phase === "playing") gameLoopTimer = setInterval(moveMazeEnemy, 620);
  if (state.run) gameClockTimer = setInterval(tickGameClock, 1000);
}

const productionMessages = [
  "Extracting proven mechanic…",
  "Replacing visual identity…",
  "Adding character package…",
  "Installing event story…",
  "Connecting reward system…",
  "Preparing monetization…",
  "New game successfully produced.",
];

const modeConversionMessages = [
  "Preserving core mechanic…",
  "Loading visual assets…",
  "Applying event interface…",
  "Connecting reward system…",
  "Packaging complete.",
];

function cancelModeConversion() {
  clearInterval(modeConversionTimer);
  modeConversionTimer = null;
  isConvertingMode = false;
  elements.modeConversion.hidden = true;
  elements.modeConversionBar.style.width = "0%";
  if (state.step === 3 && state.run) {
    renderEvent();
    startGameLoop();
  }
}

function setUiMode(mode) {
  state.uiMode = mode;
  state.packagingHidden = false;
  renderEvent();
  startGameLoop();
}

function convertOrToggleEventMode() {
  if (isConvertingMode || !state.run) return;
  if (state.eventReady) {
    const nextMode = state.uiMode === "event" ? "core" : "event";
    setUiMode(nextMode);
    showToast(nextMode === "event" ? "Event packaging restored" : "Original mechanic revealed");
    return;
  }

  isConvertingMode = true;
  stopGameLoop();
  let index = 0;
  elements.modeConversion.hidden = false;
  elements.modeConversionStatus.textContent = modeConversionMessages[index];
  elements.modeConversionBar.style.width = `${100 / modeConversionMessages.length}%`;
  renderEvent();
  modeConversionTimer = setInterval(() => {
    index += 1;
    if (index < modeConversionMessages.length) {
      elements.modeConversionStatus.textContent = modeConversionMessages[index];
      elements.modeConversionBar.style.width = `${((index + 1) / modeConversionMessages.length) * 100}%`;
      return;
    }
    clearInterval(modeConversionTimer);
    modeConversionTimer = null;
    isConvertingMode = false;
    state.eventReady = true;
    state.uiMode = "event";
    state.packagingHidden = false;
    elements.modeConversion.hidden = true;
    elements.modeConversionBar.style.width = "0%";
    renderEvent();
    startGameLoop();
    showToast("Mechanic unchanged. Packaging complete.");
  }, 250);
}

function cancelProduction() {
  clearInterval(productionTimer);
  productionTimer = null;
  isProducing = false;
  elements.productionProcess.hidden = true;
  elements.productionBar.style.width = "0%";
  syncBuilder();
}

function runProductionSequence() {
  if (isProducing || !state.mechanic || selectedAssetEntries().length === 0) return;
  isProducing = true;
  let index = 0;
  elements.productionProcess.hidden = false;
  elements.productionStatus.textContent = productionMessages[index];
  elements.productionBar.style.width = `${100 / productionMessages.length}%`;
  syncBuilder();
  productionTimer = setInterval(() => {
    index += 1;
    if (index < productionMessages.length) {
      elements.productionStatus.textContent = productionMessages[index];
      elements.productionBar.style.width = `${((index + 1) / productionMessages.length) * 100}%`;
      return;
    }
    clearInterval(productionTimer);
    productionTimer = null;
    isProducing = false;
    elements.productionProcess.hidden = true;
    elements.productionBar.style.width = "0%";
    state.layout = Math.floor(Math.random() * 3);
    state.uiMode = "core";
    state.eventReady = false;
    state.packagingHidden = false;
    state.run = createRunState();
    renderCore();
    renderPackaging();
    showStep(3);
  }, 190);
}

function generateAnotherSkin() {
  packagingCatalog.forEach((group) => {
    const candidates = group.options.map(([value]) => value).filter((value) => value !== state.assets[group.key]);
    state.assets[group.key] = candidates[Math.floor(Math.random() * candidates.length)] || group.options[0][0];
  });
  state.layout = Math.floor(Math.random() * 3);
  state.run.packageRemaining = assetValue("monetizationLayer") === "countdownOffer" ? 900 : null;
  syncBuilder();
  renderEvent();
  startGameLoop();
  persistState();
  showToast("Same mechanic. New product.");
}

document.querySelectorAll(".choice-card[data-mechanic]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextMechanic = button.dataset.mechanic;
    if (nextMechanic !== state.mechanic) {
      state.run = null;
      state.uiMode = "core";
      state.eventReady = false;
    }
    state.mechanic = nextMechanic;
    state.packagingHidden = false;
    syncBuilder();
    persistState();
  });
});

elements.assetGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".asset-option");
  if (!button) return;
  const group = button.dataset.assetGroup;
  const value = button.dataset.assetValue;
  if (state.assets[group] === value) delete state.assets[group];
  else state.assets[group] = value;
  state.run = null;
  syncBuilder();
  persistState();
});

elements.continueButton.addEventListener("click", () => { if (state.mechanic) showStep(2); });
elements.backButton.addEventListener("click", () => showStep(1));
elements.buildButton.addEventListener("click", runProductionSequence);
elements.backToBuilder.addEventListener("click", () => showStep(2));
elements.revealMechanic.addEventListener("click", convertOrToggleEventMode);
elements.anotherSkin.addEventListener("click", generateAnotherSkin);
elements.restartGame.addEventListener("click", () => {
  stopGameLoop();
  const packageRemaining = state.run?.packageRemaining;
  state.run = createRunState();
  if (packageRemaining !== null && packageRemaining !== undefined) state.run.packageRemaining = packageRemaining;
  renderCore();
  if (!state.packagingHidden) renderPackaging();
  if (state.uiMode === "event") renderEventShell();
  startGameLoop();
  showToast("Game state restarted");
});

document.addEventListener("keydown", (event) => {
  if (state.step !== 3 || !state.run) return;
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (state.mechanic === "tetris") {
    const tetrisKeys = {
      ArrowLeft: () => moveTetris(-1), ArrowRight: () => moveTetris(1), ArrowDown: () => stepTetris(true), ArrowUp: rotateTetris,
    };
    const action = event.code === "Space" ? hardDropTetris : event.key.toLowerCase() === "c" ? holdTetris : tetrisKeys[event.key];
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
  if (isProducing) cancelProduction();
  showStep(Number(event.state?.factoryStep) || 1, false);
});

history.replaceState({ factoryStep: state.step }, "", location.pathname + location.search);
showStep(state.step, false);
