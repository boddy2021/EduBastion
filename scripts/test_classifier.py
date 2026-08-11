"""Sanity-check the detector on a handful of texts.

    python scripts/test_classifier.py
    python scripts/test_classifier.py --file scripts/text.txt
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from App import config  # noqa: E402

BUILTIN = [
    ("human", "so basically what i understood is that the jwt has three parts, "
              "the header the payload and the signature. the signature is made "
              "with a secret key so nobody can change the payload without you "
              "knowing. i think this is why its used for sessions, because the "
              "server doesnt have to keep the session in memory anymore."),
    ("ai", "JSON Web Tokens represent a compact and self-contained method for "
           "securely transmitting information between parties as a JSON object. "
           "This information can be verified and trusted because it is digitally "
           "signed. JWTs consist of three distinct components: a header, a "
           "payload, and a signature, each serving a specific purpose in "
           "ensuring both the integrity and authenticity of the transmitted data."),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", type=Path)
    args = ap.parse_args()

    print(f"method    : {config.AI_DETECTOR_METHOD}")
    if config.AI_DETECTOR_METHOD == "classifier":
        print(f"model     : {config.AI_CLASSIFIER_MODEL}")
        print(f"threshold : {config.AI_CLASSIFIER_THRESHOLD}")
    print()

    from App.Services.ai_detector_service import check_ai_probability

    cases = ([("your file", args.file.read_text(encoding="utf-8"))]
             if args.file else BUILTIN)

    for label, text in cases:
        r = check_ai_probability(text)
        print(f"[{label:>10}] verdict={r['verdict']:<10} "
              f"P(AI)={r['score']}  confidence={r['confidence']}%")

    if not args.file:
        print("\nExpected: the first reads human, the second reads AI.")
        print("If they come out the same, the label mapping is wrong -- check")
        print("the model's id2label in the startup log.")


if __name__ == "__main__":
    main()
