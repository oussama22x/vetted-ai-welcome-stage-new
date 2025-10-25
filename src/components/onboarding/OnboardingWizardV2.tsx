import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, Check, X, ArrowRight } from "lucide-react";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  referralSourceEnum,
  referralSourceOptions,
} from "@/constants/referralSources";

// Step 1 Schema - Core Account Creation
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

// Step 2 Schema - Contextual Information
const step2Schema = z.object({
  userRole: z.enum(['in_house', 'hiring_manager', 'founder', 'agency', 'other'], {
    required_error: "Please select your role"
  }),
  companySize: z.enum(['1-10', '11-50', '51-200', '201+'], {
    required_error: "Please select your company size"
  }),
  referralSource: referralSourceEnum.optional()
});

type Step2FormData = z.infer<typeof step2Schema>;

interface OnboardingWizardV2Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export const OnboardingWizardV2 = ({ open, onOpenChange }: OnboardingWizardV2Props) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<Step1FormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { completeSignUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fullName: "",
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const step2Form = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      userRole: undefined,
      companySize: undefined,
      referralSource: undefined,
    },
  });

  const password = step1Form.watch("password");
  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  // Handle Step 1 submission
  const handleStep1Submit = async (data: Step1FormData) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  // Handle Step 2 submission
  const handleStep2Submit = async (data: Step2FormData) => {
    if (!step1Data) return;

    setIsSubmitting(true);
    
    try {
      // Complete signup
      const { data: authData, error } = await completeSignUp(
        step1Data.email,
        step1Data.password,
        step1Data.fullName,
        step1Data.companyName,
        data.userRole,
        data.companySize,
        data.referralSource
      );
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      
      // Show success state
      setIsSuccess(true);
      
      // Redirect to workspace
      setTimeout(() => {
        navigate('/workspace');
        onOpenChange(false);
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  // Reset wizard when closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setCurrentStep(1);
      setStep1Data(null);
      setIsSuccess(false);
      step1Form.reset();
      step2Form.reset();
    }
    onOpenChange(open);
  };

  // Success screen
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
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

  // Step 1 - Core Account Creation
  if (currentStep === 1) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl">Create Your VettedAI Workspace</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Step 1 of 2
            </DialogDescription>
          </DialogHeader>

          <Form {...step1Form}>
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4 pt-4">
              <FormField
                control={step1Form.control}
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
                control={step1Form.control}
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
                control={step1Form.control}
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
                control={step1Form.control}
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
                control={step1Form.control}
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
                disabled={!step1Form.formState.isValid}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // Step 2 - Contextual Information
  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent className="sm:max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl">A Little More About You</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            This helps us tailor your VettedAI experience. Step 2 of 2
          </DialogDescription>
        </DialogHeader>

        <Form {...step2Form}>
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-6 pt-4">
            <FormField
              control={step2Form.control}
              name="userRole"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>What is your role? <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="in_house" id="in_house" />
                        <Label htmlFor="in_house" className="font-normal cursor-pointer">
                          In-house Recruiter
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hiring_manager" id="hiring_manager" />
                        <Label htmlFor="hiring_manager" className="font-normal cursor-pointer">
                          Hiring Manager
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="founder" id="founder" />
                        <Label htmlFor="founder" className="font-normal cursor-pointer">
                          Founder
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="agency" id="agency" />
                        <Label htmlFor="agency" className="font-normal cursor-pointer">
                          Agency Recruiter
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other" className="font-normal cursor-pointer">
                          Other
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step2Form.control}
              name="companySize"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>What is your company size? <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1-10" id="1-10" />
                        <Label htmlFor="1-10" className="font-normal cursor-pointer">
                          1-10 employees
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="11-50" id="11-50" />
                        <Label htmlFor="11-50" className="font-normal cursor-pointer">
                          11-50
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="51-200" id="51-200" />
                        <Label htmlFor="51-200" className="font-normal cursor-pointer">
                          51-200
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="201+" id="201+" />
                        <Label htmlFor="201+" className="font-normal cursor-pointer">
                          201+
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={step2Form.control}
              name="referralSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    How did you hear about us? <span className="text-muted-foreground text-xs">(Optional)</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {referralSourceOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isSubmitting || !step2Form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating your workspace...
                </>
              ) : (
                <>
                  Create My Workspace <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};