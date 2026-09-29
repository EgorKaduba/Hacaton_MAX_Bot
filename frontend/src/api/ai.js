import { currentUserId, request } from "./client";

export const sendChatMessage = async (message) => {
  const { answer } = await request("/ai/chat", {
    method: "POST",
    body: { max_user_id: currentUserId(), message },
  });
  return answer;
};
