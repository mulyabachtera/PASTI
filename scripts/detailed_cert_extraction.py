import os
import json
import pymupdf # PyMuPDF
from PIL import Image
import io

cert_dir = r"D:\4. PROJECT\GitHub\PASTI (Pengamanan Aset Strategis Terintegrasi dan Informatif)\Sertifikat"
assets_path = r"D:\4. PROJECT\GitHub\PASTI (Pengamanan Aset Strategis Terintegrasi dan Informatif)\sim-pasti-web\scripts\current_assets.json"

with open(assets_path, 'r', encoding='utf-8') as f:
    assets = json.load(f)

files = sorted(os.listdir(cert_dir))
print(f"Total files in Sertifikat: {len(files)}")

# Let's inspect each PDF to get page count and check images on page 1, 2, 3
summary = []

for fname in files:
    if not fname.lower().endswith('.pdf'):
        continue
    fpath = os.path.join(cert_dir, fname)
    doc = pymupdf.open(fpath)
    
    # Prefix number (e.g. "1.", "12.", "40.")
    prefix_str = fname.split('.')[0].strip()
    prefix_num = int(prefix_str) if prefix_str.isdigit() else None
    
    matched_asset = None
    if prefix_num and 1 <= prefix_num <= len(assets):
        matched_asset = assets[prefix_num - 1] # 0-indexed matches prefix number!
        
    summary.append({
        "file": fname,
        "prefix_num": prefix_num,
        "pages": len(doc),
        "size_mb": round(os.path.getsize(fpath) / (1024 * 1024), 2),
        "matched_asset_id": matched_asset["assetId"] if matched_asset else None,
        "matched_asset_name": matched_asset["namaBarang"] if matched_asset else None,
        "current_no_sertifikat": matched_asset["noSertifikat"] if matched_asset else None,
        "current_luas": matched_asset["luas"] if matched_asset else None,
    })

print(json.dumps(summary, indent=2))

