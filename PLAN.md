# TimeMigration — LLM 接口实装实现计划（PLAN.md）

> 本文件是“把项目中预留的 LLM 接口实装成真正的 LLM 调用”这一任务的**实现规格**。
> 交给任意模型/开发者执行时，请先完整阅读 `DESIGN.md`（权威设计）再读本文件。
> 实现完成后请同步更新 `DESIGN.md` 第 0/7/12 节。

---

## 0. 目标

把项目中预留的 LLM 接口实装成真正的 LLM 调用，**保留种子库 / 规则实现作为兜底**。
游戏运行时从下列 provider 中**自动选一个可用的**（均为 OpenAI 兼容的 `/chat/completions` 接口）：

| name | model | baseURL | apiKey |
|---|---|---|---|
| silicon | `deepseek-ai/DeepSeek-V4-Flash` | `https://api.siliconflow.cn/v1` | `sk-buljnvhxuchipxidqzyirmashkgckmrbgrnjlglspdallsrl` |
| aiping | `DeepSeek-V4-Flash` | `https://aiping.cn/api/v1` | `QC-cad1caaef95e6e777748b372221941fa-83eb610f51e7320e4cfbb7b62984d1ee` |
| qnaigc | `deepseek/deepseek-v4-flash` | `https://api.qnaigc.com/v1` | `sk-560d71b94d9a1930d9b2c2cc005b0479bc2babf1382c9c9a293e56fc505a02a7` |

---

## 1. 涉及的预留点（现状）

1. **叙述**：`src/game/narrative/provider.ts`（`NarrativeProvider` 接口）+ `seedProvider.ts`（种子库实现）。
   叙述当前在 `src/game/worldEngine.ts` 的 `advanceWorld()` 内**同步**生成（调用 `SeedLibraryProvider.getNarrative`）。
2. **结局**：`src/game/ending/provider.ts`（`EndingProvider` 接口）+ `ruleEnding.ts`（规则实现）。
   当前在 `src/state/gameStore.ts` 的 reducer（`SETTLE_ALL`）里**同步**生成；`game_over` 的失败结局在 `src/App.tsx` 内联拼装。
3. **沉睡过渡**：`src/components/SleepTransition.tsx`，设计上即“LLM 加载缓冲”，当前是固定 2.4s 定时器。

### 核心约束（务必遵守）
- **世界数值演化必须保持确定性、同步**（`worldEngine` 的人口公式/演化逻辑不改其数值结果）。
- 只把**“叙述/结局文本生成”**改为异步 LLM。
- **reducer 保持纯同步**（`useReducer`）；所有异步在 `App.tsx` 用 `useEffect` 编排，完成后再 `dispatch` 覆盖动作。
- **“受控噪声是 feature”** 这一核心玩法不能被破坏：真值通道（`truthText`、先遣队情报）继续由现有 `noise.ts` 规则生成。

---

## 2. 文件改动清单（任务分解）

### 2.1 新建 `src/game/llm/config.ts`
- 导出 `LLMProviderConfig` 类型：`{ name: string; model: string; baseURL: string; apiKey: string }`。
- 导出 `LLM_PROVIDERS: LLMProviderConfig[]`，内容为上表 3 条。
- **CORS 处理**：当 `import.meta.env.DEV` 为真时，`baseURL` 改用 Vite 代理路径（见 2.3）：
  - silicon → `/llm/silicon/v1`
  - aiping → `/llm/aiping/api/v1`
  - qnaigc → `/llm/qnaigc/v1`
  - 生产构建（`!DEV`）时使用表中真实 baseURL。
- 支持环境变量覆盖（可选）：若存在 `import.meta.env.VITE_LLM_PROVIDERS`（JSON 字符串）则优先使用。

### 2.2 新建 `src/game/llm/client.ts`
- `chatCompletion(messages, opts?)`：
  - 入参 `messages: {role:'system'|'user'|'assistant'; content:string}[]`，
    `opts?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }`。
  - **按顺序尝试**每个 provider；用模块级变量 `cachedWorkingIndex` 缓存“第一个成功”的索引，下次优先用它。
  - 每个 provider 用 `AbortController` 设 ~12s 超时（与外部传入 `signal` 合并）。
  - 请求体：`{ model, messages, temperature, max_tokens, stream:false }`，
    Header：`Authorization: Bearer <apiKey>`、`Content-Type: application/json`。
  - 解析 `data.choices[0].message.content` 返回字符串；HTTP 非 2xx 或解析失败视为该 provider 失败，继续下一个。
  - 全部失败 → `throw new Error('All LLM providers failed')`。
- `chatJSON<T>(messages, opts?)`：调用 `chatCompletion` 后**容错解析 JSON**：
  - 去除 ```json ... ``` / ``` ... ``` 代码块包裹；
  - 用正则截取第一个 `{...}` 或 `[...]`；
  - `JSON.parse` 失败则抛错（由调用方回退）。
- 可加 `isLLMConfigured()`：用于调试/开关（恒为 true，因为内置了 key）。

### 2.3 修改 `vite.config.ts`
- 增加 `server.proxy`，绕过浏览器 CORS（仅 DEV 生效）：
```ts
server: {
  proxy: {
    "/llm/silicon": { target: "https://api.siliconflow.cn", changeOrigin: true,
      rewrite: (p) => p.replace(/^\/llm\/silicon/, "") },
    "/llm/aiping":  { target: "https://aiping.cn", changeOrigin: true,
      rewrite: (p) => p.replace(/^\/llm\/aiping/, "") },
    "/llm/qnaigc":  { target: "https://api.qnaigc.com", changeOrigin: true,
      rewrite: (p) => p.replace(/^\/llm\/qnaigc/, "") },
  },
},
```
- 注意：`config.ts` 中 DEV 的 baseURL 要与上面的 rewrite 拼接出正确的最终路径
  （如 `/llm/silicon/v1` → 代理到 `https://api.siliconflow.cn/v1`）。

### 2.4 新建 `src/game/narrative/llmProvider.ts` — `LLMNarrativeProvider`
- 异步方法：`async getNarrative(state: WorldState, scoutReturn = 0, fallback: NarrativeLine[]): Promise<NarrativeLine[]>`。
- Prompt（见第 3 节）注入：时代名/类型、**叙述者风格 tone**（让模型据此制造偏差）、真实参数（仅供模型把握真假倾向，**禁止直接报数值**）、是否已识破谎言（`liarExposed` 时 liar 降级为 reliable）。
- 期望返回 JSON `{ title: string; text: string }`，作为**公开叙述**那一行的 `title`/`text`。
- **truthText 与先遣队情报继续用现有 `noise.ts` 规则生成**：
  - 方案：从 `buildNarrative(state, scoutReturn)`（现有函数）拿到规则版结果作为 `fallback`/真值来源；
    LLM 成功时，仅用 LLM 的 `{title,text}` 替换第 0 行的 `title`/`text`，**保留第 0 行的 `truthText` 以及“先遣队情报”行**。
- 任意异常/超时/解析失败 → 直接返回 `fallback`（种子叙述），保证不崩。

### 2.5 新建 `src/game/ending/llmProvider.ts` — `LLMEndingProvider`
- `async buildEnding(state: WorldState, history: GameHistory): Promise<EndingResult>`。
- **成功/失败/重生（`outcome`）判定仍复用 `RuleBasedEndingProvider` 的规则逻辑**（保持确定性），
  把判定结果 + 最终世界状态 + 整局 `history.entries` 要点喂给 LLM。
- 期望返回 JSON `{ title: string; text: string; timeline: string[] }`，`outcome` 取规则判定值。
- 失败 → 回退到 `new RuleBasedEndingProvider().buildEnding(state, history)`。
- 建议把规则判定抽成可复用函数（如导出 `decideOutcome(state, history)`），供两处共用。

### 2.6 修改 `src/state/gameStore.ts`
- `GameState` 增加：`endingPending?: boolean`（结局加载态）。
- `GameAction` 增加：
  - `{ type: "SET_NARRATIVE"; narrative: NarrativeLine[] }` → 覆盖 `latestNarrative`。
  - `{ type: "SET_ENDING"; ending: EndingResult }` → 覆盖 `ending`，并置 `endingPending=false`。
- `SETTLE_ALL`：仍**同步**用 `RuleBasedEndingProvider` 产出即时兜底 `ending`，并置 `endingPending=true`（等待 LLM 覆盖）。
- `CONTINUE`：保持不变（仍由 `advanceWorld` 产出种子兜底 `latestNarrative`），等待 sleep 阶段的 LLM 覆盖。
- `game_over`：建议也走结局 provider（可选）。最简做法：进入 `game_over` 时置 `endingPending=true`，由 App 触发 LLM 生成失败结局并 `SET_ENDING`；若不想改动太大，可保留 App 内联失败结局再用 LLM 覆盖。

### 2.7 修改 `src/App.tsx`（异步编排核心）
- **sleep 阶段 effect**：phase 变为 `sleep` 时触发一次：
  - `fallback = state.latestNarrative`（种子结果）。
  - 调 `new LLMNarrativeProvider().getNarrative(state.world, state.scoutReturnLast, fallback)`。
  - 与“最短展示时间 ~2.4s”做 `Promise.all`，完成后 `dispatch(SET_NARRATIVE)` → `dispatch(AWAKEN_DONE)`。
  - 用 `useRef` 标志位防止重复触发；卸载时 `AbortController.abort()`。
- **ending / game_over 阶段 effect**：进入时若 `endingPending` 为真，触发一次：
  - 调 `new LLMEndingProvider().buildEnding(state.world, state.history)`，完成后 `dispatch(SET_ENDING)`。
- `EndScreen` 传入 `loading={state.endingPending}`。
- `SleepTransition` 改为接收 `ready` Promise（见 2.8），App 负责构造该 Promise。
  - 也可保持 App 完全掌控异步、`SleepTransition` 仍只接 `onDone`；二选一，推荐后者更简单（见 2.8 备注）。

### 2.8 修改 `src/components/SleepTransition.tsx`
- 方案 A（推荐，改动小）：保持现有 `onDone` 接口，由 **App 控制何时 dispatch `AWAKEN_DONE`**；
  `SleepTransition` 只负责播放氛围文字，不再自带 2.4s 定时器（或保留定时器仅作最短展示，由 App 决定切屏）。
- 方案 B：新增可选 `ready?: Promise<unknown>` 与 `minMs?: number`，组件内 `await Promise.all([ready, delay(minMs)])` 后调用 `onDone`，向后兼容（无 `ready` 时等价于原行为）。
- 二选一实现即可，保证：**LLM 未就绪时一直停留在沉睡界面**（真实加载缓冲），就绪后再进入苏醒。

### 2.9 修改 `src/components/EndScreen.tsx`
- 新增可选 `loading?: boolean`。
- `loading` 为真时，正文区显示“正在生成千年发展史……”占位（可用现有 `.muted` 样式 + 简单动画），
  隐藏/禁用部分内容；`SET_ENDING` 后正常展示。

### 2.10 更新 `DESIGN.md`
- 第 0 节：把“后端第一版不做 / 预留接口”改为“已实装前端直连 LLM（多 provider 运行时择优）+ 种子/规则兜底”。
- 第 7、9 节：标注 `NarrativeProvider`/`SleepTransition` 已接 LLM。
- 第 12 节：把“实时 LLM 叙述 / 千年史结局”从“未来预留”移到“已完成”。
- 增加安全提示：前端内嵌 key 无法保密，公开部署需自备后端代理。

---

## 3. Prompt 规范

### 3.1 叙述 — system
> 你是科幻文字游戏《时间移民》的时代叙述者。玩家携带冷冻人口在未来不同时代间跳跃迁移。
> 请根据给定的「叙述者风格」描写玩家本次苏醒后所见的时代见闻：
> - reliable：基本如实、克制；
> - optimistic：夸大有利条件，淡化风险；
> - pessimistic：强调代价与危险，低估生存空间；
> - liar：故意给出与真实情况相反的印象。
> 只输出 JSON：`{"title":"简短标题","text":"60-120字中文叙述"}`。
> **不要直接报出任何具体数值**（宜居度/接纳度等只能用文学化描述暗示）。

### 3.2 叙述 — user（动态拼装）
> 时代：{era.name}（类型 {era.id}）。叙述者风格：{effectiveTone}。
> （仅供你把握真假倾向，不要直接写出）真实参数：宜居度 {h}、接纳度 {a}、科技 {t}、承载力 {c}、民心 {trust}。
> {liarExposed ? "玩家已识破谎言，请如实描写。" : ""}
> 请生成本时代的公开叙述。

### 3.3 结局 — system
> 你为科幻游戏《时间移民》生成「移民文明苏醒后约 1000 年的发展史」。
> 这是开放式结局，不打分、不评级，由玩家自行解读成败。
> 只输出 JSON：`{"title":"...","text":"...","timeline":["条目1","条目2",...]}`，全部中文。
> text 为 150-250 字的史诗式叙述；timeline 为 4-7 条编年要点。

### 3.4 结局 — user（动态拼装）
> 规则判定结果：{outcome}（success/failure/rebirth）。
> 定居时代：{era.name}。最终状态：活跃人口 {activePop}、冷冻人口 {frozenPop}、承载力 {capacity}、
> 宜居度 {h}、接纳度 {a}、科技 {t}、民心 {trust}、是否建交 {allianceFormed}。
> 整局历程要点：{history.entries.map(e => `第${e.turn}代 ${e.eraName} 睡${e.sleepingYears}年 归队${e.scoutReturn}`).join("；")}。
> 请据此续写这支移民文明苏醒后约 1000 年的发展史。

---

## 4. 数据流（实装后）

```
决策确认 → CONTINUE(reducer 同步算数值 + 种子兜底叙述) → phase=sleep
  ↓ (App effect)  触发 LLMNarrativeProvider + 最短 2.4s
  成功 → SET_NARRATIVE(LLM文本, 保留规则 truthText/情报)
  失败 → 保持种子兜底
  ↓
AWAKEN_DONE → phase=awaken（展示最终叙述）
  ↓
... 直到 SETTLE_ALL / game_over
  ↓ reducer 同步出规则兜底 ending + endingPending=true → phase=ending
  ↓ (App effect) 触发 LLMEndingProvider
  成功 → SET_ENDING(LLM 千年史)   失败 → 保持规则兜底
EndScreen 显示（loading=endingPending）
```

---

## 5. CORS / 安全说明
- 纯静态前端直连这三个第三方域名很可能被浏览器 CORS 拦截，故 **DEV 走 Vite 代理**（2.3）。
- 生产部署需自备反向代理/后端代理转发这三个 baseURL。
- API key 会被打进前端产物，**无法真正保密**，仅适合个人/演示用途。

---

## 6. 验收标准
- [ ] `npm run build` 通过，无 TypeScript 报错。
- [ ] `npm run dev` 跑一局：沉睡过渡后出现 **LLM 生成的叙述**（标题/正文由模型生成，且真值/先遣队情报仍在）。
- [ ] 全体解冻 / 民心归零后出现 **LLM 生成的“千年发展史”** 结局；加载时 EndScreen 显示占位。
- [ ] 三个 provider 中至少一个可用即正常工作；运行时会缓存第一个成功的 provider。
- [ ] 断网或全部 provider 失败时：叙述回退种子库、结局回退规则文本，**游戏不崩溃**。

---

## 7. 实施顺序建议
1. `llm/config.ts` + `llm/client.ts`（先用一个临时脚本/console 验证能连通某个 provider）。
2. `vite.config.ts` 代理。
3. `narrative/llmProvider.ts`（接入并保留 noise 真值通道）。
4. `gameStore.ts` 新增 action/状态。
5. `App.tsx` sleep 阶段异步编排 + `SleepTransition` 调整。
6. `ending/llmProvider.ts` + `App.tsx` 结局编排 + `EndScreen` loading。
7. 跑通整局，验证回退路径（可临时把 key 改错测试兜底）。
8. 更新 `DESIGN.md`。
