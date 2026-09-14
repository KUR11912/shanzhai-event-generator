# 第 4 版活动场景改造验收

## 基准与范围

- 项目：`C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator`
- 分支：`minesweeper-event-ui-v4`，开始时 HEAD 为 `c584a02`。没有切换／回退分支，没有提交或推送。
- 修改前已存在的工作区变化保留。原有 `style.css` 与任务开始时的副本 SHA256 完全一致；已有旧版处理素材、其他脚本、源图删除状态均未撤销。
- 原始源素材共 49 张，处理前后 SHA256 全部相同。所有新裁切、底板清空、方形画布和边缘清理仅输出至新目录 `assets/event-ui/processed/scene/`。
- 四份源码基准副本位于 `exports/v4-scene-update/before/`，不是运行入口。

## 已完成

1. Packaging 改为四个布尔开关，允许全部关闭。移除子选项生成、随机包装与商业模块。旧子选项名称只在迁移白名单中用于识别此前开启的大类，不参与生成。
2. `Visual Skin` 关闭时保持核心可玩预览；另外三个布尔值保留。开启后，用户点击转换按钮进入场景。角色、剧情、奖励独立显隐且保留固定槽位。
3. 使用自然场景、木质舞台、公共角色、剧情底板、奖励架分层组合。参考整图和旧 `公共外壳.png` 不进入运行资源表，也未被浏览器请求。
4. 不再随机切换左侧、右侧、底部信息栏。统一 1672 × 941 场景坐标，公共模块固定；三种游戏各有内部布局。
5. 预览与场景共享同一个游戏实例。转换保留棋盘、分数、计时、旗帜、玩家位置和方块状态；反复切换不重建棋盘 DOM 或计时器。返回 Packaging 后重新运行也继续同一局游戏，只有换核心或点重开才创建新局。
6. 扫雷保持 9 × 9、13 个危险格，数字 1—8 来自邻雷计数。迷宫根据原 17 × 13 碰撞网格绘制墙、收集物和角色。俄罗斯方块保持 10 × 20 棋盘、七种形状，显示真实 Next／Hold／落点预览；现有 Hold 功能开放给用户使用。
7. 剧情使用最新要求的完整英文原文。桌面和 960px 视口中完整显示，没有省略、裁切或额外故事。窄屏整场景可横向滚动，内部坐标和比例不变，剧情文本仍完整可读。

## 原因与局部修复

| 已确认的问题 | 处理 |
| --- | --- |
| 旧包装按子选项和随机布局装配，不能用四个开关稳定控制 | 单一布尔配置、固定场景槽位，去掉旧包装模块 DOM |
| 整张旧背景混有不可关闭的模块 | 只使用公共目录的自然背景与独立木质板；角色、剧情、奖励单独节点 |
| 不同目录同名图层可能混淆 | common / minesweeper / pacman（MazeChase）/ tetris 语义命名空间 |
| 素材透明留白及洋红抠图边缘 | 测量 alpha 可见范围，裁切副本、居中方形画布；中性边框副本清理外沿洋红残色，不覆盖原图 |
| 迷宫底座墙体不匹配真实地图 | 提取底座边框、墙／地面样式，按真实 wall Set 绘制 |
| 迷宫状态图自带示例数字与图标 | 制作空白 HUD 副本，动态叠加真实分数、收集数、生命和重开 |
| 首轮剧情多一行、方块状态区按钮溢出 | 只校准剧情文本排版及方块内部 HUD；没有移动其他公共模块 |
| 方块边框内边距造成非正方格 | 以内容盒保持 1:2 棋盘比例；预览格统一尺寸与居中 |
| 扫雷悬停覆盖旗帜图 | 悬停按下态只作用于未标记格子 |
| 手机竖屏把整图缩得过小 | 720px 以下使用统一 1000px 场景画布的内部横向滚动，非独立层偏移 |

## 修改文件

| 文件 | 职责 |
| --- | --- |
| [index.html](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/index.html) | 四开关流程文案、场景独立节点、窄屏视口、新资源入口 |
| [script.js](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/script.js) | 开关配置／迁移、生成摘要、三个真实游戏渲染、委托交互、模式状态保留 |
| [scene-ui.js](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/scene-ui.js) | **核心标识 → 固定剧情原文**，公共模块显隐，资源变量绑定 |
| [scene-ui.css](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/scene-ui.css) | 选项卡、公共固定槽位、三类棋盘／HUD、边框切片、响应式 |
| [event-ui-assets.js](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/assets/event-ui/event-ui-assets.js) | 语义化运行资源映射；不含参考整图 |
| [process-scene-ui.ps1](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/scripts/process-scene-ui.ps1) | 可重现的新素材处理与源文件对应关系 |
| [inspect-scene-assets.ps1](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/scripts/inspect-scene-assets.ps1) | 原始尺寸、透明边界、哈希、素材联系表 |
| [verify-v4-scene.cjs](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/scripts/verify-v4-scene.cjs) | 48 组合、响应式、配置迁移、坐标／状态／网络验证和截图 |
| [verify-v4-gameplay.cjs](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/scripts/verify-v4-gameplay.cjs) | 游戏操作、胜负、计时、数字与源文件哈希验证 |
| 新目录 `assets/event-ui/processed/scene/` | 39 张独立处理素材及 manifest.json |
| `exports/v4-scene-update/` | 检查结果、联系表、基准源码与截图／验收页 |

## 实际素材映射

以下输入均在 `assets/event-ui/source/` 内；输出均在 `assets/event-ui/processed/scene/` 内。未使用的参考图、图集及备用素材保留在原目录。

| 命名空间／输出 | 实际输入与用途 |
| --- | --- |
| common/background | 公共外壳/new secen.png，自然场景 |
| common/stage | 公共外壳/木质板.png，独立舞台 |
| common/character | 公共外壳/character package.png，公共展示角色 |
| common/rewards | 公共外壳/reward system.png，奖励架 |
| common/dialog | 公共外壳/图层 1.png，空白剧情气泡，网页文字覆盖其安全区 |
| common/panel、button | 公共外壳/图层 5.png、图层 2.png，备用公共底板／圆按钮 |
| minesweeper/frame、hud | Minesweeper/图层 1.png、图层 2.png，主框与状态框 |
| minesweeper/closed、pressed、open | Minesweeper/图层 3.png、4.png、5.png，方格底图 |
| minesweeper/flag、mine | Minesweeper/图层 6.png、7.png，标记与危险物 |
| minesweeper/clock、restart、divider | Minesweeper/图层 8.png、9.png、10.png，计时、重开、备用分隔条 |
| maze/frame、wall、floor | MazeChase/迷宫底座.png；边框中心清空；墙体取样 [570,80,120,32]，地面取样 [580,45,100,25] |
| maze/hud | MazeChase/图层 1.png；空白副本移除内侧示例文字、生命图与按钮 |
| maze/player、enemy | MazeChase/图层 6.png、椭圆 1 拷贝.png |
| maze/collectible、power、restart | MazeChase/图层 5.png、图层 3.png、图层 7.png |
| tetris/frame、hold、next、panel | Tetris/图层 1.png、2.png、3.png、5.png |
| tetris/block-1…7 | Tetris/图层 7、8、9、10、11、13、14.png，对应七种颜色的单格 |
| tetris/ghost、restart | Tetris/图层 15.png、17.png |

完整的尺寸与映射：[manifest.json](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/assets/event-ui/processed/scene/manifest.json)。原图检查：[source-inspection.json](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/exports/v4-scene-update/source-inspection.json)。

## 验证结果

- **48 / 48**：三种核心 × 16 种布尔组合，通过。
- **6 / 6**：三核心分别在 960 × 720、390 × 844 视口复测，通过。手机使用整个场景的内部横向滚动。
- **1 / 1**：旧配置迁移与 Packaging 往返保留当前局，通过；未清空无关 localStorage 键。
- **41 项**额外功能／素材保护检查通过：扫雷翻开、右键标记／取消、悬停旗帜、数字 1—8、胜负；方块七种旋转、消行、真实 Next／Hold、堆顶失败；迷宫墙体碰撞、追逐、收集、生命、胜负；三个重开按钮；切换后每秒仅一次计时；49 张原图不变。
- 在固定随机种子 123456、1920 × 1080 视口、相同已操作状态下，活动模式各组合的场景／游戏区／棋盘／HUD 最大坐标及尺寸差均为 **0 CSS px**。
- 棋盘格宽高差不超过 1 CSS px；桌面剧情和 HUD 溢出值均为 0。
- 浏览器没有脚本异常、素材 404、参考整图请求或旧外壳请求。Visual Skin 关闭的全新页面未加载整套场景 PNG。
- JavaScript 语法检查与 `git diff --check` 通过。
- 数字 1—8 与特定消行／胜负边界使用独立测试页中的合法状态夹具，实际动作仍通过游戏原函数和按钮触发，不改变用户存档。

详细结果：[组合与布局](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/exports/v4-scene-update/verification.json)、[游戏功能](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/exports/v4-scene-update/gameplay-verification.json)。

## 截图

[打开全部代表截图验收页](http://127.0.0.1:4173/exports/v4-scene-update/gallery.html)

- [Minesweeper 全开](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/exports/v4-scene-update/screenshots/minesweeper-all-on.png)
- [MazeChase 全开](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/exports/v4-scene-update/screenshots/pacman-all-on.png)
- [Tetris 全开](C:/codex-home/visualizations/2026/09/11/01a08f75-991d-7040-9e5c-c40b13d717c9/shanzhai-event-generator/exports/v4-scene-update/screenshots/tetris-all-on.png)
- 角色／剧情／奖励分别关闭、Visual Skin 关闭、窄屏、四开关选择页均在验收页中。

## 素材与实现边界说明

- **没有缺少阻塞运行的必需素材**。剧情无需专用 Event Story 图片，按要求使用公共空白气泡（图层 1）与真实英文文本。
- **Tetris/图层 4.png 是 3 × 407 的全透明图片**，未用于任何运行模块。其他重复、备用颜色图与参考整图也没有被强制使用。
- 迷宫实际地图与参考图不同；保留了现有地图和碰撞状态，因此路径外形不会复制参考中的示例迷宫。动态迷宫玩家采用实际提供的图层 6，不与公共展示角色开关绑定。
- 扫雷保留真实 9 × 9 正方棋盘，因此没有把参考图里示例的横向格子排列硬拉到当前棋盘。方块棋盘保持真实 10 × 20；等级由真实消行数计算展示，不新增提速规则。
- 手机竖屏需在场景内部横向滑动查看全部区域，或使用横屏。不是把核心区、背景、剧情分别移动。
- 未进行 GitHub 部署。本地预览入口：[打开项目](http://127.0.0.1:4173/?scene-v4=20260913)。

## 复跑

在项目根目录启动静态服务，然后运行测试（测试使用独立无头浏览器上下文，不使用个人浏览器资料）：

```powershell
E:\PY\python.exe -m http.server 4173 --bind 127.0.0.1
node scripts/verify-v4-scene.cjs
node scripts/verify-v4-gameplay.cjs
```

重新处理素材请使用 Windows PowerShell 5.1（处理器使用 System.Drawing），UTF-8 读取脚本：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& ([scriptblock]::Create((Get-Content -LiteralPath 'scripts/process-scene-ui.ps1' -Raw -Encoding UTF8))) -ProjectRoot (Get-Location).Path"
```

