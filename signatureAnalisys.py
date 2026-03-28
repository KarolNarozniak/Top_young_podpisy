from PIL import Image


def find_bounding_box(binary_mask, width, height, padding):
    """
    Znajduje najmniejszy prostokąt obejmujący wszystkie piksele 'atramentu' (wartość 1).
    Dodaje też padding dookoła.

    Zwraca słownik z wymiarami bounding boxa albo None, jeśli nie ma żadnych ciemnych pikseli.
    """
    min_x = width
    min_y = height
    max_x = -1
    max_y = -1

    # Szukamy wszystkich pikseli oznaczonych jako "ink" = 1
    for y in range(height):
        for x in range(width):
            if binary_mask[y * width + x] == 1:
                if x < min_x:
                    min_x = x
                if y < min_y:
                    min_y = y
                if x > max_x:
                    max_x = x
                if y > max_y:
                    max_y = y

    # Jeśli nic nie znaleziono, to znaczy że podpisu brak
    if max_x == -1 or max_y == -1:
        return None

    # Dodajemy padding, ale pilnujemy granic obrazu
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
    file_path,
    grid_rows=4,
    grid_cols=8,
    white_threshold=220,
    min_ink_pixels_per_chunk=3,
    add_bounding_box_padding=2,
):
    """
    Liczy score podpisu na podstawie zajętości siatki.

    Parametry:
    - file_path: ścieżka do pliku obrazu
    - grid_rows, grid_cols: liczba wierszy i kolumn siatki
    - white_threshold: próg jasności; poniżej uznajemy piksel za "atrament"
    - min_ink_pixels_per_chunk: ile ciemnych pikseli musi być w polu siatki, by uznać je za zajęte
    - add_bounding_box_padding: ile pikseli marginesu dodać wokół podpisu

    Zwraca:
    - int od 0 do 100
    """

    # Otwieramy obraz i konwertujemy do RGBA,
    # żeby zawsze mieć kanały: R, G, B, A
    img = Image.open(file_path).convert("RGBA")
    width, height = img.size

    # Pobieramy wszystkie piksele
    pixels = list(img.getdata())

    # Binary mask: 1 = ciemny piksel (ink), 0 = tło
    binary_mask = [0] * (width * height)

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[y * width + x]

            # Jeśli piksel jest całkiem przezroczysty, traktujemy go jako tło
            if a == 0:
                binary_mask[y * width + x] = 0
                continue

            # Liczymy jasność wg tego samego wzoru co w TS
            brightness = 0.299 * r + 0.587 * g + 0.114 * b

            # Jeśli piksel jest wystarczająco ciemny, uznajemy go za część podpisu
            binary_mask[y * width + x] = 1 if brightness < white_threshold else 0

    # Szukamy bounding boxa
    bounding_box = find_bounding_box(
        binary_mask,
        width,
        height,
        add_bounding_box_padding
    )

    total_chunks = grid_rows * grid_cols

    # Jeśli nie ma podpisu, score = 0
    if bounding_box is None:
        return 0

    cropped_width = bounding_box["width"]
    cropped_height = bounding_box["height"]

    occupied_chunks = 0

    # Dzielimy obszar podpisu na siatkę
    for row in range(grid_rows):
        for col in range(grid_cols):
            start_x = (col * cropped_width) // grid_cols
            end_x = ((col + 1) * cropped_width) // grid_cols
            start_y = (row * cropped_height) // grid_rows
            end_y = ((row + 1) * cropped_height) // grid_rows

            ink_count = 0
            marked = False

            # Sprawdzamy, ile pikseli "ink" jest w danym polu siatki
            for y in range(start_y, end_y):
                if marked:
                    break

                source_y = bounding_box["min_y"] + y

                for x in range(start_x, end_x):
                    source_x = bounding_box["min_x"] + x

                    if binary_mask[source_y * width + source_x] == 1:
                        ink_count += 1

                        # Jeśli osiągniemy minimalną liczbę pikseli,
                        # to pole uznajemy za zajęte
                        if ink_count >= min_ink_pixels_per_chunk:
                            occupied_chunks += 1
                            marked = True
                            break

    # Wynik w skali 0-100
    score = round((occupied_chunks / total_chunks) * 100)

    # Dodatkowe zabezpieczenie
    score = max(0, min(100, score))

    return score