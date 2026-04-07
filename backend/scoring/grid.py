from __future__ import annotations

from pathlib import Path

from PIL import Image


def find_bounding_box(
    binary_mask: list[int],
    width: int,
    height: int,
    padding: int,
) -> dict[str, int] | None:
    min_x = width
    min_y = height
    max_x = -1
    max_y = -1

    for y in range(height):
        for x in range(width):
            if binary_mask[(y * width) + x] == 1:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

    if max_x == -1 or max_y == -1:
        return None

    min_x = max(0, min_x - padding)
    min_y = max(0, min_y - padding)
    max_x = min(width - 1, max_x + padding)
    max_y = min(height - 1, max_y + padding)

    return {
        "min_x": min_x,
        "min_y": min_y,
        "max_x": max_x,
        "max_y": max_y,
        "width": max_x - min_x + 1,
        "height": max_y - min_y + 1,
    }


def calculate_signature_coverage_score(
    file_path: str | Path,
    grid_rows: int = 4,
    grid_cols: int = 8,
    white_threshold: int = 220,
    min_ink_pixels_per_chunk: int = 3,
    add_bounding_box_padding: int = 2,
) -> int:
    image = Image.open(file_path).convert("RGBA")
    width, height = image.size
    pixel_access = image.load()

    binary_mask = [0] * (width * height)

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixel_access[x, y]

            if alpha == 0:
                continue

            brightness = (0.299 * red) + (0.587 * green) + (0.114 * blue)
            binary_mask[(y * width) + x] = 1 if brightness < white_threshold else 0

    bounding_box = find_bounding_box(binary_mask, width, height, add_bounding_box_padding)
    total_chunks = grid_rows * grid_cols

    if bounding_box is None:
        return 0

    occupied_chunks = 0
    cropped_width = bounding_box["width"]
    cropped_height = bounding_box["height"]

    for row in range(grid_rows):
        for col in range(grid_cols):
            start_x = (col * cropped_width) // grid_cols
            end_x = ((col + 1) * cropped_width) // grid_cols
            start_y = (row * cropped_height) // grid_rows
            end_y = ((row + 1) * cropped_height) // grid_rows

            ink_count = 0

            for y in range(start_y, end_y):
                source_y = bounding_box["min_y"] + y

                for x in range(start_x, end_x):
                    source_x = bounding_box["min_x"] + x

                    if binary_mask[(source_y * width) + source_x] != 1:
                        continue

                    ink_count += 1
                    if ink_count >= min_ink_pixels_per_chunk:
                        occupied_chunks += 1
                        break

                if ink_count >= min_ink_pixels_per_chunk:
                    break

    score = round((occupied_chunks / total_chunks) * 100)
    return max(0, min(100, score))

