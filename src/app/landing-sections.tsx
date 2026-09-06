import Link from "next/link";

export function Benefits() {
  const items = [
    ["Compra con criterio", "Compara precio, calidad, marca y tiempo de entrega según las necesidades de tu empresa."],
    ["Amplía tu red", "Encuentra compradores, proveedores y aliados para nuevas oportunidades de negocio."],
    ["Agiliza tus decisiones", "Reúne cotizaciones e información comercial para evaluar tus opciones en un solo lugar."],
    ["Trabaja con transparencia", "Da seguimiento a tus compras y promueve decisiones alineadas con la política de tu empresa."],
  ];
  return (
    <section aria-label="Beneficios de efness" className="border-b border-[#dbdfe9] bg-[#f9f9f9]">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([title, text]) => <div key={title}><h2 className="mb-3 text-lg font-bold text-[#293762]">{title}</h2><p className="text-sm leading-relaxed text-[#526080]">{text}</p></div>)}
      </div>
    </section>
  );
}

export function Licenses() {
  return (
    <section id="licencias" className="scroll-mt-32 bg-[#f9f9f9] px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#007da8]">Licencias</p>
        <h2 className="text-3xl font-bold text-[#293762] md:text-4xl">Una solución para cada lado del negocio</h2>
        <p className="mt-4 max-w-2xl text-[#526080]">Cuéntanos cómo compra o vende tu empresa. Te orientamos sobre las opciones de cuenta y sus condiciones antes de contratar.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {[
            ["Para compradores", "Organiza tus requisiciones, evalúa cotizaciones y elige proveedores según tus criterios de compra."],
            ["Para proveedores", "Presenta tu oferta, participa en oportunidades y da a conocer tu catálogo a nuevos compradores."],
          ].map(([title, text]) => <article key={title} className="rounded-2xl border border-[#dbdfe9] bg-white p-8"><h3 className="text-2xl font-bold text-[#293762]">{title}</h3><p className="my-5 leading-relaxed text-[#526080]">{text}</p><Link href="#contacto" className="inline-flex rounded-lg bg-[#293762] px-5 py-3 font-semibold text-white hover:bg-[#1a2442]">Consultar opciones</Link></article>)}
        </div>
      </div>
    </section>
  );
}

export function Help() {
  return (
    <section id="ayuda" className="scroll-mt-32 bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#007da8]">Ayuda</p>
        <h2 className="text-3xl font-bold text-[#293762] md:text-4xl">Conoce el recorrido antes de comenzar</h2>
        <p className="mt-4 max-w-2xl text-[#526080]">Una guía de los temas que puedes revisar con el equipo al preparar tu empresa para usar efness.</p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Tu cuenta y perfil", "Prepara la información de tu empresa e identifica si necesitas comprar, vender o ambas cosas."],
            ["Requisiciones y cotizaciones", "Define lo que necesitas comprar o revisa los requisitos de una oportunidad antes de cotizar."],
            ["Catálogo de productos", "Organiza la información, características y fichas técnicas de tu oferta comercial."],
            ["Red de aliados", "Identifica empresas con las que te interesa establecer una relación comercial."],
            ["Comparativos y decisiones", "Evalúa las propuestas por precio, calidad y condiciones; el menor precio no es el único criterio."],
            ["Órdenes de compra", "Revisa cantidades, condiciones y datos de la operación antes de acordar la adquisición."],
          ].map(([title, text]) => <article key={title} className="rounded-xl border border-[#dbdfe9] p-6"><h3 className="mb-3 font-bold text-[#293762]">{title}</h3><p className="text-sm leading-relaxed text-[#526080]">{text}</p></article>)}
        </div>
        <p className="mt-8 text-[#526080]">¿Necesitas una demostración? <Link href="#contacto" className="font-semibold text-[#293762] underline underline-offset-4">Habla con el equipo</Link>.</p>
      </div>
    </section>
  );
}

export function Faq() {
  const questions = [
    ["¿Qué es efness?", "Es una comunidad de compradores y proveedores y una plataforma para organizar procesos de compra-venta empresarial: licitaciones, cotizaciones, órdenes de compra, catálogo y relaciones comerciales."],
    ["¿A quién está dirigida?", "A empresas y profesionales que compran o venden productos y servicios, así como a sus equipos y responsables de compras y ventas."],
    ["¿Cómo funciona el proceso de compra?", "El comprador genera una requisición, los proveedores presentan cotizaciones y el comprador compara las opciones según sus necesidades. Después se definen las condiciones de adquisición y la orden de compra."],
    ["¿Qué criterios puedo considerar al comparar ofertas?", "Precio, calidad, tiempo de entrega, marca, especificaciones y otras condiciones relevantes para tu empresa. La elección comercial corresponde al comprador."],
    ["¿Dónde puedo consultar precios y licencias?", "Contacta al equipo para conocer las opciones disponibles, sus límites y condiciones vigentes. Confirma el precio y lo que incluye tu cuenta antes de contratar."],
    ["¿Efness garantiza que no habrá fraudes?", "No. La plataforma ayuda a organizar información y dar seguimiento a las decisiones, pero no sustituye la revisión de proveedores, las políticas internas ni la validación de cada operación."],
  ];
  return (
    <section id="faq" className="scroll-mt-32 bg-[#f9f9f9] px-6 py-20">
      <div className="mx-auto max-w-3xl"><h2 className="mb-10 text-3xl font-bold text-[#293762] md:text-4xl">Preguntas frecuentes</h2>
        <div className="space-y-3">{questions.map(([q, a]) => <details key={q} className="rounded-xl border border-[#dbdfe9] bg-white p-6"><summary className="cursor-pointer font-semibold text-[#293762] focus-visible:outline-2 focus-visible:outline-offset-4">{q}</summary><p className="mt-4 leading-relaxed text-[#526080]">{a}</p></details>)}</div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <section id="contacto" className="scroll-mt-32 bg-white px-6 py-20">
      <div className="mx-auto max-w-3xl text-center"><p className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#007da8]">Contáctanos</p><h2 className="text-3xl font-bold text-[#293762] md:text-4xl">Hablemos de tu empresa</h2><p className="mt-5 leading-relaxed text-[#526080]">Solicita información sobre licencias, una demostración o ayuda para comenzar. Incluye tu nombre, empresa y lo que necesitas comprar o vender.</p><a href="mailto:aaron@efness.com?subject=Informaci%C3%B3n%20sobre%20efness" className="mt-8 inline-flex rounded-xl bg-[#293762] px-7 py-3.5 font-semibold text-white hover:bg-[#1a2442]">Escribir al equipo</a><p className="mt-4 text-sm text-[#526080]">aaron@efness.com · El enlace abre tu aplicación de correo.</p></div>
    </section>
  );
}
