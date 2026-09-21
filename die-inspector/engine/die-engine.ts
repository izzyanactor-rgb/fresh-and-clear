import { experimental_evaluate as jevEvaluate } from 'ai';

/**
 * DIE Engine — turns a private rubric into an automated audit using an
 * LLM-judge (typesafe-ai/jev via the Vercel AI Gateway).
 *
 * The rubric questions are the proprietary IP. jev answers them about the
 * workflow output (`state`). Only the pass/fail OUTCOMES are exposed to the
 * client; the question text never appears in the client-facing object.
 */

export interface BooleanQuestion {
  type: 'boolean';
  instructions: string;
}
export type Rubric = Record<string, BooleanQuestion>;

export interface CriterionOutcome {
  id: string;
  pass: boolean;
  confidence: number; // 0..1
}
export interface PrivateCriterion extends CriterionOutcome {
  instructions: string; // the rubric text — private, never ship
}

export interface DieVerdict {
  verdict: 'SEALED' | 'FAILED';
  passed: number;
  total: number;
  integrity: number; // 0..100
  avgConfidence: number; // 0..1
  /** Client-facing: outcomes only, no rubric text. Safe to ship. */
  outcomes: CriterionOutcome[];
  /** Private ledger: includes the criteria. Stays server-side. */
  ledger: PrivateCriterion[];
}

export interface DieOptions {
  /** Judge model. Defaults to the jev model on the AI Gateway. */
  model?: string;
  /** Probability at/above which a boolean answer counts as "pass". Default 0.5. */
  threshold?: number;
  /** Injectable evaluator — swap a stub in for offline tests. Defaults to live jev. */
  evaluate?: typeof jevEvaluate;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

export async function runDieAudit(
  state: string,
  rubric: Rubric,
  opts: DieOptions = {},
): Promise<DieVerdict> {
  const model = opts.model ?? 'typesafe-ai/jev';
  const threshold = opts.threshold ?? 0.5;
  const evaluate = opts.evaluate ?? jevEvaluate;

  const result = await evaluate({ model, state, questions: rubric });

  const ledger: PrivateCriterion[] = Object.keys(rubric).map((id) => {
    const answer = result.answers[id] as { type: 'boolean'; probability: number };
    const confidence = answer.probability;
    return {
      id,
      instructions: rubric[id].instructions,
      pass: confidence >= threshold,
      confidence,
    };
  });

  const total = ledger.length;
  const passed = ledger.filter((c) => c.pass).length;
  const avgConfidence = total ? ledger.reduce((s, c) => s + c.confidence, 0) / total : 0;
  const integrity = total ? Math.round((passed / total) * 100) : 0;
  const verdict: DieVerdict['verdict'] = passed === total ? 'SEALED' : 'FAILED';

  return {
    verdict,
    passed,
    total,
    integrity,
    avgConfidence,
    outcomes: ledger.map(({ id, pass, confidence }) => ({ id, pass, confidence: round2(confidence) })),
    ledger,
  };
}
