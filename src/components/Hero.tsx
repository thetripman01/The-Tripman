"use client";

import { Button } from "@/components/ui/button";
import { Clock, Users, Music } from "lucide-react";
import Image from "next/image";

export function Hero() {
  const scrollToPackages = () => {
    const el = document.getElementById("become-passenger");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      aria-label="Hero section"
    >
      {/* Background image - Tripman with Lexus, Hopp-style full-bleed */}
      <div className="absolute inset-0">
        <Image
          src="/tripman-background.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/75"
          aria-hidden
        />
      </div>

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Logo/Brand */}
        <div className="mb-8 md:mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-sm rounded-full mb-6 md:mb-6 border border-white/20 shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-300 focus-within:ring-2 focus-within:ring-white focus-within:ring-offset-2 focus-within:ring-offset-transparent">
            <Image
              src="/tripman-main.jpg"
              alt="The Tripman"
              width={96}
              height={96}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 md:mb-2 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent leading-tight">
            The Tripman Experience
          </h1>
          <p className="text-base sm:text-lg text-cyan-100/90 mb-4 font-medium">
            Your journey. Your way.
          </p>
          <p className="text-lg sm:text-xl md:text-2xl text-cyan-100/95 mb-6 md:mb-6 font-light px-4 max-w-2xl mx-auto">
            Ever watched a Tripman video and thought, &quot;Damn… I wish that
            was me&quot;? Now it can be.
          </p>
        </div>

        {/* Quick hooks - simplified */}
        <div
          className="mb-10 md:mb-12 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          <ul
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8 list-none m-0 p-0"
            aria-label="Quick facts"
          >
            <li className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Clock
                className="w-5 h-5 md:w-6 md:h-6 text-cyan-100"
                aria-hidden
              />
              <span className="text-cyan-100 font-semibold text-sm md:text-base">
                60-minute ride
              </span>
            </li>
            <li className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Users
                className="w-5 h-5 md:w-6 md:h-6 text-cyan-100"
                aria-hidden
              />
              <span className="text-cyan-100 font-semibold text-sm md:text-base">
                1–4 people
              </span>
            </li>
            <li className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Music
                className="w-5 h-5 md:w-6 md:h-6 text-cyan-100"
                aria-hidden
              />
              <span className="text-cyan-100 font-semibold text-sm md:text-base">
                You pick the songs
              </span>
            </li>
          </ul>
        </div>

        {/* CTA Button */}
        <Button
          onClick={scrollToPackages}
          size="lg"
          className="bg-white text-cyan-700 hover:bg-cyan-50 text-base md:text-lg px-8 md:px-10 py-4 md:py-5 h-auto font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] rounded-2xl animate-fade-in w-full sm:w-auto focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
          style={{ animationDelay: "0.4s" }}
          aria-label="Become a passenger - scroll to packages"
        >
          Become a Passenger
        </Button>

        {/* How it works - simplified */}
        <ol
          className="mt-8 md:mt-10 animate-fade-in flex flex-col sm:flex-row justify-center items-stretch gap-3 md:gap-4 text-cyan-100 max-w-3xl mx-auto list-none m-0 p-0"
          style={{ animationDelay: "0.6s" }}
          aria-label="How to book"
        >
          <li className="flex-1 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/20">
            <div className="text-xs uppercase tracking-wide opacity-80">
              Step 1
            </div>
            <div className="font-semibold">Choose a package</div>
          </li>
          <li className="flex-1 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/20">
            <div className="text-xs uppercase tracking-wide opacity-80">
              Step 2
            </div>
            <div className="font-semibold">Pick a date & time</div>
          </li>
          <li className="flex-1 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/20">
            <div className="text-xs uppercase tracking-wide opacity-80">
              Step 3
            </div>
            <div className="font-semibold">Hop in & vibe</div>
          </li>
        </ol>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce"
        aria-hidden
      >
        <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-white/60 rounded-full mt-1.5 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
