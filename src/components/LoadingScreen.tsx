"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

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
    <div className="fixed inset-0 bg-gradient-to-b from-cyan-600 via-cyan-500 to-cyan-400 z-50 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-8">
            <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center animate-pulse border border-white/20 shadow-2xl overflow-hidden">
              <Image
                src="/tripman-logo.jpg"
                alt="The Tripman"
                width={96}
                height={96}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto">
            <div className="w-full h-full border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
          The Tripman
        </h1>
        <p className="text-cyan-100 mb-8 font-light">Your journey. Your way.</p>

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

        <p className="text-sm text-cyan-200 mt-8">
          Loading your premium experience...
        </p>
      </div>
    </div>
  );
}
