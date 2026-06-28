import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%)' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-netflix-red/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="logo-text text-5xl font-black tracking-tight mb-2">FamilyFlix</h1>
          <p className="text-white/40 text-base">Your family movie night starts here</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
