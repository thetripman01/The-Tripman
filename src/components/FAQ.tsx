"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How far in advance should I book?",
    answer:
      "We recommend booking at least 24 hours in advance to ensure availability. For special events or peak times, booking 48-72 hours ahead is ideal.",
  },
  {
    question: "What is your cancellation policy?",
    answer:
      "At launch, online changes/cancellations are disabled. If you need to request a change or cancellation, please contact The Tripman directly. Please note: all sales are final and refunds are not available, except where required by law.",
  },
  {
    question: "Do you provide vehicles for different group sizes?",
    answer:
      "Yes! We accommodate groups of 1–4 people — from solo rides to small crews.",
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
    <section className="py-20 px-4 bg-gradient-to-br from-cyan-50 to-cyan-100">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about booking with The Tripman
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card
              key={index}
              className="overflow-hidden border-cyan-100 transition-all duration-300 hover:border-cyan-200 hover:shadow-md"
            >
              <CardHeader
                className="cursor-pointer hover:bg-cyan-50/50 transition-colors duration-200 py-5"
                onClick={() => toggleItem(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleItem(index);
                  }
                }}
                aria-expanded={openItems.includes(index)}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold text-gray-900 leading-snug">
                    {faq.question}
                  </CardTitle>
                  <span
                    className={`shrink-0 transition-transform duration-300 ${
                      openItems.includes(index) ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown className="w-5 h-5 text-cyan-600" />
                  </span>
                </div>
              </CardHeader>

              <div
                id={`faq-answer-${index}`}
                role="region"
                aria-labelledby={`faq-question-${index}`}
                className={`accordion-content overflow-hidden transition-all duration-300 ease-out ${
                  openItems.includes(index)
                    ? "max-h-96 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <CardContent className="pt-0 pb-5">
                  <p className="text-gray-600 leading-relaxed text-base">
                    {faq.answer}
                  </p>
                </CardContent>
              </div>
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
                className="bg-cyan-600 hover:bg-cyan-700 transition-colors duration-200 rounded-xl"
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
              className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300 transition-colors duration-200 rounded-xl"
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
