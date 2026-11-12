import os
import shutil
import pymupdf
from PIL import Image
import io
import time
import json

src_dir = r"D:\4. PROJECT\GitHub\PASTI (Pengamanan Aset Strategis Terintegrasi dan Informatif)\Sertifikat"
dest_dir = r"D:\4. PROJECT\GitHub\PASTI (Pengamanan Aset Strategis Terintegrasi dan Informatif)\sim-pasti-web\public\uploads\certificates"
os.makedirs(dest_dir, exist_ok=True)

# Mapping definition
# file_src, target_name, target_asset_match, updates (no_sertifikat, luas, status_hak, status_legalitas)
mappings = [
    {
        "src_file": "1. BPKK.pdf",
        "dest_base": "sertifikat_01_bpkk.pdf",
        "asset_filter": {"kode": "1.3.1.01.01.04.001", "name_contains": "BPKK"},
        "no_sertifikat": "01.09.02.09.4.00009",
        "luas": 12551,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "2. Lapangan Musara Alun.pdf",
        "dest_base": "sertifikat_02_lapangan_musara_alun.pdf",
        "asset_filter": {"name_contains": "Musara Alun"},
        "no_sertifikat": "01.09.02.12.4.00005",
        "luas": 55801,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "3. Kantor Bupati.pdf",
        "dest_base": "sertifikat_03_kantor_bupati.pdf",
        "asset_filter": {"name_contains": "Kantor Bupati"},
        "no_sertifikat": "01.09.01.10.4.00037",
        "luas": 23841,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "4. pendopo.pdf",
        "dest_base": "sertifikat_04_pendopo.pdf",
        "asset_filter": {"name_contains": "Pendopo"},
        "no_sertifikat": "01.09.01.10.4.00038",
        "luas": 8790,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "5. UPTD Museum (jalan mess time ruang).pdf",
        "dest_base": "sertifikat_05_uptd_museum.pdf",
        "asset_filter": {"name_contains": "Museum"},
        "no_sertifikat": "01.09.02.07.4.00006",
        "luas": 72670,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "6. Tanah Budi luhur.pdf",
        "dest_base": "sertifikat_06_tanah_budi_luhur.pdf",
        "asset_filter": {"name_contains": "Budi luhur"},
        "no_sertifikat": "01.09.02.07.2.00008",
        "luas": 7929,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "9. Kantor BPRS.pdf",
        "dest_base": "sertifikat_09_kantor_bprs.pdf",
        "asset_filter": {"name_contains": "BPRS"},
        "no_sertifikat": "01.09.01.15.4.00055",
        "luas": 1699,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "10. tanah dekranas DPMK.pdf",
        "dest_base": "sertifikat_10_kantor_dpmk_dekranas.pdf",
        "asset_filter": {"name_contains": "DPMK"},
        "no_sertifikat": "01.09.02.14.4.00004",
        "luas": 2000,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "11. Tanah bangunan Mall bale atumall baleatu.pdf",
        "dest_base": "sertifikat_11_mall_bale_atu.pdf",
        "asset_filter": {"name_contains": "Mall bale atu"},
        "no_sertifikat": "01.09.01.13.4.00007",
        "luas": 5169,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "12. terminal lama.pdf",
        "dest_base": "sertifikat_12_terminal_lama.pdf",
        "asset_filter": {"name_contains": "terminal lama bale atu"},
        "secondary_filter": {"name_contains": "terminal (perhubungan)"},
        "no_sertifikat": "01.09.02.07.4.00005",
        "luas": 5902,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "14. SMP N 1.pdf",
        "dest_base": "sertifikat_14_smpn_1_takengon.pdf",
        "asset_filter": {"name_contains": "SMPN 1"},
        "no_sertifikat": "01.09.01.10.4.00044",
        "luas": 8412,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "15. DInas Kesehatan Kebayakan.pdf",
        "dest_base": "sertifikat_15_dinas_kesehatan.pdf",
        "asset_filter": {"name_contains": "Dinas Kesehatan"},
        "no_sertifikat": "01.09.01.02.4.00011",
        "luas": 868,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "16. BLUD datu beru.pdf",
        "dest_base": "sertifikat_16_blud_datu_beru.pdf",
        "asset_filter": {"name_contains": "RSU Datu Beru", "luas": 1200},
        "secondary_filter": {"name_contains": "RSU Datu Beru", "luas": 25770},
        "no_sertifikat": "01.09.01.02.4.00014",
        "luas": 1200,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "17. Paya nahu.pdf",
        "dest_base": "sertifikat_17_dlh_paya_nahu.pdf",
        "asset_filter": {"name_contains": "Paya Nahu"},
        "no_sertifikat": "01.09.02.28.2.00001",
        "luas": 8464,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "23. Puskesmas Bebesen.pdf",
        "dest_base": "sertifikat_23_puskesmas_bebesen.pdf",
        "asset_filter": {"name_contains": "Puskesmas Bebesen"},
        "no_sertifikat": "01.09.02.23.1.00003",
        "luas": 1149,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "24. Puskesmas Kebayakan.pdf",
        "dest_base": "sertifikat_24_puskesmas_kebayakan.pdf",
        "asset_filter": {"name_contains": "Puskesmas Kebayakan"},
        "no_sertifikat": "01.09.02.05.2.00007",
        "luas": 1885,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "25. Puskesmas Pegasing.pdf",
        "dest_base": "sertifikat_25_puskesmas_pegasing.pdf",
        "asset_filter": {"name_contains": "Puskesmas Pegasing"},
        "no_sertifikat": "01.09.09.05.4.00004",
        "luas": 2204,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "27. Puskesmas Silih Nara.pdf",
        "dest_base": "sertifikat_27_puskesmas_silih_nara.pdf",
        "asset_filter": {"name_contains": "Puskesmas Silih Nara"},
        "no_sertifikat": "01.09.04.01.1.00010",
        "luas": 2230,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "29. Puskesmas Ketol.pdf",
        "dest_base": "sertifikat_29_puskesmas_ketol.pdf",
        "asset_filter": {"name_contains": "Puskesmas Ketol"},
        "no_sertifikat": "01.09.17.03.1.00004",
        "luas": 3047,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "30. Puskesmas Kute Panang.pdf",
        "dest_base": "sertifikat_30_puskesmas_kute_panang.pdf",
        "asset_filter": {"name_contains": "Puskesmas Kute Panang"},
        "no_sertifikat": "01.09.17.04.2.00002",
        "luas": 2210,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "33. Puskesmas Bies II.pdf",
        "dest_base": "sertifikat_33_puskesmas_bies.pdf",
        "asset_filter": {"name_contains": "Puskesmas Bies"},
        "no_sertifikat": "01.09.09.01.4.00002",
        "luas": 400,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "35. Puskesmas Atulintang.pdf",
        "dest_base": "sertifikat_35_puskesmas_atu_lintang.pdf",
        "asset_filter": {"name_contains": "Puskesmas Atu Lintang"},
        "no_sertifikat": "01.09.18.03.1.00003",
        "luas": 4318,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "36. Puskesmas rusip.pdf",
        "dest_base": "sertifikat_36_puskesmas_rusip.pdf",
        "asset_filter": {"name_contains": "Puskesmas Rusip"},
        "no_sertifikat": "01.09.21.01.1.00005",
        "luas": 3674,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    },
    {
        "src_file": "40. dermaga dedalu.pdf",
        "dest_base": "sertifikat_40_dermaga_dedalu.pdf",
        "asset_filter": {"name_contains": "Lukup Penalam"},
        "no_sertifikat": "01.09.01.12.4.00002",
        "luas": 7991,
        "status_hak": "Hak Pakai",
        "status_legalitas": "Sertifikat"
    }
]

def compress_pdf_for_preview(src_path, preview_path):
    doc = pymupdf.open(src_path)
    new_doc = pymupdf.open()
    for page_idx in range(len(doc)):
        page = doc[page_idx]
        pix = page.get_pixmap(dpi=120)
        if pix.width < 300 or pix.height < 300:
            il = page.get_images()
            if il:
                xref = il[0][0]
                img_dict = doc.extract_image(xref)
                pil_img = Image.open(io.BytesIO(img_dict['image']))
                if pil_img.width > 1400:
                    h = int(pil_img.height * (1400 / pil_img.width))
                    pil_img = pil_img.resize((1400, h), Image.Resampling.LANCZOS)
            else:
                pil_img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
        else:
            pil_img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
            if pil_img.width > 1400:
                h = int(pil_img.height * (1400 / pil_img.width))
                pil_img = pil_img.resize((1400, h), Image.Resampling.LANCZOS)

        buf = io.BytesIO()
        pil_img.save(buf, format='JPEG', quality=70, optimize=True)
        buf.seek(0)
        img_doc = pymupdf.open(stream=buf.getvalue(), filetype='jpeg')
        pdf_bytes = img_doc.convert_to_pdf()
        img_pdf = pymupdf.open('pdf', pdf_bytes)
        new_doc.insert_pdf(img_pdf)

    new_doc.save(preview_path, deflate=True)
    new_doc.close()
    doc.close()

processed = []

print("Starting copying and compressing certificates...")
for m in mappings:
    src_p = os.path.join(src_dir, m["src_file"])
    if not os.path.exists(src_p):
        print(f"File not found: {src_p}")
        continue
    
    dest_p = os.path.join(dest_dir, m["dest_base"])
    preview_base = m["dest_base"].replace(".pdf", "_preview.pdf")
    preview_p = os.path.join(dest_dir, preview_base)
    
    # 1. Copy original file
    shutil.copyfile(src_p, dest_p)
    
    # 2. Generate compressed preview
    t0 = time.time()
    compress_pdf_for_preview(dest_p, preview_p)
    t1 = time.time()
    
    orig_mb = os.path.getsize(dest_p) / (1024 * 1024)
    prev_mb = os.path.getsize(preview_p) / (1024 * 1024)
    
    print(f"[OK] {m['dest_base']}: {orig_mb:.2f} MB -> {prev_mb:.2f} MB ({t1-t0:.2f}s)")
    
    m["relative_url"] = f"/uploads/certificates/{m['dest_base']}"
    m["orig_size_mb"] = round(orig_mb, 2)
    m["preview_size_mb"] = round(prev_mb, 2)
    processed.append(m)

plan_file = r"D:\4. PROJECT\GitHub\PASTI (Pengamanan Aset Strategis Terintegrasi dan Informatif)\sim-pasti-web\scripts\certificate_sync_plan.json"
with open(plan_file, "w", encoding="utf-8") as f:
    json.dump(processed, f, indent=2)

print(f"Processed {len(processed)} certificates successfully.")

