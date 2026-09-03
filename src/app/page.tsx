import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function RootPage() {
  const session = await auth();
  if (session?.user && !session.user.twoFactorPending) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#dbdfe9]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/efness-logo-color.svg"
            alt="efness"
            width={140}
            height={34}
            priority
          />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#293762]">
          <Link href="#features" className="hover:text-[#00ABE5] transition-colors">Funcionalidades</Link>
          <Link href="#how-it-works" className="hover:text-[#00ABE5] transition-colors">Cómo funciona</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-[#293762] hover:text-[#00ABE5] transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="inline-flex px-4 py-2 rounded-lg bg-[#00E84A] text-[#293762] text-sm font-bold hover:bg-[#00E84A]/90 transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative bg-[#293762] overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #00E84A 0%, transparent 50%), radial-gradient(circle at 80% 20%, #00ABE5 0%, transparent 45%)",
        }}
      />
      <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-36 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E84A]/15 border border-[#00E84A]/30 text-[#00E84A] text-xs font-semibold uppercase tracking-wider mb-8">
          Plataforma de licitaciones y red de negocios
        </span>
        <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight max-w-3xl mx-auto">
          Conecta, licita y{" "}
          <span className="text-[#00E84A]">haz crecer</span>{" "}
          tu negocio
        </h1>
        <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
          efness es la plataforma B2B donde empresas publican licitaciones,
          encuentran aliados estratégicos y gestionan su catálogo de productos
          en un solo lugar.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-[#00E84A] text-[#293762] font-bold text-base hover:bg-[#00E84A]/90 transition-colors shadow-lg shadow-[#00E84A]/25"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-base hover:bg-white/15 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-[#f9f9f9]" />
    </section>
  );
}

function Stats() {
  const items = [
    { value: "500+", label: "Empresas activas" },
    { value: "2,400+", label: "Licitaciones publicadas" },
    { value: "1,800+", label: "Alianzas concretadas" },
    { value: "98%", label: "Satisfacción de usuarios" },
  ];
  return (
    <section className="bg-[#f9f9f9] border-b border-[#dbdfe9]">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {items.map((s) => (
          <div key={s.label}>
            <p className="text-3xl md:text-4xl font-bold text-[#293762]">{s.value}</p>
            <p className="mt-1 text-sm text-[#78829d]">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
        </svg>
      ),
      color: "#00E84A",
      title: "Licitaciones en tiempo real",
      description:
        "Publica y participa en licitaciones con notificaciones instantáneas. Gestiona propuestas, compara ofertas y adjudica contratos desde un panel centralizado.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      ),
      color: "#00ABE5",
      title: "Red de aliados estratégicos",
      description:
        "Conecta con proveedores, distribuidores y socios de negocio verificados. Expande tu red, genera oportunidades y fortalece tu ecosistema empresarial.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
        </svg>
      ),
      color: "#293762",
      title: "Catálogo de productos",
      description:
        "Exhibe y descubre productos y servicios del ecosistema B2B. Gestiona tu catálogo con fichas detalladas y ponlo a disposición de toda la red efness.",
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
      color: "#00E84A",
      title: "Reportes e inteligencia",
      description:
        "Toma decisiones basadas en datos con reportes de actividad, tendencias de licitaciones, rendimiento de tu red y análisis de tu participación en el mercado.",
    },
  ];

  return (
    <section id="features" className="bg-white py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#00ABE5] font-semibold text-sm uppercase tracking-wider mb-3">Funcionalidades</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#293762]">Todo lo que tu empresa necesita</h2>
          <p className="mt-4 text-[#78829d] max-w-xl mx-auto">
            Una plataforma integral diseñada para empresas que quieren crecer, conectar y competir en el mercado B2B.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-[#dbdfe9] p-6 hover:border-transparent hover:shadow-xl transition-all duration-300"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ backgroundColor: `${f.color}18`, color: f.color }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-[#293762] mb-2">{f.title}</h3>
              <p className="text-sm text-[#78829d] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      step: "01",
      title: "Crea tu cuenta",
      description: "Regístrate en minutos y configura el perfil de tu empresa con información verificada.",
    },
    {
      step: "02",
      title: "Explora o publica",
      description: "Publica licitaciones, sube tu catálogo de productos o busca oportunidades activas en el mercado.",
    },
    {
      step: "03",
      title: "Conecta y crece",
      description: "Forma alianzas, adjudica contratos y amplía tu red de negocios dentro del ecosistema efness.",
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#f9f9f9] py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[#00ABE5] font-semibold text-sm uppercase tracking-wider mb-3">Cómo funciona</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#293762]">Empieza en tres pasos</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.step} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+3rem)] right-[calc(-50%+3rem)] h-px border-t-2 border-dashed border-[#dbdfe9]" />
              )}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#293762] text-white text-2xl font-bold mb-6 relative z-10">
                {s.step}
              </div>
              <h3 className="text-xl font-bold text-[#293762] mb-3">{s.title}</h3>
              <p className="text-[#78829d] leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="bg-[#293762] py-20">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <Image
          src="/efness-icon-color.svg"
          alt="efness icon"
          width={56}
          height={68}
          className="mx-auto mb-8 opacity-90"
        />
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          ¿Listo para hacer crecer tu empresa?
        </h2>
        <p className="text-white/65 mb-10 text-lg">
          Únete a las empresas que ya están transformando su forma de hacer negocios con efness.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center justify-center px-10 py-4 rounded-xl bg-[#00E84A] text-[#293762] font-bold text-lg hover:bg-[#00E84A]/90 transition-colors shadow-lg shadow-[#00E84A]/30"
        >
          Crear cuenta gratis
        </Link>
        <p className="mt-4 text-white/40 text-sm">Sin tarjeta de crédito requerida</p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#1a2442] border-t border-white/5 py-10">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <Image
          src="/efness-logo-white.svg"
          alt="efness"
          width={120}
          height={29}
        />
        <div className="flex items-center gap-6 text-sm text-white/40">
          <Link href="/login" className="hover:text-white/70 transition-colors">Iniciar sesión</Link>
          <Link href="/register" className="hover:text-white/70 transition-colors">Registrarse</Link>
        </div>
        <p className="text-white/30 text-sm">© {new Date().getFullYear()} efness. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
