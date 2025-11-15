'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Music, Video, TrendingUp, Mail } from 'lucide-react'

export function BecomePassenger() {
  const scrollToEvents = () => {
    const eventsSection = document.getElementById('events')
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="py-24 px-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Become a Passenger
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
            You&apos;ve seen the videos. You&apos;ve watched strangers turn into performers, hype machines, best friends, and sometimes therapy clients in the backseat.
          </p>
          <p className="text-xl font-bold text-gray-900 mb-4">
            Now it&apos;s your turn.
          </p>
          <p className="text-xl font-bold text-green-600">
            The Choice Is Yours!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* The Tripman Experience */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-6">
                <Music className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                The Tripman Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-8 pb-8">
              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">•</span>
                  <span className="text-gray-600">One full hour of pure chaos, music, and unforgettable energy.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">•</span>
                  <span className="text-gray-600">Choose your song, bring your people, set your vibe.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">•</span>
                  <span className="text-gray-600">Pick-up and drop-off at the same location (so you can party without the stress).</span>
                </li>
              </ul>
              <p className="text-sm text-gray-500 mb-6 text-center italic border-t pt-4">
                No promises your video will be posted — we only post what genuinely hits. If the vibe is fire, it might just make the feed.
              </p>
              <div className="space-y-3 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">1-4 People: $200</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">4-7 People: $400</p>
                </div>
              </div>
              <Button 
                onClick={scrollToEvents}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Book Now
              </Button>
            </CardContent>
          </Card>

          {/* The Tripman Experience + */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white border-2 border-green-500">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-6">
                <Video className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                The Tripman Experience +
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-8 pb-8">
              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">•</span>
                  <span className="text-gray-600">Everything included in The Tripman Experience.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">•</span>
                  <span className="text-gray-600">Full recording of your entire ride — every laugh, every song, every moment, saved as a memory you can keep forever.</span>
                </li>
              </ul>
              <p className="text-sm font-semibold text-green-600 mb-6 text-center border-t pt-4">
                Guaranteed feature: Your ride will be polished, edited, and posted on The Tripman accounts.
              </p>
              <div className="space-y-3 mb-6">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">1-4 People: $500</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">4-7 People: $700</p>
                </div>
              </div>
              <Button 
                onClick={scrollToEvents}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Book Now
              </Button>
            </CardContent>
          </Card>

          {/* The Tripman Promo Ride */}
          <Card className="shadow-xl hover:shadow-2xl transition-all duration-300 border-0 bg-white">
            <CardHeader className="text-center pb-6 pt-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-6">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 mb-4">
                The Tripman Promo Ride
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-8 pb-8">
              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">•</span>
                  <span className="text-gray-600">One full hour dedicated to showcasing your business, product, or personal brand in the most unique format online: Tripman Car Karaoke.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">•</span>
                  <span className="text-gray-600">Instant organic reach to millions of viewers across multiple platforms — no paid boosts, no gimmicks.</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2 font-bold">•</span>
                  <span className="text-gray-600">A creative, high-energy environment where your brand becomes part of an unforgettable moment.</span>
                </li>
              </ul>
              <div className="bg-green-50 rounded-lg p-4 mb-6 text-center border-t pt-4">
                <p className="text-sm text-gray-600 mb-2">Prices are determined after a short discovery process conducted by</p>
                <p className="font-bold text-green-600">Afes Digital, The Tripman&apos;s representative agency.</p>
                <p className="text-sm text-gray-600 mt-2">For inquiries: <a href="mailto:media@afesdigital.com" className="text-green-600 hover:underline">media@afesdigital.com</a></p>
              </div>
              <Button 
                onClick={() => window.location.href = 'mailto:media@afesdigital.com'}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Contact for Inquiries
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

