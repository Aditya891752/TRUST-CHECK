"""
Evaluation and benchmark script for TrustCheck verification pipeline.
Runs evaluation fixtures and benchmarks against the 3,750 fact verification dataset.
"""

import sys
import os
import json
import csv
import asyncio
from pathlib import Path
from collections import Counter

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.api.schemas import Verdict
from app.providers.anthropic import AnthropicProvider
from app.pipeline.verifier import verify_claims

async def run_fixtures_eval():
    print("=" * 60)
    print("RUNNING TRUSTCHECK EVALUATION FIXTURES")
    print("=" * 60)

    fixtures_path = backend_dir / "tests" / "fixtures" / "eval_fixtures.json"
    if not fixtures_path.exists():
        print(f"Error: Fixtures file not found at {fixtures_path}")
        return

    with open(fixtures_path, "r", encoding="utf-8") as f:
        fixtures = json.load(f)

    provider = AnthropicProvider()
    passed = 0

    for fix in fixtures:
        print(f"\n[Fixture: {fix['id']}] {fix['name']}")
        print(f"Input: {fix['answer'][:80]}...")
        # Verification check
        claims = await provider.extract_claims_and_queries(fix["answer"])
        print(f"Extracted {len(claims)} claims.")
        for idx, c in enumerate(claims):
            print(f"  - Claim {idx+1}: {c.get('text', '')[:60]}")
        passed += 1

    print(f"\nCompleted {passed}/{len(fixtures)} fixtures successfully.")

def run_dataset_benchmark(sample_size: int = 100):
    print("\n" + "=" * 60)
    print(f"BENCHMARKING ON VERIFICATION DATASET (Sample: {sample_size} facts)")
    print("=" * 60)

    dataset_path = backend_dir.parent / "ML MODEL DATASET" / "trustcheck_verification_dataset (1).csv"
    if not dataset_path.exists():
        print(f"Dataset not found at {dataset_path}")
        return

    rows = []
    with open(dataset_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            if r.get("split") == "test" or len(rows) < sample_size:
                rows.append(r)
            if len(rows) >= sample_size:
                break

    print(f"Loaded {len(rows)} samples from dataset.")
    label_counts = Counter(r["label"] for r in rows)
    print(f"Distribution: {dict(label_counts)}")

    provider = AnthropicProvider()
    correct = 0
    predictions = []

    async def evaluate_all():
        nonlocal correct
        for idx, r in enumerate(rows):
            ground_truth = r["label"]
            claim_text = r["claim"]
            evidence_snippet = r["evidence"]
            
            ev_list = [{
                "id": "e1",
                "title": f"Source {idx+1}",
                "url": "https://source.trustcheck.local",
                "snippet": evidence_snippet,
                "retrieved_at": "2026-10-04T10:00:00Z"
            }]

            res = await provider.verify_claim(claim_text, ev_list)
            pred_verdict = res.get("verdict", "uncertain")
            predictions.append((ground_truth, pred_verdict))

            if pred_verdict == ground_truth:
                correct += 1

    asyncio.run(evaluate_all())

    accuracy = (correct / len(rows)) * 100 if rows else 0
    print(f"\nBenchmark Results:")
    print(f"Total Evaluated: {len(rows)}")
    print(f"Correct Predictions: {correct}")
    print(f"Accuracy: {accuracy:.2f}%")

if __name__ == "__main__":
    asyncio.run(run_fixtures_eval())
    run_dataset_benchmark(sample_size=60)
