import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import wihuriLogo from "@/assets/wihuri-agri-logo.png";

const emailSchema = z.string().email("Vigane e-posti aadress");
const passwordSchema = z.string().min(6, "Parool peab olema vähemalt 6 tähemärki");
const fullNameSchema = z.string().min(2, "Nimi peab olema vähemalt 2 tähemärki");

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signIn, signUp } = useAuthContext();
  
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
      } else if (field === "fullName") {
        fullNameSchema.parse(value);
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

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const isValidName = validateField("fullName", fullName);
    const isValidEmail = validateField("email", email);
    const isValidPassword = validateField("password", password);

    if (!isValidName || !isValidEmail || !isValidPassword) {
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);

    if (error) {
      let message = "Registreerimine ebaõnnestus";
      if (error.message.includes("User already registered")) {
        message = "See e-posti aadress on juba registreeritud";
      } else if (error.message.includes("Password")) {
        message = "Parool on liiga nõrk";
      }
      toast({
        title: "Viga",
        description: message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registreerimine õnnestus!",
        description: "Palun kontrolli oma e-posti kinnituslingi jaoks.",
      });
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
            Logi sisse või registreeru, et kasutada rakendust
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Logi sisse</TabsTrigger>
              <TabsTrigger value="signup">Registreeru</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">E-post</Label>
                  <Input
                    id="signin-email"
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
                  <Label htmlFor="signin-password">Parool</Label>
                  <Input
                    id="signin-password"
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
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Täisnimi</Label>
                  <Input
                    id="signup-name"
                    name="fullName"
                    type="text"
                    placeholder="Mari Mets"
                    required
                    disabled={isLoading}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-post</Label>
                  <Input
                    id="signup-email"
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
                  <Label htmlFor="signup-password">Parool</Label>
                  <Input
                    id="signup-password"
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
                  {isLoading ? "Laadin..." : "Registreeru"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
