import { Car, Mail, Phone, MapPin, Facebook, Instagram, Twitter } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
                             <h3 className="text-xl font-bold">The Tripman</h3>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Premium transportation and experience services. From birthday surprises to airport pickups, 
              we make every journey special and memorable.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Our Services</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a href="#events" className="hover:text-white transition-colors">
                  Birthday Uber Ride
                </a>
              </li>
              <li>
                <a href="#events" className="hover:text-white transition-colors">
                  Airport Pick-Up
                </a>
              </li>
              <li>
                <a href="#events" className="hover:text-white transition-colors">
                  City Night Tour
                </a>
              </li>
              <li>
                <a href="#events" className="hover:text-white transition-colors">
                  Surprise Date Ride
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Info</h4>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-green-400" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-green-400" />
                <span>hello@tripmansite.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-green-400" />
                <span>Toronto, ON, Canada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} The Tripman. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
              <a href="/admin" className="text-gray-400 hover:text-white text-sm transition-colors">
                Admin
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
