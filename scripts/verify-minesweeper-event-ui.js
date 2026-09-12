const fs = require("fs");
const path = require("path");

const playwrightRoot = "C:/Users/逸见艾丽卡/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright";
const { chromium } = require(playwrightRoot);

const projectRoot = path.resolve(__dirname, "..");
const outputRoot = path.join(projectRoot, "exports", "minesweeper-event-ui-v3", "verification");
const screenshotRoot = path.join(outputRoot, "screenshots");
const url = process.argv.find((argument) => /^https?:\/\//.test(argument)) || "http://127.0.0.1:4173/";
const responsiveOnly = process.argv.includes("--responsive-only");
const browserPath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const storageKey = "shanzhai-event-generator:factory-state";

const representatives = [
  {
    layout: 0,
    name: "sidebar-right",
    assets: { visualSkin: "fantasy", characterPackage: "animeHero", eventStory: "worldCrisis", rewardSystem: "eventCurrency", monetizationLayer: "gachaBanner" },
  },
  {
    layout: 1,
    name: "bottom-cards",
    assets: { visualSkin: "military", characterPackage: "cuteMascot", eventStory: "summerFestival", rewardSystem: "limitedRewards", monetizationLayer: "battlePass" },
  },
  {
    layout: 2,
    name: "sidebar-left",
    assets: { visualSkin: "cyber", characterPackage: "tacticalOperator", eventStory: "limitedTournament", rewardSystem: "dailyMissions", monetizationLayer: "countdownOffer" },
  },
];

function enumerateSelections(groups) {
  const combinations = [];
  const visit = (index, assets) => {
    if (index === groups.length) {
      if (Object.keys(assets).length > 0) combinations.push({ ...assets });
      return;
    }
    const group = groups[index];
    visit(index + 1, assets);
    group.options.forEach((value) => visit(index + 1, { ...assets, [group.key]: value }));
  };
  visit(0, {});
  return combinations;
}

function maxRectDelta(before, after) {
  let maximum = 0;
  const visit = (left, right) => {
    if (Array.isArray(left) && Array.isArray(right)) {
      left.forEach((value, index) => visit(value, right[index]));
      return;
    }
    if (!left || !right || typeof left !== "object" || typeof right !== "object") return;
    ["x", "y", "width", "height"].forEach((key) => {
      if (typeof left[key] === "number" && typeof right[key] === "number") {
        maximum = Math.max(maximum, Math.abs(left[key] - right[key]));
      }
    });
    Object.keys(left).filter((key) => !["x", "y", "width", "height"].includes(key)).forEach((key) => visit(left[key], right[key]));
  };
  visit(before, after);
  return Math.round(maximum * 1000) / 1000;
}

async function ready(page) {
  await page.waitForFunction(() => document.fonts?.status === "loaded");
  await page.evaluate(async () => {
    await Promise.all(Array.from(document.images).map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    })));
  });
}

async function captureState(page, keepReferences = false) {
  return page.evaluate((storeReferences) => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const value = element.getBoundingClientRect();
      return { x: value.x, y: value.y, width: value.width, height: value.height };
    };
    const modules = Array.from(document.querySelectorAll("#packaging-panel > .package-module"));
    const cells = Array.from(document.querySelectorAll(".mine-cell"));
    if (storeReferences) {
      window.__minesweeperVerificationRefs = {
        frame: document.querySelector("#game-frame"),
        body: document.querySelector(".game-body"),
        coreGame: document.querySelector(".core-game"),
        stage: document.querySelector("#game-stage"),
        board: document.querySelector(".mine-board"),
        hud: document.querySelector(".game-hud"),
        panel: document.querySelector("#packaging-panel"),
        modules,
      };
    }
    return {
      layout: document.querySelector("#game-frame")?.dataset.layout,
      mode: document.querySelector("#game-frame")?.dataset.mode,
      rects: {
        frame: rect("#game-frame"),
        header: rect(".event-header"),
        body: rect(".game-body"),
        coreGame: rect(".core-game"),
        stage: rect("#game-stage"),
        game: rect(".minesweeper-game"),
        hud: rect(".game-hud"),
        boardShell: rect(".mine-board-shell"),
        board: rect(".mine-board"),
        packaging: rect("#packaging-panel"),
        modules: modules.map((module) => {
          const value = module.getBoundingClientRect();
          return { x: value.x, y: value.y, width: value.width, height: value.height };
        }),
      },
      mineState: cells.map((cell) => ({ className: cell.className, disabled: cell.disabled, text: cell.textContent, label: cell.getAttribute("aria-label") })),
      hudText: document.querySelector(".game-hud")?.textContent.replace(/\s+/g, " ").trim(),
      statusText: document.querySelector(".game-status")?.textContent.trim(),
      moduleText: modules.map((module) => module.textContent.replace(/\s+/g, " ").trim()),
      moduleCount: modules.length,
      noResourceSheetDisplayed: !Array.from(document.images).some((image) => /minesweeper-atlas|source\/扫雷/i.test(image.src)),
      pageHasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      frameFitsViewport: document.querySelector("#game-frame").getBoundingClientRect().bottom <= innerHeight + 1,
      packagingClipped: document.querySelector("#packaging-panel").scrollHeight > document.querySelector("#packaging-panel").clientHeight + 1,
    };
  }, keepReferences);
}

async function referencesPreserved(page) {
  return page.evaluate(() => {
    const refs = window.__minesweeperVerificationRefs;
    if (!refs) return false;
    const currentModules = Array.from(document.querySelectorAll("#packaging-panel > .package-module"));
    return refs.frame === document.querySelector("#game-frame") &&
      refs.body === document.querySelector(".game-body") &&
      refs.coreGame === document.querySelector(".core-game") &&
      refs.stage === document.querySelector("#game-stage") &&
      refs.board === document.querySelector(".mine-board") &&
      refs.hud === document.querySelector(".game-hud") &&
      refs.panel === document.querySelector("#packaging-panel") &&
      refs.modules.length === currentModules.length && refs.modules.every((module, index) => module === currentModules[index]);
  });
}

async function runRepresentative(browser, representative) {
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`); });
  await page.addInitScript(({ key, assets, layout }) => {
    localStorage.setItem(key, JSON.stringify({ mechanic: "minesweeper", assets, layout, step: 2 }));
    const layoutRandom = [0.1, 0.5, 0.9][layout];
    const originalRandom = Math.random;
    let firstRandom = true;
    Math.random = () => {
      if (firstRandom) { firstRandom = false; return layoutRandom; }
      return originalRandom();
    };
  }, { key: storageKey, assets: representative.assets, layout: representative.layout });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.click("#build-button");
  await page.waitForSelector("#step-run:not([hidden])", { timeout: 5000 });
  await ready(page);
  if (await page.getAttribute("#game-frame", "data-layout") !== String(representative.layout)) throw new Error(`Expected layout ${representative.layout}`);

  await page.locator('[data-action="mine-reveal"]').first().click();
  const flagTarget = page.locator('[data-action="mine-reveal"]:not(:disabled)').last();
  if (await flagTarget.count()) await flagTarget.click({ button: "right" });
  const prototypeState = await captureState(page, true);
  const prototypePath = path.join(screenshotRoot, `${representative.name}-prototype.png`);
  await page.locator("#game-frame").screenshot({ path: prototypePath });

  await page.click("#reveal-mechanic");
  await page.waitForFunction(() => document.querySelector("#game-frame")?.dataset.mode === "event", null, { timeout: 4000 });
  await ready(page);
  const artState = await captureState(page);
  const preservedReferences = await referencesPreserved(page);
  const artPath = path.join(screenshotRoot, `${representative.name}-art.png`);
  await page.locator("#game-frame").screenshot({ path: artPath });

  const statePreservedDuringConversion = JSON.stringify(prototypeState.mineState) === JSON.stringify(artState.mineState) &&
    prototypeState.hudText === artState.hudText && prototypeState.statusText === artState.statusText;
  const rectDelta = maxRectDelta(prototypeState.rects, artState.rects);

  const coveredBefore = artState.mineState.filter((cell) => !cell.disabled).length;
  const nextPlayable = page.locator('[data-action="mine-reveal"]:not(:disabled)').first();
  if (await nextPlayable.count()) await nextPlayable.click();
  const afterPlay = await captureState(page);
  const coveredAfter = afterPlay.mineState.filter((cell) => !cell.disabled).length;
  const continuedPlaying = coveredAfter < coveredBefore;

  await page.click("#reveal-mechanic");
  await page.waitForFunction(() => document.querySelector("#game-frame")?.dataset.mode === "core");
  const returnedPrototype = await captureState(page);
  const statePreservedOnReturn = JSON.stringify(afterPlay.mineState) === JSON.stringify(returnedPrototype.mineState) && afterPlay.hudText === returnedPrototype.hudText;
  await page.click("#reveal-mechanic");
  await page.waitForFunction(() => document.querySelector("#game-frame")?.dataset.mode === "event");
  const restoredArt = await captureState(page);
  const statePreservedOnRestore = JSON.stringify(returnedPrototype.mineState) === JSON.stringify(restoredArt.mineState) && returnedPrototype.hudText === restoredArt.hudText;

  await context.close();
  return {
    layout: representative.layout,
    layoutName: representative.name,
    assets: representative.assets,
    prototypeScreenshot: path.relative(outputRoot, prototypePath).replace(/\\/g, "/"),
    artScreenshot: path.relative(outputRoot, artPath).replace(/\\/g, "/"),
    rectDelta,
    statePreservedDuringConversion,
    preservedReferences,
    continuedPlaying,
    statePreservedOnReturn,
    statePreservedOnRestore,
    noResourceSheetDisplayed: artState.noResourceSheetDisplayed,
    noHorizontalOverflow: !artState.pageHasHorizontalOverflow,
    frameFitsViewport: artState.frameFitsViewport,
    packagingClipped: artState.packagingClipped,
    errors,
    prototypeRects: prototypeState.rects,
    artRects: artState.rects,
  };
}

async function auditAllCombinations(browser) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  await page.addInitScript((key) => {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({ mechanic: "minesweeper", assets: {}, layout: 0, step: 2 }));
    }
  }, storageKey);
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const groups = await page.evaluate(() => {
    const byGroup = new Map();
    document.querySelectorAll(".asset-option").forEach((button) => {
      const key = button.dataset.assetGroup;
      if (!byGroup.has(key)) byGroup.set(key, []);
      byGroup.get(key).push(button.dataset.assetValue);
    });
    return Array.from(byGroup, ([key, options]) => ({ key, options }));
  });
  const combinations = enumerateSelections(groups);
  const failures = [];
  for (let index = 0; index < combinations.length; index += 1) {
    const assets = combinations[index];
    const layout = index % 3;
    await page.evaluate(({ key, savedAssets, savedLayout }) => {
      localStorage.setItem(key, JSON.stringify({ mechanic: "minesweeper", assets: savedAssets, layout: savedLayout, step: 3 }));
    }, { key: storageKey, savedAssets: assets, savedLayout: layout });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#step-run:not([hidden])");
    const result = await page.evaluate(({ expectedAssets, expectedLayout }) => {
      const frame = document.querySelector("#game-frame");
      const modules = document.querySelectorAll("#packaging-panel > .package-module");
      return {
        layout: frame.dataset.layout,
        theme: frame.dataset.theme,
        story: frame.dataset.story,
        moduleCount: modules.length,
        packagingHidden: document.querySelector("#packaging-panel").classList.contains("is-concealed"),
        hasBoard: document.querySelectorAll(".mine-cell").length === 81,
        expectedCount: Object.keys(expectedAssets).length,
        expectedLayout: String(expectedLayout),
        expectedTheme: expectedAssets.visualSkin || "default",
        expectedStory: expectedAssets.eventStory || "none",
      };
    }, { expectedAssets: assets, expectedLayout: layout });
    if (result.layout !== result.expectedLayout || result.theme !== result.expectedTheme || result.story !== result.expectedStory || result.moduleCount !== result.expectedCount || result.packagingHidden || !result.hasBoard) {
      failures.push({ index, assets, result });
    }
  }
  await context.close();
  return { groupCount: groups.length, combinationCount: combinations.length, failureCount: failures.length, failures: failures.slice(0, 25), errors };
}

async function auditResponsiveViewports(browser) {
  const viewports = [
    { width: 1920, height: 1080, name: "1920x1080" },
    { width: 1440, height: 900, name: "1440x900" },
    { width: 1366, height: 768, name: "1366x768" },
    { width: 390, height: 844, name: "390x844" },
  ];
  const results = [];
  for (const viewport of viewports) {
    for (const representative of representatives) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
      const page = await context.newPage();
      const errors = [];
      page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
      page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
      await page.addInitScript(({ key, assets, layout }) => {
        localStorage.setItem(key, JSON.stringify({ mechanic: "minesweeper", assets, layout, step: 3 }));
      }, { key: storageKey, assets: representative.assets, layout: representative.layout });
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.click("#reveal-mechanic");
      await page.waitForFunction(() => document.querySelector("#game-frame")?.dataset.mode === "event", null, { timeout: 4000 });
      await ready(page);
      const metrics = await page.evaluate(() => {
        const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect();
        const frame = rect("#game-frame");
        const core = rect(".core-game");
        const board = rect(".mine-board");
        const panel = document.querySelector("#packaging-panel");
        const pageHorizontalOverflow = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
        const boardInsideCore = board.left >= core.left - 1 && board.right <= core.right + 1 && board.top >= core.top - 1 && board.bottom <= core.bottom + 1;
        const modulesInsideFrame = Array.from(panel.children).every((module) => {
          const moduleRect = module.getBoundingClientRect();
          return moduleRect.left >= frame.left - 1 && moduleRect.right <= frame.right + 1;
        });
        return {
          pageHorizontalOverflow,
          packagingClipped: panel.scrollHeight > panel.clientHeight + 1,
          packagingScrollHeight: panel.scrollHeight,
          packagingClientHeight: panel.clientHeight,
          boardInsideCore,
          modulesInsideFrame,
          frameFitsViewport: frame.bottom <= innerHeight + 1,
          scrollHeight: document.documentElement.scrollHeight,
          viewportHeight: innerHeight,
        };
      });
      results.push({ viewport: viewport.name, layout: representative.name, ...metrics, errors });
      await context.close();
    }
  }
  return results;
}

(async () => {
  fs.mkdirSync(screenshotRoot, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: browserPath });
  try {
    const existingReportPath = path.join(outputRoot, "verification-report.json");
    const existingReport = responsiveOnly && fs.existsSync(existingReportPath) ? JSON.parse(fs.readFileSync(existingReportPath, "utf8")) : null;
    const representativeResults = existingReport?.representatives || [];
    if (!responsiveOnly) {
      for (const representative of representatives) representativeResults.push(await runRepresentative(browser, representative));
    }
    const combinationAudit = existingReport?.combinationAudit || await auditAllCombinations(browser);
    const responsiveAudit = await auditResponsiveViewports(browser);
    const report = {
      version: "packaging-factory-v3",
      url,
      viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
      representatives: representativeResults,
      combinationAudit,
      responsiveAudit,
    };
    fs.writeFileSync(path.join(outputRoot, "verification-report.json"), JSON.stringify(report, null, 2));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
