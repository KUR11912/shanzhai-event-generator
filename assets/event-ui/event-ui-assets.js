// Runtime resources are namespaced; reference composites are intentionally excluded.
// Source-to-output details and measured dimensions: processed/scene/manifest.json.
window.EVENT_UI_ASSETS = (() => {
  const root = "assets/event-ui/processed/scene/";
  const group = (folder, names) => Object.freeze(Object.fromEntries(
    names.map(name => [name.replace(/-([a-z])/g, (_,c) => c.toUpperCase()), root + folder + "/" + name + ".png"])
  ));
  return Object.freeze({
    common: group("common", ["background","stage","character","rewards","dialog","panel","button"]),
    minesweeper: group("minesweeper", ["frame","hud","closed","pressed","open","flag","mine","clock","restart","divider"]),
    pacman: group("maze", ["frame","wall","floor","hud","player","enemy","collectible","power","restart"]),
    tetris: group("tetris", ["frame","hold","next","panel","block-1","block-2","block-3","block-4","block-5","block-6","block-7","ghost","restart"]),
  });
})();
