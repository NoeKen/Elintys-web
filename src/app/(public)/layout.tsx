import type { Metadata } from "next";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

export const metadata: Metadata = {
  title: {
    template: "%s — Elintys",
    default: "Elintys — Plateforme événementielle québécoise",
  },
  description:
    "Découvrez les événements, prestataires et lieux de Montréal. " +
    "La plateforme événementielle tout-en-un au Québec.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main className="min-h-screen bg-background pt-16">{children}</main>
      <PublicFooter />
    </>
  );
}
