import {
  Car,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Music,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

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
              Join the ride. Feel the chaos. Live the moment.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/thetripman_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/thetripman_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@thetripman_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <Music className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@thetripman_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/thetripman_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Packages */}
          <div>
            <h4 className="font-semibold mb-4">Packages</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <a
                  href="#events"
                  className="hover:text-white transition-colors"
                >
                  The Tripman Experience
                </a>
              </li>
              <li>
                <a
                  href="#events"
                  className="hover:text-white transition-colors"
                >
                  The Tripman Experience +
                </a>
              </li>
              <li>
                <a
                  href="#events"
                  className="hover:text-white transition-colors"
                >
                  The Tripman Promo Ride
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
                <span>Available soon</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-green-400" />
                <span>thetripman01@gmail.com</span>
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
              <a
                href="/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="/admin"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Admin
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
