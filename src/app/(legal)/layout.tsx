import { requireVertical } from '@/lib/vertical';
import { LegalSidebar } from './legal/components/sidebar';
import { LegalHeader } from './legal/components/header';
import { Toaster } from '@/components/ui/sonner';

export default async function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireVertical('legal');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        <LegalSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <LegalHeader profile={profile} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}