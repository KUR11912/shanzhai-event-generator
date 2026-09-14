// Only the renderer reads artwork. All game rules and mutable state stay in script.js.
window.EVENT_STORIES = Object.freeze({
  minesweeper: "An unstable ancient crystal field has been discovered beneath the festival grounds. mark the hidden energy traps, and secure the area before its power breaks loose.",
  tetris: "The energy modules bound for the festival workshop have scattered. Rotate and arrange the falling pieces into stable layers to restore power before the celebration begins.",
  pacman: "The scattered signal shards have awakened the maze guardians. Navigate the winding paths, recover every shard, and escape the pursuers before the exit closes.",
});

window.EventScene = (() => {
  function imageSlot(id, path, visible) {
    const node = document.getElementById(id);
    node.hidden = !visible;
    if (visible && node.getAttribute('src') !== path) node.setAttribute('src',path);
    if (!visible) node.removeAttribute('src');
  }
  function update(frame, state) {
    const visible = state.uiMode === 'event' && state.assets.visualSkin === true;
    const art = window.EVENT_UI_ASSETS;
    imageSlot('event-shell-background',art.common.background,visible);
    imageSlot('scene-wood',art.common.stage,visible);
    imageSlot('scene-character',art.common.character,visible && state.assets.characterPackage === true);
    imageSlot('scene-rewards',art.common.rewards,visible && state.assets.rewardSystem === true);
    const story = document.getElementById('scene-story');
    const copy = document.getElementById('scene-story-copy');
    const showStory = visible && state.assets.eventStory === true;
    story.hidden = !showStory;
    const text = showStory ? window.EVENT_STORIES[state.mechanic] : '';
    if (copy.textContent !== text) copy.textContent = text;
    frame.dataset.phase = state.run.core.phase;
    // Assign only the selected core's images, and only when art is requested.
    // CSS variables do not fetch images until an active rule actually uses them.
    if (visible && frame.dataset.artCore !== state.mechanic) {
      for (const [name,path] of Object.entries(art.common)) frame.style.setProperty('--common-'+name, 'url("'+path+'")');
      for (const [name,path] of Object.entries(art[state.mechanic])) frame.style.setProperty('--art-'+name, 'url("'+path+'")');
      frame.dataset.artCore = state.mechanic;
    }
  }
  return Object.freeze({update});
})();
