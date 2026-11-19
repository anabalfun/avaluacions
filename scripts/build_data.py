#!/usr/bin/env python3
"""Build anonymous aggregate data for Avaluacions using only Python's standard library."""
import argparse
import collections
import csv
import json
import math
from pathlib import Path


def build(source, stage, output, export_date):
    subjects = ['PCAT', 'PCAST', 'PMAT', 'PANG', 'PMED' if stage == 'primary' else 'PCIEN']
    groups, component_groups = {}, {}
    years, areas = set(), set()
    invalid = collections.Counter()
    rows = 0
    with source.open(encoding='utf-8-sig', newline='') as stream:
        reader = csv.DictReader(stream)
        area_key = 'AREA_TERRITORIAL' if stage == 'primary' else 'ÀREA TERRITORIAL'
        required = {'ANY', 'GENERE', 'NATURALESA', area_key, *subjects}
        missing = required - set(reader.fieldnames or [])
        if missing:
            raise ValueError(f'Missing columns: {sorted(missing)}')
        components = [k for k in reader.fieldnames if any(k.startswith(s + '_') for s in subjects)]
        for row in reader:
            year = int(row['ANY'])
            gender = {'Home': 'H', 'Dona': 'D'}.get(row['GENERE'], row['GENERE'])
            category = {'Pública': 'Públic', 'Privada': 'Privat'}.get(row['NATURALESA'], row['NATURALESA'])
            area = row[area_key].strip()
            key = year, gender, area, category
            years.add(year)
            areas.add(area)
            rows += 1
            scores = groups.setdefault(key, [[0, 0, [0] * 10] for _ in subjects])
            details = component_groups.setdefault(key, [[0, 0] for _ in components])
            for columns, totals, histogram in [(subjects, scores, True), (components, details, False)]:
                for i, column in enumerate(columns):
                    raw = row[column]
                    if not raw:
                        continue
                    try:
                        value = float(raw.replace(',', '.'))
                    except ValueError:
                        invalid[column] += 1
                        continue
                    if not math.isfinite(value) or not 0 <= value <= 100:
                        invalid[column] += 1
                        continue
                    totals[i][0] += 1
                    totals[i][1] += value
                    if histogram:
                        totals[i][2][min(9, int(value // 10))] += 1
    data = {
        'subjects': subjects, 'years': sorted(years), 'areas': sorted(areas),
        'cells': [[*key, [[n, round(total, 5), bins] for n, total, bins in values]]
                  for key, values in sorted(groups.items())],
        'sourceRows': rows, 'exportDate': export_date,
        'componentKeys': components,
        'componentCells': [[*key, [[n, round(total, 5)] for n, total in values]]
                           for key, values in sorted(component_groups.items())],
    }
    output.mkdir(parents=True, exist_ok=True)
    target = output / ('data.json' if stage == 'primary' else 'data-eso.json')
    target.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    print(f'{target}: {rows:,} source rows, {len(groups)} aggregate groups; invalid scores: {dict(invalid)}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--primary', type=Path, help='Sixth-grade CSV export')
    parser.add_argument('--eso', type=Path, help='Fourth-year ESO CSV export')
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'docs')
    parser.add_argument('--export-date', default='2026-11-19', help='Source snapshot date (YYYY-MM-DD)')
    args = parser.parse_args()
    if not args.primary and not args.eso:
        parser.error('Provide --primary and/or --eso')
    if args.primary:
        build(args.primary, 'primary', args.output, args.export_date)
    if args.eso:
        build(args.eso, 'eso', args.output, args.export_date)


if __name__ == '__main__':
    main()
