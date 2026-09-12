# Shanzhai Game Factory 使用手册

## 三步流程

1. `01 CORE`：选择 `Minesweeper`、`Tetris` 或 `Maze Chase`。Template 只决定不可改变的核心玩法。
2. `02 PACKAGE`：从五类包装模块中选择至少一项；每类最多选择一个选项，再点已选项即可取消。
3. `03 PRODUCT`：点击 `Build & Run`，短暂的流水线生成过程结束后，先进入基础小游戏的 `Core Mode`。

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

## 原型模式 / 活动美术模式

三款游戏在 `PRODUCT` 页面共用同一份实时游戏状态：

- 原型模式：显示当前 Packaging 组合已经生成的标题、角色、剧情、奖励和商业模块，同时使用基础几何游戏外观。
- 活动美术模式：保留同一个组合、同一个布局和同一组功能节点，只把背景、面板、棋盘格、旗帜、地雷与结算装饰替换成提供的活动美术。

第一次点击 `Convert to Event Version` 会播放约 1.25 秒的包装过程，然后进入活动界面。活动模式会动态显示活动标题、剧情提示、分数/时间/生命、奖励或商业包装信息。之后可用 `Reveal the Original Mechanic` 和 `Restore Event Packaging` 反复对比两种外观。

本次接入范围只包含 `Minesweeper`：

- `processed/common/background.png`：去除固定 UI 的公共场景背景。
- `processed/common/` 的对话框、圆形按钮、木质面板和通用面板：作为不参与布局的装饰层。
- `processed/minesweeper/`：未翻开格、空白格、数字 1—4、旗帜、地雷、爆炸及胜负装饰。数字 5—8 使用空白格配合程序文字显示，不改变扫雷规则。

原始中文图片保留在 `assets/event-ui/source/公共外壳/` 和 `assets/event-ui/source/扫雷/`。标准化后的英文副本保存在 `assets/event-ui/processed/`；运行时只读取独立素材，不显示完整资源表。`Tetris` 和 `Maze Chase` 保留本次修改前的实现，没有接入这批新素材。

## PRODUCT 页面按钮

- `Back to Builder`：返回包装选择页并保留所有选择。
- `Convert to Event Version`：首次把正在运行的基础小游戏转换成活动包装界面。
- `Reveal the Original Mechanic`：切回当前组合的原型外观；标题、角色、故事、奖励和商业模块仍保留，棋盘、分数与运行状态不变。
- `Restore Event Packaging`：在原位置恢复活动美术，可以反复切换。
- `Generate Another Skin`：保持当前核心 Template 和游戏状态，只随机替换五类包装。
- `Restart Game`：只重启当前小游戏，不清除 Template 或 Packaging。

结果下方的生产百分比是用于艺术讽刺的虚构数据，不代表真实行业统计。

## 当前实现范围

三个小游戏均使用原生 HTML、CSS、JavaScript。扫雷的两种外观共用同一个舞台、棋盘、HUD、信息卡片和按钮节点；转换只切换皮肤 class，不重新初始化游戏，也不再次决定布局。当前为课堂展示规模的单局原型，没有音频、联网排行榜、云存档、付费系统或真实抽卡；包装面板和生产数据用于艺术表达。处理后资源路径集中记录在 `assets/event-ui/event-ui-assets.js`，可通过 `scripts/process-split-event-ui-assets.ps1` 从保留的拆分源图重新生成副本。

## 运行方式

可直接打开 `index.html`，或在项目目录运行：

```powershell
py -m http.server 4173 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:4173/`。
