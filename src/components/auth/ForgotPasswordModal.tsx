import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Mail, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/api/auth";
import { toast } from "@/components/ui/use-toast";

interface ForgotPasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialEmail?: string;
}

export function ForgotPasswordModal({ open, onOpenChange, initialEmail = "" }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timer for resend
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (open) {
      setStep(1);
      setEmail(initialEmail);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeLeft(0);
    }
  }, [open, initialEmail]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.sendPasswordResetOtp(email);
      toast({ title: "OTP Sent", description: res.message });
      setStep(2);
      setTimeLeft(60); // 60s cooldown
    } catch (err: any) {
      toast({
        title: "Failed to send OTP",
        description: err.response?.data?.error?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      toast({ title: "Error", description: "Please enter a valid OTP", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const res = await authApi.verifyOtpAndResetPassword({ email, otp, newPassword });
      toast({ title: "Success", description: res.message });
      setStep(3);
    } catch (err: any) {
      toast({
        title: "Reset Failed",
        description: err.response?.data?.error?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !loading && onOpenChange(v)}>
      <DialogContent className="max-w-md sm:rounded-xl">
        <DialogHeader>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 mx-auto">
            {step === 3 ? <CheckCircle2 className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
          </div>
          <DialogTitle className="text-center text-xl">
            {step === 1 ? "Forgot Password" : step === 2 ? "Enter OTP Code" : "Password Reset Complete"}
          </DialogTitle>
          <DialogDescription className="text-center text-xs">
            {step === 1
              ? "Enter your email address and we'll send you an OTP to reset your password."
              : step === 2
              ? `We've sent a 6-digit code to ${email}. Valid for 10 minutes.`
              : "You can now log in securely with your new password."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-xs">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@company.com"
                    className="pl-9 h-10 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <Button type="submit" className="w-full h-10" disabled={loading || !email}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send OTP
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-xs">One-Time Password</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  className="h-10 text-center tracking-[0.5em] font-mono text-lg"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pass" className="text-xs">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-pass"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="h-10 text-sm pr-9"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pass" className="text-xs">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-pass"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="h-10 text-sm pr-9"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-10" disabled={loading || !otp || !newPassword || !confirmPassword}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
              <div className="text-center mt-4">
                <button
                  type="button"
                  disabled={timeLeft > 0 || loading}
                  onClick={() => handleSendOtp()}
                  className="text-xs text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {timeLeft > 0 ? `Resend OTP in ${timeLeft}s` : "Didn't receive code? Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="space-y-4 pt-2">
              <Button onClick={() => onOpenChange(false)} className="w-full h-10">
                Return to Login
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
