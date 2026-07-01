import Link from "next/link";
import {
  Car,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Music,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const phoneNumber =
    process.env.NEXT_PUBLIC_PHONE_NUMBER || "+1 (647) 459-4188";

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center">
                <Car className="w-5 h-5 text-white" aria-hidden />
              </div>
              <h3 className="text-xl font-bold">The Tripman</h3>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Car karaoke, party lights, unforgettable vibes. Toronto & GTA.
            </p>
            <nav className="flex space-x-4" aria-label="Social media links">
              <a
                href="https://www.facebook.com/profile.php?id=61580181414978"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-400 transition-all duration-200 hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://www.instagram.com/thetripman_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-400 transition-all duration-200 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.tiktok.com/@the.tripman"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-400 transition-all duration-200 hover:scale-110"
                aria-label="TikTok"
              >
                <Music className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@TheTripMan01"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-cyan-400 transition-all duration-200 hover:scale-110"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </nav>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300" role="list">
              <li>
                <a
                  href="#become-passenger"
                  className="hover:text-white transition-colors duration-200 hover:underline"
                >
                  Book a Ride
                </a>
              </li>
              <li>
                <a
                  href="#about"
                  className="hover:text-white transition-colors duration-200 hover:underline"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="hover:text-white transition-colors duration-200 hover:underline"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="hover:text-white transition-colors duration-200 hover:underline"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-cyan-400" aria-hidden />
                {phoneNumber ? (
                  <a
                    href={`tel:${phoneNumber}`}
                    className="hover:text-white transition-colors duration-200 hover:underline"
                  >
                    {phoneNumber}
                  </a>
                ) : (
                  <span>Available soon</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400" aria-hidden />
                <span>thetripman01@gmail.com</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-cyan-400" aria-hidden />
                <span>Toronto, ON, Canada</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              © {currentYear} The Tripman. All rights reserved.
            </p>
            <nav className="flex space-x-6" aria-label="Legal links">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200 hover:underline"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white text-sm transition-colors duration-200 hover:underline"
              >
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
