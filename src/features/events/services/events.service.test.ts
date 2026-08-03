import { describe, expect, it } from "vitest";
import { normalizeEventPublishReadiness } from "./events.service";

describe("normalizeEventPublishReadiness", () => {
  it("conserve le contrat courant du backend", () => {
    expect(
      normalizeEventPublishReadiness({
        publishable: false,
        errors: [{ code: "PAID_TICKET_TYPE_REQUIRED", field: "ticketTypes" }],
        warnings: [],
      }),
    ).toEqual({
      publishable: false,
      errors: [{ code: "PAID_TICKET_TYPE_REQUIRED", field: "ticketTypes" }],
      warnings: [],
    });
  });

  it("normalise les anciens codes texte et supprime leurs doublons", () => {
    expect(
      normalizeEventPublishReadiness({
        publishable: false,
        errors: ["TITLE_REQUIRED", "START_DATE_REQUIRED", "TITLE_REQUIRED"],
        warnings: ["ONLINE_URL_MISSING", "ONLINE_URL_MISSING"],
      }),
    ).toEqual({
      publishable: false,
      errors: [
        { code: "TITLE_REQUIRED", field: "" },
        { code: "START_DATE_REQUIRED", field: "" },
      ],
      warnings: ["ONLINE_URL_MISSING"],
    });
  });

  it("ignore les entrées malformées au lieu de produire des clés undefined", () => {
    expect(
      normalizeEventPublishReadiness({
        publishable: false,
        errors: [null, {}, { field: "title" }, ""],
      }),
    ).toEqual({ publishable: false, errors: [], warnings: [] });
  });
});
