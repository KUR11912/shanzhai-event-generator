const { chromium } = require('C:/Users/逸见艾丽卡/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out=path.resolve('exports/v4-scene-update'),shot=path.join(out,'screenshots');
fs.mkdirSync(shot,{recursive:true});
const keys=['visualSkin','characterPackage','eventStory','rewardSystem'];
const expected={
minesweeper:'An unstable ancient crystal field has been discovered beneath the festival grounds. mark the hidden energy traps, and secure the area before its power breaks loose.',
tetris:'The energy modules bound for the festival workshop have scattered. Rotate and arrange the falling pieces into stable layers to restore power before the celebration begins.',
pacman:'The scattered signal shards have awakened the maze guardians. Navigate the winding paths, recover every shard, and escape the pursuers before the exit closes.'};
const results=[],baseline={},errors=[],screenshots=[];
function check(c,m){assert.ok(c,m)}
async function ready(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.src&&!i.hidden).map(i=>i.decode().catch(()=>{})))});await page.waitForLoadState('networkidle');}
async function snap(page,name){await ready(page);await page.screenshot({path:path.join(shot,name+'.png'),fullPage:true,animations:'disabled'});screenshots.push(name+'.png');}
async function metrics(page){return page.evaluate(()=>{
const rect=s=>{const e=document.querySelector(s);if(!e)return null;const {x,y,width,height}=e.getBoundingClientRect();return{x,y,width,height}};
return {scene:rect('#game-frame'),game:rect('.core-game'),board:rect('.mine-board,.maze-board,.tetris-board'),hud:rect('.game-hud'),cell:rect('.mine-cell,.maze-cell,.tetris-cell'),story:rect('.scene-story'),storyOverflow:document.querySelector('.scene-story p').scrollHeight-document.querySelector('.scene-story p').clientHeight,hudOverflow:document.querySelector('.game-hud').scrollHeight-document.querySelector('.game-hud').clientHeight,pageOverflow:document.documentElement.scrollWidth-innerWidth};
})}
async function setup(browser,game,mask,viewport={width:1920,height:1080},raw){
const page=await browser.newPage({viewport,deviceScaleFactor:1}),requests=[],issues=[];
page.on('pageerror',e=>issues.push(e.message));
page.on('response',r=>{if(r.status()>=400)issues.push(r.status()+' '+r.url())});
page.on('request',r=>{if(r.url().includes('.png'))requests.push(decodeURI(r.url()))});
await page.clock.install({time:new Date('2026-09-13T12:00:00Z')});await page.clock.pauseAt(new Date('2026-09-13T12:00:00Z'));
await page.addInitScript(({game,mask,raw})=>{
let seed=123456;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
localStorage.setItem('unrelated-game-save','keep-me');
localStorage.setItem('shanzhai-event-generator:factory-state',JSON.stringify({mechanic:game,step:2,assets:raw||Object.fromEntries(['visualSkin','characterPackage','eventStory','rewardSystem'].map((k,i)=>[k,Boolean(mask&(1<<i))]))}));
},{game,mask,raw});
await page.goto('http://127.0.0.1:4173/');
return {page,requests,issues};
}
async function build(page){
check(await page.locator('[data-packaging-key]').count()===4,'Exactly four toggle cards');
check(await page.locator('.asset-option').count()===0,'No option branches');
await page.locator('#build-button').click();
await page.clock.runFor(await page.evaluate(()=>productionMessages.length*190));
check(await page.evaluate(()=>state.step===3&&!!state.run),'Build reached live preview');
}
async function play(page,game){
if(game==='minesweeper'){
await page.locator('.mine-cell').first().click();
const index=await page.evaluate(()=>[...Array(81).keys()].find(i=>!state.run.core.revealed.has(i)));
await page.locator('.mine-cell[data-index="'+index+'"]').click({button:'right'});
check(await page.evaluate(i=>state.run.core.revealed.size>0&&state.run.core.flags.has(i),index),'Reveal and flag updated true state');
}else if(game==='tetris'){
let x=await page.evaluate(()=>state.run.core.current.x);await page.keyboard.press('ArrowLeft');
check(await page.evaluate(()=>state.run.core.current.x)===x-1,'One keypress moves exactly one cell');
await page.keyboard.press('c');check(await page.evaluate(()=>!!state.run.core.holdName&&!state.run.core.canHold),'Hold uses real state');
await page.keyboard.press('Space');check(await page.evaluate(()=>state.run.core.lockedCount===1),'Hard drop locks exactly one piece');
}else{
let pos=await page.evaluate(()=>state.run.core.player);await page.keyboard.press('ArrowRight');
check(await page.evaluate(()=>state.run.core.player)===pos+1,'Maze move changes one cell');
check(await page.evaluate(()=>state.run.core.score>0),'Collectible changes real score');
}
}
async function preserve(page){
await page.evaluate(()=>{window.auditRun=state.run;window.auditCore=state.run.core;window.auditBoard=document.querySelector('.game-board-shell');window.auditState=JSON.stringify(state.run,(_,v)=>v instanceof Set?[...v]:v)});
}
async function assertPreserved(page){check(await page.evaluate(()=>auditRun===state.run&&auditCore===state.run.core&&auditBoard===document.querySelector('.game-board-shell')&&auditState===JSON.stringify(state.run,(_,v)=>v instanceof Set?[...v]:v)),'Mode preserved run identity, board DOM and complete game state')}
(async()=>{
const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
for(const game of ['minesweeper','pacman','tetris']){
for(const mask of [15,...Array.from({length:15},(_,i)=>i)]){
const {page,requests,issues}=await setup(browser,game,mask);
try{
await build(page);await play(page,game);await preserve(page);
if(mask&1){
await page.locator('#reveal-mechanic').click();await page.clock.runFor(await page.evaluate(()=>modeConversionMessages.length*250));await assertPreserved(page);
}else check(await page.locator('#reveal-mechanic').isDisabled(),'Visual-off conversion disabled, live preview retained');
await ready(page);
for(const [i,id] of [[0,'event-shell-background'],[0,'scene-wood'],[1,'scene-character'],[2,'scene-story'],[3,'scene-rewards']]){
check(await page.locator('#'+id).isVisible()===Boolean((mask&1)&&(mask&(1<<i))),'Visibility '+id+' mask '+mask);
}
const text=await page.locator('#scene-story-copy').textContent();check(text===((mask&1)&&(mask&4)?expected[game]:''),'Exact current-core story');
const m=await metrics(page);check(m.pageOverflow<=1,'No page horizontal overflow');check(Math.abs(m.cell.width-m.cell.height)<=1,'Square game cells '+JSON.stringify(m.cell));
if(mask&1){
check(m.hudOverflow<=1,'HUD stays inside panel '+m.hudOverflow);
if(mask&4)check(m.storyOverflow<=1,'Full desktop story fits '+m.storyOverflow);
if(!baseline[game])baseline[game]=m;
else for(const part of ['scene','game','board','hud'])for(const key of ['x','y','width','height'])check(Math.abs(m[part][key]-baseline[game][part][key])<=1,'Fixed slot '+game+' '+mask+' '+part+'.'+key);
await page.evaluate(()=>{window.auditTimers=[gameLoopTimer,gameClockTimer]});
for(let i=0;i<4;i++)await page.locator('#reveal-mechanic').click();
await assertPreserved(page);
check(await page.evaluate(()=>auditTimers[0]===gameLoopTimer&&auditTimers[1]===gameClockTimer),'Repeated switch does not rebind timers');
}else check(!requests.some(u=>u.includes('/processed/scene/')),'Visual-off loads no scene artwork');
check(!requests.some(u=>u.includes('最终效果')||u.includes('公共外壳.png')||u.includes('/processed/minesweeper/')),'No reference, legacy shell or old split resources');
if([15,13,11,7,14].includes(mask))await snap(page,game+'-'+({15:'all-on',13:'no-character',11:'no-story',7:'no-rewards',14:'visual-off'}[mask]));
check(issues.length===0,issues.join('\n'));
results.push({game,mask,passed:true,metrics:m,pngRequests:[...new Set(requests)]});console.log('PASS',game,mask);
}catch(e){results.push({game,mask,passed:false,error:e.message});errors.push(game+' mask '+mask+': '+e.message);console.log('FAIL',game,mask,e.message);await snap(page,game+'-failure-'+mask)}
finally{await page.close()}
}
}
for(const game of ['minesweeper','pacman','tetris']){
for(const viewport of [{width:960,height:720},{width:390,height:844}]){
const {page,issues}=await setup(browser,game,15,viewport);
try{await build(page);await play(page,game);await page.locator('#reveal-mechanic').click();await page.clock.runFor(1250);await ready(page);
const m=await metrics(page);check(m.pageOverflow<=1,'Narrow page overflow');check(Math.abs(m.cell.width-m.cell.height)<=1,'Narrow square cells');check(m.hudOverflow<=1,'Narrow HUD overflow '+m.hudOverflow);
check(await page.locator('#scene-story-copy').textContent()===expected[game],'Complete narrow story available');
await snap(page,game+'-'+viewport.width+'px');check(!issues.length,issues.join('\n'));results.push({game,viewport,passed:true,metrics:m});
}catch(e){errors.push(game+' narrow '+viewport.width+': '+e.message);await snap(page,game+'-narrow-failure-'+viewport.width)}
await page.close();
}
}
// Legacy migration and persistence: selected groups preserved, removed fields discarded only in config.
{
const {page}=await setup(browser,'minesweeper',0,undefined,{visualSkin:'military',characterPackage:'cuteMascot',eventStory:false,rewardSystem:'dailyMissions',monetizationLayer:'battlePass',unknownField:7});
await build(page);
check(await page.evaluate(()=>JSON.stringify(state.assets))===JSON.stringify({visualSkin:true,characterPackage:true,eventStory:false,rewardSystem:true}),'Legacy switches migrated');
check(await page.evaluate(()=>localStorage.getItem('unrelated-game-save'))==='keep-me','Unrelated save preserved');
check(await page.evaluate(()=>!('monetizationLayer' in JSON.parse(localStorage.getItem(storageKey)).assets)),'Obsolete field not persisted');
await preserve(page);await page.locator('#another-skin').click();await page.locator('[data-packaging-key="eventStory"]').click();await build(page);
// Rebuilding rendering is allowed, but must retain the same game instance and values.
check(await page.evaluate(()=>auditRun===state.run&&auditCore===state.run.core&&auditState===JSON.stringify(state.run,(_,v)=>v instanceof Set?[...v]:v)),'Editing packaging retains gameplay state');
await page.locator('#another-skin').click();await snap(page,'packaging-four-switches');
await page.close();results.push({test:'migration-and-builder-roundtrip',passed:true});
}
} finally{
await browser.close();fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({results,errors,screenshots},null,2));
console.log(JSON.stringify({passed:results.filter(x=>x.passed).length,errors,screenshots:screenshots.length},null,2));if(errors.length)process.exitCode=1;
}
})().catch(e=>{console.error(e);process.exitCode=1});

