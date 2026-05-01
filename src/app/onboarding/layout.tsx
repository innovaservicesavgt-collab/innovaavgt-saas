import { Toaster } from 'sonner';

export const metadata = {
  title: 'Configuracion inicial - InnovaAVGT',
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors closeButton />
      {children}
    </div>
  );
}
