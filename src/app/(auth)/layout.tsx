import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex min-h-screen flex-1 items-center justify-center p-5"
      style={{
        background:
          "linear-gradient(var(--efness-navy-top), var(--efness-navy-bottom))",
      }}
    >
      <div className="w-full max-w-[400px]">
        <div className="mb-16 flex justify-center">
          <Image
            src="/efness-logo-dark.png"
            alt="eFness"
            width={231}
            height={61}
            className="h-[45px] w-auto"
            priority
          />
        </div>
        {children}
      </div>
    </main>
  );
}
