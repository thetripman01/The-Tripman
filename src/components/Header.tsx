"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const scrollToPackages = () => {
    const el = document.getElementById("become-passenger");
    if (el) el.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden ${
                isScrolled
                  ? "bg-cyan-600 shadow-lg"
                  : "bg-white/10 backdrop-blur-sm border border-white/20"
              }`}
            >
              <Image
                src="/tripman-main.jpg"
                alt="The Tripman"
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <span
              className={`text-lg md:text-xl font-bold transition-colors duration-300 ${isScrolled ? "text-gray-900" : "text-white"}`}
            >
              The Tripman
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection("about")}
              className={`font-medium transition-colors duration-200 ${
                isScrolled
                  ? "text-gray-700 hover:text-cyan-600"
                  : "text-white/90 hover:text-white"
              }`}
            >
              About
            </button>
            <button
              onClick={() => scrollToSection("become-passenger")}
              className={`font-medium transition-colors duration-200 ${
                isScrolled
                  ? "text-gray-700 hover:text-cyan-600"
                  : "text-white/90 hover:text-white"
              }`}
            >
              Become a Passenger
            </button>
            <button
              onClick={() => scrollToSection("faq")}
              className={`font-medium transition-colors duration-200 ${
                isScrolled
                  ? "text-gray-700 hover:text-cyan-600"
                  : "text-white/90 hover:text-white"
              }`}
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className={`font-medium transition-colors duration-200 ${
                isScrolled
                  ? "text-gray-700 hover:text-cyan-600"
                  : "text-white/90 hover:text-white"
              }`}
            >
              Contact
            </button>
            <Button
              onClick={scrollToPackages}
              className={`${
                isScrolled
                  ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-lg rounded-xl"
                  : "bg-white text-cyan-700 hover:bg-cyan-50 shadow-lg rounded-xl"
              } font-semibold transition-all duration-300 hover:scale-[1.02]`}
            >
              Book Now
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`md:hidden p-2 rounded-lg ${
              isScrolled ? "text-gray-700" : "text-white"
            }`}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-md rounded-lg shadow-lg mt-2 mb-4">
            <nav className="flex flex-col space-y-2 p-4">
              <button
                onClick={() => scrollToSection("about")}
                className="text-left px-4 py-2 text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors duration-200"
              >
                About
              </button>
              <button
                onClick={() => scrollToSection("become-passenger")}
                className="text-left px-4 py-2 text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors duration-200"
              >
                Become a Passenger
              </button>
              <button
                onClick={() => scrollToSection("faq")}
                className="text-left px-4 py-2 text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors duration-200"
              >
                FAQ
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="text-left px-4 py-2 text-gray-700 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors duration-200"
              >
                Contact
              </button>
              <Button
                onClick={scrollToPackages}
                className="bg-cyan-600 text-white hover:bg-cyan-700 font-semibold mt-2 rounded-xl"
              >
                Book Now
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
