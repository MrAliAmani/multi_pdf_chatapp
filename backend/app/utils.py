from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma, FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFacePipeline
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.llms import OpenAI
from langchain_community.chat_models import ChatOpenAI
import os
from dotenv import load_dotenv

load_dotenv()

def process_pdfs(file_paths, chunk_size, chunk_overlap):
    documents = []
    for path in file_paths:
        loader = PyPDFLoader(path)
        documents.extend(loader.load())
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = text_splitter.split_documents(documents)
    return chunks

def create_vector_db(chunks, embedding_model, db_type="chroma"):
    embeddings = HuggingFaceEmbeddings(model_name=embedding_model)
    if db_type == "chroma":
        db = Chroma.from_documents(chunks, embeddings)
    elif db_type == "faiss":
        db = FAISS.from_documents(chunks, embeddings)
    else:
        raise ValueError("Unsupported vector DB type")
    return db

def get_llm(model_name):
    if model_name.startswith("llama-") or model_name.startswith("mixtral-"):
        return ChatGroq(temperature=0.7, groq_api_key=os.getenv("GROQ_API_KEY"))
    elif model_name in ["gpt-4o", "gpt-4o-mini"]:
        return HuggingFacePipeline(pipeline_name=model_name, huggingfacehub_api_token=os.getenv("HF_TOKEN"))
    elif model_name in ["liquid/lfm-40b:free", "nousresearch/hermes-3-llama-3.1-405b:free", "meta-llama/llama-3.1-405b-instruct:free", "mistralai/mistral-7b-instruct:free"]:
        return OpenAI(
            model=model_name,
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY"),
            max_tokens=1000,
            temperature=0.7,
            headers={
                "HTTP-Referer": "http://localhost:5173",  # Replace with your actual website URL
                "X-Title": "Multi-PDF Chat App"  # Replace with your app name
            }
        )
    elif model_name == "gemini-pro":
        return ChatGoogleGenerativeAI(model="gemini-pro", google_api_key=os.getenv("GOOGLE_API_KEY"))
    else:
        raise ValueError(f"Unsupported model: {model_name}")

def query_vector_db(question: str, model_name: str, vector_db):
    llm = get_llm(model_name)
    
    retriever = vector_db.as_retriever()
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True
    )

    result = qa_chain.invoke({"query": question})
    
    answer = result['result']
    sources = [doc.metadata.get('source', 'Unknown source') for doc in result.get('source_documents', [])]

    return answer, sources
