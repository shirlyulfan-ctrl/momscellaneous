import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Body = { provider_profile_id: string };

export const handler = async (event: any) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

    const { provider_profile_id } = JSON.parse(event.body || "{}") as Body;
    if (!provider_profile_id) return { statusCode: 400, body: "Missing provider_profile_id" };

    // Load provider profile
    const { data: provider, error } = await supabase
      .from("provider_profiles")
      .select("id, stripe_account_id")
      .eq("id", provider_profile_id)
      .single();

    if (error || !provider) return { statusCode: 404, body: "Provider not found" };

    let accountId = provider.stripe_account_id;

    // Create Stripe Connect account if missing
    if (!accountId) {
      const acct = await stripe.accounts.create({
        type: "standard",
      });

      accountId = acct.id;

      await supabase
        .from("provider_profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", provider_profile_id);
    }

    // Create onboarding link
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.PUBLIC_SITE_URL}/become-provider?stripe=refresh`,
      return_url: `${process.env.PUBLIC_SITE_URL}/become-provider?stripe=return`,
      type: "account_onboarding",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: link.url }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (e) {
    console.error(e);
    return { statusCode: 500, body: "Internal Server Error" };
  }
};
