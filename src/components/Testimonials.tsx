'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Star, Quote } from 'lucide-react'

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  rating: number
  image?: string
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    role: "Business Executive",
          content: "The Tripman provided exceptional service for our corporate event. Professional, punctual, and the vehicles were immaculate. Highly recommended!",
    rating: 5
  },
  {
    id: 2,
    name: "Ayşe Demir",
    role: "Wedding Bride",
          content: "Our wedding day transportation was perfect thanks to The Tripman. They made us feel like royalty and everything went smoothly.",
    rating: 5
  },
  {
    id: 3,
    name: "Mehmet Kaya",
    role: "Tourist",
          content: "Amazing experience exploring the city with The Tripman. Our driver was knowledgeable, friendly, and showed us hidden gems we would have missed.",
    rating: 5
  },
  {
    id: 4,
    name: "Fatma Özkan",
    role: "Event Organizer",
          content: "I've worked with many transportation services, but The Tripman stands out for their reliability and attention to detail. They never disappoint.",
    rating: 5
  }
]

export function Testimonials() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-6">
            <Quote className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our satisfied customers have to say about their experience with The Tripman.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full shadow-lg hover:shadow-xl transition-shadow duration-300 border-0">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <blockquote className="text-gray-700 mb-4 italic">
                  "{testimonial.content}"
                </blockquote>
                
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Join Our Happy Customers
            </h3>
            <p className="text-gray-600 mb-6">
              Experience the difference that professional, reliable transportation makes. 
              Book your ride today and become part of our growing family of satisfied clients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">500+</div>
                <div className="text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">1000+</div>
                <div className="text-gray-600">Successful Rides</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">5.0</div>
                <div className="text-gray-600">Average Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
