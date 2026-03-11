"use client";

import { useEffect, useState } from "react";

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-gradient-to-b from-cyan-600 via-cyan-500 to-cyan-400">
      <div className="text-center text-white">
        {/* Stylized T logo (no circular image) */}
        <div className="mb-8 flex justify-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 512 512"
            className="animate-pulse"
            aria-hidden
          >
            <path
              d="M140 150 H372 L340 190 H290 V360 L256 400 L222 360 V190 H172 Z"
              fill="white"
            />
          </svg>
        </div>

        <h1 className="text-4xl font-bold mb-3 text-white">The Tripman</h1>
        <p className="text-white/90 mb-8 font-light">Your journey. Your way.</p>

        <div className="flex justify-center space-x-3">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>

        <p className="text-sm text-white/80 mt-8">
          Loading your premium experience...
        </p>
      </div>
    </div>
  );
}
