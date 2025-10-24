'use client'

import { Button } from '@/components/ui/button'
import { Car, Star, Clock, MapPin } from 'lucide-react'

export function Hero() {
  const scrollToEvents = () => {
    const eventsSection = document.getElementById('events')
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
         <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 text-white overflow-hidden pt-20">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-32 w-16 h-16 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10"></div>

             <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
         {/* Logo/Brand */}
         <div className="mb-8 md:mb-12 animate-fade-in">
                       <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-white/10 backdrop-blur-sm rounded-full mb-6 md:mb-8 border border-white/20 shadow-2xl overflow-hidden group hover:scale-105 transition-transform duration-300">
                           <img 
                src="/tripman-logo.jpg" 
                alt="The Tripman - Professional Driver" 
                className="w-full h-full object-cover rounded-full"
              />
             <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
           </div>
                                                         <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent leading-tight">
              The Tripman
            </h1>
                       <p className="text-lg sm:text-xl md:text-2xl text-green-100 mb-6 md:mb-8 font-light px-4 max-w-3xl mx-auto">
             Premium Transportation & Experience Services
           </p>
         </div>

                 {/* Value Proposition */}
         <div className="mb-10 md:mb-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                                             <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
             From birthday surprises to airport pickups, we make every journey special. 
             Book your premium ride experience today and let us handle the rest.
           </p>
           
           {/* Features */}
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                           <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                 <Star className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" />
                 <span className="text-green-100 font-semibold text-sm md:text-base">Premium Service</span>
               </div>
               <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                 <Clock className="w-5 h-5 md:w-6 md:h-6 text-green-200" />
                 <span className="text-green-100 font-semibold text-sm md:text-base">On-Time Guarantee</span>
               </div>
               <div className="flex items-center justify-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
                 <MapPin className="w-5 h-5 md:w-6 md:h-6 text-green-200" />
                 <span className="text-green-100 font-semibold text-sm md:text-base">Citywide Coverage</span>
               </div>
            </div>
         </div>

                 {/* CTA Button */}
                                     <Button 
           onClick={scrollToEvents}
           size="lg" 
           className="bg-white text-green-600 hover:bg-green-50 text-base md:text-lg px-8 md:px-10 py-4 md:py-5 h-auto font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 rounded-2xl animate-fade-in w-full sm:w-auto"
           style={{ animationDelay: '0.6s' }}
         >
           Book Your Ride Now
         </Button>

                   {/* Trust Indicators */}
                   <div className="mt-8 md:mt-12 animate-fade-in" style={{ animationDelay: '0.9s' }}>
           <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 text-green-100">
             <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-3 md:px-5 py-2 md:py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
               <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse"></div>
               <span className="text-sm md:text-base font-semibold">24/7 Service</span>
             </div>
             <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-3 md:px-5 py-2 md:py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
               <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
               <span className="text-sm md:text-base font-semibold">Luxury Vehicles</span>
             </div>
             <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-3 md:px-5 py-2 md:py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
               <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
               <span className="text-sm md:text-base font-semibold">Professional Drivers</span>
             </div>
             <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-3 md:px-5 py-2 md:py-3 rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
               <div className="w-2 h-2 md:w-3 md:h-3 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
               <span className="text-sm md:text-base font-semibold">5-Star Rated</span>
             </div>
           </div>
           <p className="text-xs md:text-sm opacity-90 mt-4 md:mt-6 text-green-200 px-4">
             Trusted by 5000+ customers • 5.0★ rating • 24/7 support
           </p>
         </div>
      </div>

             {/* Scroll Indicator */}
       <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 animate-bounce">
         <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center">
           <div className="w-1 h-2 bg-white/60 rounded-full mt-1.5 animate-pulse"></div>
         </div>
       </div>
    </section>
  )
}
