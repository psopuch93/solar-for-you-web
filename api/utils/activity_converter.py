# api/utils/activity_converter.py

import pandas as pd
import json
import numpy as np
import re
import os
from django.conf import settings

class NumpyEncoder(json.JSONEncoder):
    """Niestandardowy enkoder JSON, który obsługuje typy numpy."""

    def default(self, obj):
        if isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NumpyEncoder, self).default(obj)

def excel_to_activities_json(excel_file_path, output_file_path=None):
    """
    Konwertuje plik Excel do formatu JSON z konfiguracją aktywności.

    Args:
        excel_file_path (str): Ścieżka do pliku Excel
        output_file_path (str, optional): Ścieżka do pliku wyjściowego JSON

    Returns:
        dict: Dane w formacie JSON
    """
    # Wczytaj arkusze z pliku Excel
    excel_data = pd.ExcelFile(excel_file_path)

    # Arkusz Info
    info_df = pd.read_excel(excel_data, sheet_name='Info', header=None)
    nazwa_projektu = info_df.iloc[0, 0]
    typ_projektu = info_df.iloc[1, 0]

    # Sprawdź typ projektu i wybierz odpowiednią strukturę
    if typ_projektu == 'Ground':
        result = process_ground_project(excel_data, nazwa_projektu)
    elif typ_projektu == 'Floating':
        result = process_floating_project(excel_data, nazwa_projektu)
    else:
        raise ValueError(f"Nieznany typ projektu: {typ_projektu}. Dostępne typy: Ground, Floating")

    # Zapisz wynik do pliku jeśli podano ścieżkę
    if output_file_path:
        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2, cls=NumpyEncoder)
        print(f"Zapisano wynik do pliku: {output_file_path}")

    return result

def process_ground_project(excel_data, nazwa_projektu):
    """Procesuje dane dla projektu typu Ground."""
    # Zainicjuj główną strukturę JSON
    result = {
        "nazwa_projektu": nazwa_projektu,
        "typ_projektu": "Ground",
        "konstrukcja": {}
    }

    # Przetwórz standardowe arkusze
    standard_sheets = {
        'Logistyka': 'logistyka',
        'Moduły': 'moduly',
        'Transport kabli': 'transport_kabli',
        'Transport konstrukcji': 'transport_konstrukcji'
    }

    for sheet_name, json_key in standard_sheets.items():
        if sheet_name in excel_data.sheet_names:
            df = pd.read_excel(excel_data, sheet_name=sheet_name)
            processed_data = process_sheet_data(df)

            # Dodaj dane do odpowiedniej sekcji JSON
            if 'Transport' in sheet_name:
                transport_key = sheet_name.replace('Transport ', '').lower()
                if 'transport' not in result:
                    result['transport'] = {}
                result['transport'][transport_key] = processed_data
            else:
                result[json_key] = processed_data

    # Przetwórz arkusze konstrukcji
    konstrukcja_pattern = re.compile(r'Konstrukcja - (.+)')
    for sheet_name in excel_data.sheet_names:
        konstrukcja_match = konstrukcja_pattern.match(sheet_name)
        if konstrukcja_match:
            konstrukcja_type = konstrukcja_match.group(1).lower()
            df = pd.read_excel(excel_data, sheet_name=sheet_name)
            result['konstrukcja'][konstrukcja_type] = process_sheet_data(df)

    return result

def process_floating_project(excel_data, nazwa_projektu):
    """Zaślepka dla projektu typu Floating."""
    return {
        "nazwa_projektu": nazwa_projektu,
        "typ_projektu": "Floating",
        "message": "Struktura dla projektu typu Floating nie została jeszcze zaimplementowana."
    }

def process_sheet_data(df):
    """Przetwarza dane z arkusza do formatu JSON."""
    # Upewnij się, że DataFrame ma dane
    if df.empty:
        return []

    # Konwertuj DataFrame na format JSON
    records = []

    # Sprawdź, czy DataFrame zawiera wymagane kolumny
    if 'Zona' not in df.columns or 'Rząd' not in df.columns:
        print(f"Uwaga: Brak kolumn Zona lub Rząd w arkuszu!")
        return []

    # Grupuj dane według Zony i Rzędu
    grouped = df.groupby(['Zona', 'Rząd'])

    for (zona, rzad), group in grouped:
        record = {
            "zona": zona,
            "rzad": rzad
        }

        # Dodaj pozostałe kolumny do rekordu
        for column in group.columns:
            if column not in ['Zona', 'Rząd']:
                # Sprawdź, czy kolumna istnieje w grupie i nie zawiera samych NaN
                if column in group and not group[column].isna().all():
                    # Jeśli mamy tylko jedną wartość w grupie dla danej kolumny
                    if len(group[column].dropna().unique()) == 1:
                        # Konwertuj wartości numpy na standardowe typy Pythona
                        value = group[column].dropna().iloc[0]
                        if isinstance(value, (np.integer, np.int64)):
                            value = int(value)
                        elif isinstance(value, (np.floating, np.float64)):
                            value = float(value)
                        record[column.lower().replace(' ', '_')] = value
                    else:
                        # Jeśli mamy wiele wartości, dodaj je jako listę
                        values = group[column].dropna().tolist()
                        # Konwertuj wartości numpy na standardowe typy Pythona
                        values = [int(v) if isinstance(v, (np.integer, np.int64)) else
                                  float(v) if isinstance(v, (np.floating, np.float64)) else v
                                  for v in values]
                        if values:  # Sprawdź, czy lista nie jest pusta
                            record[column.lower().replace(' ', '_')] = values

        # Dodaj specyficzne pola dla arkusza "Moduły"
        if 'Numer stołu' in group.columns and 'Ilość modułów' in group.columns:
            stoly = []
            for _, row in group.iterrows():
                if pd.notna(row['Numer stołu']) and pd.notna(row['Ilość modułów']):
                    numer_stolu = int(row['Numer stołu']) if isinstance(row['Numer stołu'], (np.integer, np.int64)) else \
                    row['Numer stołu']
                    ilosc_modulow = int(row['Ilość modułów']) if isinstance(row['Ilość modułów'],
                                                                            (np.integer, np.int64)) else row[
                        'Ilość modułów']
                    stoly.append({
                        "numer_stolu": numer_stolu,
                        "ilosc_modulow": ilosc_modulow
                    })
            if stoly:
                record["stoly"] = stoly

        # Dodaj specyficzne pola dla arkusza "Konstrukcja - struktura"
        if 'Numer stołu' in group.columns and any(col in group.columns for col in
                                                  ['Przedłużki', 'Belki główne', 'Stężenia ukośne', 'Płatwie']):
            stoly_struktura = []
            for _, row in group.iterrows():
                if pd.notna(row['Numer stołu']):
                    numer_stolu = int(row['Numer stołu']) if isinstance(row['Numer stołu'], (np.integer, np.int64)) else \
                    row['Numer stołu']
                    stol = {"numer_stolu": numer_stolu}

                    for col in ['Przedłużki', 'Belki główne', 'Stężenia ukośne', 'Płatwie']:
                        if col in row and pd.notna(row[col]):
                            value = row[col]
                            if isinstance(value, (np.integer, np.int64)):
                                value = int(value)
                            elif isinstance(value, (np.floating, np.float64)):
                                value = float(value)
                            stol[col.lower().replace(' ', '_')] = value

                    stoly_struktura.append(stol)

            if stoly_struktura:
                record["stoly_struktura"] = stoly_struktura

        records.append(record)

    return records

def save_activities_json_for_project(project_id, json_data):
    """
    Zapisuje dane JSON z konfiguracją aktywności dla projektu.

    Args:
        project_id (int): ID projektu
        json_data (dict): Dane konfiguracji w formacie JSON

    Returns:
        str: Ścieżka do zapisanego pliku
    """
    # Utwórz katalog dla konfiguracji aktywności, jeśli nie istnieje
    activities_dir = os.path.join(settings.MEDIA_ROOT, 'activity_configs')
    os.makedirs(activities_dir, exist_ok=True)

    # Nazwa pliku to ID projektu
    filename = f"{project_id}.json"
    file_path = os.path.join(activities_dir, filename)

    # Zapisz dane do pliku
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2, cls=NumpyEncoder)

    return file_path

def load_activities_json_for_project(project_id):
    """
    Wczytuje dane JSON z konfiguracją aktywności dla projektu.

    Args:
        project_id (int): ID projektu

    Returns:
        dict: Dane konfiguracji w formacie JSON lub None, jeśli plik nie istnieje
    """
    # Ścieżka do pliku
    activities_dir = os.path.join(settings.MEDIA_ROOT, 'activity_configs')
    file_path = os.path.join(activities_dir, f"{project_id}.json")

    # Sprawdź, czy plik istnieje
    if not os.path.exists(file_path):
        return None

    # Wczytaj dane z pliku
    with open(file_path, 'r', encoding='utf-8') as f:
        json_data = json.load(f)

    return json_data