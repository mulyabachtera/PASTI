import os
import json
import fitz # PyMuPDF
import re

cert_dir = r"D:\4. PROJECT\GitHub\PASTI (Pengamanan Aset Strategis Terintegrasi dan Informatif)\Sertifikat"
current_assets_file = r"D:\4. PROJECT\GitHub\PASTI (Pengamanan Aset Strategis Terintegrasi dan Informatif)\sim-pasti-web\scripts\current_assets.json"

with open(current_assets_file, 'r', encoding='utf-8') as f:
    assets = json.load(f)

pdf_files = [f for f in os.listdir(cert_dir) if f.lower().endswith('.pdf')]
pdf_files.sort()

print(f"Total PDFs: {len(pdf_files)}")
print(f"Total Assets: {len(assets)}")

results = []

for pdf_name in pdf_files:
    pdf_path = os.path.join(cert_dir, pdf_name)
    doc = fitz.open(pdf_path)
    page_count = len(doc)
    
    # Extract text from all pages
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
        
    # Check if text exists or it's scanned images
    has_text = len(full_text.strip()) > 50
    
    # Try regex matching for common BPN patterns if text exists
    cert_no_match = re.search(r'01\.09\.[0-9.]+', full_text)
    luas_match = re.search(r'([0-9.,]+)\s*M2', full_text, re.IGNORECASE)
    
    results.append({
        "pdf_name": pdf_name,
        "size_mb": round(os.path.getsize(pdf_path) / (1024 * 1024), 2),
        "page_count": page_count,
        "has_text": has_text,
        "extracted_cert_no": cert_no_match.group(0) if cert_no_match else None,
        "extracted_luas": luas_match.group(1) if luas_match else None,
        "sample_text": full_text[:300].strip() if has_text else "[SCANNED IMAGE ONLY]"
    })

print(json.dumps(results, indent=2))

