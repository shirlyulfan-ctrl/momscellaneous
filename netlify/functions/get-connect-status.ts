// netlify/functions/get-connect-status.ts
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "GET") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const provider_profile_id =
      event.queryStringParameters?.provider_profile_id || "";

    if (!provider_profile_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing provider_profile_id" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Load provider stripe account id from Supabase
    const { data: provider, error } = await supabase
      .from("provider_profiles")
      .select("id,stripe_account_id")
      .eq("id", provider_profile_id)
      .single();

    if (error || !provider) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Provider not found" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const accountId = (provider as any).stripe_account_id as string | null;

    if (!accountId) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          connected: false,
          charges_enabled: false,
          payouts_enabled: false,
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Ask Stripe for current status
    const acct = await stripe.accounts.retrieve(accountId);

    const charges_enabled = !!(acct as any).charges_enabled;
    const payouts_enabled = !!(acct as any).payouts_enabled;

    return {
      statusCode: 200,
      body: JSON.stringify({
        connected: true,
        charges_enabled,
        payouts_enabled,
      }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (e: any) {
    console.error("get-connect-status error:", e?.message || e);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e?.message || "Internal Server Error" }),
      headers: { "Content-Type": "application/json" },
    };
  }
};