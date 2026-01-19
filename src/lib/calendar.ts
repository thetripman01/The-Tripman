import { google } from "googleapis";
import { Booking, EventType } from "@prisma/client";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

function isGoogleCalendarConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_ID,
  );
}

function getGoogleAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return null;
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
}

export async function getFreeBusyTimes(startTime: Date, endTime: Date) {
  const auth = getGoogleAuth();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!auth || !calendarId) {
    return [];
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        items: [{ id: calendarId }],
      },
    });

    return response.data.calendars?.[calendarId]?.busy || [];
  } catch (error) {
    console.warn(
      "Google Calendar: failed to fetch free/busy times (continuing without Google busy data).",
    );
    return [];
  }
}

export async function createGoogleCalendarEvent(
  booking: Booking & { eventType: EventType },
) {
  const auth = getGoogleAuth();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!auth || !calendarId) {
    return null;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: `${booking.eventType.name} with ${booking.fullName}`,
      description: `Booking Details:
Event: ${booking.eventType.name}
Customer: ${booking.fullName}
Email: ${booking.email}
${booking.phone ? `Phone: ${booking.phone}` : ""}
${booking.pickup ? `Pickup: ${booking.pickup}` : ""}
${booking.peopleCount ? `People: ${booking.peopleCount}` : ""}
${booking.notes ? `Notes: ${booking.notes}` : ""}
${booking.eventType.priceCents ? `Price: $${(booking.eventType.priceCents / 100).toFixed(2)}` : ""}`,
      start: {
        dateTime: booking.startsAt.toISOString(),
        timeZone: booking.timezone,
      },
      end: {
        dateTime: booking.endsAt.toISOString(),
        timeZone: booking.timezone,
      },
      location: booking.pickup || undefined,
      attendees: [{ email: booking.email, displayName: booking.fullName }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 24 hours
          { method: "popup", minutes: 15 }, // 15 minutes
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: "all",
    });

    return response.data.id ?? null;
  } catch (error) {
    console.warn(
      "Google Calendar: failed to create event (continuing without Google Calendar integration).",
    );
    return null;
  }
}

export async function deleteGoogleCalendarEvent(eventId: string) {
  const auth = getGoogleAuth();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!auth || !calendarId) {
    return;
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    });
  } catch (error) {
    console.warn("Google Calendar: failed to delete event (continuing).");
  }
}

export function getWorkingHours() {
  // Default working hours: 9 AM to 6 PM, Monday to Friday
  return {
    start: 9, // 9 AM
    end: 18, // 6 PM
    daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
  };
}

export function generateTimeSlots(
  date: Date,
  durationMinutes: number,
  bufferMinutes: number = 15,
): Date[] {
  const workingHours = getWorkingHours();
  const slots: Date[] = [];

  const startOfDay = new Date(date);
  startOfDay.setHours(workingHours.start, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(workingHours.end, 0, 0, 0);

  let currentSlot = new Date(startOfDay);

  while (currentSlot < endOfDay) {
    const slotEnd = new Date(currentSlot.getTime() + durationMinutes * 60000);

    if (slotEnd <= endOfDay) {
      slots.push(new Date(currentSlot));
    }

    // Move to next slot with buffer
    currentSlot = new Date(
      currentSlot.getTime() + (durationMinutes + bufferMinutes) * 60000,
    );
  }

  return slots;
}
