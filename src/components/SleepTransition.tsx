import { useEffect, useRef } from "react";

const SLEEP_LINES = [
  "先遣队已出发，载着希望驶入未知的时间长河……",
  "你重新进入深度睡眠，思绪万千，不知再睁眼时世界是何模样……",
  "冷冻舱的低鸣渐渐远去，时间在耳边流逝……",
  "意识慢慢消散，像潮水退去，只剩下无尽的等待……",
];

interface Props {
  /** 当前沉睡的状态消息（来自 gameStore） */
  message: string;
  /**
   * 内容就绪时调用（第一版：固定延迟；未来可传入 LLM Promise）
   * 设计意图：此组件在 onDone 回调触发前保持展示，
   * 可直接把 LLM 请求 Promise 的 resolve 接到 onDone，无需改 UI。
   */
  onDone: () => void;
}

export default function SleepTransition({ message, onDone }: Props) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    // 第一版：固定展示 2.4 秒
    const id = window.setTimeout(() => onDoneRef.current(), 2400);
    return () => window.clearTimeout(id);
  }, []);   // 只在挂载时启动一次

  // 随机选一条额外氛围文字
  const extra = SLEEP_LINES[Math.floor(Date.now() / 1000) % SLEEP_LINES.length];

  return (
    <div className="sleep-overlay">
      <div className="sleep-card">
        <div className="sleep-main">{message}</div>
        <div className="sleep-extra">{extra}</div>
      </div>
    </div>
  );
}
