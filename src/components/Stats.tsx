'use client'

import { useEffect, useState } from 'react'
import { Car, Users, Star, Award } from 'lucide-react'

interface Stat {
  id: number
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  suffix?: string
  prefix?: string
}

const stats: Stat[] = [
  {
    id: 1,
    icon: Car,
    value: 50,
    label: "Luxury Vehicles",
    suffix: "+"
  },
  {
    id: 2,
    icon: Users,
    value: 5000,
    label: "Happy Customers",
    suffix: "+"
  },
  {
    id: 3,
    icon: Star,
    value: 5,
    label: "Star Rating",
    suffix: "/5"
  },
  {
    id: 4,
    icon: Award,
    value: 10,
    label: "Years of Excellence",
    suffix: "+"
  }
]

export function Stats() {
  const [animatedStats, setAnimatedStats] = useState<number[]>(new Array(stats.length).fill(0))
  const [hasAnimated, setHasAnimated] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true)
            animateStats()
          }
        })
      },
      { threshold: 0.5 }
    )

    const element = document.getElementById('stats-section')
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [hasAnimated])

  const animateStats = () => {
    stats.forEach((stat, index) => {
      const duration = 2000 // 2 seconds
      const steps = 60
      const increment = stat.value / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= stat.value) {
          current = stat.value
          clearInterval(timer)
        }

        setAnimatedStats(prev => {
          const newStats = [...prev]
          newStats[index] = Math.floor(current)
          return newStats
        })
      }, duration / steps)
    })
  }

  return (
    <section id="stats-section" className="py-16 px-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-pulse"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-white rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-white rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={stat.id} className="text-center text-white animate-slide-up" style={{ animationDelay: `${index * 0.2}s` }}>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20 shadow-lg">
                <stat.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl md:text-4xl font-bold mb-2">
                {stat.prefix || ''}{animatedStats[index]}{stat.suffix || ''}
              </div>
                             <div className="text-green-100 font-medium">
                 {stat.label}
               </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-10 max-w-4xl mx-auto border border-white/20 shadow-2xl animate-scale-in">
            <h3 className="text-2xl font-bold text-white mb-4">
              Trusted by Thousands
            </h3>
                         <p className="text-green-100 text-lg leading-relaxed">
               Join thousands of satisfied customers who choose The Tripman for their transportation needs. 
               Our commitment to excellence has made us the preferred choice for premium transportation services.
             </p>
          </div>
        </div>
      </div>
    </section>
  )
}
