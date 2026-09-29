import { useEffect, useRef, useState } from "react";

/**
 * Запускает run() один раз и анимирует прогресс: до 95% пока запрос идёт,
 * 100% — когда он завершился и прошло не меньше minDuration.
 */
export const useProcess = (run, { minDuration = 2500, onDone } = {}) => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const taskRef = useRef(null);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!taskRef.current) taskRef.current = Promise.resolve().then(run);
    let active = true;
    let finished = false;
    let result;
    let raf = 0;
    const startedAt = performance.now();

    taskRef.current.then(
      (r) => {
        result = r;
        finished = true;
      },
      (e) => {
        if (!active) return;
        cancelAnimationFrame(raf);
        setError(e);
      },
    );

    const tick = (t) => {
      const p = Math.min((t - startedAt) / minDuration, finished ? 1 : 0.95);
      setProgress(p * 100);
      if (finished && p >= 1) {
        doneRef.current?.(result);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      active = false;
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, minDuration]);

  const retry = () => {
    taskRef.current = null;
    setError(null);
    setProgress(0);
    setAttempt((a) => a + 1);
  };

  return { progress, error, retry };
};
