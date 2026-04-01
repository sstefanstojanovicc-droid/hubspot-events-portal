export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(165deg,var(--color-hub-muted)_0%,#f1f5f9_42%,#f7f8fa_100%)]">
      {children}
    </div>
  );
}
