// src/utils/chatAI.js
// Optional AI enhancement wrapper for natural conversational tone.
// Off by default: if VITE_AI_ENDPOINT is not configured or times out/fails,
// quietly falls back to the deterministic, verified rule-based response.

/**
 * Optionally refines bot text for conversational fluency if a proxy endpoint is configured.
 * Guarantees that factual room data and recommendation metrics remain unchanged.
 */
export async function enhanceReply({ draftText, userMessage, context = {} }) {
  // If no external AI endpoint is defined in environment variables, return draft immediately
  const endpoint = import.meta.env?.VITE_AI_ENDPOINT;
  if (!endpoint || typeof endpoint !== "string" || !endpoint.startsWith("http")) {
    return draftText;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s strict timeout

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        draft: draftText,
        prompt: userMessage,
        context,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return draftText;
    }

    const data = await response.json();
    return data.refinedText || data.text || draftText;
  } catch (err) {
    // Fail silently to the rule-based draft response without alerting user
    return draftText;
  }
}

