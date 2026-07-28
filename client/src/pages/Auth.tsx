import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Home, LogIn, User, Mail, Phone } from "lucide-react";

export default function Auth() {
  const { isAuthenticated, user, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/seller");
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[oklch(0.45_0.18_260)] border-t-transparent rounded-full" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-lg">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[oklch(0.45_0.18_260)] to-[oklch(0.72_0.15_80)] flex items-center justify-center mx-auto mb-4">
                <Home className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                Welcome to Pedi wa Real Estate
              </CardTitle>
              <CardDescription>
                Sign in to list properties, save favorites, and connect with sellers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                size="lg"
                className="w-full gap-2"
                onClick={() => startLogin()}
              >
                <LogIn className="w-5 h-5" />
                Sign In with Manus
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="lg" className="gap-2" onClick={() => startLogin()}>
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
                <Button variant="outline" size="lg" className="gap-2" onClick={() => startLogin()}>
                  <Phone className="w-4 h-4" />
                  Phone
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground pt-2">
                By signing in, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
