"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowRight, BadgeCheck, Building2, Camera, Check, Loader2, MapPin, Sparkles } from "lucide-react";
import { authService, type OnboardingPayload, type OnboardingRole as ApiOnboardingRole } from "@/features/auth/client/auth.service";
import { useAuth } from "@/shared/hooks/useAuth";
import { cn } from "@/shared/lib/utils";
import { pageTransition, premiumEase } from "@/lib/animations";

type OnboardingRole = "organisateur" | "prestataire" | "gestionnaire";

interface ChoiceField {
  type: "choices";
  key: string;
  label: string;
  options: string[];
  multiple?: boolean;
}

interface TextField {
  type: "text" | "textarea" | "number" | "file";
  key: string;
  label: string;
  placeholder?: string;
  maxLength?: number;
}

type Field = ChoiceField | TextField;

interface OnboardingStep {
  eyebrow: string;
  title: string;
  description: string;
  fields: Field[];
}

interface RoleConfig {
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
  accent: string;
  cta: string;
  steps: OnboardingStep[];
}

type FormState = Record<string, string | string[]>;
type OnboardingPayloadValue = string | string[] | number;

const ROLE_CONFIGS: Record<OnboardingRole, RoleConfig> = {
  organisateur: {
    title: "Onboarding organisateur",
    subtitle: "Structurez votre espace pour passer de l'intention à l'événement publié.",
    icon: Sparkles,
    accent: "bg-teal-pale text-teal",
    cta: "Accéder à mon tableau de bord",
    steps: [
      {
        eyebrow: "Activité",
        title: "Votre rythme d'organisation",
        description: "Indiquez les formats qui reviennent le plus souvent dans votre calendrier.",
        fields: [
          {
            type: "choices",
            key: "eventTypes",
            label: "Types d'événements préférés",
            multiple: true,
            options: ["Mariages", "Conférences", "Galas", "Festivals", "Ateliers", "Soirées privées", "Autres"],
          },
          {
            type: "choices",
            key: "frequency",
            label: "Fréquence d'organisation",
            options: ["1-2/an", "3-5/an", "6-12/an", "Plus de 12/an"],
          },
        ],
      },
      {
        eyebrow: "Image de marque",
        title: "Présence publique",
        description: "Ces informations aideront les partenaires à vous reconnaître rapidement.",
        fields: [
          { type: "file", key: "avatar", label: "Photo de profil optionnelle" },
          { type: "text", key: "displayName", label: "Nom d'affichage / entreprise", placeholder: "Atelier Lumiere" },
          { type: "text", key: "city", label: "Ville principale", placeholder: "Montréal" },
        ],
      },
      {
        eyebrow: "Confirmation",
        title: "Votre espace est prêt à prendre forme",
        description: "Un tableau de bord organisateur vous attend avec vos événements, invités et partenaires.",
        fields: [],
      },
    ],
  },
  prestataire: {
    title: "Onboarding prestataire",
    subtitle: "Préparez une fiche claire pour recevoir des demandes alignées avec votre expertise.",
    icon: Camera,
    accent: "bg-gold-pale text-gold-dark",
    cta: "Voir mon tableau de bord",
    steps: [
      {
        eyebrow: "Expertise",
        title: "Votre spécialité principale",
        description: "Choisissez la catégorie qui décrit le mieux votre service.",
        fields: [
          {
            type: "choices",
            key: "category",
            label: "Catégorie principale",
            options: ["Photographe", "Traiteur", "DJ", "Décorateur", "Animateur", "Sonorisation", "Autre"],
          },
        ],
      },
      {
        eyebrow: "Présence",
        title: "Votre première fiche",
        description: "Ajoutez une description courte, votre zone de service et un repère tarifaire.",
        fields: [
          { type: "file", key: "logo", label: "Logo ou photo" },
          { type: "textarea", key: "description", label: "Description courte", maxLength: 200, placeholder: "Une phrase nette sur votre signature." },
          {
            type: "choices",
            key: "serviceArea",
            label: "Zone de service",
            options: ["Montréal et environs", "Québec entier", "Canada"],
          },
          { type: "text", key: "rate", label: "Tarif indicatif optionnel", placeholder: "À partir de 850 $" },
        ],
      },
      {
        eyebrow: "Confirmation",
        title: "Votre vitrine est prête",
        description: "Vous pourrez enrichir vos photos et disponibilités depuis votre espace prestataire.",
        fields: [],
      },
    ],
  },
  gestionnaire: {
    title: "Onboarding gestionnaire",
    subtitle: "Présentez votre espace pour transformer les recherches en réservations qualifiées.",
    icon: Building2,
    accent: "bg-terracotta-pale text-terracotta",
    cta: "Gérer mon espace",
    steps: [
      {
        eyebrow: "Espace",
        title: "Identité du lieu",
        description: "Décrivez le type d'espace et la capacité que vous pouvez accueillir.",
        fields: [
          { type: "text", key: "venueName", label: "Nom de l'espace", placeholder: "Maison Saint-Laurent" },
          {
            type: "choices",
            key: "venueType",
            label: "Type",
            options: ["Salle de banquet", "Rooftop", "Studio", "Bureau", "Plein air", "Autre"],
          },
          { type: "number", key: "capacity", label: "Capacité", placeholder: "120" },
        ],
      },
      {
        eyebrow: "Localisation",
        title: "Adresse et disponibilités",
        description: "Donnez aux organisateurs les repères nécessaires pour se projeter.",
        fields: [
          { type: "text", key: "address", label: "Adresse / ville / quartier", placeholder: "Vieux-Montréal" },
          { type: "file", key: "photo", label: "Photo principale" },
          {
            type: "choices",
            key: "availability",
            label: "Disponibilité générale",
            multiple: true,
            options: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
          },
        ],
      },
      {
        eyebrow: "Confirmation",
        title: "Votre lieu peut maintenant être géré",
        description: "Votre tableau de bord centralise fiche, calendrier et demandes de réservation.",
        fields: [],
      },
    ],
  },
};

interface OnboardingFlowProps {
  role: OnboardingRole;
}

export function OnboardingFlow({ role }: OnboardingFlowProps) {
  const router = useRouter();
  const { login } = useAuth();
  const config = ROLE_CONFIGS[role];
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<FormState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const step = config.steps[stepIndex];
  const progress = ((stepIndex + 1) / config.steps.length) * 100;
  const Icon = config.icon;

  const summary = useMemo(
    () =>
      Object.entries(state).filter(([, value]) =>
        Array.isArray(value) ? value.length > 0 : value.length > 0,
      ),
    [state],
  );

  const updateText = (key: string, value: string) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const toggleChoice = (field: ChoiceField, value: string) => {
    setState((current) => {
      if (!field.multiple) return { ...current, [field.key]: value };
      const currentValue = current[field.key];
      const selected: string[] = Array.isArray(currentValue) ? currentValue : [];
      return {
        ...current,
        [field.key]: selected.includes(value)
          ? selected.filter((item: string) => item !== value)
          : [...selected, value],
      };
    });
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const session = await authService.saveOnboarding(toApiRole(role), buildOnboardingPayload(state));
      login(session);
      router.push("/tableau-de-bord");
      router.refresh();
    } catch {
      setSaveError("Impossible de sauvegarder votre onboarding. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background mesh-gradient px-4 py-6 sm:px-8">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between py-2">
        <Link href="/" className="font-serif text-2xl text-primary">Elintys</Link>
        <Link href="/tableau-de-bord" className="premium-button-ghost">Compléter plus tard</Link>
      </header>

      <section className="mx-auto grid w-full max-w-5xl gap-8 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:py-14">
        <aside className="space-y-6">
          <div className={cn("inline-flex h-12 w-12 items-center justify-center rounded-2xl", config.accent)}>
            <Icon size={22} aria-hidden="true" />
          </div>
          <div>
            <p className="section-eyebrow">Étape {stepIndex + 1} sur {config.steps.length}</p>
            <h1 className="premium-heading mt-4 text-[clamp(34px,5vw,58px)]">{config.title}</h1>
            <p className="premium-subtitle mt-4">{config.subtitle}</p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/70">
            <motion.div
              className="h-full rounded-full bg-teal"
              animate={{ width: `${progress}%` }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.42, ease: premiumEase }}
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={config.steps.length}
              aria-valuenow={stepIndex + 1}
            />
          </div>
        </aside>

        <div className="glass-card p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.title}
              variants={shouldReduceMotion ? undefined : pageTransition}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal">{step.eyebrow}</p>
                <h2 className="mt-2 font-serif text-3xl text-on-surface">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{step.description}</p>
              </div>

              {step.fields.length > 0 ? (
                <div className="space-y-6">
                  {step.fields.map((field) => (
                    <FieldRenderer
                      key={field.key}
                      field={field}
                      value={state[field.key]}
                      onTextChange={updateText}
                      onChoiceToggle={toggleChoice}
                    />
                  ))}
                </div>
              ) : (
                <PreviewCard summary={summary} cta={config.cta} />
              )}

              {saveError && (
                <div className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-white/80 px-4 py-3 text-sm text-destructive shadow-card">
                  <AlertCircle size={17} aria-hidden="true" className="mt-0.5 shrink-0" />
                  <p>{saveError}</p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-outline-variant/60 pt-5 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                  disabled={stepIndex === 0}
                  className="premium-button-secondary disabled:opacity-40"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Précédent
                </button>

                {stepIndex === config.steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleComplete}
                    disabled={isSaving}
                    className="premium-button disabled:cursor-wait disabled:opacity-60"
                  >
                    {isSaving ? (
                      <Loader2 size={16} aria-hidden="true" className="animate-spin" />
                    ) : (
                      <BadgeCheck size={16} aria-hidden="true" />
                    )}
                    {isSaving ? "Sauvegarde..." : config.cta}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStepIndex((current) => Math.min(config.steps.length - 1, current + 1))}
                    className="premium-button"
                  >
                    Suivant
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}

function toApiRole(role: OnboardingRole): ApiOnboardingRole {
  return role === "gestionnaire" ? "gestionnaire_salle" : role;
}

function buildOnboardingPayload(state: FormState): OnboardingPayload {
  return Object.entries(state).reduce<OnboardingPayload>((payload, [key, value]) => {
    const normalizedValue = normalizePayloadValue(key, value);
    if (normalizedValue === undefined) return payload;
    payload[key] = normalizedValue;
    return payload;
  }, {});
}

function normalizePayloadValue(key: string, value: string | string[]): OnboardingPayloadValue | undefined {
  if (Array.isArray(value)) {
    const values = value.map((item) => item.trim()).filter(Boolean);
    return values.length > 0 ? values : undefined;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;
  if (key === "capacity") {
    const numericValue = Number(trimmedValue);
    return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined;
  }

  return trimmedValue;
}

interface FieldRendererProps {
  field: Field;
  value: string | string[] | undefined;
  onTextChange: (key: string, value: string) => void;
  onChoiceToggle: (field: ChoiceField, value: string) => void;
}

function FieldRenderer({ field, value, onTextChange, onChoiceToggle }: FieldRendererProps) {
  if (field.type === "choices") {
    const selected = Array.isArray(value) ? value : value ? [value] : [];
    return (
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-on-surface">{field.label}</legend>
        <div className="flex flex-wrap gap-2">
          {field.options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChoiceToggle(field, option)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  isSelected
                    ? "border-teal bg-teal text-white shadow-card"
                    : "border-outline-variant bg-white/70 text-on-surface hover:border-teal/40"
                )}
              >
                {isSelected && <Check size={14} aria-hidden="true" />}
                {option}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  const stringValue = typeof value === "string" ? value : "";

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <label htmlFor={field.key} className="text-sm font-semibold text-on-surface">{field.label}</label>
        <textarea
          id={field.key}
          className="premium-textarea"
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          value={stringValue}
          onChange={(event) => onTextChange(field.key, event.target.value)}
        />
        {field.maxLength && (
          <p className="text-xs text-on-surface-variant">{stringValue.length}/{field.maxLength} caractères</p>
        )}
      </div>
    );
  }

  if (field.type === "file") {
    return (
      <div className="space-y-2">
        <label htmlFor={field.key} className="text-sm font-semibold text-on-surface">{field.label}</label>
        <input
          id={field.key}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="premium-input file:mr-4 file:rounded-full file:border-0 file:bg-teal-pale file:px-3 file:py-1 file:text-sm file:font-semibold file:text-teal"
          onChange={(event) => onTextChange(field.key, event.target.files?.[0]?.name ?? "")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={field.key} className="text-sm font-semibold text-on-surface">{field.label}</label>
      <input
        id={field.key}
        type={field.type}
        className="premium-input"
        placeholder={field.placeholder}
        value={stringValue}
        onChange={(event) => onTextChange(field.key, event.target.value)}
      />
    </div>
  );
}

function PreviewCard({ summary, cta }: { summary: [string, string | string[]][]; cta: string }) {
  return (
    <div className="premium-card space-y-5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage-pale text-sage">
          <MapPin size={18} aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-serif text-2xl text-on-surface">Aperçu du tableau de bord</h3>
          <p className="text-sm leading-6 text-on-surface-variant">
            {cta} avec un espace déjà préconfiguré selon vos réponses.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(summary.length > 0 ? summary : [["status", "Profil prêt à compléter"]]).slice(0, 4).map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-outline-variant/70 bg-white/65 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-on-surface-variant">{key}</p>
            <p className="mt-2 text-sm font-semibold text-on-surface">
              {Array.isArray(value) ? value.join(", ") : value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
