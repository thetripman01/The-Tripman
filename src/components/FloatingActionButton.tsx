"use client";

import { useState } from "react";
import { Phone, MessageCircle, X, Car } from "lucide-react";

export function FloatingActionButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE_NUMBER;

  const handleCall = () => {
    if (!phoneNumber) {
      alert("Phone number will be available soon!");
      return;
    }
    window.open(`tel:${phoneNumber}`, "_self");
  };

  const handleWhatsApp = () => {
    if (!whatsappNumber) {
      alert("WhatsApp will be available soon!");
      return;
    }
    const message = encodeURIComponent("Hi! I'd like to book a Tripman ride.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const handleBooking = () => {
    const eventsSection = document.getElementById("events");
    if (eventsSection) {
      eventsSection.scrollIntoView({ behavior: "smooth" });
    }
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      {/* Expanded Menu */}
      {isExpanded && (
        <div className="mb-3 md:mb-4 space-y-2 md:space-y-3">
          <button
            onClick={handleCall}
            className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-110"
            title="Call Us"
          >
            <Phone className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-teal-500 text-white rounded-full shadow-lg hover:bg-teal-600 transition-all duration-300 transform hover:scale-110"
            title="WhatsApp"
          >
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={handleBooking}
            className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-cyan-600 text-white rounded-full shadow-lg hover:bg-cyan-700 transition-all duration-300 transform hover:scale-110"
            title="Quick Booking"
          >
            <Car className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      )}

      {/* Main Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm"
        title={isExpanded ? "Close Menu" : "Quick Actions"}
      >
        {isExpanded ? (
          <X className="w-6 h-6 md:w-8 md:h-8" />
        ) : (
          <Phone className="w-6 h-6 md:w-8 md:h-8" />
        )}
      </button>
    </div>
  );
}
