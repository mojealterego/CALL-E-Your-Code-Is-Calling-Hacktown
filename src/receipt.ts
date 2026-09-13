import { createHash } from "node:crypto";

export type ReceiptDecision = "commit" | "abort" | "recover";

export interface TransactionReceipt {
  version: "1";
  receiptId: string;
  transactionId: string;
  decision: ReceiptDecision;
  transactionDigest: string;
  evidenceDigest: string;
  decisionDigest: string;
  issuedAt: string;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

export function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalize(value)).digest("hex");
}

export function createTransactionReceipt(input: {
  transactionId: string;
  transaction: unknown;
  evidence: unknown;
  decision: ReceiptDecision;
  issuedAt?: string;
}): TransactionReceipt {
  const transactionDigest = sha256(input.transaction);
  const evidenceDigest = sha256(input.evidence);
  const decisionDigest = sha256({
    transactionId: input.transactionId,
    transactionDigest,
    evidenceDigest,
    decision: input.decision,
  });
  const issuedAt = input.issuedAt ?? new Date().toISOString();
  const receiptId = `rct_${decisionDigest.slice(0, 24)}`;
  return {
    version: "1",
    receiptId,
    transactionId: input.transactionId,
    decision: input.decision,
    transactionDigest,
    evidenceDigest,
    decisionDigest,
    issuedAt,
  };
}
