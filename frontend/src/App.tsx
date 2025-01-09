import React, { useState } from 'react'
import { Button } from "./components/ui/button"
import { Input } from "./components/ui/input"
import { Progress } from "./components/ui/progress"
import axios from 'axios'

const models = [
  "llama-3.2-90b-text-preview",
  "liquid/lfm-40b:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "meta-llama/llama-3.1-405b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "llama-3.1-70b-versatile",
  "mixtral-8x7b-32768",
  "llama-3.2-3b-preview",
  "gpt-4o",
  "gpt-4o-mini",
  "Phi-3.5-MoE-instruct",
  "Mistral-large"
]

const embeddingModels = [
  "BAAI/bge-small-en",
  "sentence-transformers/all-mpnet-base-v2",
  "text-embedding-3-large",
  "text-embedding-3-small"
]

function App() {
  const [selectedModel, setSelectedModel] = useState("llama-3.2-90b-text-preview")
  const [selectedEmbeddingModel, setSelectedEmbeddingModel] = useState("BAAI/bge-small-en")
  const [chunkSize, setChunkSize] = useState(1000)
  const [chunkOverlap, setChunkOverlap] = useState(200)
  const [similarityThreshold, setSimilarityThreshold] = useState(0.7)
  const [files, setFiles] = useState<File[]>([])
  const [progress, setProgress] = useState(0)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [sources, setSources] = useState<string[]>([])
  const [chatHistory, setChatHistory] = useState<{question: string, answer: string}[]>([])
  const [isVectorDBCreated, setIsVectorDBCreated] = useState(false)
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const uploadedFiles = Array.from(event.target.files)
      setFiles(uploadedFiles)
      console.log('Files uploaded:', uploadedFiles)
    }
  }

  const handleCreateVectorDB = async () => {
    setProgress(0);
    try {
      // First, upload the files
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      const uploadResponse = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Then, process the files and create the vector DB
      const processResponse = await axios.post('http://localhost:8000/process', {
        model: selectedModel,
        embedding_model: selectedEmbeddingModel,
        chunk_size: chunkSize,
        chunk_overlap: chunkOverlap,
        similarity_threshold: similarityThreshold,
        file_paths: uploadResponse.data.file_paths
      });

      setProgress(100);
      console.log('Vector DB created:', processResponse.data);
      setIsVectorDBCreated(true);
      setError(null);
    } catch (error) {
      console.error('Error creating vector DB:', error);
      setProgress(0);
      setError('Failed to create vector DB. Please try again.');
    }
  };

  const handleAskQuestion = async () => {
    try {
      const response = await axios.post('http://localhost:8000/query', { question, model: selectedModel });
      setAnswer(response.data.answer);
      setSources(response.data.sources || []);
      setChatHistory([...chatHistory, { question, answer: response.data.answer }]);
      setQuestion("");
    } catch (error) {
      console.error('Error asking question:', error);
      if (axios.isAxiosError(error) && error.response) {
        setAnswer(`Error: ${error.response.status} - ${error.response.data.detail || 'Unknown error'}`);
      } else {
        setAnswer("An error occurred while processing your question.");
      }
      setSources([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Multi-PDF Chat App</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Model</label>
        <select
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
        >
          {models.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Select Embedding Model</label>
        <select
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          value={selectedEmbeddingModel}
          onChange={(e) => setSelectedEmbeddingModel(e.target.value)}
        >
          {embeddingModels.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Upload PDF Files</label>
        <Input type="file" multiple onChange={handleFileUpload} />
        {files.length > 0 && (
          <div className="mt-2">
            <h3 className="text-lg font-bold">Uploaded Files:</h3>
            <ul>
              {files.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Chunk Size</label>
        <Input type="number" value={chunkSize} onChange={(e) => setChunkSize(Number(e.target.value))} placeholder="Chunk Size" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Chunk Overlap</label>
        <Input type="number" value={chunkOverlap} onChange={(e) => setChunkOverlap(Number(e.target.value))} placeholder="Chunk Overlap" />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Similarity Threshold</label>
        <Input type="number" value={similarityThreshold} onChange={(e) => setSimilarityThreshold(Number(e.target.value))} placeholder="Similarity Threshold" step="0.1" min="0" max="1" />
      </div>

      <Button onClick={handleCreateVectorDB}>Create Vector DB</Button>

      <div className="my-4">
        <Progress value={progress} />
      </div>

      {error && <div className="text-red-500 mt-2">{error}</div>}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Ask a Question</label>
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question" />
        <Button onClick={handleAskQuestion} className="mt-2" disabled={!isVectorDBCreated}>Ask</Button>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold">Answer:</h2>
        <p>{answer}</p>
        <h3 className="text-lg font-bold mt-2">Sources:</h3>
        <ul>
          {sources.map((source, index) => (
            <li key={index}>{source}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-xl font-bold">Chat History:</h2>
        {chatHistory.map((chat, index) => (
          <div key={index} className="mb-2">
            <p><strong>Q:</strong> {chat.question}</p>
            <p><strong>A:</strong> {chat.answer}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
