import { useMemo } from "react";
import { bridge } from "../bridge/max";

export const useUser = () =>
  useMemo(() => {
    const u = bridge.user;
    return {
      id: u?.id,
      photoUrl: u?.photo_url,
    };
  }, []);
