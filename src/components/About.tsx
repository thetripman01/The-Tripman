'use client'

// Removed unused Card imports
import { Star, Shield, Clock, MapPin } from 'lucide-react'

export function About() {
  return (
         <section className="py-24 px-4 bg-gradient-to-br from-gray-50 to-white">
       <div className="max-w-7xl mx-auto">
                   <div className="text-center mb-16">
                       <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Meet The Tripman
            </h2>
           <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
             Your trusted partner for premium transportation experiences. 
             Professional, reliable, and committed to making every journey special.
           </p>
         </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
           {/* TripMan Photo */}
           <div className="relative">
             <div className="relative rounded-3xl overflow-hidden shadow-2xl group">
                               <img 
                  src="/tripman-logo.jpg" 
                  alt="The Tripman - Professional Driver" 
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
               <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
             </div>
            
                         {/* Floating Stats */}
             <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
               <div className="flex items-center space-x-3">
                 <Star className="w-6 h-6 text-yellow-400 fill-current" />
                 <span className="font-bold text-gray-900 text-lg">5.0★</span>
                 <span className="text-base text-gray-600">Rating</span>
               </div>
             </div>
          </div>

                     {/* Content */}
           <div className="space-y-10">
             <div>
               <h3 className="text-3xl font-bold text-gray-900 mb-6">
                 Professional Transportation Excellence
               </h3>
                               <p className="text-gray-600 leading-relaxed mb-8 text-lg">
                  With years of experience in premium transportation services, The Tripman 
                  has become the trusted choice for clients who demand excellence. From 
                  airport transfers to special events, we ensure every journey is comfortable, 
                  safe, and memorable.
                </p>
               <p className="text-gray-600 leading-relaxed text-lg">
                 Our modern fleet of vehicles, combined with professional drivers and 
                 personalized service, makes us the preferred transportation partner 
                 for discerning clients across the city.
               </p>
             </div>

                         {/* Features Grid */}
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
               <div className="flex items-start space-x-4">
                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                   <Shield className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-900 mb-2 text-lg">Safety First</h4>
                   <p className="text-base text-gray-600">Fully licensed and insured with background-checked drivers</p>
                 </div>
               </div>

               <div className="flex items-start space-x-4">
                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                   <Clock className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-900 mb-2 text-lg">Punctual Service</h4>
                   <p className="text-base text-gray-600">On-time guarantee with real-time tracking and updates</p>
                 </div>
               </div>

               <div className="flex items-start space-x-4">
                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                   <Star className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-900 mb-2 text-lg">Premium Experience</h4>
                   <p className="text-base text-gray-600">Luxury vehicles with professional amenities and service</p>
                 </div>
               </div>

               <div className="flex items-start space-x-4">
                 <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                   <MapPin className="w-6 h-6 text-green-600" />
                 </div>
                 <div>
                   <h4 className="font-bold text-gray-900 mb-2 text-lg">Citywide Coverage</h4>
                   <p className="text-base text-gray-600">Comprehensive service area with local expertise</p>
                 </div>
               </div>
             </div>

                         {/* CTA */}
             <div className="pt-8">
               <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-10 py-5 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 text-lg">
                 Book Your Ride Today
               </button>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
