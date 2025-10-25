import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

// Validation schema for admin signup
const adminSignupSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  companyName: z.string().trim().max(200, "Company name must be less than 200 characters").optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Validation schema for admin login
const adminLoginSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(255, "Email must be less than 255 characters"),
  password: z.string().min(1, "Password is required")
});

const GENERIC_SIGNUP_MESSAGE = "If your email is authorized, you will receive a confirmation link.";

export default function AdminAuth() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    email: "", 
    password: "", 
    confirmPassword: "",
    fullName: "",
    companyName: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input
      const validation = adminLoginSchema.safeParse(loginData);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await signIn(validation.data.email, validation.data.password);
      
      if (error) {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Check if user is admin after login
      const { data: isAdmin } = await supabase.rpc('is_admin');
      
      if (!isAdmin) {
        await supabase.auth.signOut();
        toast({
          title: "Access denied",
          description: "This account does not have admin privileges.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in as admin.",
      });
      
      navigate('/admin/dashboard');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate input with zod schema
      const validation = adminSignupSchema.safeParse(signupData);
      if (!validation.success) {
        const firstError = validation.error.errors[0];
        toast({
          title: "Validation Error",
          description: firstError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const validatedData = validation.data;
      const normalizedEmail = validatedData.email.toLowerCase();

      console.log('Starting admin signup for:', normalizedEmail);

      const showGenericSignupMessage = () =>
        toast({
          title: "Check your email",
          description: GENERIC_SIGNUP_MESSAGE,
        });

      const handleGenericSuccessResponse = () => {
        showGenericSignupMessage();
        navigate('/admin/login');
      };

      console.log('Creating auth user...');

      // Create auth user with validated data
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: validatedData.password,
        options: {
          data: {
            full_name: validatedData.fullName
          },
          emailRedirectTo: `${window.location.origin}/admin/dashboard`
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        const errorMessage = authError.message?.toLowerCase() || "";
        if (errorMessage.includes('already registered') || errorMessage.includes('already exists')) {
          handleGenericSuccessResponse();
          return;
        }
        throw new Error(`Signup failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error("Failed to create user account");
      }

      console.log('User created successfully:', authData.user.id);

      // Check if email is whitelisted using RPC after user creation
      const { data: isWhitelisted, error: whitelistError } = await supabase
        .rpc('is_email_whitelisted', { email: normalizedEmail });

      if (whitelistError) {
        console.error('Whitelist check error:', whitelistError);
        throw new Error('Failed to verify email authorization');
      }

      if (!isWhitelisted) {
        console.log('Email not whitelisted; skipping admin provisioning.');
        handleGenericSuccessResponse();
        return;
      }

      console.log('Email whitelisted, provisioning admin access...');

      // Create recruiter profile for admin (so they can test features)
      const { error: recruiterError } = await supabase.from('recruiters').insert({
        user_id: authData.user.id,
        email: normalizedEmail,
        full_name: validatedData.fullName,
        company_name: validatedData.companyName || 'VettedAI Team',
        status: 'active'
      });

      if (recruiterError) {
        console.error('Recruiter profile creation error:', recruiterError);
        // Don't fail completely, but log it
      }

      if (authData.session) {
        console.log('Granting admin role...');

        // Grant admin role when session is active
        const { error: roleError } = await supabase.rpc('grant_admin_role', {
          user_email: normalizedEmail
        });

        if (roleError) {
          console.error('Role grant error:', roleError);
          throw new Error(`Failed to grant admin role: ${roleError.message}`);
        }

        console.log('Admin role granted, verifying...');

        // Verify role was actually granted
        const { data: roleCheck, error: roleCheckError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleCheckError) {
          console.error('Role verification error:', roleCheckError);
          throw new Error('Failed to verify admin role assignment');
        }

        if (!roleCheck) {
          console.error('Admin role not found in user_roles table');
          throw new Error('Admin role was not properly assigned. Please contact support.');
        }

        console.log('Admin role verified successfully');

        handleGenericSuccessResponse();
      } else {
        console.log('No active session returned after signup; relying on automatic whitelist trigger.');

        handleGenericSuccessResponse();
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Access</CardTitle>
          <CardDescription>
            Restricted area for authorized administrators only
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@vettedai.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login as Admin"
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-company">Company Name (Optional)</Label>
                  <Input
                    id="signup-company"
                    type="text"
                    placeholder="VettedAI"
                    value={signupData.companyName}
                    onChange={(e) => setSignupData({ ...signupData, companyName: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="admin@vettedai.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    value={signupData.confirmPassword}
                    onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Admin Account"
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Only whitelisted emails can create admin accounts
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}