# ccprompt Knowledge Base

Collected wisdom from deep research across formal methods, cognitive science, aviation safety, medicine, military intelligence, AI/LLM research, and software engineering — applied to AI-assisted code analysis and verification.

---

## Table of Contents

1. [Verification Methodologies](#1-verification-methodologies)
2. [Cognitive Science of Code Review](#2-cognitive-science-of-code-review)
3. [AI Pattern Recognition Strengths](#3-ai-pattern-recognition-strengths)
4. [Critical Thinking Frameworks](#4-critical-thinking-frameworks)
5. [Prompt Engineering for Defect Detection](#5-prompt-engineering-for-defect-detection)
6. [Large Codebase Analysis](#6-large-codebase-analysis)
7. [CRM-Specific Patterns](#7-crm-specific-patterns)
8. [Cross-Discipline Safety Lessons](#8-cross-discipline-safety-lessons)
9. [AI Self-Verification Paradox](#9-ai-self-verification-paradox)
10. [Adversarial Thinking Frameworks](#10-adversarial-thinking-frameworks)
11. [AI-Generated Code: Patterns to Watch For](#11-ai-generated-code-patterns-to-watch-for)
12. [Innovative Analysis Techniques](#12-innovative-analysis-techniques)

---

## 1. Verification Methodologies

### Formal Methods

- **Model Checking** exhaustively explores all states to verify properties hold. Key insight: specify properties BEFORE checking, don't just read and hope.
- **Theorem Proving** ensures universal correctness across all inputs, not just tested ones. Lesson: ask "what invariant must this code maintain?" not just "does it look right?"
- **Property-Based Testing** (QuickCheck, Hypothesis) defines properties that must always hold, then generates random inputs to falsify them. A Unicode bug in a production JSON parser with 95% line coverage was found this way.
- **Invariant Checking** focuses on conditions that must remain true throughout execution. Gap in most verification: no explicit invariant identification step.

### The Scientific Method Applied to Code

- **Hypothesis-Driven Debugging**: Observe → Hypothesize → Predict → Test → Refine. Critical: make predictions BEFORE running experiments, or you'll rationalize whatever you find.
- **Falsification over Confirmation** (Karl Popper): Instead of trying to show code works, systematically try to show it doesn't. The falsification mindset should permeate ALL verification layers.
- **Mutation Testing Philosophy**: "Who guards the guards?" Deliberately introduce faults — if your verification doesn't catch them, it has blind spots. Meta-verification.

### Key Principle

> The disciplined search for counterexamples is the most powerful verification technique.
> — Zac Hatfield-Dodds (Hypothesis framework)

---

## 2. Cognitive Science of Code Review

### Expert Pattern Recognition

- **De Groot/Chase & Simon**: Expert chess players don't think more moves ahead — they recognize board positions from ~50,000-100,000 stored patterns. Expert programmers work identically: they recognize bug-prone patterns, not trace every path.
- **Soloway, Adelson, Ehrlich**: Experts categorize code by FUNCTION (what it does), novices by SYNTAX (how it looks). Experts use "programming plans" (stereotypic action sequences) and notice when code violates them.
- **Code Smells = System 1**: Kent Beck's "code smells" are expert pattern recognition made explicit. Detection is intuitive (Kahneman's System 1 — fast, automatic) not deliberative (System 2 — slow, analytical).

### Working Memory & Chunking

- **Miller's Law**: Working memory holds 7±2 chunks. Recent research (Cowan): true limit is 3-4 for concurrent processing.
- **Sweller's Cognitive Load Theory**: Unrehersed working memory lasts ~20 seconds.
- **Expert Chunking**: An entire `for` loop becomes one chunk for an expert but 5-7 elements for a novice. Experts see patterns, novices see syntax.
- **Beacons**: Specific code fragments that trigger recognition of larger patterns. Experts recall beacons; novices recall non-beacon elements.

### Vigilance Decrement (Hard Numbers)

- **15% performance decline within 30 minutes** on monitoring tasks.
- **After 60 minutes**, reviewers "simply wear out and stop finding additional defects" (SmartBear/Cisco, 2,500 reviews, 3.2M LOC).
- **Optimal review**: 200-400 LOC per session, under 300-500 LOC/hour.
- **AI advantage**: No vigilance decrement. Reviews line 400 with same sensitivity as line 1.

### Signal Detection Theory

| | Bug Present | Bug Absent |
|---|---|---|
| **Flagged** | Hit (TP) | False Alarm (FP) |
| **Not Flagged** | Miss (FN) | Correct Rejection (TN) |

- **Critical tradeoff**: Increasing hit rate also increases false alarm rate. No free lunch.
- **Design implication**: Use liberal criteria for security/correctness (never miss), conservative for style (only flag certainties). Different severity = different signal detection criterion.

### Gestalt Principles in Code

1. **Proximity**: Related code near each other. Violations feel like "feature envy."
2. **Similarity**: Same-role elements visually grouped. Convention breaks cause cognitive strain.
3. **Continuity**: Code "flows" top-to-bottom. Deep nesting disrupts visual flow.
4. **Closure**: Cohesive classes perceived as unified wholes. Disorganization forces reconstruction.
5. **Pragnanz**: Brain prefers simplest interpretation. Well-aligned code makes copy-paste bugs visually obvious.

### The "Something Looks Wrong" Feeling

When code aligns with Gestalt principles, System 1 processes it effortlessly. A pattern violation triggers pre-conscious anomaly detection → System 1 to System 2 switch → experienced as unease. Experts "feel" bugs before articulating them.

---

## 3. AI Pattern Recognition Strengths

### What Transformers Uniquely Excel At

The self-attention mechanism lets every token attend to every other token — capturing long-range dependencies humans miss due to working memory limits:

1. **Copy-paste drift**: Holding dozens of similar implementations in context simultaneously, spotting subtle differences across files.
2. **Naming convention violations**: Detecting mixed `camelCase`/`snake_case`, pattern-breaking names across entire codebase.
3. **Dead code / unreachable paths**: Tracing reference chains across files more patiently than humans.
4. **Implicit coupling / cross-file inconsistencies**: When a function signature changes in file A but callers in file B aren't updated.
5. **Anti-patterns across large surface areas**: Logical inconsistencies, runtime error potential, design inefficiencies that static analysis misses.
6. **Race conditions / concurrency bugs**: Studies found LLMs detected issues developers "would not have seen."
7. **Convention breaks**: Training on millions of repos gives strong priors about what "normal" looks like.

### AI vs Human: What Each Catches

**AI excels at:**
- Consistency enforcement across large surface areas (200+ files)
- Functional error detection
- Race conditions and concurrency bugs
- Authorization boundary violations across multiple handlers
- Known vulnerability patterns (JWT, XSS, SQLi, SSRF)
- Cross-file pattern detection

**Humans excel at:**
- Business logic correctness ("should this code do what it does?")
- Organizational context (cost, team, deadlines)
- Prioritization (which findings actually matter)
- Architectural decisions requiring domain knowledge
- Novel attack vectors
- Coding standards adherence (paradoxically)

### The Unlimited Working Memory Advantage

A human reviewer holds 3-4 chunks in working memory. AI can simultaneously track hundreds of patterns across an entire codebase — comparing a function definition in file A with its usage in file B, its test in file C, and its documentation in file D. This parallel comparison is something humans physically cannot do.

### Performance Degradation with Context Length

Bug detection accuracy by model as context grows (BICS benchmark):

| Model | 500 tokens | 16k tokens | Degradation |
|-------|-----------|------------|-------------|
| GPT-4o | 82% | 74% | -8% |
| Gemini-1.5-Pro | ~80% | ~64% | -16% |
| Claude-3 Opus | 84% | 18% | -66% |
| Claude-3.5 Sonnet | ~75% | ~67% | -8% |

**Implication**: Chunk large codebases into focused slices rather than dumping everything into context.

### Transfer Learning at Scale

Expert programmers transfer patterns across dozens of codebases over a career. LLMs have seen millions of repos — every common bug pattern, every security vulnerability class, every anti-pattern in every framework. This is like a chess master who has studied millions of games instead of thousands.

---

## 4. Critical Thinking Frameworks

### Analysis of Competing Hypotheses (ACH) — CIA Method

Developed by CIA veteran Richards Heuer. The most rigorous structured analysis framework found:
1. Generate ALL plausible hypotheses
2. Build evidence matrix: consistent / inconsistent / neutral for each hypothesis
3. Select the hypothesis LEAST burdened by inconsistent evidence
4. Prioritize DISPROVING over confirming

Applied to code: instead of "does this work?", ask "what are all the ways this could be wrong, and which can I eliminate?"

### Pre-Mortem Analysis

Imagine the code has already failed in production. Work backward: what went wrong? This inverts verification from "will this work?" to "how did this fail?" — surfaces risks people wouldn't otherwise raise. One of the most powerful single techniques across all disciplines.

### Steel-Manning

Before dismissing a concern, construct the STRONGEST possible version of it. If someone says "this might have a race condition," don't check the obvious case — construct the worst-case scenario.

### Socratic Questioning (Six Categories)

1. **Clarification**: What do you mean by...? Can you give an example?
2. **Probing assumptions**: What are you assuming? What if that assumption is wrong?
3. **Probing evidence**: What evidence supports this? How do you know?
4. **Questioning viewpoints**: What would someone who disagrees say?
5. **Probing implications**: If this is true, what follows? What are the consequences?
6. **Questioning the question**: Why is this the right question to ask?

### Cognitive Bias Mitigation

Key biases affecting verification:
- **Confirmation bias**: Seeking evidence that confirms beliefs. ACH-trained analysts reduced this by 33%.
- **Anchoring**: First reading of code anchors understanding. Mitigation: verify from multiple starting points.
- **Availability heuristic**: Overweighting recent/memorable failures. Mitigation: checklists forcing consideration of all categories.
- **Dunning-Kruger**: Overconfidence in verification thoroughness. Mitigation: external validation, not self-assessment.

Most effective single debiasing technique: **Consider-the-opposite interventions**.

---

## 5. Prompt Engineering for Defect Detection

### Framing Effects

- **"This code HAS bugs, find them"** outperforms **"review this code"** consistently. Asserting bug existence shifts from evaluation to discovery mode.
- **"How would you break this?"** (adversarial) generates 2-3x more actionable findings than **"Is this secure?"** (evaluative).
- **Anomaly framing** ("find what's inconsistent") catches different bugs than **defect framing** ("find what's wrong"). Use both.

### Multi-Pass Architecture

Three passes is optimal (two felt incomplete, four brought back checklist fatigue):
1. **Comprehension pass**: Understand structure, data flow, intent
2. **Maintainability pass**: Error handling, resilience, extensibility
3. **Adversarial pass**: Security, edge cases, abuse scenarios

BugBot (Cursor) runs 8 parallel passes with randomized diff ordering — majority voting filters false positives. Resolution rate: 52% → 70%+.

### Categorical vs Holistic Review

**Not mutually exclusive.** Build holistic understanding first, then run focused categorical passes. Focusing on a single goal per pass improves detection for that category (military target acquisition principle).

### Reducing False Positives

- Demand justification: force "WHY it's a bug + HOW to fix" — self-filters low-confidence findings
- Severity classification: Critical/High/Medium/Low separates must-fix from noise
- Confidence scoring: High/Medium/Low per finding
- Consensus: K-LLM pattern (multiple models, majority voting) dramatically reduces false positives
- Explicit scope: "Focus on logic/semantics/design. Leave formatting to linters."

### The "What Else?" Escalation

Subtle bugs are lower-probability completions. Each "what else?" pushes the model further into the tail of its distribution, where the interesting findings live. First pass catches obvious issues; escalation catches subtle ones.

### Needle in a Haystack Techniques

From a practitioner who discovered 30+ CVEs with LLM-assisted research:
1. Assert vulnerability existence (don't ask "is this vulnerable?")
2. Demand exploit artifacts (force step-by-step reasoning)
3. Adversarial framing (red team, not auditor)
4. Assumption decomposition (enumerate invariants first, test each separately)
5. Iterative "what else?" escalation
6. Slice-based auditing (thin focused sections matching attack surfaces)

---

## 6. Large Codebase Analysis

### The Scale Problem

A 500k-line codebase: only ~0.8% fits in a 500k token context window. Django (~800k lines) cannot be analyzed in a single pass.

### Chunking Strategies (State of the Art)

1. **Language-specific structural chunking**: Tree-sitter/CST parsers create chunks along syntax boundaries (functions, classes) not arbitrary line counts.
2. **Context preservation**: Keep imports, class definitions, `__init__` methods attached to method chunks.
3. **Chunk size tradeoffs**: Semantic matching needs smaller chunks (100-256 tokens); understanding needs larger (1024+). Start at ~512 characters with 64-char overlap.
4. **LLM-enhanced descriptions**: Generate natural language descriptions for code chunks before embedding — enables retrieval for queries that wouldn't match raw keywords.
5. **Two-stage retrieval**: Vector similarity → LLM relevance filtering.

### Context Engineering (Emerging Field)

The winning strategy is not better models but better retrieval-context assembly-reasoning pipelines. Vector retrieval identifies relevant context, then long-context windows reason across it. The two approaches are complementary.

### What Goes Wrong in Large Codebases

- **Architectural erosion**: LLMs detect compliance issues at 85-91% accuracy, but struggle with infrastructure/deployment decisions (42% of errors) and organizational context (28% of errors).
- **Convention drift**: Module A (2019) follows different patterns than Module B (2023). LLMs detect this if both sides are in context.
- **Duplicated business logic**: Same rule in 3 places with slightly different edge case handling. Fixes don't propagate.
- **Orphaned code**: 10-20% of large codebases is unreachable from any entry point.
- **Implicit contracts**: Module A assumes Module B returns sorted results. Undocumented. Breaks silently when B changes.

---

## 7. CRM-Specific Patterns

### Permission Model Failures

- Permission checks at UI layer but missing from API endpoints
- Role hierarchies that don't properly cascade
- Late-added endpoints bypassing auth (most common finding)

### Multi-Tenant Data Isolation

- Missing `WHERE tenant_id = ?` clauses
- Cached data leaking between tenant contexts
- Background jobs processing without tenant scoping
- Reports aggregating across tenant boundaries

### Ticket Workflow State Machine Bugs

- Missing state transitions leaving tickets in limbo
- Race conditions when multiple agents update same ticket
- Notification triggers firing on wrong transitions
- SLA timers not pausing during "Waiting on Customer"

### External System Sync (ERP, DWH)

- Bidirectional sync: compromised credentials in one system affect all
- Internal notes syncing to less-secured systems
- Data conflict resolution missing or wrong

### Audit Trail Gaps

- Bulk operations bypassing audit logging
- Soft deletes not recorded
- Field-level tracking missing for sensitive fields
- Audit queries that don't scale

### GDPR Compliance Failures

- "Right to be forgotten" missing related records in joined tables
- Consent tracking not propagating to downstream systems
- Data export including other tenants' data
- PII in logs, error messages, analytics pipelines
- Retention policies not enforced on backups

---

## 8. Cross-Discipline Safety Lessons

### Aviation — Swiss Cheese Model (James Reason)

Accidents require failures to align across multiple independent defense layers. Each layer has "holes" — safety comes from ensuring holes don't align. Verification layers must be TRULY independent — same person performing all checks reduces independence through cognitive carry-over.

### Aviation — Crew Resource Management (CRM)

Born from 1978 crash investigation. Key principles:
- Anyone can raise safety concerns regardless of hierarchy
- Communication must be explicit
- Assumptions must be stated aloud

### Aviation — Checklists

Formalized after 1935 crash. Two types:
- **READ-DO** (read step, then do it) — more reliable for verification
- **DO-CONFIRM** (do from memory, confirm with checklist) — faster but riskier

### Medicine — Differential Diagnosis

Generate ALL plausible diagnoses before investigating any. Critical finding: diagnostic checklists improve accuracy ONLY when the correct diagnosis is included. If the checklist misses the actual problem, it can REDUCE accuracy.

**Warning for verification templates**: A framework must not create false sense of completeness. It must include mechanisms for discovering problems outside its categories.

### Nuclear — Defense in Depth

Five levels of barriers. Four I&C principles: redundancy, independence, deterministic behavior, diversity. Critical finding: "there is no way to verify or evaluate the diversity of two software versions."

### NASA — Independent Verification & Validation (IV&V)

Established after Challenger. Three forms of independence required: technical, managerial, financial. Fundamental questions:
- "Are we building the product right?" (verification)
- "Are we building the right product?" (validation)

Most verification templates focus on the first and neglect the second.

---

## 9. AI Self-Verification Paradox

### The Problem

- LLMs are "unreliable at self-verification — they'll confidently tell you the code works while it's on fire."
- 29-45% of AI-generated code contains security vulnerabilities
- 20% of package recommendations are fabricated ("slopsquatting")
- ~19% of hallucinations are reasoning errors
- LLMs exhibit overcorrection bias — when prompted to verify, they incorrectly flag correct code as wrong

### Hallucination is Mathematically Inevitable

A 2024 paper (National University of Singapore) proves using computability theory that hallucinations are inevitable when LLMs are used as general problem solvers.

### Effective Mitigations

- **Multi-agent cross-validation** (different models checking each other): 87% false positive reduction
- **RAG grounding** in actual codebase: 60-80% hallucination reduction
- **Verification artifacts** (pass/fail tests) over judgment: "the agent cannot negotiate with a failing test"
- **Context limit**: Keep agent context under 25K tokens to prevent "lost in the middle" degradation
- **Treat AI output like junior developer code** — review everything

### Key Principle (Addy Osmani)

> Define verification steps that produce pass/fail artifacts rather than relying on LLM judgment. The LLM should not be both generator and verifier.

---

## 10. Adversarial Thinking Frameworks

### STRIDE Threat Modeling (Microsoft)

| Threat | Property Violated |
|--------|-------------------|
| **S**poofing | Authentication |
| **T**ampering | Integrity |
| **R**epudiation | Non-repudiation |
| **I**nformation Disclosure | Confidentiality |
| **D**enial of Service | Availability |
| **E**levation of Privilege | Authorization |

### Attack Trees

Enumerate ALL possible failure/attack paths as a tree structure. More systematic than "is there a scenario you haven't considered?"

### Mutation Testing

Tests verify code, but what verifies the tests? Mutation score = killed mutants / total mutants. Applied to verification: could you deliberately introduce a bug that your verification process would miss?

### Chaos Engineering (Netflix)

1. Define steady state
2. Hypothesize steady state continues during perturbation
3. Introduce real-world events
4. Look for differences

Verify under realistic failure conditions, not just ideal conditions.

### OWASP Top 10 Business Logic Abuse (2025)

1. Action Limit Overrun (race conditions bypassing single-use checks)
2. Concurrent Workflow Order Bypass (executing final step before prerequisites)
3. Object State Manipulations (mass assignment / parameter pollution)
4. Malicious Logic Loop (infinite recursion / resource exhaustion)
5. Artifact Lifetime Exploitation (replaying expired tokens/sessions)
6. Missing Transition Validation (skipping steps in workflows)
7. Resource Quota Violation (rate limit bypass)
8. Internal State Disclosure (info leakage via timing/error differences)
9. Broken Access Control (privilege escalation)
10. Shadow Function Abuse (hidden/debug endpoints in production)

---

## 11. AI-Generated Code: Patterns to Watch For

### Common Failure Modes of AI-Generated Code

AI-generated code has specific, predictable failure patterns different from human-written code:

1. **Plausible-but-wrong patterns**: Code that LOOKS correct, follows naming conventions, has proper structure — but contains subtle logic errors. AI optimizes for "looks like good code" not "is correct code."
2. **Hallucinated APIs**: Calling functions, methods, or library features that don't exist. 20% of package recommendations are fabricated ("slopsquatting").
3. **Overcorrection bias**: When asked to verify, AI incorrectly flags correct code as wrong. Self-verification is unreliable.
4. **Security blindness**: 29-45% of AI-generated code contains security vulnerabilities. AI reproduces insecure patterns from training data.
5. **Incomplete error handling**: Happy path is well-implemented; error paths are shallow or missing entirely.
6. **Copy-paste with drift**: AI generates similar code blocks that should be parameterized, with subtle inconsistencies between copies.
7. **Outdated patterns**: Using deprecated APIs, old library versions, or patterns that were common in training data but are no longer best practice.
8. **Context window amnesia**: In long sessions, AI loses track of decisions made earlier, leading to inconsistent implementations across files.

### What to Specifically Look For in AI-Written Codebases

**Architecture level:**
- Inconsistent patterns between modules (different modules written in different sessions)
- Over-engineering in some areas, under-engineering in others (depends on prompt quality)
- Missing cross-cutting concerns in later-added modules (auth, logging, validation)
- Feature flags or configuration that was added "just in case" but never used (YAGNI violations)

**Code level:**
- Functions that look complete but don't handle edge cases (empty arrays, null values, concurrent access)
- Validation in the UI but not the API (or vice versa)
- Error handling that catches and swallows exceptions silently
- Database queries without proper indexing consideration
- Missing transaction boundaries on multi-step operations
- Race conditions in state changes (AI rarely considers concurrency)

**Test level:**
- Tests that assert `toBeTruthy()` instead of specific values
- Tests that test the mock, not the implementation
- Missing negative test cases (what should FAIL)
- Tests that pass for the wrong reason (assertion on wrong value, accidentally always true)

**Integration level:**
- Missing timeout configuration on external calls
- No retry logic or incorrect retry logic (retrying non-idempotent operations)
- Missing circuit breakers for external dependencies
- Optimistic assumptions about external API response formats

### The 80/20 of AI Code Verification

Research shows these checks catch the most AI-generated bugs:

1. **Run the code** — 60% of AI-generated bugs are caught by simply running it. Artifacts don't lie.
2. **Check error paths** — trace what happens when things FAIL. This is where AI code is weakest.
3. **Check concurrency** — AI rarely considers multi-user scenarios. What happens with concurrent requests?
4. **Check the edges** — empty inputs, null values, maximum values, unicode, negative numbers.
5. **Cross-reference implementations** — if the same logic exists in multiple places, check they're consistent.

---

## 12. Innovative Analysis Techniques

### Code Forensics (Git History as Crime Scene)

Adam Tornhill's methodology: your git history reveals where bugs hide.
- **Hotspot = Churn × Complexity**: Files that change often AND are complex account for 80% of bugs
- **Temporal coupling**: Files committed together have hidden coupling
- **Code age**: Ancient complex code that suddenly needs to change is highest risk
- **Bus factor**: Code only one person understands is knowledge risk

Tools: code-maat, code-forensics, Hercules

### Graph-Based Code Analysis

Treat the codebase as a graph, apply graph algorithms:
- **Community detection** (Louvain) → discover actual module boundaries vs intended ones
- **Betweenness centrality** → find "god modules" that sit on too many paths
- **PageRank** → identify most "important" files (highest cascade risk)
- **Cycle detection** → find circular dependencies including multi-hop chains

Tools: dependency-cruiser, typescript-graph, Graph-Code (Neo4j)

### Information Flow / Taint Analysis

Track sensitive data from sources (user input) to sinks (database queries, logs, API calls):
- Define all entry points as taint sources
- Define dangerous operations as sinks
- Verify sanitization exists on every path

Tools: CodeQL, Semgrep (NestJS DI-aware since 2025), SonarQube taint analysis

### Semantic Clone Detection

Find code that does the same thing but looks different (Type-3/4 clones):
- Token-based (fast, catches exact copies): jscpd
- AST-based (catches renamed clones): Semgrep
- Embedding-based (catches semantic equivalents): LLM-assisted clustering

In large codebases, expect 10-20% semantic duplication — particularly in validation, error handling, and data transformation.

### Architectural Conformance Checking

Define architecture as code, enforce automatically:
- **ArchUnitTS**: Write architecture rules as TypeScript tests
- **dependency-cruiser**: Rule-based dependency validation with CI integration
- **SonarQube Architecture as Code**: Architectural drift detection (2025)

### Mutation Testing

"Who guards the guards?" — deliberately introduce bugs to test your tests:
- **Stryker Mutator** for TypeScript: flips operators, removes conditionals, changes return values
- If tests still pass after mutation → test has blind spot
- Target hotspot files from code forensics for maximum value
- Above 80% mutation score = high quality; below 50% = critical gap

---

## Sources

### Formal Methods & Verification
- Formal Verification — Wikipedia
- What Are Formal Methods? — Galois
- Property-Based Testing — Hypothesis
- Falsification-Driven Verification — Springer
- NASA IV&V Overview — nasa.gov
- NASA Software IV&V Handbook

### Cognitive Science
- Miller's Magical Number Seven (1956)
- Chunking — Chase & Simon via Chessprogramming Wiki
- Code Comprehension: Chunks and Beacons — Mike Bowler
- Synthesizing Research on Programmers' Mental Models — ScienceDirect
- Towards a Cognitive Model of Dynamic Debugging — Weimer et al. (2024)
- Applying Gestalt Principles to Code — yetanotherchris.dev
- Vigilance Decrement — PMC, Frontiers in Cognition (2025)
- SmartBear/Cisco Code Review Study
- Signal Detection Theory — NYU
- System 1 and System 2 Thinking — Kahneman via The Decision Lab

### Critical Thinking
- CIA Tradecraft Primer: Structured Analytic Techniques
- Red Team Thinking Tools & Techniques
- Mastering ACH — SOS Intelligence
- Cognitive Bias Mitigation Interventions — PMC
- Cognitive Bias in Systems Verification — Academia.edu

### AI Code Review
- AI-powered Code Review with LLMs: Early Results — arXiv 2404.18496
- Rethinking Code Review Workflows — arXiv 2505.16339
- Bug in the Code Stack (BICS) — arXiv 2406.15325
- Code-Survey: LLM-Driven Codebase Analysis — arXiv 2410.01837
- Evaluating LLMs for Architectural Decision Violations — arXiv 2602.07609
- Evaluating LLMs for Code Review — arXiv 2505.20206
- Benchmarking LLM-based Code Review — arXiv 2509.01494
- Comparing Human and LLM Code — arXiv 2501.16857
- Human-AI Synergy in Code Review — arXiv 2603.15911
- Building a Better BugBot — Cursor blog
- My LLM Coding Workflow 2026 — Addy Osmani

### Prompt Engineering
- Benchmarking Prompt Engineering for Secure Code — arXiv 2502.06039
- The Prompt Report: 58 Techniques — arXiv 2406.06608
- Prompting LLM Security Reviews — Crash Override
- How to Review Code in Three Focused Passes — Management Deltas
- Effective Prompt Engineering for AI Code Reviews — Graphite
- Reducing AI Code Review False Positives — Propel
- K-LLM Code Review Pattern — Jose Casanova
- Needle in the Haystack: LLMs for Vulnerability Research — Devansh

### Large Codebases & RAG
- Greptile: Graph-based Codebase Context
- RAG for 10k Repos — Qodo
- RAG vs Long Context 2026 — markaicode.com
- Manage RAG Context Windows — markaicode.com

### Innovative Analysis Techniques
- Your Code as a Crime Scene (2nd Ed) — Adam Tornhill, Pragmatic Bookshelf
- code-maat: VCS Mining Tool — GitHub
- ArchUnitTS — TypeScript Architecture Testing — GitHub
- dependency-cruiser — Rule-based Dependency Validation — npm
- Stryker Mutator for JavaScript/TypeScript — stryker-mutator.io
- CodeQL: Analyzing Data Flow in JavaScript/TypeScript — GitHub
- Semgrep JavaScript Vulnerability Detection Deep Dive (2025)
- SonarQube Architecture as Code (2025) — SecurityBoulevard
- Knip: Dead Code Detector for TypeScript — dev.to
- jscpd: Copy/Paste Detector — jscpd.dev

### Safety & Other Disciplines
- Swiss Cheese Model — Wikipedia, SKYbrary
- Defense in Depth Nuclear Engineering — Wikipedia, IAEA
- Fagan Inspection — Wikipedia
- OWASP Top 10 Business Logic Abuse (2025)
- OWASP Top 10:2025
- STRIDE Threat Model — Practical DevSecOps
- Chaos Engineering — Wikipedia, Netflix
- Mutation Testing — Wikipedia
