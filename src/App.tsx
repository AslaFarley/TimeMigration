import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import DecisionScreen from "./components/DecisionScreen";
import EndScreen from "./components/EndScreen";
import SleepTransition from "./components/SleepTransition";
import { gameReducer, initialGameState, MAX_SLEEPS } from "./state/gameStore";
import { getLLMNarrative } from "./game/narrative/llmProvider";
import { buildLLMEnding } from "./game/ending/llmProvider";

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [sleepingYears, setSleepingYears] = useState(100);
  const [sendScout, setSendScout] = useState(true);

  // ── LLM 状态（沉睡界面展示用） ──────────────────────────
  const [llmPingStatus, setLlmPingStatus] = useState<"pending" | "ok" | "fail">("pending");
  const [llmNarrativeReady, setLlmNarrativeReady] = useState(false);

  // 防止重复触发 LLM 请求
  const narrativeFiredRef = useRef(false);
  const endingFiredRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  // ── 60秒倒计时（decision 阶段） ──────────────────────────
  useEffect(() => {
    if (state.phase !== "decision") return;
    setSecondsLeft(60);
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [state.phase]);

  // 时间到 → 自动确认决策
  useEffect(() => {
    if (secondsLeft === 0 && state.phase === "decision") {
      dispatch({
        type: "CONTINUE",
        decision: { settleAll: false, sleepingYears, sendScout },
      });
    }
  }, [secondsLeft, state.phase, sleepingYears, sendScout]);

  // ── sleep 阶段：触发 LLM 叙述生成 ────────────────────────
  useEffect(() => {
    if (state.phase !== "sleep") return;

    if (narrativeFiredRef.current) return;
    narrativeFiredRef.current = true;

    const abort = new AbortController();
    abortRef.current = abort;

    const fallback = state.latestNarrative;

    setLlmPingStatus("pending");
    setLlmNarrativeReady(false);

    const llmPromise = getLLMNarrative(
      state.world,
      state.scoutReturnLast,
      fallback,
    );

    // 并行等待 LLM + 最短展示时间 2.4s
    Promise.all([
      llmPromise,
      new Promise((r) => setTimeout(r, 2400)),
    ])
      .then(([narrative]) => {
        if (abort.signal.aborted) return;
        setLlmPingStatus("ok");
        dispatch({ type: "SET_NARRATIVE", narrative });
        setLlmNarrativeReady(true);
      })
      .catch(() => {
        if (abort.signal.aborted) return;
        setLlmPingStatus("fail");
        setLlmNarrativeReady(true);
      });

    return () => {
      abort.abort();
    };
  }, [state.phase, state.world.era.id]);

  // ── ending / game_over 阶段：触发 LLM 千年史生成 ────────
  useEffect(() => {
    if (!state.endingPending) return;

    if (endingFiredRef.current) return;
    endingFiredRef.current = true;

    const abort = new AbortController();
    abortRef.current = abort;

    buildLLMEnding(state.world, state.history)
      .then((ending) => {
        if (abort.signal.aborted) return;
        dispatch({ type: "SET_ENDING", ending });
      })
      .catch(() => {
        if (abort.signal.aborted) return;
        if (state.ending) {
          dispatch({ type: "SET_ENDING", ending: state.ending });
        }
      });

    return () => {
      abort.abort();
    };
  }, [state.endingPending]);

  // ── 重置 ref 标志（RESET 后） ────────────────────────────
  useEffect(() => {
    if (state.phase === "intro") {
      narrativeFiredRef.current = false;
      endingFiredRef.current = false;
      setLlmPingStatus("pending");
      setLlmNarrativeReady(false);
    }
  }, [state.phase]);

  // ── 叙述（决策阶段显示上一轮叙述，首轮显示时代介绍） ────
  const narrative = useMemo(() => {
    if (state.latestNarrative.length > 0) return state.latestNarrative;
    return [
      {
        title: state.world.era.name,
        text: `冷冻舱缓缓开启，你望向这片陌生的大地。${state.world.era.description}`,
      },
    ];
  }, [state.latestNarrative, state.world.era, state.world.frozenPop]);

  const handleContinue = useCallback(() => {
    dispatch({
      type: "CONTINUE",
      decision: { settleAll: false, sleepingYears, sendScout },
    });
  }, [sleepingYears, sendScout]);

  const sleepsRemaining = Math.max(0, MAX_SLEEPS - state.sleepCount);
  const sleepsExhausted = sleepsRemaining <= 0;

  // ── 渲染各阶段 ───────────────────────────────────────────
  if (state.phase === "intro") {
    return (
      <main className="intro-layout">
        <h1 className="intro-title">时间移民</h1>
        <p className="intro-subtitle">TimeMigration</p>
        <p className="intro-desc">
          你携带十二万冷冻人口，在未来不同时代间跳跃迁移。<br />
          每次苏醒只有 60 秒做出决策：继续沉睡，还是扎根此地？<br />
          叙述者不一定可靠——学会甄别，才能为文明找到栖身之所。
        </p>
        <button className="primary intro-btn" onClick={() => dispatch({ type: "START" })}>
          开始移民
        </button>
      </main>
    );
  }

  if (state.phase === "sleep") {
    return (
      <SleepTransition
        message={state.sleepMessage}
        llmStatus={llmPingStatus}
        narrativeReady={llmNarrativeReady}
        onAwaken={() => dispatch({ type: "BACK_TO_DECISION" })}
      />
    );
  }

  if (state.phase === "game_over") {
    const failEnding = state.ending ?? {
      outcome: "failure" as const,
      title: `${state.world.era.name}——政变爆发`,
      text: "民心归零，移民内部的信任彻底崩溃。这次迁移没有到达终点，但留下了不会被遗忘的痕迹。",
      timeline: [
        `· 信任崩溃，政变终结了这次旅程`,
        `· 幸存者散落于荒野，再无统一意志`,
      ],
    };
    return (
      <EndScreen
        ending={failEnding}
        loading={state.endingPending}
        onReset={() => dispatch({ type: "RESET" })}
      />
    );
  }

  if (state.phase === "ending" && state.ending) {
    return (
      <EndScreen
        ending={state.ending}
        loading={state.endingPending}
        onReset={() => dispatch({ type: "RESET" })}
      />
    );
  }

  // decision 阶段
  return (
    <DecisionScreen
      world={state.world}
      history={state.history}
      narrative={narrative}
      secondsLeft={secondsLeft}
      sleepingYears={sleepingYears}
      setSleepingYears={setSleepingYears}
      sendScout={sendScout}
      setSendScout={setSendScout}
      trustWarning={state.trustWarning}
      sleepsRemaining={sleepsRemaining}
      sleepsExhausted={sleepsExhausted}
      onSettleAll={() => dispatch({ type: "SETTLE_ALL" })}
      onContinue={handleContinue}
    />
  );
}