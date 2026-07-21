import { useLocation } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

export default function LoginPage() {
  const { pathname } = useLocation();
  const isSignup = pathname === "/signup";

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {isSignup ? <SignupForm /> : <LoginForm />}
    </div>
  );
}
