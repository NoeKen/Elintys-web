"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  vendorRequestsService,
  eventTitle,
  organizerName,
  type VendorRequest,
} from "@/features/vendors/services/vendor-requests.service";
import { isMissingProfileError } from "@/features/vendors/services/vendor-profile.service";
import { cn } from "@/shared/lib/utils";
import { getUserFacingError } from "@/shared/lib/user-facing-error";
import { FormErrorAlert } from "@/shared/ui/FormErrorAlert";

const STATUS_LABELS: Record<VendorRequest["status"], string> = {
  pending: "En attente",
  accepted: "Accepté",
  declined: "Refusé",
  cancelled: "Annulé",
};

const STATUS_CLASSES: Record<VendorRequest["status"], string> = {
  pending: "bg-amber text-white",
  accepted: "bg-teal text-white",
  declined: "bg-red-500 text-white",
  cancelled: "bg-muted text-white",
};

const VENDOR_REQUESTS_KEY = ["vendor-requests-mine"] as const;

export default function PrestataireDemandesPage() {
  const queryClient = useQueryClient();
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const {
    data: requests,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: VENDOR_REQUESTS_KEY,
    // Service canonique : PATCH + responseMessage, aligné sur le contrôleur.
    queryFn: () => vendorRequestsService.listMine(),
  });

  const {
    mutate: respond,
    isPending: isResponding,
    error: respondError,
  } = useMutation({
    mutationFn: ({
      id,
      status,
      responseMessage,
    }: {
      id: string;
      status: "accepted" | "declined";
      responseMessage?: string;
    }) => vendorRequestsService.respond(id, { status, responseMessage }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VENDOR_REQUESTS_KEY });
      setOpenReplyId(null);
      setReplyMessage("");
    },
  });

  const handleRespond = (id: string, status: "accepted" | "declined") => {
    respond({ id, status, responseMessage: replyMessage.trim() || undefined });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-sm text-muted" role="status">
        Chargement des demandes…
      </div>
    );
  }

  // Pas encore de profil prestataire : ce n'est pas une panne, c'est une
  // étape manquante du parcours. On oriente au lieu d'afficher une erreur.
  if (isError && isMissingProfileError(error)) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="font-serif text-2xl text-navy">Demandes reçues</h1>
        <div className="rounded-xl bg-surface p-8 text-center shadow-card">
          <p className="text-sm text-navy">
            Créez d’abord votre profil prestataire pour recevoir des demandes.
          </p>
          <Link
            href="/tableau-de-bord/prestataire/profil"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-teal underline"
          >
            Créer mon profil
          </Link>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="font-serif text-2xl text-navy">Demandes reçues</h1>
        <div className="rounded-xl bg-destructive/8 p-4" role="alert">
          <p className="text-sm text-destructive">
            Impossible de charger vos demandes pour le moment.
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 min-h-11 text-sm font-medium text-teal underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const items = requests ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-serif text-2xl text-navy">Demandes reçues</h1>
      <p className="text-sm text-muted">
        Suivez les demandes envoyées par les organisateurs pour vos services.
      </p>

      {items.length === 0 ? (
        <div
          className="rounded-xl bg-surface p-8 text-center text-sm text-muted shadow-card"
          data-testid="empty-state"
        >
          Aucune demande pour le moment.
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((request) => (
            <li
              key={request._id}
              className="space-y-3 rounded-xl bg-surface p-5 shadow-card"
              data-testid="vendor-request-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-navy">
                    {eventTitle(request.event) ?? "Événement"}
                  </p>
                  {/* `fullName` : le schéma User n'a ni firstName ni lastName. */}
                  <p className="text-sm text-muted">{organizerName(request.organizer) ?? "—"}</p>
                  {request.message && (
                    <p className="mt-2 border-l-2 border-border pl-3 text-sm italic text-navy">
                      {request.message}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
                    STATUS_CLASSES[request.status],
                  )}
                  data-testid="vendor-request-status"
                >
                  {STATUS_LABELS[request.status]}
                </span>
              </div>

              {request.status === "pending" &&
                (openReplyId === request._id ? (
                  <div className="space-y-3 border-t border-border pt-2">
                    <label
                      htmlFor={`reply-msg-${request._id}`}
                      className="block text-sm font-medium text-navy"
                    >
                      Message (optionnel)
                    </label>
                    <textarea
                      id={`reply-msg-${request._id}`}
                      className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-teal"
                      rows={3}
                      placeholder="Message optionnel…"
                      value={replyMessage}
                      onChange={(event) => setReplyMessage(event.target.value)}
                    />
                    {respondError && (
                      <FormErrorAlert
                        error={getUserFacingError(respondError, {
                          fallback:
                            "Impossible d’enregistrer votre réponse à cette demande. Réessayez.",
                        })}
                      />
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isResponding}
                        onClick={() => handleRespond(request._id, "accepted")}
                        className="min-h-11 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        data-testid="vendor-request-accept"
                      >
                        {isResponding ? "Envoi…" : "Accepter"}
                      </button>
                      <button
                        type="button"
                        disabled={isResponding}
                        onClick={() => handleRespond(request._id, "declined")}
                        className="min-h-11 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                        data-testid="vendor-request-decline"
                      >
                        Refuser
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenReplyId(null)}
                        className="min-h-11 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenReplyId(request._id);
                      setReplyMessage("");
                    }}
                    className="min-h-11 rounded-lg border border-teal px-4 py-2 text-sm font-medium text-teal"
                    data-testid="vendor-request-reply"
                  >
                    Répondre
                  </button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
