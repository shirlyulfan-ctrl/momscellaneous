import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, User } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailSchema = z.string().email().max(255);
const passwordSchema = z.string().min(6).max(128);

type SignupStage = "form" | "check-email";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // NEW: shows a “check your email” screen after signup if session is null
  const [signupStage, setSignupStage] = useState<SignupStage>("form");
  const [resendLoading, setResendLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    try {
      emailSchema.parse(email);
    } catch {
      newErrors.email = t.auth.emailRequired;
    }

    try {
      passwordSchema.parse(password);
    } catch {
      newErrors.password = t.auth.passwordRequired;
    }

    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = t.auth.passwordMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetToForm = () => {
    setSignupStage("form");
    setIsLoading(false);
    setResendLoading(false);
  };

  const handleResend = async () => {
    try {
      setResendLoading(true);

      // Supabase resend confirmation email
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        toast({
          title: t.common.error,
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t.common.success,
        description: "Confirmation email resent. Please check your inbox.",
      });
    } catch (e: any) {
      toast({
        title: t.common.error,
        description: e?.message || "Could not resend email.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);

        if (error) {
          toast({
            title: t.common.error,
            description: t.auth.invalidCredentials,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: t.common.success,
          description: t.auth.loginSuccess,
        });
        navigate("/");
        return;
      }

      // SIGNUP
      // IMPORTANT: we need signUp to return { data, error } so we can detect if session is null
      const { data, error } = await signUp(email, password, fullName);

      if (error) {
        toast({
          title: t.common.error,
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // If email confirmation is ON, Supabase often returns session=null
      // In that case, show a “check your email” screen.
      const hasSession = !!data?.session;

      toast({
        title: t.common.success,
        description: hasSession
          ? t.auth.signupSuccess
          : "Account created. Please confirm your email to finish signing up.",
      });

      if (hasSession) {
        navigate("/");
      } else {
        setSignupStage("check-email");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showCheckEmail = !isLogin && signupStage === "check-email";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md">
          {showCheckEmail ? (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Check your email</CardTitle>
                <CardDescription>
                  We sent a confirmation link to <span className="font-medium">{email}</span>.
                  <br />
                  Click the link to activate your account, then come back and log in.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  Tip: If you don’t see it in 1–2 minutes, check spam/junk.
                </div>

                <Button
                  type="button"
                  className="w-full"
                  variant="secondary"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Resend confirmation email
                </Button>

                <Button
                  type="button"
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    // let them return to login quickly after confirming
                    setIsLogin(true);
                    resetToForm();
                  }}
                >
                  Back to login
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  Wrong email?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => {
                      // go back to form to change email
                      resetToForm();
                      setSignupStage("form");
                    }}
                  >
                    Change it
                  </button>
                </div>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">
                  {isLogin ? t.auth.login : t.auth.signup}
                </CardTitle>
                <CardDescription>
                  {isLogin
                    ? "Welcome back! Please enter your details."
                    : "Create an account to get started."}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">{t.auth.fullName}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Jane Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          maxLength={100}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">{t.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        maxLength={255}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t.auth.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        maxLength={128}
                      />
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">{t.auth.confirmPassword}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                          maxLength={128}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLogin ? t.auth.login : t.auth.signup}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    {isLogin ? t.auth.noAccount : t.auth.hasAccount}{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setErrors({});
                        setSignupStage("form");
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      {isLogin ? t.auth.signup : t.auth.login}
                    </button>
                  </div>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;