import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPain } from "@/components/landing/LandingPain";
import { LandingPromise } from "@/components/landing/LandingPromise";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";

export default function LandingPage() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/app" replace />;

  return (
    <div className="font-body overflow-x-hidden">
      <LandingNav />
      <LandingHero />
      <LandingPain />
      <LandingPromise />
      <LandingFeatures />
      <LandingSocialProof />
    </div>
  );
}
