# Shanzhai Game Factory 使用手册

## 三步流程

1. `01 CORE`：选择 `Minesweeper`、`Tetris` 或 `Maze Chase`。Template 只决定不可改变的核心玩法。
2. `02 PACKAGE`：从五类包装模块中选择至少一项；每类最多选择一个选项，再点已选项即可取消。
3. `03 PRODUCT`：点击 `Build & Run`，短暂的流水线生成过程结束后即可游玩包装后的游戏。

返回上一步或刷新页面时，Template 与 Packaging 选择会通过浏览器 `localStorage` 保留。更换 Template 会清除旧游戏运行状态，但保留包装选择。

## 核心玩法

- `Minesweeper`：翻开安全格、识别并标记地雷、清空棋盘。左键翻格，右键插旗或取消旗帜。
- `Tetris`：方块下落、移动旋转、堆叠并消除完整行。`←` / `→` 移动，`↓` 加速，`↑` 旋转，`Space` 快速落下。
- `Maze Chase`：在迷宫内收集豆子并躲避敌人。使用方向键或 `WASD` 移动。

包装选择不会改变以上规则。

## Packaging Modules

- `Visual Skin`：Fantasy、Cyber、Military。改变三个游戏各自的背景、棋盘、方块、迷宫、角色和视觉效果。
- `Character Package`：Anime Hero、Cute Mascot、Tactical Operator。加入不同的原创活动角色与身份包装。
- `Event Story`：Summer Festival、World Crisis、Limited Tournament。改变活动标题、介绍与背景语境。
- `Reward System`：Event Currency 显示活动货币；Daily Missions 显示随游戏进度变化的任务；Limited Rewards 显示限定奖励。
- `Monetization Layer`：Gacha Banner 显示限定卡池包装；Battle Pass 显示活动通行证；Countdown Offer 显示持续倒计时的限时销售模块。

## PRODUCT 页面按钮

- `Back to Builder`：返回包装选择页并保留所有选择。
- `Reveal the Original Mechanic`：隐藏皮肤、角色、故事、奖励和商业包装，保持当前棋盘、分数与运行状态不变。
- `Restore the Packaging`：恢复刚才隐藏的全部包装，可以反复切换。
- `Generate Another Skin`：保持当前核心 Template 和游戏状态，只随机替换五类包装。
- `Restart Game`：只重启当前小游戏，不清除 Template 或 Packaging。

结果下方的生产百分比是用于艺术讽刺的虚构数据，不代表真实行业统计。

## 当前实现范围

三个小游戏均使用原生 HTML、CSS、JavaScript 和原创几何图形。当前为课堂展示规模的单局原型，没有音频、联网排行榜、云存档、付费系统或商业游戏素材。包装面板是概念展示，不执行真实购买或抽卡。

## 运行方式

可直接打开 `index.html`，或在项目目录运行：

```powershell
py -m http.server 4173 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:4173/`。
