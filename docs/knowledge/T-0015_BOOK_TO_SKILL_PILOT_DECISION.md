# T-0015 — Book-to-skill pilot decision

## Decision

DEFER

## Scope inspected

The repository was searched locally for an existing book-to-skill implementation,
package, manifest, license, or generated output. None was found.

No network search, installation, clone, dependency addition, binary ingestion, or
generation run was performed.

## Decision rationale

- Repository license: unavailable locally; cannot be verified.
- Local/offline capability: not demonstrated.
- Dependency footprint: unknown.
- Output structure: not inspectable.
- Original-source preservation: not demonstrated.
- Provenance support: not demonstrated.
- Hallucination controls: not demonstrated.
- Usefulness of a generated SKILL.md: cannot be evaluated without a safe,
  licensed implementation and a non-sensitive pilot source.

Running or adapting an unknown tool would contradict the T-0015 requirement to
preserve canonical sources and explicit provenance.

## Safe future pilot

If a licensed repository is provided or separately approved for inspection:

1. use only the TRAINING_SYNTHETIC CSV delimiter topic;
2. run locally and offline;
3. preserve the source as canonical;
4. classify the generated SKILL.md as DERIVED_MATERIAL;
5. record source IDs, generation method, generator, creation time and verification;
6. compare the output with a manually authored micro-skill;
7. reject any output that invents facts, hides provenance or copies restricted text.

## Stop condition

Do not resume this pilot until the repository, license and execution boundary are
available for explicit human review.
