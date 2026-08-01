import type { JoinWaitlistInput, JoinWaitlistResult } from "../types";
import { API_URL } from "@/shared/config/api-url";
import { apiErrorFromResponse } from "@/shared/lib/api";

export const waitlistService = {
  async join(input: JoinWaitlistInput): Promise<JoinWaitlistResult> {
    const res = await fetch(`${API_URL}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      throw await apiErrorFromResponse(res);
    }

    const data = await res.json();
    return data as JoinWaitlistResult;
  },

  async count(): Promise<number> {
    const res = await fetch(`${API_URL}/waitlist/count`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data?.count === "number" ? data.count : 0;
  },
};
