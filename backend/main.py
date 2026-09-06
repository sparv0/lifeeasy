from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import zipfile
from pypdf import PdfWriter, PdfReader
from pdf2docx import Converter
import fitz  # PyMuPDF
from PIL import Image

app = FastAPI(title="OmniConvert API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("temp_in", exist_ok=True)
os.makedirs("temp_out", exist_ok=True)

@app.get("/")
def read_root():
    return {"status": "OmniConvert Backend Running"}

@app.post("/merge_pdf")
async def merge_pdfs(files: list[UploadFile] = File(...)):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least 2 PDF files to merge.")
    
    merger = PdfWriter()
    temp_files = []
    
    try:
        for f in files:
            file_path = os.path.join("temp_in", f.filename)
            temp_files.append(file_path)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(f.file, buffer)
            merger.append(file_path)
            
        output_path = os.path.join("temp_out", "merged.pdf")
        merger.write(output_path)
        merger.close()
        
        return FileResponse(output_path, filename="merged_document.pdf")
    finally:
        for path in temp_files:
            if os.path.exists(path):
                os.remove(path)

@app.post("/split_pdf")
async def split_pdf(file: UploadFile = File(...)):
    file_path = os.path.join("temp_in", file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        reader = PdfReader(file_path)
        zip_path = os.path.join("temp_out", "split_pages.zip")
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for i, page in enumerate(reader.pages):
                writer = PdfWriter()
                writer.add_page(page)
                page_filename = f"page_{i+1}.pdf"
                page_path = os.path.join("temp_out", page_filename)
                
                with open(page_path, "wb") as f_out:
                    writer.write(f_out)
                    
                zipf.write(page_path, arcname=page_filename)
                os.remove(page_path)
                
        return FileResponse(zip_path, filename="split_documents.zip")
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

@app.post("/pdf_to_docx")
async def pdf_to_docx(file: UploadFile = File(...)):
    file_path = os.path.join("temp_in", file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        docx_path = os.path.join("temp_out", "converted.docx")
        cv = Converter(file_path)
        cv.convert(docx_path, start=0, end=None)
        cv.close()
        return FileResponse(docx_path, filename="converted_document.docx")
    finally:
        if os.path.exists(file_path): 
            os.remove(file_path)

@app.post("/pdf_to_images")
async def pdf_to_images(file: UploadFile = File(...)):
    file_path = os.path.join("temp_in", file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        doc = fitz.open(file_path)
        zip_path = os.path.join("temp_out", "pdf_images.zip")
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                pix = page.get_pixmap(dpi=150)
                img_name = f"page_{page_num+1}.png"
                img_path = os.path.join("temp_out", img_name)
                pix.save(img_path)
                zipf.write(img_path, arcname=img_name)
                os.remove(img_path)
                
        doc.close()
        return FileResponse(zip_path, filename="pdf_images.zip")
    finally:
        if os.path.exists(file_path): 
            os.remove(file_path)

@app.post("/convert_image")
async def convert_image(file: UploadFile = File(...), target_format: str = Form(...)):
    file_path = os.path.join("temp_in", file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        img = Image.open(file_path)
        # Handle RGBA to JPEG conversion which doesn't support alpha
        if img.mode in ("RGBA", "P", "LA") and target_format.lower() in ("jpeg", "jpg"):
            # Create a white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'RGBA':
                background.paste(img, mask=img.split()[3]) # 3 is the alpha channel
            else:
                background.paste(img)
            img = background
            
        output_filename = f"converted_image.{target_format.lower()}"
        output_path = os.path.join("temp_out", output_filename)
        
        # Save format string, mapping jpg to jpeg for Pillow
        save_format = "JPEG" if target_format.lower() == "jpg" else target_format.upper()
        img.save(output_path, format=save_format)
        
        return FileResponse(output_path, filename=output_filename)
    finally:
        if os.path.exists(file_path): 
            os.remove(file_path)
