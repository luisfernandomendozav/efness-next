"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type RegisterActionState } from "@/server/auth/register-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  email_taken: "Este correo ya está registrado.",
  rfc_taken: "Este RFC / Tax ID ya está registrado.",
  password_mismatch: "Las contraseñas no coinciden.",
  validation_error: "Por favor revisa los datos ingresados.",
  server_error: "Ocurrió un error inesperado. Intenta de nuevo.",
};

type Step1 = {
  name: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [step1, setStep1] = useState<Step1>({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [stepError, setStepError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<RegisterActionState, FormData>(
    registerAction,
    undefined,
  );

  if (state?.success) {
    return <SuccessScreen email={step1.email} />;
  }

  function handleStep1(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStepError(null);
    if (step1.password.length < 8) {
      setStepError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (step1.password !== step1.confirmPassword) {
      setStepError("Las contraseñas no coinciden.");
      return;
    }
    setStep(2);
  }

  return (
    <div>
      <h1 className="mb-1 text-center text-3xl font-bold text-[#f9f9f9]">Crear cuenta</h1>
      <p className="mb-6 text-center text-sm text-white/50">
        Paso {step} de 2 — {step === 1 ? "Información personal" : "Tu empresa"}
      </p>

      <div className="mb-8 h-1 rounded-full bg-white/10">
        <div
          className="h-1 rounded-full bg-[#00E84A] transition-all duration-300"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>

      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-4">
          {stepError && <ErrorBox message={stepError} />}

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Nombre"
              id="name"
              value={step1.name}
              onChange={(v) => setStep1((s) => ({ ...s, name: v }))}
              required
            />
            <Field
              label="Apellido"
              id="lastName"
              value={step1.lastName}
              onChange={(v) => setStep1((s) => ({ ...s, lastName: v }))}
              required
            />
          </div>

          <Field
            label="Correo electrónico"
            id="email"
            type="email"
            autoComplete="email"
            value={step1.email}
            onChange={(v) => setStep1((s) => ({ ...s, email: v }))}
            required
          />

          <div className="space-y-1">
            <Field
              label="Contraseña"
              id="password"
              type="password"
              autoComplete="new-password"
              value={step1.password}
              onChange={(v) => setStep1((s) => ({ ...s, password: v }))}
              required
            />
            <PasswordStrength password={step1.password} />
          </div>

          <Field
            label="Confirmar contraseña"
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={step1.confirmPassword}
            onChange={(v) => setStep1((s) => ({ ...s, confirmPassword: v }))}
            required
          />

          <Button type="submit" className="h-11 w-full font-semibold">
            Siguiente →
          </Button>

          <p className="text-center text-sm text-[#f9f9f9]">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-bold text-primary underline hover:text-primary/80"
            >
              Iniciar sesión
            </Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form action={formAction} className="space-y-4">
          {/* Step 1 hidden values */}
          <input type="hidden" name="name" value={step1.name} />
          <input type="hidden" name="lastName" value={step1.lastName} />
          <input type="hidden" name="email" value={step1.email} />
          <input type="hidden" name="password" value={step1.password} />
          <input type="hidden" name="confirmPassword" value={step1.confirmPassword} />

          {state?.error && <ErrorBox message={ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.server_error} />}

          <p className="text-sm text-white/60">
            Crea el perfil de tu empresa. Podrás completar más información después.
          </p>

          <Field label="Nombre de la empresa" id="companyName" name="companyName" required />

          <div>
            <Field label="RFC / Tax ID" id="rfcTaxId" name="rfcTaxId" required />
            <p className="mt-1 text-xs text-white/40">
              Identificador fiscal único de tu empresa.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-11 flex-1 rounded-lg border border-white/20 text-sm font-semibold text-white/80 hover:bg-white/5 transition-colors"
            >
              ← Atrás
            </button>
            <Button
              type="submit"
              className="h-11 flex-1 font-semibold"
              disabled={pending}
            >
              {pending ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </div>

          <p className="text-center text-sm text-[#f9f9f9]">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="font-bold text-primary underline hover:text-primary/80"
            >
              Iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  id,
  name,
  type = "text",
  autoComplete,
  value,
  onChange,
  required,
}: {
  label: string;
  id: string;
  name?: string;
  type?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="font-semibold text-[#f9f9f9]">
        {label}
      </Label>
      <Input
        id={id}
        name={name ?? id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        className="h-11 bg-white text-[#4b5675]"
        required={required}
      />
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const long = password.length >= 8;

  const score = [long, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  const labels = ["", "Muy débil", "Débil", "Regular", "Fuerte"];
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-[#00E84A]"];

  return (
    <div className="px-0.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${i <= score ? colors[score] : "bg-white/10"}`}
          />
        ))}
      </div>
      <p className="text-xs text-white/40">{labels[score]}</p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-destructive bg-[#ffeef3] px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

function SuccessScreen({ email }: { email: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#00E84A]/15">
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8 text-[#00E84A]"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="mb-3 text-2xl font-bold text-white">¡Cuenta creada!</h2>
      <p className="text-white/60 mb-1">Te enviamos un enlace de verificación a</p>
      <p className="font-semibold text-[#00E84A] mb-6">{email}</p>
      <p className="text-sm text-white/40 mb-8">
        Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
      </p>
      <Link
        href="/login"
        className="text-sm text-white/50 underline hover:text-white/80 transition-colors"
      >
        Volver al inicio de sesión
      </Link>
    </div>
  );
}
