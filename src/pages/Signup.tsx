import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Check, X, ArrowRight } from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSignupFlow } from "@/hooks/useSignupFlow";
import { cn } from "@/lib/utils";

const step1Schema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  companyName: z.string().trim().min(2, "Company name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid work email").max(255),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type Step1FormData = z.infer<typeof step1Schema>;

const calculatePasswordStrength = (password: string): { 
  strength: "weak" | "medium" | "strong"; 
  checks: Record<string, boolean> 
} => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  if (passedChecks < 3) return { strength: "weak", checks };
  if (passedChecks === 3) return { strength: "medium", checks };
  return { strength: "strong", checks };
};

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { toast } = useToast();
  const { setStep1Data, step1Data, password: storedPassword, setPassword } = useSignupFlow();
  const navigate = useNavigate();

  const form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    mode: "onChange",
    defaultValues: {
      fullName: step1Data?.fullName ?? "",
      companyName: step1Data?.companyName ?? "",
      email: step1Data?.email ?? "",
      password: storedPassword ?? "",
      confirmPassword: "",
    },
  });

  const { reset } = form;

  useEffect(() => {
    if (step1Data) {
      reset({
        fullName: step1Data.fullName,
        companyName: step1Data.companyName,
        email: step1Data.email,
        password: storedPassword ?? "",
        confirmPassword: "",
      });
    }
  }, [reset, step1Data, storedPassword]);

  const password = form.watch("password");
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  const onSubmit = async (data: Step1FormData) => {
    try {
      const { confirmPassword: _confirmPassword, password: passwordValue } = data;
      setStep1Data({
        fullName: data.fullName,
        companyName: data.companyName,
        email: data.email
      });
      setPassword(passwordValue);
      navigate("/signup/context");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <LandingNavbar />
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-b from-background to-muted/30">
        <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Create Your Workspace</h1>
          <p className="text-muted-foreground">Step 1 of 2</p>
        </div>

        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
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
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name <span className="text-destructive">*</span></FormLabel>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Email <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="jane@acme.com" 
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
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
                className="w-full mt-6" 
                disabled={!form.formState.isValid}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </>
  );
};

export default Signup;
