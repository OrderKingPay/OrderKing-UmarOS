import { useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Database,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  INITIAL_KNOWLEDGE_DOCUMENTS,
  INITIAL_MEMORY_ENTRIES,
  searchKnowledgeBase,
  tokenize,
  type KnowledgeDocument,
  type MemoryEntry,
  type MemoryLayer,
  type SearchResult,
} from "@/lib/ai/knowledge-engine";
import { toast } from "sonner";

export function KnowledgeMemoryHub() {
  const [activeTab, setActiveTab] = useState<"KNOWLEDGE_BASE" | "AGENT_MEMORY">("KNOWLEDGE_BASE");
  const [docs, setDocs] = useState<KnowledgeDocument[]>(INITIAL_KNOWLEDGE_DOCUMENTS);
  const [memories, setMemories] = useState<MemoryEntry[]>(INITIAL_MEMORY_ENTRIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument | null>(null);

  // New Document Modal/Form State
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCategory, setNewDocCategory] = useState<KnowledgeDocument["category"]>("SPEC");
  const [newDocContent, setNewDocContent] = useState("");
  const [showAddDoc, setShowAddDoc] = useState(false);

  // Filter Memory Layer
  const [selectedLayer, setSelectedLayer] = useState<MemoryLayer | "ALL">("ALL");

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const results = searchKnowledgeBase(searchQuery, docs);
    setSearchResults(results);
    toast.info(`Found ${results.length} relevant documents for "${searchQuery}"`);
  };

  const handleAddDocument = () => {
    if (!newDocTitle.trim() || !newDocContent.trim()) {
      toast.error("Please fill title and content for document");
      return;
    }
    const newDoc: KnowledgeDocument = {
      id: `DOC-${Date.now().toString(36)}`,
      title: newDocTitle,
      category: newDocCategory,
      content: newDocContent,
      tokens: tokenize(newDocTitle + " " + newDocContent),
      uploadedAt: new Date().toISOString(),
      author: "Founder Direct",
    };
    setDocs((prev) => [newDoc, ...prev]);
    toast.success("Document ingested and indexed in knowledge engine!");
    setNewDocTitle("");
    setNewDocContent("");
    setShowAddDoc(false);
  };

  const handleDeleteMemory = (memId: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== memId));
    toast.success("Memory entry deleted from agent store!");
  };

  const filteredMemories =
    selectedLayer === "ALL" ? memories : memories.filter((m) => m.layer === selectedLayer);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-teal-500/30 bg-teal-950/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-teal-400" />
              <h2 className="text-xl font-bold text-white">Searchable Knowledge Engine & Layered Memory (§20, §21)</h2>
              <Badge tone="primary">Founder Controllable</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Searchable document store with token retrieval and full transparency over all 9 agent memory layers.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => setShowAddDoc((prev) => !prev)}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold"
            >
              <Upload className="h-4 w-4" />
              Ingest Document
            </Button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-teal-500/20 pt-4">
          <div className="rounded-lg bg-black/40 p-3 border border-teal-500/20">
            <span className="text-xs text-slate-400">Ingested Documents</span>
            <div className="text-2xl font-bold text-white">{docs.length}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-teal-500/20">
            <span className="text-xs text-slate-400">Indexed Tokens</span>
            <div className="text-2xl font-bold text-teal-400">
              {docs.reduce((acc, d) => acc + d.tokens.length, 0)}
            </div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-teal-500/20">
            <span className="text-xs text-slate-400">Stored Memories</span>
            <div className="text-2xl font-bold text-emerald-400">{memories.length}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-teal-500/20">
            <span className="text-xs text-slate-400">Memory Control</span>
            <div className="text-2xl font-bold text-amber-400">100% Deletable</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("KNOWLEDGE_BASE")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "KNOWLEDGE_BASE"
              ? "bg-teal-500 text-black font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Knowledge Base & Documents ({docs.length})
        </button>
        <button
          onClick={() => setActiveTab("AGENT_MEMORY")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "AGENT_MEMORY"
              ? "bg-teal-500 text-black font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Layered Agent Memory ({memories.length})
        </button>
      </div>

      {activeTab === "KNOWLEDGE_BASE" ? (
        <div className="space-y-4">
          {/* Document Ingestion Form */}
          {showAddDoc && (
            <div className="rounded-xl border border-teal-500/40 bg-slate-950/90 p-5 space-y-4">
              <h3 className="font-bold text-white">Ingest New Document into Knowledge Base</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Document Title</label>
                  <Input
                    placeholder="e.g. White-Label Delivery Platform SLA"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                    className="mt-1 bg-black/50 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Category</label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value as any)}
                    className="mt-1 w-full rounded-md border border-slate-700 bg-black/50 px-3 py-2 text-sm text-white"
                  >
                    <option value="SPEC">Specification</option>
                    <option value="CONTRACT">Contract & Agreement</option>
                    <option value="MANUAL">Manual & Playbook</option>
                    <option value="CODE">Codebase Architecture</option>
                    <option value="RESEARCH">Market Research</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Document Text / Specification Content</label>
                <textarea
                  rows={4}
                  placeholder="Paste raw markdown, contract text, or technical guidelines..."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-black/50 p-3 text-sm text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDoc(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleAddDocument}>
                  Index & Ingest
                </Button>
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Search knowledge documents by keyword (e.g. commission, upi, retainer, architecture)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-black/40 border-slate-700 text-white"
            />
            <Button variant="primary" onClick={handleSearch} className="shrink-0 bg-teal-600 hover:bg-teal-500">
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
          </div>

          {/* Search Results / Document Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(searchResults
              ? docs.filter((d) => searchResults.some((r) => r.documentId === d.id))
              : docs
            ).map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedDoc?.id === doc.id
                    ? "border-teal-400 bg-teal-950/30"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge tone="primary">{doc.category}</Badge>
                  <span className="text-[11px] text-slate-500 font-mono">{doc.id}</span>
                </div>
                <h4 className="mt-2 font-semibold text-white text-sm line-clamp-1">{doc.title}</h4>
                <p className="mt-1 text-xs text-slate-400 line-clamp-3">{doc.content}</p>

                <div className="mt-3 flex items-center justify-between border-t border-slate-900 pt-2 text-[11px] text-slate-500">
                  <span>Author: {doc.author}</span>
                  <span>{doc.tokens.length} tokens</span>
                </div>
              </div>
            ))}
          </div>

          {/* Document Reader Preview */}
          {selectedDoc && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedDoc.title}</h3>
                  <span className="text-xs text-slate-400">Category: {selectedDoc.category}</span>
                </div>
                <Button variant="outline" onClick={() => setSelectedDoc(null)}>
                  Close
                </Button>
              </div>
              <div className="rounded-lg bg-black/50 p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap border border-slate-800">
                {selectedDoc.content}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Layered Agent Memory */
        <div className="space-y-4">
          {/* Layer Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLayer("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                selectedLayer === "ALL"
                  ? "bg-teal-500 text-black font-bold"
                  : "bg-black/40 text-slate-300 border border-slate-800"
              }`}
            >
              All Layers ({memories.length})
            </button>
            {Array.from(new Set(memories.map((m) => m.layer))).map((layer) => (
              <button
                key={layer}
                onClick={() => setSelectedLayer(layer)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                  selectedLayer === layer
                    ? "bg-teal-500 text-black font-bold"
                    : "bg-black/40 text-slate-300 border border-slate-800"
                }`}
              >
                {layer.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Memories List */}
          <div className="space-y-3">
            {filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Badge tone="primary">{mem.layer}</Badge>
                    <span className="font-mono text-xs text-teal-400">{mem.key}</span>
                  </div>
                  <p className="text-xs text-slate-200">{mem.value}</p>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Tag className="h-3 w-3" />
                    <span>{mem.tags.join(", ")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="rounded p-2 text-red-400 hover:bg-red-950/30 hover:text-red-300"
                    title="Delete Memory from Agent Store"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
