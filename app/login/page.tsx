import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="bg-muted flex h-screen overflow-hidden flex-col items-center justify-center p-2 md:p-4">
      <div className="w-full max-w-sm md:max-w-3xl h-full max-h-screen overflow-y-auto flex items-center justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
