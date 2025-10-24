'use client'

import { Phone, MessageCircle, Calendar, ArrowRight } from 'lucide-react'

export function CTA() {
  const scrollToEvents = () => {
    const eventsSection = document.getElementById('events')
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-green-600 via-emerald-700 to-teal-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-32 w-16 h-16 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <div className="mb-12">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience Premium Transportation?
          </h2>
          <p className="text-xl text-green-100 max-w-3xl mx-auto leading-relaxed">
            Don't wait! Book your ride now and discover why thousands of customers choose The Tripman 
            for their transportation needs. Experience the difference today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Easy Booking</h3>
            <p className="text-green-100">
              Simple and fast booking process. Get your ride confirmed instantly.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">24/7 Support</h3>
            <p className="text-green-100">
              Round-the-clock customer support. We're here whenever you need us.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">Real-time Updates</h3>
            <p className="text-green-100">
              Track your ride in real-time. Know exactly when we'll arrive.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={scrollToEvents}
            className="bg-white text-green-700 hover:bg-green-50 px-8 py-4 rounded-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group"
          >
            Book Your Ride Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
          
          <a
            href="tel:+1234567890"
            className="border-2 border-white text-white hover:bg-white hover:text-green-700 px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center gap-2 group"
          >
            <Phone className="w-5 h-5" />
            Call Now
          </a>
        </div>

        <div className="mt-12">
          <p className="text-green-200 text-sm">
            ⭐ Trusted by 5000+ customers • 5.0★ rating • 24/7 availability
          </p>
        </div>
      </div>
    </section>
  )
}
