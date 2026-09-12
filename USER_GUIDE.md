# Shanzhai Game Factory 使用手册

## 三步流程

1. `01 TEMPLATE`：选择 `Minesweeper`、`Tetris` 或 `Pac-Man`，确定不可改变的核心玩法。
2. `02 ASSETS`：从当前模板专属的五组扩展元素中选择至少一项。同组只能选择一个选项，再点一次可取消。
3. `03 RUN`：点击 `Build & Run`，运行由核心玩法和扩展元素组合出的可玩版本。

返回上一步或刷新页面时，兼容的 Template 与 Assets 会通过浏览器 `localStorage` 保留。更换 Template 会自动清除上一种游戏的不兼容 Assets。

## Template 与 Assets

### Minesweeper

核心循环：`Reveal Tiles → Identify Mines → Mark Mines → Clear the Board`

- `Board Size`：Small、Medium、Large 分别生成 7×7、9×9、12×12 棋盘。
- `Mine Density`：Low、Normal、High 改变地雷比例。
- `Game Mode`：Classic 使用标准规则；Time Limit 增加倒计时；Limited Lives 允许多次触雷后再失败。
- `Special Tile`：Chain Reveal 首次翻开时额外展开相邻安全格；Safety Shield 抵消第一次触雷；Score Multiplier 将安全格分数加倍。
- `Visual Theme`：Military、Cyber、Fantasy 改变棋盘配色与边框表现。

操作：左键翻开格子，右键插旗或取消旗帜。第一格不会触雷，空白区域会自动展开。

### Tetris

核心循环：`Falling Blocks → Move and Rotate → Complete Lines → Clear Lines`

- `Falling Speed`：Slow、Normal、Fast 改变自动下落速度。
- `Board Rule`：Classic 使用标准棋盘；Rising Floor 每锁定五个方块抬升一行；Time Attack 增加 90 秒倒计时。
- `Extra Feature`：Hold Block 可用 `C` 或 `Hold` 保存方块；Next Block Preview 显示下一个方块；Combo Bonus 为连续消行增加分数。
- `Special Block`：每第四个方块成为 Bomb Block、Locked Block 或 Score Block，分别清除落点附近格子、禁止旋转或奖励 250 分。
- `Visual Theme`：Retro、Cyber、Fantasy 改变方块、棋盘与强调色。

操作：`←` / `→` 移动，`↓` 加速下降，`↑` 旋转，`Space` 快速落下；选择 Hold Block 时可按 `C`。

### Pac-Man

核心循环：`Navigate the Maze → Collect Dots → Avoid or Chase Enemies`

- `Maze Layout`：Classic、Symmetrical、Multiple Rooms 使用三张不同的固定迷宫。
- `Enemy Behaviour`：Random 随机移动；Patrol 按固定方向巡逻；Chase 优先靠近玩家。
- `Game Mode`：Classic 使用三条生命；Time Limit 增加 90 秒倒计时；Limited Lives 改为两条生命。
- `Special Item`：Power Pellet 可暂时反击敌人；Speed Boost 可暂时移动两格；Temporary Shield 抵消一次碰撞。
- `Visual Theme`：Arcade、Cyber、Fantasy 改变迷宫、角色与强调色。

操作：方向键或 `WASD` 移动。收集全部豆子获胜；碰到敌人会失去生命。

## RUN 页面

- `Core Mechanic` 显示当前模板固定不变的核心循环。
- `Added Elements` 显示本次实际加入的扩展元素。
- `Back to Builder` 返回 Assets 页面并保留选择。
- `Restart Game` 只重启当前小游戏，不清空 Template 或 Assets。

## 当前实现范围

三个小游戏均使用原生 HTML、CSS 和 JavaScript 以及原创几何图形，不嵌入第三方网站。当前为课堂展示规模的单局原型，没有音频、联网排行榜、存档进度或商业游戏素材。

## 运行方式

可直接打开 `index.html`，或在项目目录运行：

```powershell
py -m http.server 4173 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:4173/`。
