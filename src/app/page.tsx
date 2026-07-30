"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck, Building2, HelpCircle, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/login");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push("/dashboard");
          }
        }
      } catch (err) {}
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Successful Login -> Redirect to role-based dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans selection:bg-red-600 selection:text-white relative">
      {/* Top Clean White Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 lg:px-12 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <Image
            src="/fhi.png"
            alt="Filipino Homes | Leuterio Realty"
            width={180}
            height={75}
            className="object-contain h-9 w-auto"
            priority
          />
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            Invoicing Portal
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <a
            href="#"
            className="text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 font-medium"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Help & Support
          </a>
          <span className="h-4 w-px bg-slate-200" />
          <span className="text-slate-500 font-mono">v2.4.0</span>
        </div>
      </header>

      {/* Main Split Layout */}
      <section className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 p-6 lg:p-12 items-center z-10">
        
        {/* Left Hero Branding Banner */}
        <div className="lg:col-span-6 space-y-6 lg:pr-6 hidden lg:block">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <Building2 className="w-4 h-4 text-red-600" />
            Official Leuterio Realty Portal
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Streamlined <br />
            <span className="text-red-600">
              Commission Invoicing
            </span> <br />
            & Agent Management
          </h1>

          <p className="text-slate-600 text-base leading-relaxed max-w-lg">
            Manage your billing records, track payouts, verify subteams, and generate automated PDF invoices with enterprise-grade security.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-200 max-w-md">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-2xl font-black text-slate-900 font-mono">100%</span>
              <p className="text-xs text-slate-600 mt-1 font-medium">Verified Ledger Records</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl shadow-xs">
              <span className="text-2xl font-black text-red-600 font-mono">Real-time</span>
              <p className="text-xs text-slate-600 mt-1 font-medium">Team & Payout Tracking</p>
            </div>
          </div>
        </div>

        {/* Right Modern Clean White Card */}
        <div className="lg:col-span-6 w-full max-w-xl mx-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
            {/* Top Red Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-600" />

            {/* Mobile Branding Logo */}
            <div className="mb-6 lg:hidden flex justify-center">
              <Image
                src="/leuteriorealty.svg"
                alt="Leuterio Realty"
                width={180}
                height={80}
                className="object-contain"
                priority
              />
            </div>

            {/* Form Header */}
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Sign In to Account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Please enter your credentials to log in to your account.
              </p>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Inputs Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email / Username Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Email or Username <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@leuteriorealty.com"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10 transition-all font-medium placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password <span className="text-red-600">*</span>
                  </label>
                  <a
                    href="#"
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-xl pl-11 pr-11 py-3.5 focus:outline-none focus:border-red-600 focus:bg-white focus:ring-2 focus:ring-red-600/10 transition-all font-medium placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 bg-slate-50 text-red-600 focus:ring-red-600/20 cursor-pointer"
                  />
                  <span>Keep me signed in on this device</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-base py-3.5 rounded-xl shadow-md transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Security Note */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Protected by 256-bit encrypted authentication</span>
            </div>
          </div>
        </div>

      </section>

      {/* Clean White Footer */}
      <footer className="w-full bg-white border-t border-slate-200 px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          © {new Date().getFullYear()} Leuterio Realty & Brokerage. All rights reserved.
        </div>
        <div className="flex items-center gap-6 font-medium">
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
          <a href="https://leuteriorealty.com" target="_blank" rel="noreferrer" className="text-red-600 hover:text-red-700 font-mono font-semibold">
            leuteriorealty.com
          </a>
        </div>
      </footer>
    </main>
  );
}
