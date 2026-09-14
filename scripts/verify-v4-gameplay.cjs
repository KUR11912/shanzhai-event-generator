const {chromium}=require('C:/Users/逸见艾丽卡/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve('exports/v4-scene-update'),results=[];
const check=(v,label)=>{assert.ok(v,label);results.push(label)};
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
for(const game of ['minesweeper','tetris','pacman']){
const page=await browser.newPage({viewport:{width:1920,height:1080}});
await page.clock.install({time:new Date('2026-09-13T12:00:00Z')});await page.clock.pauseAt(new Date('2026-09-13T12:00:00Z'));
await page.addInitScript(g=>localStorage.setItem('shanzhai-event-generator:factory-state',JSON.stringify({mechanic:g,step:3,assets:{visualSkin:true,characterPackage:false,eventStory:false,rewardSystem:false}})),game);
await page.goto('http://127.0.0.1:4173/');
await page.locator('#reveal-mechanic').click();await page.clock.runFor(1250);
await page.clock.runFor(1000);
check(await page.evaluate(()=>state.run.elapsedSeconds)===1,game+': clock advances once per second');
for(let n=0;n<6;n++)await page.locator('#reveal-mechanic').click();
const elapsed=await page.evaluate(()=>state.run.elapsedSeconds);await page.clock.runFor(1000);
check(await page.evaluate(()=>state.run.elapsedSeconds)===elapsed+1,game+': no doubled clock after six mode switches');
await page.locator('.scene-restart').click();
check(await page.evaluate(()=>state.run.elapsedSeconds===0&&state.run.core.phase==='playing'),game+': artwork restart resets real state');
if(game==='minesweeper'){
await page.locator('.mine-cell').first().click();
const danger=await page.evaluate(()=>[...state.run.core.mines][0]);
const tile=page.locator('.mine-cell[data-index="'+danger+'"]');
await tile.click({button:'right'});await tile.hover();
check(await tile.evaluate(e=>getComputedStyle(e).backgroundImage.includes('/flag.png')),'Mines: hover keeps the real flag visible');
await tile.click({button:'right'});
check(await page.evaluate(i=>!state.run.core.flags.has(i),danger),'Mines: artwork right-click unmarks the real cell');
await tile.click();
check(await page.evaluate(()=>state.run.core.phase==='lost'&&document.querySelectorAll('.mine-cell.is-mine').length===state.run.core.mineCount),'Mines: actual danger and loss icons');
await page.screenshot({path:path.join(out,'screenshots/minesweeper-loss.png'),animations:'disabled'});
await page.locator('.scene-restart').click();
await page.locator('.mine-cell').first().click();
const safe=await page.evaluate(()=>[...Array(81).keys()].filter(i=>!state.run.core.mines.has(i)&&!state.run.core.revealed.has(i)));
for(const i of safe)if(await page.locator('.mine-cell[data-index="'+i+'"]').isEnabled())await page.locator('.mine-cell[data-index="'+i+'"]').click();
check(await page.evaluate(()=>state.run.core.phase==='won'&&state.run.core.revealed.size===68),'Mines: true win with all safe tiles');
// Renderer fixtures exercise 1-8 counts without changing game rules or a saved run.
for(let count=1;count<=8;count++){
await page.evaluate(n=>{const r=state.run.core;r.phase='playing';r.mines=new Set(mineNeighbors(40,9).slice(0,n));r.revealed=new Set([40]);r.flags.clear();r.triggeredMines.clear();renderCore()},count);
check(await page.locator('.mine-cell[data-index="40"] .cell-symbol').textContent()===String(count),'Mines: number '+count+' rendered from neighbors');
}
}else if(game==='tetris'){
// Construct a legal near-clear board, then use the real Drop button.
await page.evaluate(()=>{let r=state.run.core;r.board=emptyTetrisBoard();r.board[19]=[1,1,1,0,0,0,0,1,1,1];r.current={name:'I',color:1,shape:[[1,1,1,1]],x:3,y:0,special:null};renderCore()});
await page.locator('[data-action="tetris-drop"]').click();
check(await page.evaluate(()=>state.run.core.lines===1&&state.run.core.score>0&&state.run.core.lockedCount===1),'Tetris: real line clear, score and lock');
check(await page.locator('.next-panel .preview-cell[class*="block-"]').count()===4,'Tetris: live next tetromino has four cells');
await page.locator('.scene-restart').click();
for(const name of ['I','O','T','L','J','S','Z']){
await page.evaluate(n=>{const r=state.run.core;r.board=emptyTetrisBoard();r.phase='playing';spawnTetrisPiece(r,n);renderCore()},name);
await page.locator('[data-action="tetris-rotate"]').click();
check(await page.evaluate(()=>state.run.core.current.shape.flat().filter(Boolean).length===4&&tetrisCanPlace(state.run.core,state.run.core.current)),'Tetris: '+name+' rotation valid');
}
await page.evaluate(()=>{const r=state.run.core;r.board=Array.from({length:20},()=>Array(10).fill(1));spawnTetrisPiece(r);renderCore()});
check(await page.evaluate(()=>state.run.core.phase==='lost'),'Tetris: stack collision still loses');
}else{
const position=await page.evaluate(()=>state.run.core.player);
await page.locator('[data-direction="up"]').click();
check(await page.evaluate(()=>state.run.core.player)===position,'Maze: visible wall blocks movement');
check(await page.evaluate(()=>[...document.querySelectorAll('.maze-cell')].every(e=>e.classList.contains('is-wall')===state.run.core.walls.has(Number(e.dataset.index)))),'Maze: every painted wall equals collision Set');
await page.locator('[data-direction="right"]').click();
check(await page.evaluate(()=>document.querySelector('.maze-player').dataset.index===String(state.run.core.player)),'Maze: sprite follows live cell');
const before=await page.evaluate(()=>state.run.core.enemy);await page.clock.runFor(620);
check(await page.evaluate(()=>state.run.core.enemy)!==before,'Maze: guardian moves with real timer');
// Set up one remaining real collectible; movement invokes the unchanged win logic.
await page.evaluate(()=>{const r=state.run.core;r.player=r.playerStart;r.enemy=r.enemyStart;r.dots=new Set([r.player+1]);renderCore()});
await page.locator('[data-direction="right"]').click();
check(await page.evaluate(()=>state.run.core.phase==='won'&&state.run.core.dots.size===0),'Maze: collecting final shard wins');
await page.locator('.scene-restart').click();
await page.evaluate(()=>{const r=state.run.core;r.enemy=r.player+1;r.lives=1;renderCore()});
await page.locator('[data-direction="right"]').click();
check(await page.evaluate(()=>state.run.core.phase==='lost'&&state.run.core.lives===0),'Maze: guardian collision uses real lives/loss');
}
await page.locator('.scene-restart').click();
check(await page.evaluate(()=>state.run.core.phase==='playing'),game+': restart usable after game-over');
await page.close();
}
const inspection=JSON.parse(fs.readFileSync(path.join(out,'source-inspection.json'),'utf8').replace(/^\uFEFF/,''));
const crypto=require('node:crypto');
for(const file of inspection){
const digest=crypto.createHash('sha256').update(fs.readFileSync(path.resolve('assets/event-ui/source',file.directory,file.file))).digest('hex').toUpperCase();
assert.equal(digest,file.sha256,'Original source unchanged: '+file.directory+'/'+file.file);
}
results.push('All '+inspection.length+' original source images remain byte-identical');
console.log(JSON.stringify({passed:results.length,results},null,2));
fs.writeFileSync(path.join(out,'gameplay-verification.json'),JSON.stringify({passed:results.length,results},null,2));
}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
