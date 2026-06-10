import Link from "next/link";

interface PlaceholderPageProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function PlaceholderPage({
  title,
  description = "Cette section est prête côté navigation et sera complétée avec ses données métier.",
  backHref = "/tableau-de-bord",
  backLabel = "Retour au tableau de bord",
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-3xl flex-col justify-center px-6 py-12">
      <p className="mb-3 text-sm font-medium text-teal">Elintys</p>
      <h1 className="font-serif text-3xl font-bold text-navy">{title}</h1>
      <p className="mt-4 max-w-2xl text-muted">{description}</p>
      <Link href={backHref} className="mt-8 w-fit text-sm font-medium text-teal hover:underline">
        {backLabel}
      </Link>
    </div>
  );
}
