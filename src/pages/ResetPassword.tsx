import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import wihuriLogo from "@/assets/wihuri-agri-logo.png";

const passwordSchema = z.string().min(6, "Parool peab olema vähemalt 6 tähemärki");

const isPasswordSetupFlow = () => {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace("#", "?"));
  const authLinkType = queryParams.get("type") || hashParams.get("type");

  return (
    authLinkType === "invite" ||
    authLinkType === "recovery" ||
    hashParams.has("access_token") ||
    queryParams.has("access_token")
  );
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fromEmailLink = isPasswordSetupFlow();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && fromEmailLink) || !!session) {
        setIsReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsReady(true);
      } else if (!fromEmailLink) {
        navigate("/auth", { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;

    // Validate password
    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setErrors({ password: err.errors[0].message });
      }
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({
        title: "Viga",
        description: "Parooli seadistamine ebaõnnestus. Proovi uuesti.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Parool edukalt salvestatud!",
      });
      window.history.replaceState({}, "", window.location.pathname);
      navigate("/", { replace: true });
    }

    setIsLoading(false);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={wihuriLogo} alt="Wihuri Agri" className="h-16 w-auto" />
            </div>
            <CardTitle className="text-2xl">Parooli seadistamine</CardTitle>
            <CardDescription>
              Linki töödeldakse, palun oota...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={wihuriLogo} alt="Wihuri Agri" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Tere tulemast! Palun määra omale parool.</CardTitle>
          <CardDescription>
            Sisesta uus parool, et jätkata rakenduse kasutamist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Uus parool</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Vähemalt 6 tähemärki"
                required
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Salvestan..." : "Salvesta parool"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
