import { useEffect, useRef, useState } from "react";

const SLEEP_LINES = [
  "先遣队已出发，载着希望驶入未知的时间长河……",
  "你重新进入深度睡眠，思绪万千，不知再睁眼时世界是何模样……",
  "冷冻舱的低鸣渐渐远去，时间在耳边流逝……",
  "意识慢慢消散，像潮水退去，只剩下无尽的等待……",
];

interface Props {
  /** 当前沉睡的状态消息 */
  message: string;
  /** LLM 连通状态 */
  llmStatus: "pending" | "ok" | "fail";
  /** LLM 叙述是否已就绪 */
  narrativeReady: boolean;
  /** 玩家点击"缓缓苏醒"时调用 */
  onAwaken: () => void;
}

export default function SleepTransition({ message, llmStatus, narrativeReady, onAwaken }: Props) {
  const onAwakenRef = useRef(onAwaken);
  onAwakenRef.current = onAwaken;

  const [buttonVisible, setButtonVisible] = useState(false);

  // 当 narrativeReady 变为 true 时，延迟一小会儿再显示按钮（营造缓缓出现效果）
  useEffect(() => {
    if (!narrativeReady) return;
    const id = window.setTimeout(() => setButtonVisible(true), 600);
    return () => window.clearTimeout(id);
  }, [narrativeReady]);

  // 随机选一条额外氛围文字
  const extra = SLEEP_LINES[Math.floor(Date.now() / 1000) % SLEEP_LINES.length];

  const llmLabel: Record<typeof llmStatus, string> = {
    pending: "⏳ 正在连接叙述者…",
    ok: "✅ 已连接叙述者",
    fail: "⚠ 叙述者连接失败，使用本地记录",
  };

  return (
    <div className="sleep-overlay">
      <div className="sleep-card">
        <div className="sleep-main">{message}</div>
        <div className="sleep-extra">{extra}</div>

        {/* LLM 连通状态 */}
        <div className={`sleep-llm-status sleep-llm--${llmStatus}`}>
          {llmLabel[llmStatus]}
        </div>

        {/* 缓缓苏醒按钮（淡入） */}
        <div className={`sleep-awaken-btn-wrap${buttonVisible ? " sleep-awaken-btn-wrap--show" : ""}`}>
          <button
            className="primary awaken-btn"
            onClick={() => onAwakenRef.current()}
          >
            缓缓苏醒
          </button>
        </div>
      </div>
    </div>
  );
}