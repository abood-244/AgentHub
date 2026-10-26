import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiClient } from '../../../services/apiClient';
import './DatabaseView.css';

interface DocumentItem {
  id: number;
  title: string;
  title_en: string | null;
  source_type: 'csv' | 'markdown';
  storage_type: 'vector' | 'normal';
  chunks_count: number;
  total_tokens: number;
  records_count?: number | null;
  columns_count?: number | null;
  file_size?: number | null;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  original_content?: string;
  created_at: string;
}

interface DocumentChunkItem {
  id: number;
  chunk_index: number;
  content: string;
  token_count: number;
}

interface EmbeddingModelItem {
  id: number;
  name: string;
  display_name?: string;
  provider: string;
  dimensions: number;
  max_tokens: number;
  is_enabled: boolean;
  is_recommended?: boolean;
}

interface CsvPreviewData {
  columns: string[];
  columns_count: number;
  total_records: number;
  sample_rows: string[][];
  file_size: number;
  file_name: string;
}

interface DatabaseViewProps {
  workspaceId: string;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ workspaceId }) => {
  const { language } = useTranslation();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState<'documents' | 'add' | 'embedding'>('documents');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'csv' | 'markdown'>('all');
  const [storageFilter, setStorageFilter] = useState<'all' | 'vector' | 'normal'>('all');

  // Add Document state
  const [addSourceType, setAddSourceType] = useState<'markdown' | 'csv'>('markdown');
  const [docTitle, setDocTitle] = useState('');
  const [storageType, setStorageType] = useState<'vector' | 'normal'>('vector');
  const [markdownContent, setMarkdownContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Embedding Settings state
  const [embeddingModels, setEmbeddingModels] = useState<EmbeddingModelItem[]>([]);
  const [selectedEmbeddingModelId, setSelectedEmbeddingModelId] = useState<number | null>(null);
  const [savingEmbedding, setSavingEmbedding] = useState(false);

  // Modals state
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null);
  const [docChunks, setDocChunks] = useState<DocumentChunkItem[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [activeModal, setActiveModal] = useState<'content' | 'chunks' | null>(null);

  useEffect(() => {
    loadDocuments();
    loadWorkspaceInfo();
    loadEmbeddingModels();
  }, [workspaceId]);

  const showBanner = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<{ data: DocumentItem[] }>(`/workspaces/${workspaceId}/documents`);
      setDocuments(res.data);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      showBanner('error', isEn ? 'Failed to load documents' : 'فشل تحميل المستندات');
    } finally {
      setLoading(false);
    }
  };

  const loadWorkspaceInfo = async () => {
    try {
      const res = await apiClient.get<{ workspace: { selected_embedding_model_id: number | null } }>(`/workspaces/${workspaceId}`);
      setSelectedEmbeddingModelId(res.workspace?.selected_embedding_model_id ?? null);
    } catch (err) {
      console.error('Failed to load workspace info:', err);
    }
  };

  const loadEmbeddingModels = async () => {
    try {
      const res = await apiClient.get<{ data: EmbeddingModelItem[] }>('/embedding-models?enabled=true');
      setEmbeddingModels(res.data);
    } catch (err) {
      console.error('Failed to load embedding models:', err);
    }
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (!docTitle) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    try {
      setPreviewLoading(true);
      const formData = new FormData();
      formData.append('csv_file', file);

      const res = await apiClient.post<{ data: CsvPreviewData }>(
        `/workspaces/${workspaceId}/documents/preview-csv`,
        formData
      );
      setCsvPreview(res.data);
    } catch (err: any) {
      console.error('Failed to preview CSV:', err);
      showBanner('error', err.message || (isEn ? 'Invalid CSV file' : 'ملف CSV غير صالح أو تالف'));
      setCsvPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      showBanner('error', isEn ? 'Document title is required' : 'عنوان المستند مطلوب');
      return;
    }

    if (addSourceType === 'markdown' && !markdownContent.trim()) {
      showBanner('error', isEn ? 'Markdown content cannot be empty' : 'محتوى المستند لا يمكن أن يكون فارغاً');
      return;
    }

    if (addSourceType === 'csv' && !selectedFile) {
      showBanner('error', isEn ? 'Please choose a CSV file' : 'يرجى اختيار ملف CSV صالح');
      return;
    }

    try {
      setSubmitting(true);
      if (addSourceType === 'csv' && selectedFile) {
        const formData = new FormData();
        formData.append('title', docTitle.trim());
        formData.append('source_type', 'csv');
        formData.append('storage_type', storageType);
        formData.append('csv_file', selectedFile);

        await apiClient.post(`/workspaces/${workspaceId}/documents`, formData);
      } else {
        await apiClient.post(`/workspaces/${workspaceId}/documents`, {
          title: docTitle.trim(),
          source_type: 'markdown',
          storage_type: storageType,
          content: markdownContent,
        });
      }

      showBanner('success', isEn ? 'Document added and indexed successfully!' : 'تم حفظ المستند ومعالجته بنجاح!');
      // Reset form
      setDocTitle('');
      setMarkdownContent('');
      setSelectedFile(null);
      setCsvPreview(null);
      setActiveTab('documents');
      loadDocuments();
    } catch (err: any) {
      console.error('Failed to create document:', err);
      showBanner('error', err.message || (isEn ? 'Failed to process document' : 'فشل حفظ ومعالجة المستند'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm(isEn ? 'Are you sure you want to delete this document and all its vector embeddings?' : 'هل أنت متأكد من حذف هذا المستند وجميع متجهاته المرتبطة؟')) {
      return;
    }

    try {
      await apiClient.delete(`/workspaces/${workspaceId}/documents/${docId}`);
      setDocuments(docs => docs.filter(d => d.id !== docId));
      showBanner('success', isEn ? 'Document and embeddings deleted.' : 'تم حذف المستند والمتجهات المرتبطة به بنجاح.');
    } catch (err: any) {
      showBanner('error', err.message || (isEn ? 'Failed to delete' : 'فشل حذف المستند'));
    }
  };

  const handleOpenContentModal = async (doc: DocumentItem) => {
    setInspectDoc(doc);
    setActiveModal('content');
    if (!doc.original_content) {
      try {
        const res = await apiClient.get<{ data: DocumentItem }>(`/workspaces/${workspaceId}/documents/${doc.id}`);
        setInspectDoc(res.data);
      } catch (err) {
        console.error('Failed to fetch full doc:', err);
      }
    }
  };

  const handleOpenChunksModal = async (doc: DocumentItem) => {
    setInspectDoc(doc);
    setActiveModal('chunks');
    setLoadingChunks(true);
    try {
      const res = await apiClient.get<{ data: DocumentChunkItem[] }>(`/workspaces/${workspaceId}/documents/${doc.id}/chunks`);
      setDocChunks(res.data);
    } catch (err) {
      console.error('Failed to fetch chunks:', err);
      showBanner('error', isEn ? 'Failed to load chunks' : 'فشل تحميل المقاطع النصية');
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleSaveEmbeddingModel = async (modelId: number) => {
    try {
      setSavingEmbedding(true);
      await apiClient.put(`/workspaces/${workspaceId}`, {
        selected_embedding_model_id: modelId,
      });
      setSelectedEmbeddingModelId(modelId);
      showBanner('success', isEn ? 'Embedding model updated for this workspace.' : 'تم تحديث نموذج التضمين المعتمد لهذه المساحة.');
    } catch (err: any) {
      showBanner('error', err.message || (isEn ? 'Failed to update embedding model' : 'فشل تحديث نموذج التضمين'));
    } finally {
      setSavingEmbedding(false);
    }
  };

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="ws-db-badge ws-db-badge--success">✓ {isEn ? 'Ready' : 'جاهز ومفهرس'}</span>;
      case 'processing':
        return <span className="ws-db-badge ws-db-badge--processing">⏳ {isEn ? 'Processing...' : 'جاري المعالجة...'}</span>;
      case 'failed':
        return <span className="ws-db-badge ws-db-badge--danger">✕ {isEn ? 'Failed' : 'فشل الفهرسة'}</span>;
      default:
        return <span className="ws-db-badge ws-db-badge--warning">{isEn ? 'Pending' : 'قيد الانتظار'}</span>;
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || doc.source_type === sourceFilter;
    const matchesStorage = storageFilter === 'all' || doc.storage_type === storageFilter;
    return matchesSearch && matchesSource && matchesStorage;
  });

  const totalChunksCount = documents.reduce((acc, d) => acc + (d.chunks_count || 0), 0);
  const vectorDocsCount = documents.filter(d => d.storage_type === 'vector').length;
  const normalDocsCount = documents.filter(d => d.storage_type === 'normal').length;

  return (
    <div className="ws-database-container">
      {/* Header */}
      <div className="ws-database-header">
        <div>
          <h1 className="ws-database-title">{isEn ? 'Knowledge Base & Vectors' : 'قاعدة المعرفة والمتجهات'}</h1>
          <p className="ws-database-subtitle">
            {isEn
              ? 'Manage documents, CSV uploads, chunking, and semantic vector embeddings for this workspace'
              : 'إدارة المستندات، ملفات CSV، المقاطع النصية (Chunks)، والتضمين المتجهي الدلالي (RAG)'}
          </p>
        </div>
        <button
          className="ws-db-btn ws-db-btn--primary"
          onClick={() => setActiveTab(activeTab === 'add' ? 'documents' : 'add')}
        >
          {activeTab === 'add' ? (isEn ? 'View Documents' : 'عرض المستندات') : (isEn ? '+ Add New Document' : '+ إضافة مستند جديد')}
        </button>
      </div>

      {/* Banner Message */}
      {message && (
        <div className={`ws-db-alert ws-db-alert--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="ws-db-tabs">
        <button
          className={`ws-db-tab ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => setActiveTab('documents')}
        >
          📚 {isEn ? 'Documents & Chunks' : 'المستندات والمقاطع'} ({documents.length})
        </button>
        <button
          className={`ws-db-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          ➕ {isEn ? 'Add Document (CSV / Markdown)' : 'إضافة مستند جديد'}
        </button>
        <button
          className={`ws-db-tab ${activeTab === 'embedding' ? 'active' : ''}`}
          onClick={() => setActiveTab('embedding')}
        >
          ⚙️ {isEn ? 'Embedding Settings' : 'إعدادات التضمين (Embedding)'}
        </button>
      </div>

      {/* TAB 1: DOCUMENTS LIST */}
      {activeTab === 'documents' && (
        <div>
          {/* Summary Metric Cards */}
          <div className="ws-db-stats-grid">
            <div className="ws-db-stat-card">
              <span className="ws-db-stat-icon">📄</span>
              <div className="ws-db-stat-info">
                <span className="ws-db-stat-label">{isEn ? 'Total Documents' : 'إجمالي المستندات'}</span>
                <span className="ws-db-stat-val">{documents.length}</span>
              </div>
            </div>
            <div className="ws-db-stat-card">
              <span className="ws-db-stat-icon" style={{ background: '#EEF2FF', color: '#4F46E5' }}>🔍</span>
              <div className="ws-db-stat-info">
                <span className="ws-db-stat-label">{isEn ? 'Vector Storage' : 'تخزين متجهي (RAG)'}</span>
                <span className="ws-db-stat-val">{vectorDocsCount}</span>
              </div>
            </div>
            <div className="ws-db-stat-card">
              <span className="ws-db-stat-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>📁</span>
              <div className="ws-db-stat-info">
                <span className="ws-db-stat-label">{isEn ? 'Normal Storage' : 'تخزين عادي'}</span>
                <span className="ws-db-stat-val">{normalDocsCount}</span>
              </div>
            </div>
            <div className="ws-db-stat-card">
              <span className="ws-db-stat-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>🧩</span>
              <div className="ws-db-stat-info">
                <span className="ws-db-stat-label">{isEn ? 'Total Chunks' : 'إجمالي المقاطع Chunks'}</span>
                <span className="ws-db-stat-val">{totalChunksCount}</span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="ws-db-filters">
            <input
              type="text"
              className="ws-db-search"
              placeholder={isEn ? 'Search documents by title...' : 'بحث في المستندات بالعنوان...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="ws-db-filter-group">
              <select
                className="ws-db-select"
                value={sourceFilter}
                onChange={e => setSourceFilter(e.target.value as any)}
              >
                <option value="all">{isEn ? 'All Sources' : 'كافة المصادر'}</option>
                <option value="markdown">{isEn ? 'Markdown' : 'محرر Markdown'}</option>
                <option value="csv">{isEn ? 'CSV Files' : 'ملفات CSV'}</option>
              </select>
              <select
                className="ws-db-select"
                value={storageFilter}
                onChange={e => setStorageFilter(e.target.value as any)}
              >
                <option value="all">{isEn ? 'All Storage Types' : 'كافة أنواع التخزين'}</option>
                <option value="vector">{isEn ? 'Vector (Semantic Search)' : 'متجهي (بحث دلالي)'}</option>
                <option value="normal">{isEn ? 'Normal (Standard DB)' : 'تخزين عادي'}</option>
              </select>
            </div>
          </div>

          {/* List or Empty State */}
          {loading ? (
            <div className="ws-db-loading">
              <div className="ws-db-spinner" />
              <p>{isEn ? 'Loading knowledge base...' : 'جاري تحميل قاعدة المعرفة...'}</p>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="ws-db-empty">
              <span className="ws-db-empty-icon">📂</span>
              <h3>{isEn ? 'No documents found' : 'لا توجد مستندات مطابقة'}</h3>
              <p>
                {documents.length === 0
                  ? (isEn ? 'Add your first document or upload a CSV file to train the AI agent.' : 'أضف أول مستند أو ارفع ملف CSV لتمكين الوكيل من الإجابة.')
                  : (isEn ? 'Try adjusting your search query or filters.' : 'جرّب تعديل معايير البحث أو التصفية.')}
              </p>
              {documents.length === 0 && (
                <button className="ws-db-btn ws-db-btn--primary" onClick={() => setActiveTab('add')} style={{ marginTop: 12 }}>
                  {isEn ? 'Add First Document' : 'إضافة أول مستند'}
                </button>
              )}
            </div>
          ) : (
            <div className="ws-db-card-list">
              {filteredDocs.map(doc => (
                <div key={doc.id} className="ws-db-item-card">
                  <div className="ws-db-item-header">
                    <div className="ws-db-item-icon-wrap">
                      <span className="ws-db-item-icon">{doc.source_type === 'csv' ? '📊' : '📝'}</span>
                    </div>
                    <div className="ws-db-item-meta-wrap">
                      <div className="ws-db-item-title-row">
                        <h3 className="ws-db-item-title">{doc.title}</h3>
                        <span className={`ws-db-storage-pill ${doc.storage_type}`}>
                          {doc.storage_type === 'vector' ? (isEn ? '🔍 Vector RAG' : '🔍 تخزين متجهي') : (isEn ? '📁 Normal' : '📁 تخزين عادي')}
                        </span>
                      </div>
                      <div className="ws-db-item-badges">
                        <span className="ws-db-sub-badge">{doc.source_type.toUpperCase()}</span>
                        <span className="ws-db-sub-badge">{doc.chunks_count} {isEn ? 'Chunks' : 'مقطع'}</span>
                        <span className="ws-db-sub-badge">~{doc.total_tokens} {isEn ? 'Tokens' : 'رمز'}</span>
                        {doc.source_type === 'csv' && doc.records_count !== null && (
                          <span className="ws-db-sub-badge">{doc.records_count} {isEn ? 'rows' : 'سجل'}</span>
                        )}
                        {doc.file_size ? <span className="ws-db-sub-badge">{formatFileSize(doc.file_size)}</span> : null}
                        <span className="ws-db-item-date">{new Date(doc.created_at).toLocaleDateString(isEn ? 'en-US' : 'ar-SA')}</span>
                      </div>
                    </div>
                    <div className="ws-db-item-status">
                      {getStatusBadge(doc.processing_status)}
                    </div>
                  </div>

                  <div className="ws-db-item-actions">
                    <button
                      className="ws-db-action-btn"
                      onClick={() => handleOpenContentModal(doc)}
                      title={isEn ? 'View Original Content' : 'استعراض المحتوى الأصلي'}
                    >
                      👁️ {isEn ? 'Content' : 'المحتوى الأصلي'}
                    </button>
                    <button
                      className="ws-db-action-btn"
                      onClick={() => handleOpenChunksModal(doc)}
                      title={isEn ? 'View Chunks' : 'استعراض المقاطع'}
                    >
                      🧩 {isEn ? 'Chunks' : 'المقاطع'} ({doc.chunks_count})
                    </button>
                    <button
                      className="ws-db-action-btn ws-db-action-btn--danger"
                      onClick={() => handleDelete(doc.id)}
                      title={isEn ? 'Delete document' : 'حذف المستند'}
                    >
                      🗑️ {isEn ? 'Delete' : 'حذف'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD DOCUMENT */}
      {activeTab === 'add' && (
        <div className="ws-db-form-wrapper">
          <form onSubmit={handleCreateDocument} className="ws-db-form">
            <h2 className="ws-db-form-title">{isEn ? 'Add Knowledge Document' : 'إضافة مستند جديد لقاعدة المعرفة'}</h2>

            {/* Source Type Selector */}
            <div className="ws-db-form-group">
              <label className="ws-db-label">{isEn ? '1. Content Source' : '١. مصدر البيانات'}</label>
              <div className="ws-db-type-selector">
                <button
                  type="button"
                  className={`ws-db-type-card ${addSourceType === 'markdown' ? 'selected' : ''}`}
                  onClick={() => setAddSourceType('markdown')}
                >
                  <span className="ws-db-type-icon">📝</span>
                  <div className="ws-db-type-info">
                    <h4>{isEn ? 'Manual Markdown Entry' : 'إدخال يدوي (Markdown)'}</h4>
                    <p>{isEn ? 'Write or paste formatted text, articles, or policies' : 'كتابة أو لصق نصوص ولوائح وإرشادات مباشرة'}</p>
                  </div>
                </button>
                <button
                  type="button"
                  className={`ws-db-type-card ${addSourceType === 'csv' ? 'selected' : ''}`}
                  onClick={() => setAddSourceType('csv')}
                >
                  <span className="ws-db-type-icon">📊</span>
                  <div className="ws-db-type-info">
                    <h4>{isEn ? 'CSV File Upload' : 'رفع ملف CSV'}</h4>
                    <p>{isEn ? 'Upload structured FAQ tables or student directories' : 'رفع ملفات الجداول، الأسئلة الشائعة أو البيانات المهيكلة'}</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Storage Type Selector */}
            <div className="ws-db-form-group">
              <label className="ws-db-label">{isEn ? '2. Storage & Retrieval Method' : '٢. طريقة التخزين والاسترجاع'}</label>
              <div className="ws-db-storage-selector">
                <label className={`ws-db-storage-option ${storageType === 'vector' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="storage_type"
                    value="vector"
                    checked={storageType === 'vector'}
                    onChange={() => setStorageType('vector')}
                  />
                  <div>
                    <strong>🔍 {isEn ? 'Vector Storage (Semantic Search RAG)' : 'التخزين المتجهي (Vector RAG)'}</strong>
                    <p>
                      {isEn
                        ? 'Divides text into chunks, generates vector embeddings using the configured embedding model, and enables semantic AI search.'
                        : 'يقوم بتقسيم المحتوى إلى مقاطع (Chunks) وتوليد تمثيلات متجهية (Embeddings) عبر نموذج التضمين للبحث الدلالي الذكي.'}
                    </p>
                  </div>
                </label>
                <label className={`ws-db-storage-option ${storageType === 'normal' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="storage_type"
                    value="normal"
                    checked={storageType === 'normal'}
                    onChange={() => setStorageType('normal')}
                  />
                  <div>
                    <strong>📁 {isEn ? 'Normal Storage (Standard DB)' : 'التخزين العادي (قاعدة البيانات الرئيسية)'}</strong>
                    <p>
                      {isEn
                        ? 'Stores document and chunks in PostgreSQL directly without generating vector embeddings. Useful for exact keyword lookups.'
                        : 'يحفظ المستند ومحتواه في قاعدة البيانات الرئيسية مباشرة دون توليد متجهات. مخصص للاسترجاع النصي المباشر.'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Title Field */}
            <div className="ws-db-form-group">
              <label className="ws-db-label">{isEn ? '3. Document Title' : '٣. عنوان المستند'} *</label>
              <input
                type="text"
                className="ws-db-input"
                placeholder={isEn ? 'e.g. Admission Policies 2026' : 'مثال: لوائح القبول والتسجيل للعام ٢٠٢٦'}
                value={docTitle}
                onChange={e => setDocTitle(e.target.value)}
                required
              />
            </div>

            {/* Markdown Input */}
            {addSourceType === 'markdown' && (
              <div className="ws-db-form-group">
                <label className="ws-db-label">{isEn ? '4. Content (Markdown)' : '٤. المحتوى النصي'} *</label>
                <textarea
                  className="ws-db-textarea"
                  placeholder={isEn ? 'Enter document content here in Markdown format...' : 'أدخل محتوى المستند أو اللوائح هنا بتنسيق Markdown...'}
                  value={markdownContent}
                  onChange={e => setMarkdownContent(e.target.value)}
                  rows={10}
                  required
                />
                <div className="ws-db-form-hint">
                  {markdownContent.length} {isEn ? 'characters' : 'حرف'} · ~{Math.ceil(markdownContent.split(/\s+/).filter(Boolean).length * 1.3)} {isEn ? 'estimated tokens' : 'رمز تقديري'}
                </div>
              </div>
            )}

            {/* CSV File Upload & Preview Workflow */}
            {addSourceType === 'csv' && (
              <div className="ws-db-form-group">
                <label className="ws-db-label">{isEn ? '4. Upload and Validate CSV File' : '٤. رفع ومعاينة ملف CSV'} *</label>
                <div className="ws-db-file-dropzone">
                  <input
                    type="file"
                    id="csv-file-input"
                    accept=".csv,.txt"
                    onChange={handleCsvFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="csv-file-input" className="ws-db-file-dropzone-label">
                    <span style={{ fontSize: 36 }}>📊</span>
                    <span>{selectedFile ? selectedFile.name : (isEn ? 'Click to select CSV file' : 'اضغط لاختيار ملف CSV من جهازك')}</span>
                    <small>{isEn ? 'Supports CSV with comma or semicolon delimiter (Max 10MB)' : 'يدعم ملفات CSV بحجم أقصى 10 ميغابايت'}</small>
                  </label>
                </div>

                {previewLoading && (
                  <div className="ws-db-preview-loading">
                    <div className="ws-db-spinner" />
                    <span>{isEn ? 'Analyzing file structure and columns...' : 'جاري قراءة بنية الملف والأعمدة ومعاينة السجلات...'}</span>
                  </div>
                )}

                {csvPreview && !previewLoading && (
                  <div className="ws-db-csv-preview">
                    <div className="ws-db-preview-summary">
                      <div>
                        <strong>{isEn ? 'File Name:' : 'اسم الملف:'}</strong> {csvPreview.file_name}
                      </div>
                      <div>
                        <strong>{isEn ? 'File Size:' : 'الحجم:'}</strong> {formatFileSize(csvPreview.file_size)}
                      </div>
                      <div>
                        <strong>{isEn ? 'Columns:' : 'عدد الأعمدة:'}</strong> {csvPreview.columns_count}
                      </div>
                      <div>
                        <strong>{isEn ? 'Total Records:' : 'إجمالي السجلات:'}</strong> {csvPreview.total_records}
                      </div>
                    </div>

                    <div className="ws-db-preview-table-wrap">
                      <table className="ws-db-preview-table">
                        <thead>
                          <tr>
                            {csvPreview.columns.map((col, idx) => (
                              <th key={idx}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.sample_rows.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx}>{cell || '-'}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <small className="ws-db-preview-note">
                      {isEn ? 'Showing up to first 5 sample rows for verification' : 'يتم عرض أول 5 صفوف كمعاينة للتحقق قبل الحفظ والفهرسة'}
                    </small>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="ws-db-form-actions">
              <button
                type="button"
                className="ws-db-btn ws-db-btn--secondary"
                onClick={() => setActiveTab('documents')}
              >
                {isEn ? 'Cancel' : 'إلغاء'}
              </button>
              <button
                type="submit"
                className="ws-db-btn ws-db-btn--primary"
                disabled={submitting || previewLoading}
              >
                {submitting ? (isEn ? 'Processing & Indexing...' : 'جاري المعالجة والفهرسة...') : (isEn ? 'Save & Process Document' : 'حفظ وفهرسة المستند')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: EMBEDDING SETTINGS */}
      {activeTab === 'embedding' && (
        <div className="ws-db-embedding-section">
          <div className="ws-db-embedding-banner">
            <h3>🎯 {isEn ? 'Workspace Embedding Configuration' : 'إعدادات نموذج التضمين (Embedding)'}</h3>
            <p>
              {isEn
                ? 'Only globally enabled embedding models configured in system general settings are available here. The selected model will be used when vectorizing documents and for semantic cosine similarity search in this workspace.'
                : 'تظهر هنا نماذج التضمين المُعدّة والمفعّلة مسبقاً في الإعدادات العامة للنظام. يُستخدم النموذج المحدد لتوليد المتجهات وتنفيذ البحث الدلالي لمساحة العمل الحالية.'}
            </p>
          </div>

          <div className="ws-db-models-grid">
            {embeddingModels.map(model => {
              const isSelected = selectedEmbeddingModelId === model.id;
              return (
                <div key={model.id} className={`ws-db-model-card ${isSelected ? 'active' : ''}`}>
                  <div className="ws-db-model-header">
                    <div>
                      <h4 className="ws-db-model-name">{model.display_name || model.name}</h4>
                      <span className="ws-db-model-provider">{model.provider}</span>
                    </div>
                    {isSelected && (
                      <span className="ws-db-active-badge">
                        ✓ {isEn ? 'Active Model' : 'النموذج المعتمد'}
                      </span>
                    )}
                  </div>

                  <div className="ws-db-model-specs">
                    <div className="ws-db-spec-item">
                      <span>{isEn ? 'Dimensions' : 'الأبعاد'}:</span>
                      <strong>{model.dimensions}d</strong>
                    </div>
                    <div className="ws-db-spec-item">
                      <span>{isEn ? 'Max Tokens' : 'الحد الأقصى للرموز'}:</span>
                      <strong>{model.max_tokens}</strong>
                    </div>
                  </div>

                  <button
                    className={`ws-db-btn ${isSelected ? 'ws-db-btn--outline' : 'ws-db-btn--primary'}`}
                    style={{ width: '100%', marginTop: 14 }}
                    onClick={() => handleSaveEmbeddingModel(model.id)}
                    disabled={isSelected || savingEmbedding}
                  >
                    {isSelected ? (isEn ? 'Currently Selected' : 'محدد حالياً') : (isEn ? 'Set as Workspace Model' : 'اعتماد لهذه المساحة')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW ORIGINAL CONTENT */}
      {activeModal === 'content' && inspectDoc && (
        <div className="ws-db-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="ws-db-modal" onClick={e => e.stopPropagation()}>
            <div className="ws-db-modal-header">
              <h3>{inspectDoc.title} - {isEn ? 'Original Content' : 'المحتوى الأصلي'}</h3>
              <button className="ws-db-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="ws-db-modal-body">
              <pre className="ws-db-content-preview">
                {inspectDoc.original_content || (isEn ? 'No content stored directly.' : 'لا يوجد محتوى نصي مباشر.')}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW CHUNKS */}
      {activeModal === 'chunks' && inspectDoc && (
        <div className="ws-db-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="ws-db-modal" onClick={e => e.stopPropagation()}>
            <div className="ws-db-modal-header">
              <h3>{inspectDoc.title} - {isEn ? 'Chunks' : 'المقاطع النصية المنشأة'} ({docChunks.length})</h3>
              <button className="ws-db-modal-close" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div className="ws-db-modal-body">
              {loadingChunks ? (
                <div className="ws-db-loading">
                  <div className="ws-db-spinner" />
                  <p>{isEn ? 'Loading chunks...' : 'جاري تحميل المقاطع...'}</p>
                </div>
              ) : docChunks.length === 0 ? (
                <p className="ws-db-empty-chunks">{isEn ? 'No chunks generated for this document.' : 'لا توجد مقاطع منشأة لهذا المستند.'}</p>
              ) : (
                <div className="ws-db-chunks-list">
                  {docChunks.map(chunk => (
                    <div key={chunk.id} className="ws-db-chunk-item">
                      <div className="ws-db-chunk-header">
                        <span className="ws-db-chunk-idx">#{chunk.chunk_index + 1}</span>
                        <span className="ws-db-chunk-tokens">{chunk.token_count} {isEn ? 'Tokens' : 'رمز'}</span>
                      </div>
                      <div className="ws-db-chunk-text">{chunk.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
