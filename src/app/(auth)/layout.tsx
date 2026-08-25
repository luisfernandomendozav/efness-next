export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold tracking-tight">efness</span>
        </div>
        {children}
      </div>
    </main>
  );
}
