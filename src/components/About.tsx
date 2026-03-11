"use client";

import Image from "next/image";

export function About() {
  return (
    <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Meet The Tripman
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Every trip becomes a viral karaoke night. Party lights, goofy
            glasses, unforgettable vibes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* TripMan Photo */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
              <Image
                src="/tripman-meet.jpg"
                alt="The Tripman"
                width={600}
                height={400}
                className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-10">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">
                How It ALLLLLL Started
              </h3>
              <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                In a galaxy far far away… there was a man who loved connecting
                with random strangers through karaoke, Latin dances, and the
                kind of conversations you remember forever. He loved it so much
                that a spark lit inside him. A spark that said{" "}
                <strong>
                  &quot;These moments are meant to be shared!&quot;
                </strong>
              </p>
              <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                So he found the easiest way to bring people into his world —{" "}
                <strong>rideshare apps</strong>. He started surprising
                passengers with party lights, karaoke mics, and unexpected vibes
                that turned regular rides into little pieces of magic.
              </p>
              <p className="text-gray-600 leading-relaxed text-lg">
                Then he posted one video. Just one.{" "}
                <strong>The very first Instagram clip went viral</strong> — and
                everything changed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
