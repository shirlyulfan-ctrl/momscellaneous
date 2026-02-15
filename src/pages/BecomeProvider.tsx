// src/pages/BecomeProvider.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import AvailabilityForm from "@/components/AvailabilityForm";
import { supabase } from "@/integrations/supabase/client";

import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Upload,
  X,
  Check,
  Image,
  Video,
  Baby,
  DollarSign,
  MapPin,
} from "lucide-react";

import { categories } from "@/data/providers";
import { TERMS_VERSION, PROVIDER_AGREEMENT_VERSION } from "@/lib/legalVersions";
import BackgroundCheckDisclaimerDialog from "@/components/BackgroundCheckDisclaimerDialog";

const serviceOptions = [
  "Babysitting",
  "Tutoring",
  "After-school care",
  "Homework help",
  "Dog walking",
  "Pet sitting",
  "Vet visits",
  "Pet grooming",
  "Cleaning",
  "Organizing",
  "Meal prep",
  "Laundry",
  "Handyman",
  "Furniture assembly",
  "Moving help",
  "Repairs",
  "Grocery shopping",
  "Package pickup",
  "Dry cleaning",
  "Yard work",
  "Gardening",
  "Snow removal",
  "Elder care",
  "Companionship",
  "Birthday party help",
];

type ProviderProfileRow = {
  id: string;
  user_id: string;

  bio: string | null;
  location: string | null;
  neighborhood: string | null;

  hourly_rate: number | null;
  task_rate: number | null;

  services: string[] | null;
  categories: string[] | null;

  years_experience: number | null;
  child_friendly: boolean | null;
  can_bring_child: boolean | null;

  terms_and_conditions: string | null;
  available: boolean | null;

  stripe_account_id: string | null;

  // NEW: legal acceptance columns
  accepted_terms_at: string | null;
  accepted_terms_version: string | null;
  accepted_provider_agreement_at: string | null;
  accepted_provider_agreement_version: string | null;
};

export default function BecomeProvider() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- provider profile ID for availability ---
  const [providerProfileId, setProviderProfileId] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState(true);
  const [providerError, setProviderError] = useState<string | null>(null);

  // page state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // profile row (from provider_profiles)
  const [existingProfile, setExistingProfile] = useState<ProviderProfileRow | null>(null);

  // media
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // form state
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [taskRate, setTaskRate] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [yearsExperience, setYearsExperience] = useState("");
  const [childFriendly, setChildFriendly] = useState(false);
  const [canBringChild, setCanBringChild] = useState(false);
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [available, setAvailable] = useState(true);

  // NEW: agreement states + disclaimer popup
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeProviderAgreement, setAgreeProviderAgreement] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Version mismatch = must re-accept
  const needsTermsReaccept = useMemo(() => {
    return (existingProfile?.accepted_terms_version ?? null) !== TERMS_VERSION;
  }, [existingProfile]);

  const needsProviderAgreementReaccept = useMemo(() => {
    return (existingProfile?.accepted_provider_agreement_version ?? null) !== PROVIDER_AGREEMENT_VERSION;
  }, [existingProfile]);

  const mustAcceptAgreements = needsTermsReaccept || needsProviderAgreementReaccept || !existingProfile;

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Load existing profile to edit
  useEffect(() => {
    if (user) loadExistingProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadExistingProfile = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("provider_profiles")
        .select(
          [
            "id",
            "user_id",
            "bio",
            "location",
            "neighborhood",
            "hourly_rate",
            "task_rate",
            "services",
            "categories",
            "years_experience",
            "child_friendly",
            "can_bring_child",
            "terms_and_conditions",
            "available",
            "stripe_account_id",
            // NEW
            "accepted_terms_at",
            "accepted_terms_version",
            "accepted_provider_agreement_at",
            "accepted_provider_agreement_version",
          ].join(",")
        )
        .eq("user_id", user.id)
        .limit(1);

      if (error) throw error;

      const row = (data?.[0] ?? null) as ProviderProfileRow | null;

      if (row) {
        setExistingProfile(row);

        setBio(row.bio || "");
        setLocation(row.location || "");
        setNeighborhood(row.neighborhood || "");
        setHourlyRate(row.hourly_rate != null ? String(row.hourly_rate) : "");
        setTaskRate(row.task_rate != null ? String(row.task_rate) : "");
        setSelectedServices(row.services || []);
        setSelectedCategories(row.categories || []);
        setYearsExperience(row.years_experience != null ? String(row.years_experience) : "");
        setChildFriendly(!!row.child_friendly);
        setCanBringChild(!!row.can_bring_child);
        setTermsAndConditions(row.terms_and_conditions || "");
        setAvailable(row.available ?? true);

        // Agreement checkbox defaults:
        // If already accepted current versions, pre-check them.
        const acceptedTermsCurrent = (row.accepted_terms_version ?? null) === TERMS_VERSION;
        const acceptedProvCurrent =
          (row.accepted_provider_agreement_version ?? null) === PROVIDER_AGREEMENT_VERSION;

        setAgreeTerms(acceptedTermsCurrent);
        setAgreeProviderAgreement(acceptedProvCurrent);

        // Load media
        const { data: media } = await supabase
          .from("provider_media")
          .select("*")
          .eq("provider_id", row.id);

        if (media) setMediaFiles(media);
      } else {
        setExistingProfile(null);
        setAgreeTerms(false);
        setAgreeProviderAgreement(false);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure a provider profile exists and get its ID (for AvailabilityForm)
  useEffect(() => {
    let cancelled = false;

    const ensureProviderProfile = async () => {
      try {
        setLoadingProvider(true);
        setProviderError(null);

        const { data: authData, error: authErr } = await supabase.auth.getUser();
        const userId = authData?.user?.id;

        if (authErr || !userId) {
          if (!cancelled) {
            setProviderError("Please log in to create a provider profile.");
            setProviderProfileId(null);
            setLoadingProvider(false);
          }
          return;
        }

        const { data: found, error: findErr } = await supabase
          .from("provider_profiles")
          .select("id")
          .eq("user_id", userId)
          .limit(1);

        if (findErr) {
          console.error(findErr);
          if (!cancelled) {
            setProviderError("Could not load your provider profile.");
            setProviderProfileId(null);
            setLoadingProvider(false);
          }
          return;
        }

        const existing = found?.[0];

        if (existing?.id) {
          if (!cancelled) {
            setProviderProfileId(existing.id);
            setLoadingProvider(false);
          }
          return;
        }

        // Create minimal profile if none exists
        const { data: created, error: createErr } = await supabase
          .from("provider_profiles")
          .insert({
            user_id: userId,
            bio: "",
            location: "",
            neighborhood: "",
            hourly_rate: 0,
            task_rate: 0,
            services: [],
            categories: [],
            verified: false,
            available: true,
            years_experience: 0,
          })
          .select("id")
          .single();

        if (createErr) {
          console.error(createErr);
          if (!cancelled) {
            setProviderError("Could not create your provider profile (permissions/RLS?).");
            setProviderProfileId(null);
            setLoadingProvider(false);
          }
          return;
        }

        if (!cancelled) {
          setProviderProfileId(created.id);
          setLoadingProvider(false);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setProviderError("Unexpected error loading provider profile.");
          setProviderProfileId(null);
          setLoadingProvider(false);
        }
      }
    };

    ensureProviderProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleCategoryToggle = (categoryId: string) => {
    if (categoryId === "all") return;
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !existingProfile) return;

    setUploadingMedia(true);
    try {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/");
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("provider-media")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const publicUrl = supabase.storage
          .from("provider-media")
          .getPublicUrl(fileName).data.publicUrl;

        const { data: mediaRecord, error: insertError } = await supabase
          .from("provider_media")
          .insert({
            provider_id: existingProfile.id,
            media_type: isVideo ? "video" : "photo",
            url: publicUrl,
            is_primary: mediaFiles.length === 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setMediaFiles((prev) => [...prev, mediaRecord]);
      }

      toast({
        title: t.common.success,
        description: "Media uploaded successfully!",
      });
    } catch (error) {
      console.error("Error uploading media:", error);
      toast({
        title: t.common.error,
        description: "Failed to upload media",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase.from("provider_media").delete().eq("id", mediaId);
      if (error) throw error;

      setMediaFiles((prev) => prev.filter((m) => m.id !== mediaId));
      toast({ title: t.common.success, description: "Media deleted successfully!" });
    } catch (error) {
      console.error("Error deleting media:", error);
      toast({
        title: t.common.error,
        description: "Failed to delete media",
        variant: "destructive",
      });
    }
  };

  const handleSetPrimary = async (mediaId: string) => {
    try {
      if (!existingProfile?.id) return;

      await supabase.from("provider_media").update({ is_primary: false }).eq("provider_id", existingProfile.id);
      await supabase.from("provider_media").update({ is_primary: true }).eq("id", mediaId);

      setMediaFiles((prev) => prev.map((m) => ({ ...m, is_primary: m.id === mediaId })));
    } catch (error) {
      console.error("Error setting primary:", error);
    }
  };

  // Stripe Connect (provider payouts)
  const connectStripe = async () => {
    if (!existingProfile?.id) {
      toast({
        title: "Save your profile first",
        description: "Please save your provider profile, then connect Stripe.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/create-connect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_profile_id: existingProfile.id }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const json = JSON.parse(text);
      if (!json?.url) throw new Error("Missing Stripe URL");
      window.location.href = json.url;
    } catch (err) {
      console.error("Stripe connect error:", err);
      toast({
        title: "Stripe error",
        description: "Could not start Stripe onboarding.",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    // Enforce agreement acceptance (especially when version changed)
    if (mustAcceptAgreements) {
      if (!agreeTerms) {
        toast({
          title: t.common.error,
          description: "Please accept the Terms & Conditions to continue.",
          variant: "destructive",
        });
        return;
      }
      if (!agreeProviderAgreement) {
        toast({
          title: t.common.error,
          description: "Please accept the Provider Agreement to continue.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true);

    try {
      const nowIso = new Date().toISOString();

      const profileData: any = {
        user_id: user.id,
        bio,
        location,
        neighborhood,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        task_rate: taskRate ? parseFloat(taskRate) : null,
        services: selectedServices,
        categories: selectedCategories,
        years_experience: yearsExperience ? parseInt(yearsExperience) : null,
        child_friendly: childFriendly,
        can_bring_child: canBringChild,
        terms_and_conditions: termsAndConditions,
        available,

        // NEW: record acceptance (always overwrite when saving, so you always have latest timestamp)
        accepted_terms_at: nowIso,
        accepted_terms_version: TERMS_VERSION,
        accepted_provider_agreement_at: nowIso,
        accepted_provider_agreement_version: PROVIDER_AGREEMENT_VERSION,
      };

      if (existingProfile?.id) {
        const { error } = await supabase
          .from("provider_profiles")
          .update(profileData)
          .eq("id", existingProfile.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("provider_profiles")
          .insert(profileData)
          .select(
            [
              "id",
              "user_id",
              "bio",
              "location",
              "neighborhood",
              "hourly_rate",
              "task_rate",
              "services",
              "categories",
              "years_experience",
              "child_friendly",
              "can_bring_child",
              "terms_and_conditions",
              "available",
              "stripe_account_id",
              "accepted_terms_at",
              "accepted_terms_version",
              "accepted_provider_agreement_at",
              "accepted_provider_agreement_version",
            ].join(",")
          )
          .single();

        if (error) throw error;
        setExistingProfile(data as ProviderProfileRow);
      }

      // Mark user as provider
      await supabase.from("profiles").update({ is_provider: true }).eq("user_id", user.id);

      // Refresh profile row (to pick up stripe_account_id after connect return, etc.)
      await loadExistingProfile();

      toast({
        title: t.common.success,
        description: t.provider.profileSaved,
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: t.common.error,
        description: t.provider.profileError,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Disable save if agreements required but not checked
  const saveDisabled = isSaving || (mustAcceptAgreements && (!agreeTerms || !agreeProviderAgreement));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <BackgroundCheckDisclaimerDialog open={showDisclaimer} onOpenChange={setShowDisclaimer} />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold">
              {existingProfile ? t.provider.editProfile : t.provider.createProfile}
            </h1>
          </div>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t.provider.location}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">{t.provider.location}</Label>
                  <Input
                    id="location"
                    placeholder={t.provider.locationPlaceholder}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">{t.provider.neighborhood}</Label>
                  <Input
                    id="neighborhood"
                    placeholder={t.provider.neighborhoodPlaceholder}
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    maxLength={100}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">{t.provider.bio}</Label>
                <Textarea
                  id="bio"
                  placeholder={t.provider.bioPlaceholder}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">{t.provider.yearsExperience}</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(e.target.value)}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t.provider.hourlyRate} / {t.provider.taskRate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">{t.provider.hourlyRate}</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="25.00"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskRate">{t.provider.taskRate}</Label>
                  <Input
                    id="taskRate"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="50.00"
                    value={taskRate}
                    onChange={(e) => setTaskRate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>{t.provider.services}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {serviceOptions.map((service) => (
                  <Badge
                    key={service}
                    variant={selectedServices.includes(service) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleServiceToggle(service)}
                  >
                    {selectedServices.includes(service) && <Check className="h-3 w-3 mr-1" />}
                    {service}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2">
                <Label>{t.provider.categories}</Label>
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter((c) => c.id !== "all")
                    .map((category) => (
                      <Badge
                        key={category.id}
                        variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => handleCategoryToggle(category.id)}
                      >
                        {selectedCategories.includes(category.id) && <Check className="h-3 w-3 mr-1" />}
                        {category.label}
                      </Badge>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mom-Friendly Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                {t.provider.childFriendly}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t.provider.childFriendly}</Label>
                  <p className="text-sm text-muted-foreground">{t.provider.childFriendlyDesc}</p>
                </div>
                <Switch checked={childFriendly} onCheckedChange={setChildFriendly} />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t.provider.canBringChild}</Label>
                  <p className="text-sm text-muted-foreground">{t.provider.canBringChildDesc}</p>
                </div>
                <Switch checked={canBringChild} onCheckedChange={setCanBringChild} />
              </div>
            </CardContent>
          </Card>

          {/* Provider “custom text” Terms box (your existing field) */}
          <Card>
            <CardHeader>
              <CardTitle>{t.provider.termsAndConditions}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t.provider.termsPlaceholder}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                rows={4}
                maxLength={2000}
              />
            </CardContent>
          </Card>

          {/* Photos & Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                {t.provider.photos}
              </CardTitle>
              <CardDescription>{t.provider.photosDesc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!existingProfile ? (
                <p className="text-sm text-muted-foreground">Save your profile first to upload media.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaFiles.map((media) => (
                    <div key={media.id} className="relative group">
                      {media.media_type === "video" ? (
                        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      ) : (
                        <img src={media.url} alt="" className="aspect-square object-cover rounded-lg" />
                      )}

                      {media.is_primary && (
                        <Badge className="absolute top-2 left-2 text-xs">
                          {t.provider.primaryPhoto}
                        </Badge>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                        {!media.is_primary && (
                          <Button size="sm" variant="secondary" onClick={() => handleSetPrimary(media.id)}>
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteMedia(media.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                    {uploadingMedia ? (
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">{t.provider.uploadMedia}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={handleMediaUpload}
                      disabled={uploadingMedia}
                    />
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Availability toggle */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t.provider.available}</Label>
                  <p className="text-sm text-muted-foreground">{t.provider.availableDesc}</p>
                </div>
                <Switch checked={available} onCheckedChange={setAvailable} />
              </div>
            </CardContent>
          </Card>

          {/* NEW: Agreements + Disclaimer */}
          <Card>
            <CardHeader>
              <CardTitle>Agreements</CardTitle>
              <CardDescription>
                {mustAcceptAgreements
                  ? "Please review and accept to continue."
                  : "You’re up to date on the latest agreements."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(needsTermsReaccept || !existingProfile) && (
                <p className="text-sm text-muted-foreground">
                  We may require re-acceptance if the agreement version changes.
                </p>
              )}

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-muted-foreground">
                  I agree to the{" "}
                  <Link to="/terms" className="underline text-foreground">
                    Terms & Conditions
                  </Link>{" "}
                  (v{TERMS_VERSION})
                  {needsTermsReaccept && <span className="text-destructive"> — required</span>}
                </span>
              </label>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={agreeProviderAgreement}
                  onChange={(e) => setAgreeProviderAgreement(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-muted-foreground">
                  I agree to the{" "}
                  <Link to="/provider-agreement" className="underline text-foreground">
                    Provider Agreement
                  </Link>{" "}
                  (v{PROVIDER_AGREEMENT_VERSION})
                  {needsProviderAgreementReaccept && <span className="text-destructive"> — required</span>}
                </span>
              </label>

              <div className="text-xs text-muted-foreground">
                Reminder: Momscellaneous does not perform background checks.{" "}
                <button type="button" className="underline" onClick={() => setShowDisclaimer(true)}>
                  Read safety notice
                </button>
                .
              </div>
            </CardContent>
          </Card>

          {/* Stripe Connect Section (payouts) */}
          {existingProfile && !existingProfile.stripe_account_id && (
            <Card>
              <CardHeader>
                <CardTitle>Enable Payouts</CardTitle>
                <CardDescription>
                  To receive money from bookings, connect your Stripe account.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button onClick={connectStripe}>Connect Stripe for Payouts</Button>
                <p className="text-xs text-muted-foreground">
                  You can do this now or later, but customers won’t be able to pay until Stripe is connected.
                </p>
              </CardContent>
            </Card>
          )}

          {existingProfile?.stripe_account_id && (
            <Card>
              <CardContent className="pt-6">
                <span className="text-secondary font-medium">
                  Stripe Connected ✅ — You can receive payouts.
                </span>
              </CardContent>
            </Card>
          )}

          {/* Availability slots + recurring */}
          <div className="mt-2">
            {loadingProvider ? (
              <div className="text-muted-foreground">Loading your provider profile…</div>
            ) : providerError ? (
              <div className="text-destructive">{providerError}</div>
            ) : providerProfileId ? (
              <AvailabilityForm providerId={providerProfileId} />
            ) : null}
          </div>

          {/* Save Button */}
          <Button size="lg" className="w-full" onClick={handleSaveProfile} disabled={saveDisabled}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saveDisabled && mustAcceptAgreements ? "Accept agreements to save" : t.provider.saveProfile}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
