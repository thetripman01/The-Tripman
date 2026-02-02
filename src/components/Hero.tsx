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
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 text-white overflow-hidden pt-20">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full animate-pulse"></div>
        <div
          className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-32 left-32 w-16 h-16 bg-white rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full animate-pulse"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Logo/Brand */}
        <div className="mb-8 md:mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-sm rounded-full mb-6 md:mb-8 border border-white/20 shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
            <Image
              src="/tripman-main.jpg"
              alt="The Tripman"
              width={96}
              height={96}
              className="w-full h-full object-cover rounded-full"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent leading-tight">
            The Tripman Experience
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-green-100 mb-6 md:mb-8 font-light px-4 max-w-3xl mx-auto">
            Ever watched a Tripman video and thought, &quot;Damn… I wish that
            was me&quot;?
          </p>
        </div>

        {/* Value Proposition */}
        <div
          className="mb-10 md:mb-16 animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          <p className="text-base sm:text-lg md:text-xl text-green-100 mb-4 md:mb-6 max-w-3xl mx-auto leading-relaxed px-4">
            Now it can be.
          </p>
          <p className="text-base sm:text-lg md:text-xl text-green-100 mb-4 md:mb-6 max-w-3xl mx-auto leading-relaxed px-4">
            Join the ride. Feel the chaos. Live the moment.
          </p>
          <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            Whether it&apos;s a girl&apos;s night out, a hangout with the boyz,
            or you&apos;re just riding solo — you can now experience what
            it&apos;s really like to be a Tripman passenger. And trust millions
            of people that watched The Tripman videos… it&apos;s unforgettable.
          </p>

          {/* Quick hooks (truthful + Tripman-specific) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-green-100" />
              <span className="text-green-100 font-semibold text-sm md:text-base">
                60-minute ride
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Users className="w-5 h-5 md:w-6 md:h-6 text-green-100" />
              <span className="text-green-100 font-semibold text-sm md:text-base">
                1–7 people
              </span>
            </div>
            <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <Music className="w-5 h-5 md:w-6 md:h-6 text-green-100" />
              <span className="text-green-100 font-semibold text-sm md:text-base">
                You pick the songs
              </span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={scrollToPackages}
          size="lg"
          className="bg-white text-green-600 hover:bg-green-50 text-base md:text-lg px-8 md:px-10 py-4 md:py-5 h-auto font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 rounded-2xl animate-fade-in w-full sm:w-auto"
          style={{ animationDelay: "0.6s" }}
        >
          Become a Passenger
        </Button>

        {/* “How it works” micro-steps */}
        <div
          className="mt-8 md:mt-12 animate-fade-in"
          style={{ animationDelay: "0.9s" }}
        >
          <div className="flex flex-col sm:flex-row justify-center items-stretch gap-3 md:gap-4 text-green-100 max-w-3xl mx-auto">
            <div className="flex-1 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/20">
              <div className="text-xs uppercase tracking-wide opacity-80">
                Step 1
              </div>
              <div className="font-semibold">Choose a package</div>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/20">
              <div className="text-xs uppercase tracking-wide opacity-80">
                Step 2
              </div>
              <div className="font-semibold">Pick a date & time</div>
            </div>
            <div className="flex-1 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/20">
              <div className="text-xs uppercase tracking-wide opacity-80">
                Step 3
              </div>
              <div className="font-semibold">Hop in & vibe</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-2 bg-white/60 rounded-full mt-1.5 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}
