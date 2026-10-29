// src/components/SpaceSyncChatbot.jsx
// SpaceSync Assistant: Intelligent room recommendations, event planning checklist,
// real-time room availability, and pre-filled booking navigation.

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getRooms, getBookings } from "../api";
import { extractEventDetails, extractIntent } from "../utils/chatIntent";
import { getEventProfile } from "../utils/eventProfiles";
import { recommendRooms, getCurrentlyFreeRooms } from "../utils/roomMatcher";
import { enhanceReply } from "../utils/chatAI";

const BASE_QUICK_PROMPTS = [
  "Find a room for my event",
  "What's free right now?",
  "Plan my event",
  "Booking status",
];

function formatTime12(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

export default function SpaceSyncChatbot() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [expandedSlots, setExpandedSlots] = useState({});

  // Rooms and bookings fetched from backend
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState("");

  // Stateful conversation memory across the session
  const [sessionContext, setSessionContext] = useState({
    eventType: null,
    attendees: { min: null, max: null },
    equipment: [],
    date: null,
    startTime: null,
    endTime: null,
    waitingFor: null, // "attendees" | "time" | null
  });

  const [messages, setMessages] = useState([
    {
      id: "initial-msg",
      sender: "bot",
      text: "Hi! I'm your SpaceSync Assistant. I can recommend halls for events, check live room availability, and help you plan your requirements.",
    },
  ]);

  // Load real data from api.js when chatbot opens
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    async function loadBackendData() {
      setLoadingData(true);
      setDataError("");
      try {
        const [roomsData, bookingsData] = await Promise.all([
          getRooms(),
          getBookings(),
        ]);
        if (!active) return;
        setRooms(Array.isArray(roomsData) ? roomsData : []);
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } catch (err) {
        if (!active) return;
        setDataError(
          "I couldn't reach the room data. Please check that the backend is running and try again."
        );
      } finally {
        if (active) setLoadingData(false);
      }
    }

    loadBackendData();
    return () => {
      active = false;
    };
  }, [isOpen]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  const addMessage = useCallback((msg) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random()}`,
        ...msg,
      },
    ]);
  }, []);

  const toggleFreeSlots = (cardKey) => {
    setExpandedSlots((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  const handleBookRoomClick = (card, req) => {
    setIsOpen(false);
    const dateToBook = req.date || new Date().toISOString().slice(0, 10);
    const startToBook = req.startTime || "14:00";
    const endToBook = req.endTime || "17:00";
    const attendeesCount = req.attendees?.max || req.attendees?.min || 40;
    const title = req.eventType ? `${capitalize(req.eventType)}` : "Campus Reservation";

    navigate("/book", {
      state: {
        roomId: card.room.id,
        date: dateToBook,
        startTime: startToBook,
        endTime: endToBook,
        type: req.eventType === "exam" ? "exam" : "event",
        title,
        attendance: attendeesCount,
        equipment: card.room.equipment || [],
      },
    });
  };

  /**
   * Generates response based on message and conversation state
   */
  const processUserMessage = async (userText) => {
    const rawIntent = extractIntent(userText);
    const extracted = extractEventDetails(userText, sessionContext);

    // Update conversation context memory
    const updatedContext = {
      ...sessionContext,
      eventType: extracted.eventType || sessionContext.eventType,
      attendees: {
        min: extracted.attendees.min ?? sessionContext.attendees.min,
        max: extracted.attendees.max ?? sessionContext.attendees.max,
      },
      equipment: Array.from(new Set([...(sessionContext.equipment || []), ...(extracted.equipment || [])])),
      date: extracted.date || sessionContext.date,
      startTime: extracted.startTime || sessionContext.startTime,
      endTime: extracted.endTime || sessionContext.endTime,
      waitingFor: null,
    };

    setSessionContext(updatedContext);

    // 1. "What's free right now?" query
    if (rawIntent === "check_availability" || /free right now|available now|vacant now/i.test(userText)) {
      if (rooms.length === 0) {
        return {
          text: "I couldn't load rooms from the server. Please verify the backend is running.",
        };
      }

      const freeList = getCurrentlyFreeRooms(rooms, bookings, new Date());
      const freeNow = freeList.filter((item) => item.isFreeNow);

      if (freeNow.length === 0) {
        return {
          text: "All campus spaces currently have active reservations. Check back later or open the calendar to view future slots.",
          action: { label: "View calendar", route: "/" },
        };
      }

      const lines = freeNow.slice(0, 5).map((f) => {
        return `• ${f.room.name} (${f.room.capacity} seats)\n  ${f.statusText}`;
      });

      return {
        text: `Here are rooms free right now:\n\n${lines.join("\n\n")}${
          freeNow.length > 5 ? `\n\n…and ${freeNow.length - 5} more spaces free.` : ""
        }`,
        action: { label: "Book a room", route: "/book" },
      };
    }

    // 2. Booking status check
    if (/my booking|booking status|reservation status/i.test(userText)) {
      if (bookings.length === 0) {
        return {
          text: "No booking records were found in the database. Open the calendar to see all scheduled events.",
          action: { label: "Open calendar", route: "/" },
        };
      }

      const recentBookings = bookings.slice(-5).reverse();
      const lines = recentBookings.map((b) => {
        const room = rooms.find((r) => String(r.id) === String(b.roomId ?? b.room_id));
        const roomName = room ? room.name : `Room ${b.roomId ?? b.room_id}`;
        const startStr = b.start ?? b.start_time;
        const timePart = startStr ? formatDateDisplay(startStr.slice(0, 10)) + " " + formatTime12(startStr.slice(11, 16)) : "";
        return `• ${b.title || "Booking"} (${roomName})\n  ${timePart} — Status: ${b.status}`;
      });

      return {
        text: `Here are the latest bookings on record:\n\n${lines.join("\n\n")}`,
        action: { label: "View calendar", route: "/" },
      };
    }

    // 3. How to book guidance
    if (rawIntent === "how_to") {
      return {
        text: "Booking a campus room in SpaceSync is simple:\n\n1. Go to the Book Room page.\n2. Pick your desired hall and date/time.\n3. Enter the attendee count and equipment.\n4. Submit your request. It will be reviewed by an authorized administrator.",
        action: { label: "Book a room", route: "/book" },
      };
    }

    // 4. Case 2: User doesn't know requirements ("I don't know what I need", "Plan my event")
    if (rawIntent === "plan_event" || (!extracted.attendees.max && /coding workshop|workshop|seminar|hackathon/i.test(userText) && /don'?t know/i.test(userText))) {
      const typeKey = updatedContext.eventType || "workshop";
      const profile = getEventProfile(typeKey);

      // Assume typical requirements if not provided
      const assumedAttendees = updatedContext.attendees.max || updatedContext.attendees.min || profile.typicalSeats.max;
      const assumedDate = updatedContext.date || new Date().toISOString().slice(0, 10);
      const assumedStart = updatedContext.startTime || "14:00";
      const assumedEnd = updatedContext.endTime || "17:00";
      const assumedEquip = Array.from(new Set([...(updatedContext.equipment || []), ...profile.neededEquipment]));

      const effectiveReq = {
        eventType: typeKey,
        attendees: { min: Math.round(assumedAttendees * 0.8), max: assumedAttendees },
        equipment: assumedEquip,
        date: assumedDate,
        startTime: assumedStart,
        endTime: assumedEnd,
      };

      const topRooms = recommendRooms({
        rooms,
        bookings,
        request: effectiveReq,
        now: new Date(),
      });

      return {
        text: `Here is a planning guide for a **${profile.label}**:\n\n` +
          `• **Seating & Layout:** ${profile.layoutTip}\n` +
          `• **Duration:** ${profile.durationHint}\n` +
          `• **Essential Equipment:** ${profile.neededEquipment.map((e) => e.replace("_", " ")).join(", ")}\n` +
          `• **Helpful Advice:** ${profile.notes[0]} ${profile.notes[1]}\n\n` +
          `I assumed an attendance of **${assumedAttendees} students** on **${formatDateDisplay(assumedDate)}** from **${formatTime12(assumedStart)} to ${formatTime12(assumedEnd)}**. Here are the best-fit halls:`,
        recommendations: topRooms,
        requestSnapshot: effectiveReq,
        quickReplies: ["Add a mic", "Need AC", "Change time", "Change attendees"],
        approvalHint: "This request may need approval from faculty or a venue administrator.",
      };
    }

    // 5. Case 1: Room recommendation inquiry
    if (rawIntent === "find_room" || updatedContext.eventType || updatedContext.attendees.max) {
      // Check for missing vital information - ask ONE short question at a time
      if (!updatedContext.attendees.max && !updatedContext.attendees.min) {
        setSessionContext((prev) => ({ ...prev, waitingFor: "attendees" }));
        return {
          text: `How many attendees are you expecting for the ${updatedContext.eventType ? updatedContext.eventType.replace("_", " ") : "event"}?`,
          quickReplies: ["Around 30", "Around 60", "Around 100", "50 to 100"],
        };
      }

      if (!updatedContext.date && !updatedContext.startTime) {
        setSessionContext((prev) => ({ ...prev, waitingFor: "time" }));
        return {
          text: "What date and time would you like to schedule the event?",
          quickReplies: ["Tomorrow 2 to 5 PM", "This Saturday 2 to 5 PM", "Today afternoon"],
        };
      }

      // We have sufficient criteria: execute multi-factor scoring
      const topRooms = recommendRooms({
        rooms,
        bookings,
        request: updatedContext,
        now: new Date(),
      });

      if (topRooms.length === 0) {
        return {
          text: "I couldn't find any campus facilities matching those requirements. Try adjusting the crowd size, choosing a different time slot, or splitting across multiple rooms.",
          quickReplies: ["What's free right now?", "Plan my event"],
        };
      }

      const attendeesLabel = updatedContext.attendees.min && updatedContext.attendees.max && updatedContext.attendees.min !== updatedContext.attendees.max
        ? `${updatedContext.attendees.min}-${updatedContext.attendees.max}`
        : updatedContext.attendees.max || updatedContext.attendees.min || "your";

      const timeLabel = updatedContext.startTime && updatedContext.endTime
        ? ` for ${formatDateDisplay(updatedContext.date)} (${formatTime12(updatedContext.startTime)} - ${formatTime12(updatedContext.endTime)})`
        : "";

      return {
        text: `Here are the top 3 recommended halls for **${attendeesLabel} attendees**${timeLabel}:`,
        recommendations: topRooms,
        requestSnapshot: updatedContext,
        quickReplies: ["Check another time", "Add equipment", "What's free right now?"],
        approvalHint: "This request may need approval from faculty or a venue administrator.",
      };
    }

    // Fallback general guidance
    return {
      text: "I can recommend suitable campus halls, check room availability, or guide your event setup.\n\nTry asking:\n• “Seminar on Saturday 2 to 5 PM for 50 to 100 students with a projector and mic”\n• “Coding workshop for 80 students, what do I need?”\n• “What's free right now?”",
      quickReplies: BASE_QUICK_PROMPTS,
    };
  };

  const sendMessage = async (customText = null) => {
    const textToSend = String(customText || input || "").trim();
    if (!textToSend) return;

    setInput("");
    addMessage({ sender: "user", text: textToSend });
    setIsTyping(true);

    try {
      const response = await processUserMessage(textToSend);

      // Optional AI natural language smoothing (falls back to rule-based response)
      const refinedText = await enhanceReply({
        draftText: response.text,
        userMessage: textToSend,
        context: sessionContext,
      });

      setTimeout(() => {
        setIsTyping(false);
        addMessage({
          sender: "bot",
          text: refinedText,
          recommendations: response.recommendations || null,
          requestSnapshot: response.requestSnapshot || null,
          action: response.action || null,
          quickReplies: response.quickReplies || null,
          approvalHint: response.approvalHint || null,
        });
      }, 350);
    } catch (err) {
      setIsTyping(false);
      addMessage({
        sender: "bot",
        text: "I ran into a problem checking campus rooms. Please make sure the backend server is running and try again.",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <>
      {/* Floating assistant launcher button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close SpaceSync Assistant" : "Open SpaceSync Assistant"}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-[#4F46E5] text-white shadow-xl transition-all duration-150 hover:bg-[#4338CA] hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        <span className="material-symbols-outlined text-[27px]">
          {isOpen ? "close" : "smart_toy"}
        </span>
      </button>

      {/* Assistant Window */}
      {isOpen && (
        <section
          aria-label="SpaceSync assistant chat"
          className="fixed bottom-24 right-4 sm:right-5 z-[60] flex h-[min(640px,calc(100vh-7.5rem))] w-[min(410px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl font-['Inter',sans-serif]"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-[#0F172A] px-4 py-3.5 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4F46E5] text-white">
                <span className="material-symbols-outlined text-[20px]">
                  smart_toy
                </span>
              </div>
              <div>
                <h2 className="text-sm font-semibold tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
                  SpaceSync Assistant
                </h2>
                <p className="text-[11px] text-slate-300">
                  Room recommendations & planning
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 space-y-3.5 overflow-y-auto bg-slate-50 p-3.5 text-xs sm:text-sm">
            {dataError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800">
                {dataError}
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[92%] rounded-xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === "user"
                      ? "rounded-br-sm bg-[#4F46E5] text-white"
                      : "rounded-bl-sm border border-slate-200 bg-white text-slate-800 shadow-2xs"
                  }`}
                >
                  <p className="whitespace-pre-line text-xs sm:text-[13px]">
                    {msg.text}
                  </p>

                  {/* Simple action link */}
                  {msg.action && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        navigate(msg.action.route);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      {msg.action.label}
                      <span className="material-symbols-outlined text-[14px]">
                        arrow_forward
                      </span>
                    </button>
                  )}
                </div>

                {/* Recommendation Room Cards */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-2.5 w-full space-y-2.5">
                    {msg.recommendations.map((card, idx) => {
                      const cardKey = `${msg.id}-card-${card.room.id}`;
                      const isExpanded = !!expandedSlots[cardKey];

                      return (
                        <div
                          key={cardKey}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs space-y-2 text-slate-800"
                        >
                          {/* Card Header: Room Name, Capacity, and Status Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs sm:text-sm text-slate-900">
                                  {card.room.name}
                                </span>
                                <span className="text-[11px] font-medium text-slate-500">
                                  · {card.room.capacity} seats
                                </span>
                              </div>
                              <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider">
                                #{idx + 1} Best Match · {card.score}% Fit
                              </span>
                            </div>

                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                card.isFree
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  card.isFree ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              {card.isFree ? "Free" : "Busy"}
                            </span>
                          </div>

                          {/* Equipment Tags */}
                          {card.room.equipment && card.room.equipment.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {card.room.equipment.map((eq) => (
                                <span
                                  key={eq}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 font-medium"
                                >
                                  {eq.replace("_", " ")}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Reasons & Warnings */}
                          <div className="space-y-1 text-[11px] text-slate-600 pt-0.5">
                            {card.reasons.map((r, rIdx) => (
                              <div key={rIdx} className="flex items-start gap-1 text-slate-600">
                                <span className="text-emerald-600 text-xs shrink-0 font-bold">✓</span>
                                <span>{r}</span>
                              </div>
                            ))}
                            {card.warnings.map((w, wIdx) => (
                              <div key={wIdx} className="flex items-start gap-1 text-amber-700">
                                <span className="text-amber-500 text-xs shrink-0 font-bold">⚠</span>
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>

                          {/* Alternative Free Slots toggle list */}
                          {isExpanded && (
                            <div className="rounded-lg bg-slate-50 p-2 text-[11px] border border-slate-200 space-y-1">
                              <span className="font-semibold text-slate-700 block text-[10px] uppercase tracking-wider">
                                Available Time Windows:
                              </span>
                              {card.nextFreeSlots && card.nextFreeSlots.length > 0 ? (
                                card.nextFreeSlots.map((slot, sIdx) => (
                                  <div key={sIdx} className="flex items-center justify-between text-slate-600">
                                    <span>{slot.label}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const reqSnapshot = msg.requestSnapshot || sessionContext;
                                        setIsOpen(false);
                                        navigate("/book", {
                                          state: {
                                            roomId: card.room.id,
                                            date: reqSnapshot.date || new Date().toISOString().slice(0, 10),
                                            startTime: slot.start,
                                            endTime: slot.end,
                                            type: reqSnapshot.eventType === "exam" ? "exam" : "event",
                                            title: reqSnapshot.eventType ? `${capitalize(reqSnapshot.eventType)}` : "Campus Reservation",
                                            attendance: reqSnapshot.attendees?.max || reqSnapshot.attendees?.min || 40,
                                            equipment: card.room.equipment || [],
                                          },
                                        });
                                      }}
                                      className="text-indigo-600 hover:underline font-semibold text-[10px]"
                                    >
                                      Select
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-400 text-[10px]">
                                  No alternative 2-hour blocks open during campus operating hours (08:00–18:00).
                                </p>
                              )}
                            </div>
                          )}

                          {/* Card Action Buttons */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleBookRoomClick(card, msg.requestSnapshot || sessionContext)}
                              className="flex-1 rounded-md bg-[#4F46E5] py-1.5 px-2 text-center text-xs font-semibold text-white hover:bg-[#4338CA] transition"
                            >
                              Book this room
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleFreeSlots(cardKey)}
                              className="rounded-md border border-slate-200 bg-white py-1.5 px-2.5 text-center text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                            >
                              {isExpanded ? "Hide times" : "See free times"}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Hedged Approval Hint */}
                    {msg.approvalHint && (
                      <p className="text-[10px] text-slate-400 italic px-1">
                        ℹ {msg.approvalHint}
                      </p>
                    )}
                  </div>
                )}

                {/* Quick-reply chips */}
                {msg.quickReplies && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {msg.quickReplies.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => sendMessage(chip)}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-xl rounded-bl-sm border border-slate-200 bg-white px-3.5 py-2.5 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            {loadingData && (
              <p className="text-center text-[11px] text-slate-400">
                Connecting to campus spaces…
              </p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick-reply prompt drawer on clean chat start */}
          {messages.length <= 2 && (
            <div className="flex gap-1.5 overflow-x-auto border-t border-slate-100 bg-white p-2.5 shrink-0">
              {BASE_QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about halls, event requirements…"
              aria-label="Message the SpaceSync Assistant"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4F46E5] text-white hover:bg-[#4338CA] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
            </button>
          </form>

          <div className="bg-white px-3 pb-2 text-center text-[10px] text-slate-400 shrink-0">
            SpaceSync Assistant · Real-time campus room recommendations
          </div>
        </section>
      )}
    </>
  );
}
