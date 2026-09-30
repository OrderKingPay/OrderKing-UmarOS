
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";

export type ReferralStats = {
  status: "ACTIVE" | "PROVIDER_REQUIRED";
  referralCode: string;
  shareUrl: string;
  totalInvited: number;
  totalEarnedPaise: number;
  rewardPerFriendPaise: number;
  friendDiscountPaise: number;
  minOrderPaise: number;
};

  .handler(async ({ context }): Promise<ReferralStats> => {
    void context;
    return {
      status: "PROVIDER_REQUIRED",
      referralCode: "",
      shareUrl: "https://orderking.in/",
      totalInvited: 0,
      totalEarnedPaise: 0,
      rewardPerFriendPaise: 0,
      friendDiscountPaise: 0,
      minOrderPaise: 0,
    };
  });