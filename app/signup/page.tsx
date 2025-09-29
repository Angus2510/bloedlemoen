import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
  return (
    <div className="bg-muted flex min-h-screen flex-col items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-sm md:max-w-3xl flex items-center justify-center">
        <SignupForm />
      </div>
    </div>
  );
}
