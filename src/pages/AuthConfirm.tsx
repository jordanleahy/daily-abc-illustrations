import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageLayout } from "@/components/layout/PageLayout";
import { Container } from "@/components/layout/Container";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const planType = searchParams.get("planType") as 'monthly' | 'annual' | null;

        // Check for existing session (Supabase auto-detects hash tokens)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setStatus("success");
          
          // If planType exists, redirect to Stripe checkout
            if (planType === 'monthly' || planType === 'annual') {
              const body = planType === 'monthly'
                ? { plan_type: 'monthly' }
                : { plan_type: 'annual' };
              
              const { data, error } = await supabase.functions.invoke('create-checkout', {
                body
              });

            if (error) {
              setStatus("error");
              setErrorMessage("Failed to create checkout session");
              return;
            }

            if (data?.url) {
              window.location.href = data.url;
              return;
            }
          } else {
            // No plan selected, go to library
            setTimeout(() => {
              navigate("/library", { replace: true });
            }, 2000);
          }
          return;
        }

        // Parse hash tokens (access_token, refresh_token)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            setStatus("error");
            setErrorMessage(error.message);
            return;
          }

          // Clean up URL hash
          window.history.replaceState(null, '', window.location.pathname + window.location.search);

          setStatus("success");
          
          // If planType exists, redirect to Stripe checkout
          if (planType === 'monthly' || planType === 'annual') {
            const body = planType === 'monthly' 
              ? { plan_type: 'monthly' }
              : { plan_type: 'annual' };
            
            const { data, error } = await supabase.functions.invoke('create-checkout', {
              body
            });

            if (error) {
              setStatus("error");
              setErrorMessage("Failed to create checkout session");
              return;
            }

            if (data?.url) {
              window.location.href = data.url;
              return;
            }
          } else {
            // No plan selected, go to library
            setTimeout(() => {
              navigate("/library", { replace: true });
            }, 2000);
          }
          return;
        }

        // Fallback to OTP verification (token_hash method)
        const token_hash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (!token_hash || !type) {
          setStatus("error");
          setErrorMessage("Invalid confirmation link");
          return;
        }

        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        });

        if (error) {
          setStatus("error");
          setErrorMessage(error.message);
          return;
        }

        setStatus("success");
        
        // If planType exists, redirect to Stripe checkout
        if (planType === 'monthly' || planType === 'annual') {
          const body = planType === 'monthly'
            ? { plan_type: 'monthly' }
            : { plan_type: 'annual' };
          
          const { data, error } = await supabase.functions.invoke('create-checkout', {
            body
          });

          if (error) {
            setStatus("error");
            setErrorMessage("Failed to create checkout session");
            return;
          }

          if (data?.url) {
            window.location.href = data.url;
            return;
          }
        } else {
          // No plan selected, go to library
          setTimeout(() => {
            navigate("/library", { replace: true });
          }, 2000);
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage("An unexpected error occurred");
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  return (
    <PageLayout>
      <Container className="flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Email Confirmation</CardTitle>
            <CardDescription className="text-center">
              {status === "loading" && "Confirming your email..."}
              {status === "success" && searchParams.get("planType") 
                ? "Email confirmed! Redirecting you to checkout..."
                : "Email confirmed successfully!"}
              {status === "error" && "Confirmation failed"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {status === "loading" && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {status === "success" && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <p className="text-center text-muted-foreground">
                  Redirecting you to the home page...
                </p>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-destructive" />
                <p className="text-center text-muted-foreground">{errorMessage}</p>
                <Button onClick={() => navigate("/auth")} variant="outline">
                  Back to Login
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </PageLayout>
  );
}
