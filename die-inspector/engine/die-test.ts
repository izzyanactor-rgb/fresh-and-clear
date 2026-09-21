import { runDieAudit, type Rubric, type DieOptions } from './die-engine';

/* DIE rubric = the IP. Typed questions jev answers about the workflow output. */
const supportRefundRubric: Rubric = {
  refund_issued:     { type: 'boolean', instructions: 'Did the agent issue a refund to the customer?' },
  full_amount:       { type: 'boolean', instructions: 'Was the refund for the FULL amount (not partial)?' },
  professional_tone: { type: 'boolean', instructions: 'Did the agent stay professional and courteous?' },
  policy_followed:   { type: 'boolean', instructions: 'Was the outcome consistent with a standard refund policy?' },
};

/*
 * STUB judge — stands in for typesafe-ai/jev so the engine can be tested OFFLINE.
 * Live jev needs AI_GATEWAY_API_KEY + network egress to the Vercel gateway, which
 * is blocked in this sandbox. It returns jev's exact response shape (a probability
 * per boolean question). This is a placeholder judge, NOT the real model.
 */
const stubJev: DieOptions['evaluate'] = (async ({ state, questions }: any) => {
  const s = String(state).toLowerCase();
  const prob = (id: string): number => {
    switch (id) {
      case 'refund_issued':     return /refund/.test(s) && !/no refund|denied|declined/.test(s) ? 0.98 : 0.06;
      case 'full_amount':       return /full refund|full amount/.test(s) ? 0.97 : /partial/.test(s) ? 0.12 : 0.55;
      case 'professional_tone': return /rude|dismissive|angrily|snapped/.test(s) ? 0.08 : 0.93;
      case 'policy_followed':   return /against policy|expired|no receipt/.test(s) ? 0.19 : 0.90;
      default: return 0.5;
    }
  };
  return {
    answers: Object.fromEntries(
      Object.keys(questions).map((id) => [id, { type: 'boolean', probability: prob(id) }]),
    ),
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    warnings: [],
    rounding: undefined,
    providerMetadata: undefined,
    response: { timestamp: new Date(), modelId: 'stub/jev' },
  };
}) as any;

async function main() {
  const cases = [
    { label: 'Clean handling',          state: 'The support agent issued a full refund to the customer and apologized for the delay.' },
    { label: 'Partial + against policy', state: 'The agent gave a partial refund even though the item was returned expired and against policy.' },
  ];

  for (const c of cases) {
    const r = await runDieAudit(c.state, supportRefundRubric, { evaluate: stubJev });
    console.log('\n────────────────────────────────────────────────────────');
    console.log(`CASE: ${c.label}`);
    console.log(`  state: "${c.state}"`);
    console.log(`  VERDICT: ${r.verdict}   gates ${r.passed}/${r.total}   integrity ${r.integrity}/100   avg-confidence ${(r.avgConfidence * 100).toFixed(0)}%`);
    console.log('  client-facing outcomes (rubric text is NOT included):');
    for (const o of r.outcomes) {
      console.log(`    ${o.pass ? 'PASS' : 'FAIL'}  ${o.id.padEnd(18)} conf ${(o.confidence * 100).toFixed(0)}%`);
    }
  }

  console.log('\n[note] Judge above is a STUB standing in for typesafe-ai/jev (live call needs');
  console.log('       AI_GATEWAY_API_KEY + network). Drop the { evaluate } override to go live.');
}

main().catch((e) => { console.error(e); process.exit(1); });
