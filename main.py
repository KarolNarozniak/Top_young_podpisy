import sys
import os

# import funkcji z Twojego pliku
from signatureAnalisys import calculate_signature_coverage_score


def main():
    # argument z terminala
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = "example\\path"  # fallback

    if not os.path.exists(file_path):
        print(f"[ERROR] File not found: {file_path}")
        return

    try:
        score = calculate_signature_coverage_score(file_path)

        print(f"File: {os.path.basename(file_path)}")
        print(f"Score: {score}/100")

    except Exception as e:
        print(f"[ERROR] {e}")


if __name__ == "__main__":
    main()