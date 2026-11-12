import React, { useState, useRef } from "react";
export interface ChatMessage {
  id: string;
  sender: "PARTNER" | "SPARK_AI";
  text: string;
  timestamp: string;
  attachmentName?: string;
  parsedData?: {
    type: "MENU_PARSE" | "SALES_METRICS" | "KITCHEN_BOTTLENECK";
    summary: string;
    details: Record<string, unknown>;
  };
}
interface SparkAIWorkspaceProps {
  restaurantId: string;
  onUploadFileToBackend: (file: File) => Promise<{ parsedContent: string; metadata: Record<string, unknown> }>;
  onSendMessageToAI: (message: string, contextFileId?: string) => Promise<string>;
}
export const SparkAIWorkspace: React.FC<SparkAIWorkspaceProps> = ({
  restaurantId,
  onUploadFileToBackend,
  onSendMessageToAI,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "SPARK_AI",
      text: "OrderKing Partner Assistant active. Upload your physical menu card photo, daily sales CSV, or invoice to parse items, optimize margins, or diagnose kitchen bottlenecks.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleSend = async () => {
    if (!inputText.trim() && !selectedFile) return;
    const userText = inputText.trim();
    const currentFile = selectedFile;
    setInputText("");
    setSelectedFile(null);
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "PARTNER",
      text: userText || `Uploaded file: ${currentFile?.name}`,
      timestamp: new Date().toISOString(),
      attachmentName: currentFile?.name,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);
    try {
      let aiResponseText = "";
      let parsedPayload = undefined;
      if (currentFile) {
        const uploadResult = await onUploadFileToBackend(currentFile);
        aiResponseText = `I've analyzed ${currentFile.name}. ${uploadResult.parsedContent}`;
        parsedPayload = {
          type: "MENU_PARSE" as const,
          summary: "Document Structured Extraction",
          details: uploadResult.metadata,
        };
      } else {
        aiResponseText = await onSendMessageToAI(userText);
      }
      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "SPARK_AI",
        text: aiResponseText,
        timestamp: new Date().toISOString(),
        parsedData: parsedPayload,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "SPARK_AI",
          text: `Processing error: ${err instanceof Error ? err.message : "Service connection error"}. Please check file format.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "85vh", backgroundColor: "#0F172A", borderRadius: "12px", border: "1px solid #334155", color: "#F8FAFC", overflow: "hidden" }}>
      <header style={{ padding: "16px", backgroundColor: "#1E293B", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "18px", color: "#EA580C", fontWeight: 700 }}>Partner Assistant Intelligence</h2>
          <span style={{ fontSize: "12px", color: "#94A3B8" }}>Outlet ID: {restaurantId} | Multi-Modal Document & KDS Engine</span>
        </div>
      </header>
      <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              alignSelf: msg.sender === "PARTNER" ? "flex-end" : "flex-start",
              maxWidth: "80%",
              backgroundColor: msg.sender === "PARTNER" ? "#EA580C" : "#1E293B",
              color: "#FFF",
              padding: "12px 16px",
              borderRadius: "10px",
              border: msg.sender === "SPARK_AI" ? "1px solid #334155" : "none",
            }}
          >
            {msg.attachmentName && (
              <div style={{ fontSize: "11px", backgroundColor: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: "4px", marginBottom: "6px" }}>
                Attachment: {msg.attachmentName}
              </div>
            )}
            <div style={{ fontSize: "14px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{msg.text}</div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.7)", textAlign: "right", marginTop: "4px" }}>
              {new Date(msg.timestamp).toLocaleTimeString("en-IN")}
            </div>
          </div>
        ))}
        {isProcessing && (
          <div style={{ alignSelf: "flex-start", backgroundColor: "#1E293B", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", color: "#F97316" }}>
            Processing document via neural parser...
          </div>
        )}
      </div>
      <footer style={{ padding: "12px 16px", backgroundColor: "#1E293B", borderTop: "1px solid #334155" }}>
        {selectedFile && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0F172A", padding: "6px 12px", borderRadius: "6px", marginBottom: "8px", fontSize: "12px" }}>
            <span>File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            <button onClick={() => setSelectedFile(null)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }} aria-label="Remove file">Remove</button>
          </div>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept=".png,.jpg,.jpeg,.pdf,.csv"
            onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: "10px 14px", backgroundColor: "#334155", color: "#FFF", border: "none", borderRadius: "6px", cursor: "pointer" }}
            title="Upload Menu/CSV"
          >
            Attach
          </button>
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask Partner Assistant (e.g. 'Extract items from menu', 'Diagnose prep delays')..."
            style={{ flex: 1, padding: "10px 14px", backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: "6px", color: "#FFF", outline: "none" }}
          />
          <button
            onClick={handleSend}
            disabled={isProcessing}
            style={{ padding: "10px 18px", backgroundColor: "#EA580C", color: "#FFF", border: "none", borderRadius: "6px", fontWeight: 700, cursor: isProcessing ? "not-allowed" : "pointer" }}
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
};
