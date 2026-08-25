import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumCheckoutDialog, type PremiumCheckoutPlan } from "@/components/PremiumCheckoutDialog";
import { parsePremiumCheckoutPlanId, type PremiumCheckoutSubmission } from "@/lib/premiumCheckout";
import { Check, Crown, Loader2, Zap, Star, Shield, BarChart3, Video, Image, Share2, Headphones, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearch } from "wouter";

const planIcons = [Building2, Crown, Star];

const featureLabels: Record<string, string> = {
  maxImages: "Image uploads",
  maxVideos: "Video uploads",
  featured: "Featured listings",
  prioritySearch: "Priority search placement",
  aiDescriptions: "AI-generated descriptions",
  aiPriceRecommendations: "AI price recommendations",
  leadManagement: "Lead management dashboard",
  verifiedBadge: "Verified badge",
  agencyBranding: "Agency branding",
  socialSharing: "Social media sharing",
  prioritySupport: "Priority support",
};

const featureIcons: Record<string, any> = {
  maxImages: Image,
  maxVideos: Video,
  featured: Star,
  prioritySearch: Zap,
  aiDescriptions: Crown,
  aiPriceRecommendations: BarChart3,
  leadManagement: BarChart3,
  verifiedBadge: Shield,
  agencyBranding: Building2,
  socialSharing: Share2,
  prioritySupport: Headphones,
};

export default function Premium() {
  const { user, isAuthenticated } = useAuth();
  const search = useSearch();
  const [activeTab, setActiveTab] = useState("plans");
  const [subscribing, setSubscribing] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PremiumCheckoutPlan | null>(null);
  const directCheckoutHandled = useRef<number | null>(null);
  const requestedCheckoutPlanId = useMemo(() => parsePremiumCheckoutPlanId(search), [search]);
  const mockMpesaEnabled = user?.role === "admin";

  const { data: plans, isLoading: plansLoading } = trpc.subscription.plans.useQuery();
  const { data: mySub, isLoading: subLoading } = trpc.subscription.mySubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: paymentHistory } = trpc.subscription.paymentHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myFeatured, isLoading: featuredLoading } = trpc.subscription.featuredListings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!requestedCheckoutPlanId || !plans?.length || directCheckoutHandled.current === requestedCheckoutPlanId) return;
    const selectedPlan = plans.find((plan) => plan.id === requestedCheckoutPlanId);
    if (!selectedPlan) return;
    directCheckoutHandled.current = requestedCheckoutPlanId;
    setCheckoutPlan({ id: selectedPlan.id, name: selectedPlan.name, price: selectedPlan.price, period: selectedPlan.period, currency: selectedPlan.currency });
    window.history.replaceState({}, "", "/premium");
  }, [plans, requestedCheckoutPlanId]);

  const utils = trpc.useUtils();

  const subscribeMutation = trpc.subscription.subscribe.useMutation({
    onSuccess: (data) => {
      setSubscribing(false);
      setCheckoutPlan(null);
      toast.success(`Membership request confirmed for the ${data.plan.name} plan. Your premium benefits are now active.`);
      utils.subscription.mySubscription.invalidate();
      utils.subscription.paymentHistory.invalidate();
      setActiveTab("my-subscription");
    },
    onError: (err) => {
      setSubscribing(false);
      toast.error(err.message || "Failed to subscribe");
    },
  });

  const mockMpesaMutation = trpc.subscription.mockMpesaCheckout.useMutation({
    onSuccess: (data) => {
      setSubscribing(false);
      setCheckoutPlan(null);
      utils.subscription.mySubscription.invalidate();
      utils.subscription.paymentHistory.invalidate();
      setActiveTab(data.outcome === "success" ? "my-subscription" : "payments");
      const message = data.outcome === "success"
        ? "Mock M-Pesa success recorded. Test premium benefits are active."
        : data.outcome === "pending"
          ? "Mock M-Pesa payment recorded as pending. No benefits were activated."
          : "Mock M-Pesa failure recorded. No benefits were activated.";
      toast.success(message);
    },
    onError: (err) => {
      setSubscribing(false);
      toast.error(err.message || "Unable to run the mock M-Pesa sandbox");
    },
  });

  const handleSubscribe = async ({ method, reference, mockOutcome }: PremiumCheckoutSubmission) => {
    if (!isAuthenticated) {
      startLogin();
      return;
    }
    if (!checkoutPlan) return;
    setSubscribing(true);
    try {
      if (method === "mpesa" && mockOutcome) {
        await mockMpesaMutation.mutateAsync({ planId: checkoutPlan.id, outcome: mockOutcome });
        return;
      }
      await subscribeMutation.mutateAsync({ planId: checkoutPlan.id, method, reference });
    } catch {
      setSubscribing(false);
    }
  };

  const cancelMutation = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled. Benefits remain until end of billing period.");
      utils.subscription.mySubscription.invalidate();
    },
    onError: (err) => toast.error(err.message || "Failed to cancel"),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <Crown className="w-14 h-14 text-[oklch(0.72_0.15_80)] mx-auto mb-3" />
            <CardTitle className="text-2xl">Premium Membership</CardTitle>
            <CardDescription>Sign in to view premium plans and upgrade your account</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={startLogin} className="w-full bg-[oklch(0.45_0.18_260)] hover:bg-[oklch(0.4_0.17_260)]">
              Sign In to Continue
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[oklch(0.42_0.18_260)] via-[oklch(0.48_0.18_260)] to-[oklch(0.38_0.14_280)] text-white">
        <div className="container py-12 md:py-16">
          <div className="flex items-center gap-3 mb-3">
            <Crown className="w-10 h-10 text-[oklch(0.8_0.15_80)]" />
            <h1 className="text-3xl md:text-4xl font-bold">Premium Membership</h1>
          </div>
          <p className="text-blue-100 max-w-2xl text-lg">
            Unlock powerful tools to grow your real estate business. Featured listings, AI-powered tools,
            video uploads, and priority support — all in one subscription.
          </p>
        </div>
      </div>

      <div className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto">
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="my-subscription">My Subscription</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="featured">Featured Listings</TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans">
            {plansLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {plans?.map((plan, i) => {
                  const Icon = planIcons[i] || Crown;
                  const isCurrentPlan = mySub?.plan?.id === plan.id;
                  const bestValue = (plan.maxVideos ?? 0) >= 5;
                  return (
                    <Card key={plan.id} className={`relative overflow-hidden flex flex-col ${isCurrentPlan ? "ring-2 ring-[oklch(0.45_0.18_260)]" : ""} ${bestValue ? "shadow-xl" : ""}`}>
                      {bestValue && (
                        <div className="absolute top-0 right-0">
                          <Badge className="bg-[oklch(0.72_0.15_80)] text-white rounded-bl-lg rounded-tr-none">Best Value</Badge>
                        </div>
                      )}
                      {isCurrentPlan && (
                        <div className="absolute top-0 left-0 z-10">
                          <Badge className="bg-emerald-600 text-white rounded-br-lg rounded-tl-none">Current Plan</Badge>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Icon className="w-6 h-6 text-[oklch(0.45_0.18_260)]" />
                          <CardTitle>{plan.name}</CardTitle>
                        </div>
                        <CardDescription>{plan.description}</CardDescription>
                        <div className="mt-2">
                          <span className="text-3xl font-bold text-[oklch(0.35_0.15_260)]">KES {plan.price.toLocaleString()}</span>
                          <span className="text-gray-500">/{plan.period === "monthly" ? "month" : "year"}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <ul className="space-y-2.5">
                          <li className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                            Up to {plan.maxImages} images per listing
                          </li>
                          {(plan.maxVideos ?? 0) > 0 && (
                            <li className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              Up to {plan.maxVideos} property videos
                            </li>
                          )}
                          {(plan.maxVideos ?? 0) === 0 && (
                            <li className="flex items-center gap-2 text-sm text-gray-400">
                              <Check className="w-4 h-4 shrink-0 invisible" />
                              No video uploads
                            </li>
                          )}
                          {plan.featured && (
                            <li className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              Featured listings available
                            </li>
                          )}
                          {plan.prioritySearch && (
                            <li className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              Priority in search results
                            </li>
                          )}
                          {plan.aiDescriptions && (
                            <li className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              AI-generated descriptions
                            </li>
                          )}
                          {plan.aiPriceRecommendations && (
                            <li className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              AI price recommendations
                            </li>
                          )}
                          {plan.verifiedBadge && (
                            <li className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              Verified badge on profile & listings
                            </li>
                          )}
                          {plan.leadManagement && (
                            <li className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              Listing analytics dashboard
                            </li>
                          )}
                          {plan.agencyBranding && (
                            <li className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              Agency branding
                            </li>
                          )}
                          {plan.prioritySupport && (
                            <li className="flex items-center gap-2 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                              Priority customer support
                            </li>
                          )}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        {isCurrentPlan ? (
                          <Button variant="outline" className="w-full" disabled>
                            Current Plan
                          </Button>
                        ) : (
                          <Button
                            className="w-full bg-[oklch(0.45_0.18_260)] hover:bg-[oklch(0.4_0.17_260)]"
                            disabled={subscribing}
                            onClick={() => setCheckoutPlan({ id: plan.id, name: plan.name, price: plan.price, period: plan.period, currency: plan.currency })}
                          >
                            Continue to payment
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Subscription Tab */}
          <TabsContent value="my-subscription">
            <Card>
              <CardHeader>
                <CardTitle>My Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                {subLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : mySub ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Plan</p>
                        <p className="font-semibold text-lg">{mySub.plan?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge variant={mySub.subscription.status === "active" ? "default" : "secondary"}>
                          {mySub.subscription.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Start Date</p>
                        <p className="font-medium">{new Date(mySub.subscription.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">End Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {mySub.subscription.endDate ? new Date(mySub.subscription.endDate).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-medium">KES {mySub.plan?.price?.toLocaleString()} / {mySub.plan?.period}</p>
                      </div>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-2">Active Benefits</h4>
                      <div className="flex flex-wrap gap-2">
                        {mySub.plan && Object.entries(mySub.plan).map(([key, value]) => {
                          if (typeof value === "boolean" && value && featureLabels[key]) {
                            const Icon = featureIcons[key] || Check;
                            return (
                              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {featureLabels[key]}
                              </Badge>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                    {mySub.subscription.status === "active" && (
                      <Button
                        variant="outline"
                        className="mt-4 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={cancelMutation.isPending}
                        onClick={() => {
                          if (window.confirm("Cancel your subscription? Benefits remain until the end of the billing period.")) {
                            cancelMutation.mutate({ subscriptionId: mySub.subscription.id });
                          }
                        }}
                      >
                        {cancelMutation.isPending ? "Cancelling..." : "Cancel Subscription"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <Crown className="w-12 h-12 mx-auto mb-3 text-[oklch(0.8_0.15_80)]" />
                    <p className="font-medium text-gray-700 mb-1">You are on the free plan</p>
                    <p className="text-sm mb-4">Upgrade to Premium to unlock featured listings, AI tools, and more.</p>
                    <Button onClick={() => setActiveTab("plans")} className="bg-[oklch(0.45_0.18_260)] hover:bg-[oklch(0.4_0.17_260)]">
                      View Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment History Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentHistory && paymentHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-2 pr-4">Date</th>
                          <th className="pb-2 pr-4">Description</th>
                          <th className="pb-2 pr-4">Method</th>
                          <th className="pb-2 pr-4">Reference</th>
                          <th className="pb-2 pr-4">Status</th>
                          <th className="pb-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((p) => (
                          <tr key={p.id} className="border-b last:border-0">
                            <td className="py-2.5 pr-4 whitespace-nowrap">{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td className="py-2.5 pr-4">{p.description}</td>
                            <td className="py-2.5 pr-4 capitalize">{p.method.replace("_", " ")}</td>
                            <td className="py-2.5 pr-4 font-mono text-xs text-gray-600">{p.reference || "—"}</td>
                            <td className="py-2.5 pr-4">
                              <Badge variant={p.status === "completed" ? "default" : "secondary"} className="text-xs">
                                {p.status}
                              </Badge>
                            </td>
                            <td className="py-2.5 text-right font-medium">KES {p.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500 text-sm">No payments yet.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Featured Listings Tab */}
          <TabsContent value="featured">
            <Card>
              <CardHeader>
                <CardTitle>My Featured Listings</CardTitle>
                <CardDescription>Manage your featured property placements</CardDescription>
              </CardHeader>
              <CardContent>
                {featuredLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : myFeatured && myFeatured.length > 0 ? (
                  <div className="space-y-3">
                    {myFeatured.map((f) => (
                      <div key={f.id} className="flex items-center justify-between border rounded-lg p-4">
                        <div>
                          <p className="font-medium">{f.propertyTitle}</p>
                          <p className="text-sm text-gray-500">
                            Featured until {new Date(f.featuredUntil).toLocaleDateString()}
                            {new Date(f.featuredUntil) < new Date() ? " (expired)" : ""}
                          </p>
                        </div>
                        <Badge variant={new Date(f.featuredUntil) > new Date() ? "default" : "secondary"}>
                          {new Date(f.featuredUntil) > new Date() ? "Active" : "Expired"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500 text-sm">
                    You have not featured any listings yet. Feature a listing from your Seller Dashboard to get priority placement.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <PremiumCheckoutDialog
        plan={checkoutPlan}
        open={Boolean(checkoutPlan)}
        isSubmitting={subscribing || mockMpesaMutation.isPending}
        mockMpesaEnabled={mockMpesaEnabled}
        onClose={() => { if (!subscribing) setCheckoutPlan(null); }}
        onConfirm={handleSubscribe}
      />
    </div>
  );
}
