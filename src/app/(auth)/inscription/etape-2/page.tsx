import { RegisterStep2Client } from "@/features/auth/components/RegisterStep2Client";
import { sanitizeRedirectPath } from "@/lib/auth/redirects";

interface InscriptionEtape2PageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function InscriptionEtape2Page({ searchParams }: InscriptionEtape2PageProps) {
  const { redirect } = await searchParams;
  return <RegisterStep2Client redirectTo={sanitizeRedirectPath(redirect ?? null) ?? undefined} />;
}
