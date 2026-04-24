"use client";

import { useEffect, useState } from "react";

type Props = {
  end: number;
  suffix?: string;
  decimals?: number;
};

export default function AnimatedCounter({
  end,
  suffix = "",
  decimals = 0,
}: Props) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;

      if (start >= end) {
        setCount(end);
        setDone(true);
        clearInterval(timer);

        setTimeout(() => {
          setDone(false);
        }, 500);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end]);

  return (
    <span
      className={`inline-block transition-all duration-300 ${
        done ? "scale-125 text-white drop-shadow-[0_0_18px_rgba(149,174,193,0.9)]" : "scale-100"
      }`}
    >
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}