import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import wihuriLogo from "@/assets/wihuri-agri-logo.png";

const emailSchema = z.string().email("Vigane e-posti aadress");
const passwordSchema = z.string().min(6, "Parool peab olema vähemalt 6 tähemärki");

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signIn } = useAuthContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateField = (field: string, value: string) => {
    try {
      if (field === "email") {
        emailSchema.parse(value);
      } else if (field === "password") {
        passwordSchema.parse(value);
      }
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        setErrors((prev) => ({ ...prev, [field]: e.errors[0].message }));
      }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!validateField("email", email) || !validateField("password", password)) {
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      let message = "Sisselogimine ebaõnnestus";
      if (error.message.includes("Invalid login credentials")) {
        message = "Vale e-posti aadress või parool";
      } else if (error.message.includes("Email not confirmed")) {
        message = "E-posti aadress pole kinnitatud. Palun kontrolli oma postkasti.";
      }
      toast({
        title: "Viga",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Sisselogimine õnnestus!" });
      navigate("/");
    }

    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Laadin...</div>
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
          <CardTitle className="text-2xl">Tehnika võrdlus</CardTitle>
          <CardDescription>
            Logi sisse oma kontoga
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="mari.mets@wihuri.ee"
                required
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parool</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Laadin..." : "Logi sisse"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
