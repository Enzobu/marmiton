#!/usr/bin/env python3
"""Generate the Ciqual 2025 migration from the official French XLSX (requires openpyxl)."""

import argparse
import hashlib
import re
import unicodedata
from decimal import Decimal, InvalidOperation
from pathlib import Path

from openpyxl import load_workbook

SOURCE_MD5 = "0d9758ce23f3f13dd63a005bc1bb4f2c"
ALIASES = {
    "ail": 11000, "carotte": 20009, "carottes": 20009, "oignon": 20034, "oignons": 20034,
    "oignon rouge": 20238, "oignons rouges": 20238, "oignon jaune": 20239, "oignons jaunes": 20239,
    "tomate": 20385, "tomates": 20385, "tomate cerise": 20172, "tomates cerises": 20172,
    "oeuf": 22000, "oeufs": 22000, "oeuf entier": 22000, "oeufs entiers": 22000,
    "oeuf de poule": 22000, "oeufs de poule": 22000, "oeufs durs": 22010,
    "huile d olive": 17270, "huile d olive vierge extra": 17270, "beurre doux": 16400,
    "beurre demi sel": 16402, "banane": 13005, "bananes": 13005, "sucre": 31016,
    "farine": 9436, "farine de ble": 9436, "farine t55": 9436, "farine t45": 9440,
    "pomme de terre": 4008, "pommes de terre": 4008, "filet de poulet": 36017,
    "filets de poulet": 36017, "blanc de poulet": 36017, "blancs de poulet": 36017,
    "lait demi ecreme": 19033, "riz blanc cru": 9100, "riz blanc cuit": 9104,
    "haricots verts crus": 20061, "haricots verts cuits": 20030,
}

SCHEMA = """-- Ciqual 2025, Anses. DOI 10.57745/RDMHWY, Licence Ouverte 2.0.
-- Generated with scripts/generate-ciqual-migration.py from the official 2025-11-03 XLSX.
ALTER TABLE `RecipeIngredient` ADD COLUMN `nutrition` JSON NULL;

CREATE TABLE `NutritionFood` (
    `code` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `nameKey` VARCHAR(255) NOT NULL,
    `kcal` DOUBLE NULL,
    `protein` DOUBLE NULL,
    `carbs` DOUBLE NULL,
    `fat` DOUBLE NULL,
    INDEX `NutritionFood_nameKey_idx`(`nameKey`),
    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `NutritionAlias` (
    `nameKey` VARCHAR(191) NOT NULL,
    `foodCode` INTEGER NOT NULL,
    PRIMARY KEY (`nameKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"""


def name_key(value):
    normalized = unicodedata.normalize("NFD", value.lower().replace("œ", "oe"))
    without_marks = "".join(char for char in normalized if not unicodedata.category(char).startswith("M"))
    return re.sub(r"[\W_]+", " ", without_marks).strip()


def sql_text(value):
    return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"


def sql_value(value):
    value = str(value).strip().replace(",", ".")
    if value in {"-", "traces", "None"} or value.startswith("<"):
        return "NULL"
    try:
        number = Decimal(value)
    except InvalidOperation as error:
        raise ValueError(f"Unexpected Ciqual value: {value!r}") from error
    if not number.is_finite() or number < 0:
        raise ValueError(f"Invalid Ciqual value: {value!r}")
    return format(number, "f")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    if hashlib.md5(args.source.read_bytes()).hexdigest() != SOURCE_MD5:
        parser.error("Use the official Ciqual 2025 French XLSX for this migration.")
    workbook = load_workbook(args.source, read_only=True, data_only=True)
    rows = workbook.worksheets[0].values
    header = tuple(" ".join(str(cell).split()) for cell in next(rows))
    assert header[6:8] == ("alim_code", "alim_nom_fr")
    assert header[10].startswith("Energie, Règlement") and "(kcal" in header[10]
    assert header[15].startswith("Protéines, N x 6.25") and header[16:18] == ("Glucides (g 100 g)", "Lipides (g 100 g)")
    foods = []
    for row in rows:
        if not row[6]:
            continue
        code = int(row[6])
        name = " ".join(row[7].split())
        if len(name) > 255 or len(name_key(name)) > 255:
            raise ValueError(f"Ciqual label exceeds database column length: {code}")
        values = [sql_value(row[index]) for index in (10, 15, 16, 17)]
        foods.append((code, sql_text(name), sql_text(name_key(name)), *values))
    workbook.close()
    codes = {food[0] for food in foods}
    assert len(foods) == len(codes) == 3484 and set(ALIASES.values()) <= codes
    with args.output.open("w", encoding="utf-8") as output:
        output.write(SCHEMA)
        for offset in range(0, len(foods), 250):
            output.write("\nINSERT INTO `NutritionFood` (`code`, `name`, `nameKey`, `kcal`, `protein`, `carbs`, `fat`) VALUES\n")
            output.write(",\n".join("(" + ", ".join(map(str, food)) + ")" for food in foods[offset:offset + 250]) + ";\n")
        output.write("\nINSERT INTO `NutritionAlias` (`nameKey`, `foodCode`) VALUES\n")
        output.write(",\n".join(f"({sql_text(name)}, {code})" for name, code in sorted(ALIASES.items())) + ";\n")


if __name__ == "__main__":
    main()
