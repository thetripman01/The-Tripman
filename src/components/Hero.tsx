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
      className="relative min-h-screen flex flex-col lg:flex-row items-stretch overflow-hidden pt-20"
      aria-label="Hero section"
    >
      {/* Left: Tour poster. The poster is a 1:1 square with text near the
          edges, so it must never be cropped: below lg the container is an
          exact square (poster covers it fully), on lg+ the column
          stretches to the section height (ratio varies ~0.75–1.15 by
          screen) and the poster is object-contained over a blurred,
          zoomed copy of itself — gaps fill with matching imagery
          instead of black bars. Same src/sizes/quality on both images
          so the browser downloads the optimized file only once. */}
      <div className="relative w-full lg:w-1/2 aspect-square lg:aspect-auto lg:min-h-0 shrink-0 overflow-hidden">
        <Image
          src="/tripman-europe-tour.jpg"
          alt=""
          aria-hidden
          fill
          className="object-cover object-center scale-110 blur-lg brightness-75"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          quality={90}
        />
        <Image
          src="/tripman-europe-tour.jpg"
          alt="The Tripman Europe Tour — Brussels, Strasbourg, Zürich, Milano, Munich, Prague, Berlin, Cologne & Amsterdam. Tour dates and booking at trvoo.com"
          fill
          className="object-contain object-center"
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          quality={90}
        />
      </div>

      {/* Right: Text panel with solid background */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-cyan-50 to-white px-6 py-12 md:px-12 md:py-16">
        <div className="text-left max-w-xl w-full">
          {/* Logo/Brand */}
          <div className="mb-8 md:mb-10 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-cyan-100 rounded-full mb-6 overflow-hidden group hover:scale-105 transition-transform duration-300 ring-2 ring-cyan-200 shadow-lg">
              <Image
                src="/tripman-main.jpg"
                alt="The Tripman"
                width={96}
                height={96}
                className="w-full h-full object-cover"
                quality={90}
              />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 text-gray-900 leading-tight">
              The Tripman Experience
            </h1>
            <p className="text-base sm:text-lg text-cyan-700 mb-4 font-medium">
              Your journey. Your way.
            </p>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 font-light">
              Ever watched a Tripman video and thought, &quot;Damn… I wish that
              was me&quot;? Now it can be.
            </p>
          </div>

          {/* Quick hooks */}
          <div
            className="mb-10 md:mb-12 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            <ul
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 list-none m-0 p-0"
              aria-label="Quick facts"
            >
              <li className="flex items-center gap-2 bg-white rounded-xl p-3 border border-cyan-100 shadow-sm">
                <Clock className="w-5 h-5 text-cyan-600 shrink-0" aria-hidden />
                <span className="text-gray-800 font-semibold text-sm">
                  60-minute ride
                </span>
              </li>
              <li className="flex items-center gap-2 bg-white rounded-xl p-3 border border-cyan-100 shadow-sm">
                <Users className="w-5 h-5 text-cyan-600 shrink-0" aria-hidden />
                <span className="text-gray-800 font-semibold text-sm">
                  1–4 people
                </span>
              </li>
              <li className="flex items-center gap-2 bg-white rounded-xl p-3 border border-cyan-100 shadow-sm">
                <Music className="w-5 h-5 text-cyan-600 shrink-0" aria-hidden />
                <span className="text-gray-800 font-semibold text-sm">
                  You pick the songs
                </span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <Button
            onClick={scrollToPackages}
            size="lg"
            className="bg-cyan-600 text-white hover:bg-cyan-700 text-base md:text-lg px-8 md:px-10 py-4 md:py-5 h-auto font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl animate-fade-in w-full sm:w-auto"
            style={{ animationDelay: "0.4s" }}
            aria-label="Become a passenger - scroll to packages"
          >
            Become a Passenger
          </Button>

          {/* How it works */}
          <ol
            className="mt-8 animate-fade-in flex flex-col sm:flex-row gap-3 list-none m-0 p-0"
            style={{ animationDelay: "0.6s" }}
            aria-label="How to book"
          >
            <li className="flex-1 bg-white px-4 py-3 rounded-xl border border-cyan-100 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-cyan-600 font-medium">
                Step 1
              </div>
              <div className="font-semibold text-gray-900">
                Choose a package
              </div>
            </li>
            <li className="flex-1 bg-white px-4 py-3 rounded-xl border border-cyan-100 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-cyan-600 font-medium">
                Step 2
              </div>
              <div className="font-semibold text-gray-900">
                Pick a date & time
              </div>
            </li>
            <li className="flex-1 bg-white px-4 py-3 rounded-xl border border-cyan-100 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-cyan-600 font-medium">
                Step 3
              </div>
              <div className="font-semibold text-gray-900">Hop in & vibe</div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
