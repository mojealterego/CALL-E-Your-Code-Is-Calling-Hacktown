import {
  buildAssuranceContext,
  buildConversationContract,
  buildGoT,
  compoundReasoning,
  evaluateTrajectory,
  formalGate,
  type Claim,
  type CompoundReasoningResult,
  type ConversationContract,
  type FormalGateResult,
  type TrajectoryEvent,
} from "./assurance.js";
import {
  retrieveWholeMemory,
  type MemoryFabric,
} from "./memory-fabric.js";

export interface CognitiveAssuranceInput {
  patientName: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  claims: Claim[];
  trajectory: TrajectoryEvent[];
  decision: "commit" | "abort" | "recover";
  patientConfirmed?: string;
  appointmentDecision?: string;
  providerStatus?: string;
  taskCompleted?: boolean;
  conversationCompleted?: boolean;
  evidenceItems?: string[];
  selectedSlotPrepared?: boolean;
  contradiction?: boolean;
  parserInterpretations?: Array<{ name: string; claims: Claim[] }>;
  evidenceSummary?: string;
  /** Optional seven-dimensional memory available to GoT/R3 context assembly. */
  memoryFabric?: MemoryFabric;
  memoryQuery?: string;
}

export interface CognitiveAssuranceResult {
  contract: ConversationContract;
  thoughts: ReturnType<typeof buildGoT>;
  trajectory: ReturnType<typeof evaluateTrajectory>;
  compound: CompoundReasoningResult;
  formal: FormalGateResult;
  context: ReturnType<typeof buildAssuranceContext>;
  retrievedMemory: ReturnType<typeof retrieveWholeMemory>;
  executionAllowed: boolean;
}

/**
 * Single deterministic boundary for the cognitive assurance stack.
 * Cognitive modules may reason and predict; only the final formal gate can
 * authorize a consequential commit. Memory is injected as contextual
 * evidence and can never authorize execution.
 */
export function runCognitiveAssuranceStack(input: CognitiveAssuranceInput): CognitiveAssuranceResult {
  const contract = buildConversationContract(input.patientName);
  const memoryQuery = input.memoryQuery ?? [
    input.appointmentDecision ?? "appointment",
    input.doctorName,
    input.patientName,
  ].join(" ");
  const retrievedMemory = input.memoryFabric
    ? retrieveWholeMemory(memoryQuery, input.memoryFabric)
    : [];
  const thoughts = buildGoT(input.claims);
  const trajectory = evaluateTrajectory(input.trajectory);
  const compound = compoundReasoning(input.parserInterpretations ?? []);
  const formal = formalGate({
    decision: input.decision,
    patientConfirmed: input.patientConfirmed,
    appointmentDecision: input.appointmentDecision,
    providerStatus: input.providerStatus,
    taskCompleted: input.taskCompleted,
    conversationCompleted: input.conversationCompleted,
    evidenceItems: input.evidenceItems,
    selectedSlotPrepared: input.selectedSlotPrepared,
    contradiction: input.contradiction,
  });
  const context = buildAssuranceContext({
    patientName: input.patientName,
    doctorName: input.doctorName,
    appointmentDate: input.appointmentDate,
    appointmentTime: input.appointmentTime,
    appointmentDecision: input.appointmentDecision,
    patientConfirmed: input.patientConfirmed,
    evidenceSummary: input.evidenceSummary ?? "",
    evidenceItems: input.evidenceItems,
  });
  // Keep the existing assurance context contract stable while replacing its
  // synthetic retrieval with the supplied whole-memory retrieval when present.
  if (retrievedMemory.length > 0) context.retrievedMemory = retrievedMemory;

  const executionAllowed = input.decision !== "commit"
    ? true
    : formal.allowed && trajectory.safe && compound.action === "confidence-signal" && context.claimLedger.commitAllowed;

  return { contract, thoughts, trajectory, compound, formal, context, retrievedMemory, executionAllowed };
}
