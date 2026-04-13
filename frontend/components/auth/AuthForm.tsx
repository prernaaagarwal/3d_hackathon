"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "signup";
}

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link href="/" className="mb-10 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-gold-600">
              <span className="font-display text-lg font-bold text-navy-950">P</span>
            </div>
            <span className="font-display text-xl font-bold text-alabaster">
              Prop<span className="text-gold-400">Intel</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-alabaster">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="mt-2 text-pearl/50">
            {mode === "login"
              ? "Sign in to access your investment dashboard"
              : "Start analyzing Dubai properties with AI"}
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {mode === "signup" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-pearl/60">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pearl/30" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full rounded-xl border border-gold-500/15 bg-navy-800/60 py-3 pl-11 pr-4 text-alabaster placeholder:text-pearl/30 focus:border-gold-500/40 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-pearl/60">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pearl/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-gold-500/15 bg-navy-800/60 py-3 pl-11 pr-4 text-alabaster placeholder:text-pearl/30 focus:border-gold-500/40 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-pearl/60">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pearl/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full rounded-xl border border-gold-500/15 bg-navy-800/60 py-3 pl-11 pr-12 text-alabaster placeholder:text-pearl/30 focus:border-gold-500/40 focus:outline-none focus:ring-1 focus:ring-gold-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-pearl/30 hover:text-pearl/60"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full">
              {mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-pearl/40">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="font-medium text-gold-400 hover:text-gold-300">
                  Create one
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-gold-400 hover:text-gold-300">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </motion.div>
      </div>

      {/* Right: Decorative panel */}
      <div className="relative hidden flex-1 lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950" />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(201, 168, 76, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(201, 168, 76, 0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-2xl shadow-gold-500/20">
              <span className="font-display text-3xl font-bold text-navy-950">P</span>
            </div>
            <h2 className="font-display text-3xl font-bold text-alabaster">
              Prop<span className="text-gold-400">Intel</span>
            </h2>
            <p className="max-w-xs text-pearl/40">
              AI-powered Dubai real estate intelligence at your fingertips.
            </p>
          </div>
        </div>
        {/* Glow accents */}
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-gold-500/5 blur-[120px]" />
      </div>
    </div>
  );
};
