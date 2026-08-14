import argparse
import csv
import random
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
csv.field_size_limit(10 ** 7)

from App import config


def load_path(path: Path) -> list[str]:
    if path.is_dir():
        out = [f.read_text(encoding="utf-8").strip() for f in sorted(path.glob("*.txt"))]
        out = [t for t in out if t]
    else:
        out = [l.strip() for l in path.read_text(encoding="utf-8").splitlines() if l.strip()]
    if not out:
        sys.exit(f"No samples in {path}")
    return out


def load_csv(path: Path, text_col, label_col, ai_label):
    with open(path, encoding="utf-8-sig", errors="replace") as f:
        rows = list(csv.DictReader(f))
    if text_col not in rows[0]:
        sys.exit(f"Column '{text_col}' not found. Available: {list(rows[0])}")

    ai, human = [], []
    for r in rows:
        t = str(r.get(text_col) or "").strip()
        if t:
            (ai if str(r.get(label_col)).strip() == str(ai_label) else human).append(t)
    return ai, human


def length_report(ai, human):
    print(f"  {'':6} {'n':>6} {'p10':>7} {'median':>7} {'p90':>7} {'max':>7}")
    for name, s in (("AI", ai), ("human", human)):
        n = sorted(len(t) for t in s)
        p = lambda q: n[int(q * (len(n) - 1))]
        print(f"  {name:6} {len(s):>6} {p(.1):>7} {p(.5):>7} {p(.9):>7} {n[-1]:>7}")


def match_on_length(ai, human, limit, tolerance=40, seed=42):
    random.seed(seed)
    buckets = {}
    for t in human:
        buckets.setdefault(len(t) // tolerance, []).append(t)

    pool = ai[:]
    random.shuffle(pool)
    sel_ai, sel_hum = [], []
    for t in pool:
        b = len(t) // tolerance
        for cand in (b, b - 1, b + 1):
            if buckets.get(cand):
                sel_hum.append(buckets[cand].pop())
                sel_ai.append(t)
                break
        if len(sel_ai) >= limit:
            break
    return sel_ai, sel_hum


def score_all(samples, label, scorer):
    out = []
    for i, t in enumerate(samples, 1):
        try:
            v = scorer(t)
        except Exception as e:
            print(f"  [{label}] {i}/{len(samples)}  skipped ({e})")
            continue
        out.append(v)
        print(f"  [{label}] {i}/{len(samples)}  score={v: .4f}")
    if not out:
        sys.exit(f"Nothing scored for {label}")
    return out


def pct(vals, q):
    s = sorted(vals)
    return s[int(q * (len(s) - 1))]


def evaluate(threshold, human, ai, flag_below):
    if flag_below:
        fp = sum(1 for s in human if s < threshold)
        tp = sum(1 for s in ai if s < threshold)
    else:
        fp = sum(1 for s in human if s >= threshold)
        tp = sum(1 for s in ai if s >= threshold)
    return {"fpr": fp / len(human), "tpr": tp / len(ai),
            "fp": fp, "missed": len(ai) - tp}


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--human", type=Path)
    ap.add_argument("--ai", type=Path)
    ap.add_argument("--csv", type=Path)
    ap.add_argument("--text-col", default="text")
    ap.add_argument("--label-col", default="label")
    ap.add_argument("--ai-label", default="1")
    ap.add_argument("--limit", type=int, default=150)
    ap.add_argument("--fpr", type=float, default=0.05)
    ap.add_argument("--report-only", action="store_true")
    args = ap.parse_args()

    if args.csv:
        ai, human = load_csv(args.csv, args.text_col, args.label_col, args.ai_label)
        print(f"\n{args.csv.name}: {len(ai)} AI / {len(human)} human")
        print("\nLength before matching:")
        length_report(ai, human)

        ai, human = match_on_length(ai, human, args.limit)
        if not ai:
            sys.exit("\nNo length-matched pairs; the classes don't overlap in length.")
        print(f"\nAfter matching: {len(ai)} pairs")
        length_report(ai, human)
        gap = abs(statistics.mean(map(len, ai)) - statistics.mean(map(len, human)))
        print(f"  mean length gap: {gap:.1f} chars")
    elif args.human and args.ai:
        human, ai = load_path(args.human)[:args.limit], load_path(args.ai)[:args.limit]
        print("\nLengths:")
        length_report(ai, human)
    else:
        ap.error("give --csv, or both --human and --ai")

    if args.report_only:
        return

    if config.AI_DETECTOR_METHOD == "classifier":
        from App.Services.ai_classifier_service import ai_probability as scorer
        flag_below = False
        print(f"\nModel: {config.AI_CLASSIFIER_MODEL}\n")
    else:
        from App.Services.ai_detector_service import compute_binoculars_score as scorer
        flag_below = True
        print(f"\nObserver : {config.AI_DETECTOR_OBSERVER_MODEL}")
        print(f"Performer: {config.AI_DETECTOR_PERFORMER_MODEL}\n")

    hs = score_all(human, "human", scorer)
    print()
    as_ = score_all(ai, "ai", scorer)

    q = args.fpr if flag_below else 1 - args.fpr
    suggested = pct(hs, q)
    r = evaluate(suggested, hs, as_, flag_below)

    print("\n" + "=" * 64)
    print(f"Human  min={min(hs):.4f}  median={pct(hs,.5):.4f}  max={max(hs):.4f}")
    print(f"AI     min={min(as_):.4f}  median={pct(as_,.5):.4f}  max={max(as_):.4f}")
    print("-" * 64)
    print(f"Threshold at {args.fpr:.0%} target FPR: {suggested:.4f}")
    print(f"  false positives: {r['fp']}/{len(hs)} ({r['fpr']:.1%})")
    print(f"  detection      : {r['tpr']:.1%} ({r['missed']} missed)")
    print("=" * 64)

    print("\n  target FPR  threshold      FPR  detection")
    for t in (0.01, 0.02, 0.05, 0.10, 0.20, 0.30):
        th = pct(hs, t if flag_below else 1 - t)
        rr = evaluate(th, hs, as_, flag_below)
        print(f"  {t:>10.0%} {th:>10.4f} {rr['fpr']:>8.1%} {rr['tpr']:>10.1%}")

    hm, am = pct(hs, .5), pct(as_, .5)
    separated = (am < hm) if flag_below else (am > hm)
    if not separated:
        print("\nWARNING: classes are not separated in the expected direction.")
    else:
        print(f"\nClass separation: {abs(hm-am)/max(hm, 1e-9):.1%}")

    key = ("AI_DETECTOR_BINOCULARS_THRESHOLD" if flag_below
           else "AI_CLASSIFIER_THRESHOLD")
    print(f"\n.env:\n  {key}={suggested:.4f}")


if __name__ == "__main__":
    main()
