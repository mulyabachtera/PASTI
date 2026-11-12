import json

with open(r"D:\4. PROJECT\GitHub\PASTI (Pengamanan Aset Strategis Terintegrasi dan Informatif)\sim-pasti-web\scripts\extracted_40_assets.json", "r", encoding="utf-8") as f:
    items = json.load(f)

for i, x in enumerate(items):
    print(f"{i+1}. [Row {x['row']}] {x.get('nama_combined')} | No Sert: {x.get('no_sertifikat')} | Luas: {x.get('luas')}")

