"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface TypewriterProps {
  /** The text that gets typed out, character by character. */
  text: string;
  /** Milliseconds between characters. */
  speed?: number;
  /** Pause before the first character appears. */
  startDelay?: number;
  /** Optional pause (ms) before the text erases itself and types again. */
  loopPause?: number;
  className?: string;
  cursorClassName?: string;
  showCursor?: boolean;
  /** Reserves the full sentence's space so nothing jumps while typing. */
  reserveSpace?: boolean;
  onDone?: () => void;
}

/**
 * A soft, friendly typewriter effect.
 *
 * The animated text is hidden from assistive tech (`aria-hidden`) while the
 * full sentence is exposed through a visually hidden sibling, so screen
 * readers never have to listen to a half-typed sentence.
 */
export default function Typewriter({
  text,
  speed = 38,
  startDelay = 200,
  loopPause,
  className = "",
  cursorClassName = "",
  showCursor = true,
  reserveSpace = false,
  onDone,
}: TypewriterProps) {
  const characters = useMemo(() => Array.from(text), [text]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [currentText, setCurrentText] = useState(text);
  const doneRef = useRef(onDone);

  /* Keep the freshest callback around without writing the ref during render. */
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  /* New sentence? Reset the progress — React's "adjust state on prop change"
     pattern, which is cheaper than resetting inside the typing effect. */
  if (currentText !== text) {
    setCurrentText(text);
    setVisibleCount(0);
    setFinished(false);
  }

  useEffect(() => {
    let timer: number | undefined;
    let cancelled = false;
    let index = 0;

    const typeNext = (): void => {
      if (cancelled) return;
      if (index >= characters.length) {
        setFinished(true);
        doneRef.current?.();
        if (loopPause && loopPause > 0) {
          timer = window.setTimeout(() => {
            if (cancelled) return;
            setFinished(false);
            index = 0;
            setVisibleCount(0);
            timer = window.setTimeout(typeNext, 420);
          }, loopPause);
        }
        return;
      }
      index += 1;
      setVisibleCount(index);
      const char = characters[index - 1];
      const pause = /[.,!?…]/.test(char ?? "") ? speed * 7 : speed;
      timer = window.setTimeout(typeNext, pause);
    };

    timer = window.setTimeout(typeNext, startDelay);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [characters, speed, startDelay, loopPause]);

  const typed = characters.slice(0, visibleCount).join("");
  const stillTyping = !finished && visibleCount < characters.length;

  const cursor = showCursor ? (
    <span
      className={`ml-1 inline-block w-[0.5ch] rounded-full bg-current align-baseline ${
        stillTyping ? "animate-pulse" : "opacity-40"
      } ${cursorClassName}`}
      aria-hidden="true"
    >
      &#8203;
    </span>
  ) : null;

  if (reserveSpace) {
    return (
      <span className={`relative block ${className}`}>
        {/* invisible full sentence keeps the exact final height */}
        <span className="invisible" aria-hidden="true">
          {text}
        </span>
        <span className="absolute inset-0" aria-hidden="true">
          {typed}
          {cursor}
        </span>
        <span className="sr-only">{text}</span>
      </span>
    );
  }

  return (
    <span className={className}>
      <span aria-hidden="true">
        {typed}
        {cursor}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
