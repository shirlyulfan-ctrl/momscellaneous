// netlify/functions/release-payouts.ts
export const handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      message:
        "Not required: payouts are automatic with Stripe Connect destination charges (Option A).",
    }),
    headers: { "Content-Type": "application/json" },
  };
};