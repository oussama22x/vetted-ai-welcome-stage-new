import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface Step1Data {
  fullName: string;
  companyName: string;
  email: string;
}

interface SignupFlowContextValue {
  step1Data: Step1Data | null;
  setStep1Data: (data: Step1Data) => void;
  password: string | null;
  setPassword: (password: string | null) => void;
  clearStep1Data: () => void;
}

const SignupFlowContext = createContext<SignupFlowContextValue | undefined>(undefined);

export const SignupFlowProvider = ({ children }: { children: ReactNode }) => {
  const [step1Data, setStep1DataState] = useState<Step1Data | null>(null);
  const [password, setPasswordState] = useState<string | null>(null);

  const value = useMemo((): SignupFlowContextValue => ({
    step1Data,
    setStep1Data: (data: Step1Data) => setStep1DataState(data),
    password,
    setPassword: (value: string | null) => setPasswordState(value),
    clearStep1Data: () => {
      setStep1DataState(null);
      setPasswordState(null);
    },
  }), [step1Data, password]);

  return (
    <SignupFlowContext.Provider value={value}>
      {children}
    </SignupFlowContext.Provider>
  );
};

export const useSignupFlow = () => {
  const context = useContext(SignupFlowContext);
  if (!context) {
    throw new Error("useSignupFlow must be used within a SignupFlowProvider");
  }

  return context;
};
