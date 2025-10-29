'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Car, Users, Calendar, MapPin, Clock, Shield } from 'lucide-react'

interface Service {
  id: number
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  features: string[]
  price?: string
}

const services: Service[] = [
  {
    id: 1,
    title: "Airport Transfers",
    description: "Reliable airport pickup and drop-off services with flight monitoring",
    icon: Car,
    features: [
      "Flight monitoring",
      "Meet & greet service",
      "Luggage assistance",
      "Fixed pricing",
      "24/7 availability"
    ],
    price: "From $50"
  },
  {
    id: 2,
    title: "Corporate Events",
    description: "Professional transportation for business meetings and corporate events",
    icon: Users,
    features: [
      "Executive vehicles",
      "Professional drivers",
      "Flexible scheduling",
      "Corporate billing",
      "Multi-vehicle coordination"
    ],
    price: "From $80"
  },
  {
    id: 3,
    title: "Wedding Transportation",
    description: "Make your special day perfect with our luxury wedding transportation",
    icon: Calendar,
    features: [
      "Luxury vehicles",
      "Wedding coordination",
      "Bridal party transport",
      "Decoration included",
      "Photography friendly"
    ],
    price: "From $120"
  },
  {
    id: 4,
    title: "City Tours",
    description: "Explore the city with our knowledgeable local drivers",
    icon: MapPin,
    features: [
      "Local expertise",
      "Customized routes",
      "Historical insights",
      "Photo stops",
      "Flexible duration"
    ],
    price: "From $60"
  },
  {
    id: 5,
    title: "Hourly Service",
    description: "Flexible hourly transportation for any occasion",
    icon: Clock,
    features: [
      "Minimum 2 hours",
      "Multiple stops",
      "Wait time included",
      "Professional service",
      "Real-time tracking"
    ],
    price: "From $40/hour"
  },
  {
    id: 6,
    title: "VIP Transportation",
    description: "Premium service for high-profile clients and special occasions",
    icon: Shield,
    features: [
      "Luxury vehicles",
      "Experienced drivers",
      "Discretion guaranteed",
      "Priority booking",
      "Personalized service"
    ],
    price: "From $150"
  }
]

export function Services() {
  return (
         <section className="py-24 px-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
       <div className="max-w-7xl mx-auto">
                                     <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-6 animate-scale-in overflow-hidden">
              <img 
                src="/tripman-logo.jpg" 
                alt="The Tripman" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-slide-up">
              Our Premium Services
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto animate-slide-up leading-relaxed" style={{ animationDelay: '0.2s' }}>
              From airport transfers to luxury events, we provide comprehensive transportation solutions 
              tailored to your specific needs. Experience excellence in every journey.
            </p>
          </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
           {services.map((service, index) => (
             <Card key={service.id} className="h-full shadow-xl hover:shadow-2xl transition-all duration-500 border-0 bg-white/90 backdrop-blur-sm hover:bg-white group animate-slide-up rounded-2xl" style={{ animationDelay: `${index * 0.1}s` }}>
               <CardHeader className="text-center pb-6 pt-8">
                                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <service.icon className="w-10 h-10 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {service.title}
                  </CardTitle>
                  {service.price && (
                    <p className="text-green-600 font-bold text-xl">
                      {service.price}
                    </p>
                  )}
               </CardHeader>
                             <CardContent className="pt-0 px-8 pb-8">
                 <p className="text-gray-600 mb-8 text-center text-lg leading-relaxed">
                   {service.description}
                 </p>
                 
                                  <ul className="space-y-4 mb-8">
                   {service.features.map((feature, index) => (
                     <li key={index} className="flex items-start">
                       <div className="w-3 h-3 bg-green-500 rounded-full mt-2 mr-4 flex-shrink-0"></div>
                       <span className="text-gray-700 text-base">{feature}</span>
                     </li>
                   ))}
                 </ul>
                 
                  <div className="pt-6 border-t border-gray-200">
                   <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 px-6 rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 text-lg">
                     Book Now
                   </button>
                 </div>
               </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-2xl max-w-4xl mx-auto border border-white/20 animate-scale-in">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Custom Transportation Solutions
            </h3>
            <p className="text-gray-600 mb-8">
              Don&apos;t see exactly what you need? We specialize in creating custom transportation solutions 
              for unique requirements. Contact us to discuss your specific needs.
            </p>
                         <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <button className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105">
                 Get Custom Quote
               </button>
               <button className="border-2 border-green-500 text-green-600 px-8 py-4 rounded-xl hover:bg-green-50 transition-all duration-300 font-semibold transform hover:scale-105">
                 Contact Us
               </button>
             </div>
          </div>
        </div>
      </div>
    </section>
  )
}
