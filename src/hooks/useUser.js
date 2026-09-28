import { useMemo } from "react";
import { bridge } from "../bridge/max";
import { USER_FALLBACK } from "../data/content";

export const useUser = () =>
  useMemo(() => {
    const u = bridge.user;
    return {
      id: u?.id,
      firstName: u?.first_name || USER_FALLBACK.firstName,
      lastName: u?.last_name || (u ? "" : USER_FALLBACK.lastName),
      username: u?.username,
      photoUrl: u?.photo_url,
      email: USER_FALLBACK.email,
      address: USER_FALLBACK.address,
    };
  }, []);
