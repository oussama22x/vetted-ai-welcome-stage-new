import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  company: z.string().trim().min(2, "Company name must be at least 2 characters").max(100),
  role: z.string().trim().min(2, "Role must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address").max(255),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const calculatePasswordStrength = (password: string): { strength: "weak" | "medium" | "strong"; checks: Record<string, boolean> } => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  if (passedChecks < 4) return { strength: "weak", checks };
  if (passedChecks === 4) return { strength: "medium", checks };
  return { strength: "strong", checks };
};

export const OnboardingWizard = ({ open, onOpenChange }: OnboardingWizardProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      company: "",
      role: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchedFields = form.watch();
  const password = form.watch("password");
  const filledFields = Object.values(watchedFields).filter(Boolean).length;
  const progress = (filledFields / 6) * 100;
  
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    
    // Simulate account creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log("Account created:", { 
      name: data.name, 
      company: data.company, 
      role: data.role,
      email: data.email 
    });
    
    setIsSubmitting(false);
    setIsSuccess(true);
    
    // Redirect after success message
    setTimeout(() => {
      setIsSuccess(false);
      onOpenChange(false);
      window.location.href = "/workspace";
    }, 2000);
  };

  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-success" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Welcome to VettedAI!</h3>
              <p className="text-muted-foreground">
                Your workspace is ready. Redirecting you now...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl">Create Your VettedAI Workspace</DialogTitle>
          <DialogDescription>
            Get started in less than a minute. No credit card required.
          </DialogDescription>
          <Progress value={progress} className="h-2" />
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Jane Doe" 
                      autoComplete="name"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Acme Inc." 
                      autoComplete="organization"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Role <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Senior Recruiter" 
                      autoComplete="organization-title"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="jane@acme.com" 
                      autoComplete="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    We'll never share your email with anyone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        autoComplete="new-password"
                        className="pr-10"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  
                  {password && passwordStrength && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Strength:</span>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          passwordStrength.strength === "weak" && "bg-destructive/10 text-destructive",
                          passwordStrength.strength === "medium" && "bg-warning/10 text-warning",
                          passwordStrength.strength === "strong" && "bg-success/10 text-success"
                        )}>
                          {passwordStrength.strength === "weak" && "Weak"}
                          {passwordStrength.strength === "medium" && "Medium"}
                          {passwordStrength.strength === "strong" && "Strong"}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.checks.length ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={passwordStrength.checks.length ? "text-success" : "text-muted-foreground"}>
                            At least 8 characters
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.checks.uppercase ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={passwordStrength.checks.uppercase ? "text-success" : "text-muted-foreground"}>
                            One uppercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.checks.lowercase ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={passwordStrength.checks.lowercase ? "text-success" : "text-muted-foreground"}>
                            One lowercase letter
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.checks.number ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={passwordStrength.checks.number ? "text-success" : "text-muted-foreground"}>
                            One number
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {passwordStrength.checks.special ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className={passwordStrength.checks.special ? "text-success" : "text-muted-foreground"}>
                            One special character (recommended)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••" 
                        autoComplete="new-password"
                        className="pr-10"
                        {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              variant="hero"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating your workspace...
                </>
              ) : (
                "Create Workspace"
              )}
            </Button>
          </form>
        </Form>

        <p className="text-xs text-center text-muted-foreground pt-4">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </DialogContent>
    </Dialog>
  );
};