from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from app.utils import process_pdfs, create_vector_db, query_vector_db
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vector_db = None

class ProcessRequest(BaseModel):
    model: str
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    similarity_threshold: float
    file_paths: List[str]

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_paths = []
    for file in files:
        file_path = os.path.join(upload_dir, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        file_paths.append(file_path)
    return {"file_paths": file_paths}

@app.post("/process")
async def process_files(request: ProcessRequest):
    global vector_db
    chunks = process_pdfs(request.file_paths, request.chunk_size, request.chunk_overlap)
    vector_db = create_vector_db(chunks, request.embedding_model)
    return {"status": "Processing complete"}

class QueryRequest(BaseModel):
    question: str
    model: str

@app.post("/query")
async def query(request: QueryRequest):
    global vector_db
    if vector_db is None:
        raise HTTPException(status_code=400, detail="Vector database not created. Please process files first.")
    try:
        answer, sources = query_vector_db(request.question, request.model, vector_db)
        return {"answer": answer, "sources": sources}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
