import { supabase } from "@/integrations/supabase/client";
import { TERMS_VERSION } from "@/legal/terms_v1";
import { PROVIDER_AGREEMENT_VERSION } from "@/legal/provider_agreement_v1";

export async function ensureCustomerTermsAccepted(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("accepted_terms_version")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const version = data?.accepted_terms_version ?? null;
  return version === TERMS_VERSION;
}

export async function acceptCustomerTerms(userId: string) {
  const { error } = await supabase
    .from("profiles")
    .update({
      accepted_terms_at: new Date().toISOString(),
      accepted_terms_version: TERMS_VERSION,
    })
    .eq("user_id", userId);

  if (error) throw error;
}

export async function ensureProviderAgreementsAccepted(providerProfileId: string) {
  const { data, error } = await supabase
    .from("provider_profiles")
    .select("accepted_terms_version, accepted_provider_agreement_version")
    .eq("id", providerProfileId)
    .single();

  if (error) throw error;

  const okTerms = (data?.accepted_terms_version ?? null) === TERMS_VERSION;
  const okProv = (data?.accepted_provider_agreement_version ?? null) === PROVIDER_AGREEMENT_VERSION;

  return okTerms && okProv;
}

export async function acceptProviderAgreements(providerProfileId: string) {
  const { error } = await supabase
    .from("provider_profiles")
    .update({
      accepted_terms_at: new Date().toISOString(),
      accepted_terms_version: TERMS_VERSION,
      accepted_provider_agreement_at: new Date().toISOString(),
      accepted_provider_agreement_version: PROVIDER_AGREEMENT_VERSION,
    })
    .eq("id", providerProfileId);

  if (error) throw error;
}
