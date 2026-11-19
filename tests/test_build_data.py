"""Small, hand-calculated fixtures verify the CSV-to-aggregate boundary."""
import contextlib
import csv
import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location('build_data', Path(__file__).resolve().parents[1] / 'scripts/build_data.py')
builder = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(builder)


class BuildDataTests(unittest.TestCase):
    def run_fixture(self, stage, changes):
        fifth = 'PMED' if stage == 'primary' else 'PCIEN'
        area = 'AREA_TERRITORIAL' if stage == 'primary' else 'ÀREA TERRITORIAL'
        columns = ['ANY', 'GENERE', 'NATURALESA', area, 'CODI_ALUMNE', 'PCAT', 'PCAST', 'PMAT', 'PANG', fifth, 'PCAT_CL']
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'source.csv'
            with source.open('w', encoding='utf-8-sig', newline='') as stream:
                writer = csv.DictWriter(stream, fieldnames=columns)
                writer.writeheader()
                for change in changes:
                    row = dict.fromkeys(columns, '')
                    row.update(ANY='2025', GENERE='Dona', NATURALESA='Pública', CODI_ALUMNE='private-fixture-id')
                    row[area] = 'Girona'
                    row.update(change)
                    writer.writerow(row)
            with contextlib.redirect_stdout(io.StringIO()):
                builder.build(source, stage, Path(directory) / 'out', '2026-11-19')
            result = Path(directory) / 'out' / ('data.json' if stage == 'primary' else 'data-eso.json')
            return json.loads(result.read_text())

    def test_decimal_commas_zero_missing_and_histogram_boundaries(self):
        data = self.run_fixture('primary', [{'PCAT': '0', 'PCAT_CL': '50,5'}, {'PCAT': '10'}, {'PCAT': '100'}, {}])
        n, total, bins = data['cells'][0][4][0]
        self.assertEqual((n, total), (3, 110))
        self.assertEqual(bins, [1, 1, 0, 0, 0, 0, 0, 0, 0, 1])
        self.assertEqual(data['componentCells'][0][4][0], [1, 50.5])
        self.assertEqual(data['cells'][0][1:4], ['D', 'Girona', 'Públic'])
        self.assertNotIn('private-fixture-id', json.dumps(data))
        self.assertEqual(data['sourceRows'], 4)

    def test_invalid_scores_are_excluded_without_becoming_zero(self):
        data = self.run_fixture('eso', [{'PCAT': value} for value in ['NaN', 'inf', '-1', '101', 'invalid', '', '25,5']])
        self.assertEqual(data['cells'][0][4][0][:2], [1, 25.5])
        self.assertEqual(data['subjects'][-1], 'PCIEN')

    def test_male_private_labels_are_normalized(self):
        data = self.run_fixture('eso', [{'GENERE': 'Home', 'NATURALESA': 'Privada'}])
        self.assertEqual(data['cells'][0][1:4], ['H', 'Girona', 'Privat'])

    def test_missing_required_columns_fail_with_a_clear_error(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'bad.csv'
            source.write_text('ANY\n2025\n')
            with self.assertRaisesRegex(ValueError, 'Missing columns'):
                builder.build(source, 'primary', Path(directory) / 'out', '2026-11-19')


if __name__ == '__main__':
    unittest.main()
