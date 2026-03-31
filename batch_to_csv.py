import os
import csv
import argparse

from signatureAnalisys import calculate_signature_coverage_score

# Example usage:
#   1) Basic (reads images from a folder, writes scores.csv in current directory):
#      python batch_to_csv.py ./images
#
#   2) Custom output file name:
#      python batch_to_csv.py ./images -o results.csv
#
#   3) Custom output path (folder must exist):
#      python batch_to_csv.py ./images -o output/signature_scores.csv
#
#   4) Limit processed files to PNG only:
#      python batch_to_csv.py ./images --extensions .png
#
#   5) Process PNG + JPG only:
#      python batch_to_csv.py ./images --extensions .png,.jpg,.jpeg

DEFAULT_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp"}

def iter_image_files(input_dir: str, extensions: set[str]):
    for f in os.listdir(input_dir):
        full = os.path.join(input_dir, f)
        if not os.path.isfile(full):
            continue
        ext = os.path.splitext(f)[1].lower()
        if ext in extensions:
            yield full


def main():
    parser = argparse.ArgumentParser(
        description="Generate CSV with signature readability score for each image file in a directory (non-recursive)."
    )
    parser.add_argument("input_dir", help="Directory containing images")
    parser.add_argument(
        "-o",
        "--output",
        default="scores.csv",
        help="Output CSV path (default: scores.csv)",
    )
    parser.add_argument(
        "--extensions",
        default=",".join(sorted(DEFAULT_EXTENSIONS)),
        help="Comma-separated list of extensions to include (default: common image types)",
    )
    args = parser.parse_args()

    input_dir = args.input_dir
    if not os.path.isdir(input_dir):
        raise SystemExit(f"[ERROR] Not a directory: {input_dir}")

    extensions = {e.strip().lower() for e in args.extensions.split(",") if e.strip()}
    extensions = {e if e.startswith(".") else f".{e}" for e in extensions}

    rows = []
    for path in sorted(iter_image_files(input_dir, extensions)):
        filename = os.path.basename(path)
        try:
            score = calculate_signature_coverage_score(path)
            rows.append((filename, score))
            print(f"[OK] {filename}: {score}/100")
        except Exception as e:
            rows.append((filename, "ERROR"))
            print(f"[ERROR] {filename}: {e}")

    with open(args.output, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["filename", "score"])
        writer.writerows(rows)

    print(f"\nWrote {len(rows)} rows to: {args.output}")


if __name__ == "__main__":
    main()