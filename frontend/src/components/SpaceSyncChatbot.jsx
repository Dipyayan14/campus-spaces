// src/components/SpaceSyncChatbot.jsx
// SpaceSync assistant: answers basic room, availability, booking, and navigation questions.

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRooms, getBookings } from "../api";

const QUICK_PROMPTS = [
  "Show me available rooms",
  "How do I book a room?",
  "Show my booking status",
];

function normalize(value) {
  return String(value || "").toLowerCase().trim();
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "date not specified";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getBookingRoomId(booking) {
  return booking?.roomId ?? booking?.room_id ?? booking?.room?.id;
}

function getBookingStart(booking) {
  return booking?.start ?? booking?.start_time ?? booking?.startTime;
}

function getBookingEnd(booking) {
  return booking?.end ?? booking?.end_time ?? booking?.endTime;
}

function getRoomName(room) {
  return room?.name || room?.room_name || room?.title || `Room ${room?.id}`;
}

function getRoomCapacity(room) {
  return Number(room?.capacity ?? room?.seats ?? 0);
}

function getRoomEquipment(room) {
  const equipment = room?.equipment ?? room?.amenities ?? [];
  return Array.isArray(equipment) ? equipment.join(" ").toLowerCase() : "";
}

function getLocalDateKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSameLocalDay(a, b) {
  return Boolean(a && b) && getLocalDateKey(a) === getLocalDateKey(b);
}

function overlaps(startA, endA, startB, endB) {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  if ([aStart, aEnd, bStart, bEnd].some(Number.isNaN)) {
    return false;
  }

  return aStart < bEnd && bStart < aEnd;
}

function getBookingStatus(booking) {
  return normalize(booking?.status || "pending");
}

function getDisplayStatus(status) {
  const labels = {
    approved: "Approved",
    pending: "Pending review",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };

  return labels[status] || status || "Unknown";
}

export default function SpaceSyncChatbot() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hi! I'm the SpaceSync assistant. I can help you find campus rooms, check availability, understand booking statuses, and navigate the app.",
    },
  ]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    async function loadData() {
      setLoadingData(true);
      setDataError("");

      try {
        const [roomData, bookingData] = await Promise.all([
          getRooms(),
          getBookings(),
        ]);

        if (!active) return;

        setRooms(Array.isArray(roomData) ? roomData : []);
        setBookings(Array.isArray(bookingData) ? bookingData : []);
      } catch (error) {
        if (!active) return;

        setDataError(
          "I couldn't reach the booking service. Check that the backend is running, then try again."
        );
      } finally {
        if (active) setLoadingData(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  function addMessage(sender, text, action = null) {
    setMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-${Math.random()}`,
        sender,
        text,
        action,
      },
    ]);
  }

  function getAvailabilityMessage(query) {
    const today = new Date();
    const todayKey = getLocalDateKey(today);
    const approvedBookings = bookings.filter(
      (booking) => getBookingStatus(booking) === "approved"
    );

    const capacityMatch = query.match(
      /(?:at least|min(?:imum)?|for)\s*(\d+)\s*(?:people|persons|students|seats|members)?/i
    );
    const requestedCapacity = capacityMatch
      ? Number(capacityMatch[1])
      : null;

    const equipmentTerms = [
      "projector",
      "whiteboard",
      "computer",
      "computers",
      "microphone",
      "mic",
      "speaker",
      "speakers",
      "wifi",
      "wi-fi",
      "lab",
      "air conditioning",
      "ac",
    ];

    const requestedEquipment = equipmentTerms.filter((term) =>
      query.includes(term)
    );

    const matchingRooms = rooms.filter((room) => {
      if (
        requestedCapacity &&
        getRoomCapacity(room) < requestedCapacity
      ) {
        return false;
      }

      const equipment = getRoomEquipment(room);
      const roomText = normalize(
        `${getRoomName(room)} ${room?.type || ""} ${room?.description || ""}`
      );

      return requestedEquipment.every((term) => {
        if (term === "computers") {
          return equipment.includes("computer") || roomText.includes("computer");
        }
        if (term === "mic") {
          return equipment.includes("microphone") || roomText.includes("microphone");
        }
        if (term === "wi-fi") {
          return equipment.includes("wifi") || equipment.includes("wi-fi");
        }
        if (term === "ac") {
          return equipment.includes("air conditioning") || equipment.includes("ac");
        }

        return equipment.includes(term) || roomText.includes(term);
      });
    });

    if (matchingRooms.length === 0) {
      return {
        text: "I couldn't find rooms matching those requirements in the current room list. Try a smaller capacity or fewer equipment requirements.",
        action: { label: "Browse rooms", route: "/book" },
      };
    }

    const isTodayQuery =
      query.includes("today") ||
      query.includes("right now") ||
      query.includes("currently") ||
      query.includes("available now");

    const resultLines = matchingRooms.slice(0, 8).map((room) => {
      const roomBookings = approvedBookings.filter(
        (booking) =>
          String(getBookingRoomId(booking)) === String(room.id)
      );

      if (!isTodayQuery) {
        const capacity = getRoomCapacity(room);
        return `• ${getRoomName(room)}${
          capacity ? ` — capacity ${capacity}` : ""
        }`;
      }

      const now = new Date();
      const nowPlusOneHour = new Date(now.getTime() + 60 * 60 * 1000);

      const currentlyOccupied = roomBookings.some((booking) => {
        const start = getBookingStart(booking);
        const end = getBookingEnd(booking);

        return (
          start &&
          end &&
          overlaps(start, end, now.toISOString(), nowPlusOneHour.toISOString()) &&
          new Date(start).getTime() <= now.getTime() &&
          new Date(end).getTime() > now.getTime()
        );
      });

      const bookingsToday = roomBookings.filter((booking) => {
        const start = getBookingStart(booking);
        const end = getBookingEnd(booking);

        return (
          start &&
          end &&
          isSameLocalDay(start, today) &&
          new Date(end).getTime() > now.getTime()
        );
      });

      const capacity = getRoomCapacity(room);
      const capacityLabel = capacity ? ` — capacity ${capacity}` : "";

      if (currentlyOccupied) {
        const activeBooking = roomBookings.find((booking) => {
          const start = getBookingStart(booking);
          const end = getBookingEnd(booking);

          return (
            start &&
            end &&
            new Date(start).getTime() <= now.getTime() &&
            new Date(end).getTime() > now.getTime()
          );
        });

        return `• ${getRoomName(room)}${capacityLabel} — booked until ${formatTime(
          getBookingEnd(activeBooking)
        )}`;
      }

      if (bookingsToday.length > 0) {
        const nextBooking = bookingsToday
          .slice()
          .sort(
            (a, b) =>
              new Date(getBookingStart(a)).getTime() -
              new Date(getBookingStart(b)).getTime()
          )[0];

        return `• ${getRoomName(room)}${capacityLabel} — free now; next booking at ${formatTime(
          getBookingStart(nextBooking)
        )}`;
      }

      return `• ${getRoomName(room)}${capacityLabel} — no approved bookings listed for today`;
    });

    const intro = isTodayQuery
      ? "Here are matching rooms and their current booking information:"
      : "Here are rooms matching your requirements:";

    const extra =
      matchingRooms.length > 8
        ? `\n…and ${matchingRooms.length - 8} more matching rooms.`
        : "";

    return {
      text: `${intro}\n\n${resultLines.join("\n")}${extra}`,
      action: { label: "Open room booking", route: "/book" },
    };
  }

  function buildReply(rawMessage) {
    const query = normalize(rawMessage);

    if (!query) {
      return { text: "Type a question and I'll do my best to help." };
    }

    if (
      /\b(hello|hi|hey|good morning|good afternoon|good evening)\b/.test(query)
    ) {
      return {
        text: "Hello! I can help you find rooms, check their listed bookings, and understand the booking process. What do you need?",
      };
    }

    if (
      query.includes("help") ||
      query.includes("what can you do") ||
      query.includes("capabilities")
    ) {
      return {
        text: "I can help you:\n• Find rooms by capacity or equipment\n• Check today's approved booking information\n• See booking statuses\n• Navigate to the calendar or booking page\n\nTry asking: “Find a room for 30 people with a projector.”",
      };
    }

    if (
      query.includes("how do i book") ||
      query.includes("how to book") ||
      query.includes("book a room") ||
      query.includes("reserve a room") ||
      query === "booking"
    ) {
      return {
        text: "To request a room, open Book Room, choose a space, enter the date and time, provide the required booking details, and submit your request. If approval is required, the request may remain pending until an authorized administrator reviews it.",
        action: { label: "Book a room", route: "/book" },
      };
    }

    if (
      query.includes("calendar") ||
      query.includes("schedule") ||
      query.includes("timetable")
    ) {
      return {
        text: "Open the SpaceSync Calendar to view scheduled campus bookings.",
        action: { label: "Open calendar", route: "/" },
      };
    }

    if (
      query.includes("approval") ||
      query.includes("pending request") ||
      query.includes("review request")
    ) {
      return {
        text: "Booking approvals are available to Venue Admin and Super Admin accounts. If your account has that role, use the Approvals tab in the navigation.",
      };
    }

    if (
      query.includes("my booking") ||
      query.includes("booking status") ||
      query.includes("reservation status") ||
      query.includes("pending booking") ||
      query.includes("approved booking") ||
      query.includes("rejected booking")
    ) {
      if (bookings.length === 0) {
        return {
          text: "I couldn't find any bookings in the current data returned by the server. If you just submitted a request, check that the backend is running and refresh the chat.",
          action: { label: "Open calendar", route: "/" },
        };
      }

      const statusFilter = query.includes("pending")
        ? "pending"
        : query.includes("approved")
          ? "approved"
          : query.includes("rejected")
            ? "rejected"
            : null;

      const relevantBookings = bookings.filter((booking) =>
        statusFilter
          ? getBookingStatus(booking) === statusFilter
          : true
      );

      if (relevantBookings.length === 0) {
        return {
          text: statusFilter
            ? `There are no bookings with status "${getDisplayStatus(statusFilter)}" in the current booking data.`
            : "No bookings were found.",
          action: { label: "Open calendar", route: "/" },
        };
      }

      const lines = relevantBookings.slice(0, 6).map((booking) => {
        const room = rooms.find(
          (item) =>
            String(item.id) === String(getBookingRoomId(booking))
        );

        const start = getBookingStart(booking);
        const status = getDisplayStatus(getBookingStatus(booking));

        return `• ${booking.title || "Room booking"} — ${
          room ? getRoomName(room) : `Room ${getBookingRoomId(booking) ?? "unknown"}`
        }\n  ${start ? formatDate(start) + " at " + formatTime(start) : "Date not specified"} — ${status}`;
      });

      return {
        text: `Here are the booking records currently available to the assistant:\n\n${lines.join(
          "\n\n"
        )}${relevantBookings.length > 6 ? "\n\nShowing the first 6 records." : ""}\n\nNote: this lists server booking records and may include bookings from other users.`,
        action: { label: "View calendar", route: "/" },
      };
    }

    if (
      query.includes("available room") ||
      query.includes("availability") ||
      query.includes("free room") ||
      query.includes("room for") ||
      query.includes("projector") ||
      query.includes("whiteboard") ||
      query.includes("capacity") ||
      query.includes("seats") ||
      query.includes("people") ||
      query.includes("today") ||
      query.includes("available now")
    ) {
      if (rooms.length === 0) {
        return {
          text: "The room list isn't loaded yet. Please wait a moment and try again.",
          action: { label: "Browse rooms", route: "/book" },
        };
      }

      return getAvailabilityMessage(query);
    }

    if (
      query.includes("insight") ||
      query.includes("analytics") ||
      query.includes("utilization") ||
      query.includes("report")
    ) {
      return {
        text: "SpaceSync Insights provides overview and analytics for authorized roles. Availability of that page depends on your account role.",
        action: { label: "Open calendar", route: "/" },
      };
    }

    return {
      text: "I can help with room availability, capacity, equipment, booking steps, booking statuses, and navigation. Try “Find a room for 25 people with a projector” or “Show available rooms today.”",
    };
  }

  function sendMessage(text = input) {
    const cleanText = String(text || "").trim();

    if (!cleanText) return;

    addMessage("user", cleanText);
    setInput("");

    const reply = buildReply(cleanText);

    window.setTimeout(() => {
      addMessage("bot", reply.text, reply.action || null);
    }, 180);
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <>
      {/* Floating assistant launcher */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close SpaceSync assistant" : "Open SpaceSync assistant"}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#4F46E5] text-white shadow-xl transition hover:bg-[#4338CA] hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <span className="material-symbols-outlined text-[27px]">
          {isOpen ? "close" : "smart_toy"}
        </span>
      </button>

      {/* Chat panel */}
      {isOpen && (
        <section
          aria-label="SpaceSync assistant chat"
          className="fixed bottom-24 right-4 sm:right-5 z-[60] flex h-[min(620px,calc(100vh-8rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-[#0F172A] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#4F46E5]">
                <span className="material-symbols-outlined text-[23px]">
                  smart_toy
                </span>
              </div>

              <div>
                <h2 className="text-sm font-bold">SpaceSync Assistant</h2>
                <p className="mt-0.5 text-xs text-slate-300">
                  Campus space helper
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1.5 text-slate-300 transition hover:bg-slate-700 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
            {dataError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {dataError}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-3 text-sm leading-relaxed ${
                    message.sender === "user"
                      ? "rounded-br-md bg-[#4F46E5] text-white"
                      : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>

                  {message.action && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(message.action.route);
                      }}
                      className={`mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                        message.sender === "user"
                          ? "bg-white/15 text-white hover:bg-white/25"
                          : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                      }`}
                    >
                      {message.action.label}
                      <span className="material-symbols-outlined text-[15px]">
                        arrow_forward
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loadingData && (
              <p className="text-center text-xs text-slate-400">
                Connecting to campus spaces…
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length <= 2 && (
            <div className="flex gap-2 overflow-x-auto border-t border-slate-100 bg-white px-3 py-3">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about campus rooms…"
              aria-label="Message the SpaceSync assistant"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#4F46E5] text-white transition hover:bg-[#4338CA] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>

          <p className="bg-white px-3 pb-2 text-center text-[10px] text-slate-400">
            Prototype assistant · Verify important booking details in the app
          </p>
        </section>
      )}
    </>
  );
}