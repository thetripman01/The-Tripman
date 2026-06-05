import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// Length caps protect against DoS (giant strings) and overflow into the
// email rendering. Service / phone are optional but if present must obey
// the cap. `message` is the longest because legitimate inquiries are long.
const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  service: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(4000),
});

/**
 * Escape user-supplied text before interpolating into our admin/customer
 * email HTML. Without this an attacker could submit a message containing
 * <script> or <img onerror=…> that some email clients would execute.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 messages per 15min per IP. Generous for legit users
    // (one accidental double-click won't trip it) but blocks spam waves.
    const ip = getClientIp(request);
    const limited = rateLimit(ip, {
      key: "contact-form",
      limit: 5,
      windowMs: 15 * 60_000,
      blockDurationMs: 15 * 60_000,
    });
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many messages. Please try again later." },
        {
          status: 429,
          headers: limited.retryAfterSeconds
            ? { "Retry-After": String(limited.retryAfterSeconds) }
            : undefined,
        },
      );
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid contact form data" },
        { status: 400 },
      );
    }
    const { name, email, phone, service, message } = parsed.data;

    if (!resend) {
      console.error("Resend API key not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL || "thetripman01@gmail.com";

    // ALL interpolations escaped. Customer-controlled strings ONLY appear
    // inside the escaped pre-rendered chunks below — never as href / src
    // attributes (which would need URL-scheme validation in addition).
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = phone ? escapeHtml(phone) : "";
    const safeService = service ? escapeHtml(service) : "";
    const safeMessage = escapeHtml(message);

    await resend.emails.send({
      from: "The Tripman Contact Form <bookings@thetripman.com>",
      to: adminEmail,
      replyTo: email,
      subject: `New Contact Form Submission: ${
        safeService || "General Inquiry"
      }`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">New Contact Form Submission</h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            ${safePhone ? `<p><strong>Phone:</strong> ${safePhone}</p>` : ""}
            ${
              safeService
                ? `<p><strong>Service Type:</strong> ${safeService}</p>`
                : ""
            }
            <p><strong>Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              <p style="white-space: pre-wrap;">${safeMessage}</p>
            </div>
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This email was sent from the contact form on The Tripman website.
          </p>
        </div>
      `,
    });

    await resend.emails.send({
      from: "The Tripman <bookings@thetripman.com>",
      to: email,
      subject: "Thank you for contacting The Tripman",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Thank You for Contacting Us!</h2>
          <p>Hi ${safeName},</p>
          <p>We've received your message and will get back to you within 24 hours.</p>
          <p>If you have any urgent questions, please contact us via email.</p>
          <p>Best regards,<br>The Tripman Team</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 },
    );
  }
}
