import { currentUserId, request } from "./client";

/** POST /ai/chat (backend/app/api/ai.py) → { answer } */
export const sendChatMessage = async (message) => {
  const { answer } = await request("/ai/chat", {
    method: "POST",
    body: { max_user_id: currentUserId(), message },
  });
  return answer;
};
