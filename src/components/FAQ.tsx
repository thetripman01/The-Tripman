"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "How far in advance should I book?",
    answer:
      "We recommend booking at least 24 hours in advance to ensure availability. For special events or peak times, booking 48-72 hours ahead is ideal.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "You can cancel your booking up to 12 hours before your scheduled time for a full refund. Cancellations made within 12 hours may be subject to a cancellation fee.",
  },
  {
    question: "Do you provide vehicles for different group sizes?",
    answer:
      "Yes! We have a fleet of vehicles to accommodate different group sizes, from intimate rides for 2 people to larger vehicles for groups up to 7 people.",
  },
  {
    question: "What areas in Ontario do you ride?",
    answer:
      "We provide service in most cities throughout the Greater Toronto Area (Toronto, Mississauga, Brampton, Markham, Etobicoke, North York, Scarborough, and Richmond Hill). Contact us for specific coverage areas and any additional charges for extended distances.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, debit cards, and digital payment methods. Payment is processed securely at the time of booking.",
  },
];

export function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const waDigits = (whatsappNumber || "16474594188").replace(/\D/g, "");

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-green-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about booking with The Tripman
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleItem(index)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {faq.question}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    {openItems.includes(index) ? (
                      <ChevronUp className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    )}
                  </Button>
                </div>
              </CardHeader>

              {openItems.includes(index) && (
                <CardContent className="pt-0">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            Still have questions? We&apos;re here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {(whatsappNumber || waDigits) && (
              <Button
                onClick={() => {
                  const message =
                    "Hi! I have a question about The Tripman. Can you help me?";
                  const whatsappUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(
                    message,
                  )}`;
                  window.open(whatsappUrl, "_blank");
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Contact via WhatsApp
              </Button>
            )}
            <Button
              onClick={() => {
                const contactSection = document.getElementById("contact");
                if (contactSection) {
                  contactSection.scrollIntoView({ behavior: "smooth" });
                }
              }}
              variant="outline"
            >
              Send us an Email
            </Button>
          </div>
          {/* Never show env/debug tips on the public site */}
        </div>
      </div>
    </section>
  );
}
