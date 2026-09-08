import type { JoinWaitlistInput, JoinWaitlistResult } from "../types";
import api from "@/shared/lib/api";

export const waitlistService = {
  async join(input: JoinWaitlistInput): Promise<JoinWaitlistResult> {
    const response = await api.post<JoinWaitlistResult>("/waitlist", input);
    return response.data;
  },
};
