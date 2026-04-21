import { useState, useEffect, useRef } from 'react';
import { UploadCloud, AlertCircle, Loader2, BrainCircuit, FileText, Activity, Trash2, TrendingUp, Server, CheckCircle, Volume2, VolumeX, Download, Share2, Heart, Camera, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';

const API = 'http://localhost:5000/api/medai';
const ACCEPTED = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.json,.html,.htm,.xml,.md,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.gif';

export default function DashboardPage() {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("");
  const [files, setFiles] = useState([]);
  const [pastFiles, setPastFiles] = useState([]);
  const [riskAlert, setRiskAlert] = useState(false);
  const [score, setScore] = useState(null);
  const [vitals, setVitals] = useState([]);
  const [link, setLink] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [serverOk, setServerOk] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [trend, setTrend] = useState([
    { date: "Jan", systolic: 118, sugar: 92 },
    { date: "Feb", systolic: 122, sugar: 95 },
    { date: "Mar", systolic: 125, sugar: 102 }
  ]);
  const sid = user?.uid || `session_${Date.now()}`;
  const synthRef = useRef(null);

  const fetchFiles = async () => {
    try { const r = await fetch(`${API}/files?sessionId=${sid}`); const d = await r.json(); if (d.success) setPastFiles(d.files); } catch {}
  };
  const deleteFile = async (id) => {
    if (!confirm("Delete?")) return;
    await fetch(`${API}/files/${encodeURIComponent(id)}?sessionId=${sid}`, { method: 'DELETE' }); fetchFiles();
  };

  const handleUpload = async () => {
    if (!files.length && !link.trim()) return setError("Select a file or paste a link.");
    setUploading(true); setError(null); setStatus(""); setAnalysis(""); setVitals([]);
    const fd = new FormData(); fd.append('sessionId', sid);
    if (files.length) fd.append('document', files[0]);
    if (link.trim()) fd.append('linkUrl', link.trim());
    try {
      const r = await fetch(`${API}/upload-report`, { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || `Error ${r.status}`);
      setStatus(d.message); setAnalysis(d.explanation); setRiskAlert(d.isCritical || false);
      setScore(d.healthScore || null); setVitals(d.vitals || []);
      if (d.healthScore) setTrend(p => [...p, { date: "Now", systolic: d.healthScore < 80 ? 148 : 115, sugar: d.healthScore < 80 ? 120 : 90 }]);
      setFiles([]); setLink(''); fetchFiles(); setShareUrl(null);
    } catch (e) { setError(e.message); } finally { setUploading(false); }
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/health').then(r => r.json()).then(() => setServerOk(true)).catch(() => setServerOk(false));
    fetchFiles();
  }, []);

  // ═══ VOICE READOUT ═══
  const toggleVoice = () => {
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    if (!analysis) return;
    const u = new SpeechSynthesisUtterance(analysis);
    u.rate = 0.9; u.pitch = 1; u.lang = 'en-US';
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u); setSpeaking(true);
  };

  // ═══ PDF DOWNLOAD ═══
  const downloadPDF = () => {
    const doc = new jsPDF(); const w = doc.internal.pageSize.getWidth(); let y = 20;
    doc.setFillColor(119, 221, 119); doc.rect(0, 0, w, 40, 'F');
    doc.setTextColor(255); doc.setFontSize(22); doc.setFont(undefined, 'bold');
    doc.text('MedTwin AI — Health Report', w / 2, 18, { align: 'center' });
    doc.setFontSize(10); doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()} | Patient: ${user?.name || 'Unknown'}`, w / 2, 30, { align: 'center' });
    y = 50;
    if (score !== null) {
      doc.setTextColor(47, 42, 38); doc.setFontSize(16); doc.setFont(undefined, 'bold');
      doc.text(`Health Score: ${score}/100`, 20, y);
      doc.setFontSize(10); doc.setFont(undefined, 'normal');
      doc.text(score > 80 ? 'Overall Healthy' : score > 50 ? 'Moderate Risks' : 'Critical', 20, y + 8);
      y += 22;
    }
    if (vitals.length > 0) {
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.text('Extracted Vitals', 20, y); y += 10;
      doc.setFontSize(9); doc.setFont(undefined, 'normal');
      vitals.forEach(v => {
        if (y > 270) { doc.addPage(); y = 20; }
        const color = v.status === 'high' ? [239, 68, 68] : v.status === 'low' ? [245, 158, 11] : [119, 221, 119];
        doc.setFillColor(...color); doc.circle(24, y - 1, 2, 'F');
        doc.setTextColor(47, 42, 38);
        doc.text(`${v.name}: ${v.value} ${v.unit}  (Normal: ${v.normalRange})  — ${v.status.toUpperCase()}`, 30, y);
        y += 7;
      });
      y += 8;
    }
    if (analysis) {
      doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(47, 42, 38);
      doc.text('AI Analysis', 20, y); y += 10;
      doc.setFontSize(9); doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize(analysis, w - 40);
      lines.forEach(line => { if (y > 275) { doc.addPage(); y = 20; } doc.text(line, 20, y); y += 5; });
    }
    doc.setFontSize(7); doc.setTextColor(168, 155, 141);
    doc.text('Disclaimer: AI-assisted analysis only. Consult a healthcare professional.', w / 2, 290, { align: 'center' });
    doc.save(`MedTwin_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // ═══ SHARE ═══
  const shareReport = () => {
    const data = btoa(JSON.stringify({ score, vitals, analysis: analysis?.substring(0, 500), date: new Date().toISOString() }));
    const url = `${window.location.origin}/shared?data=${data.substring(0, 2000)}`;
    navigator.clipboard.writeText(url).then(() => setShareUrl(url));
  };

  // ═══ CAMERA ═══
  const openCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } });
      streamRef.current = stream;
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch (e) { setError('Camera access denied: ' + e.message); setShowCamera(false); }
  };
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setFiles([file]); setError(null); closeCamera();
    }, 'image/jpeg', 0.9);
  };
  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setShowCamera(false);
  };

  const statusColor = (s) => s === 'high' ? 'border-red-300 bg-red-50' : s === 'low' ? 'border-amber-300 bg-amber-50' : 'border-[#77DD77]/40 bg-[#e8fbe8]';
  const statusText = (s) => s === 'high' ? 'text-red-600' : s === 'low' ? 'text-amber-600' : 'text-[#3a8f3a]';
  const fileIcon = (n) => { const e = n?.split('.').pop()?.toLowerCase(); return ['pdf'].includes(e) ? '📄' : ['doc','docx'].includes(e) ? '📝' : ['xls','xlsx','csv'].includes(e) ? '📊' : ['png','jpg','jpeg','webp'].includes(e) ? '🖼️' : '📎'; };

  return (
    <div className="page-enter">
      <div className="bg-white/60 border-b border-[#e8dccf]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-black text-[#2f2a26] mb-1">Clinical Dashboard</h1>
          <p className="text-[#a89b8d] font-medium">Upload medical reports for AI-powered diagnostics</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* ═══ LEFT ═══ */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upload */}
            <div className="card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#77DD77]/15 flex items-center justify-center text-[#77DD77]"><UploadCloud size={20} /></div>
                <h3 className="font-bold text-[#2f2a26]">Upload Report</h3>
              </div>
              <div className="border-2 border-dashed border-[#d0bfae] rounded-2xl p-6 flex flex-col items-center text-center bg-white/30 hover:bg-white/50 transition-colors group cursor-pointer"
                onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.length) { setFiles(Array.from(e.dataTransfer.files)); setError(null); } }}>
                <div className="bg-white p-3 rounded-full text-[#77DD77] mb-3 shadow-sm border border-[#e8dccf] group-hover:scale-110 transition-transform"><UploadCloud size={24} /></div>
                <p className="text-[#2f2a26] font-bold text-sm mb-1">Drop files here</p>
                <p className="text-[#a89b8d] text-xs mb-4">PDF, Word, Excel, CSV, Images, JSON, TXT</p>
                <div className="flex gap-2 w-full">
                  <label className="btn-dark flex-1 justify-center text-sm cursor-pointer">Browse<input type="file" className="hidden" accept={ACCEPTED} onChange={e => { if (e.target.files?.length) { setFiles(Array.from(e.target.files)); setError(null); } }} /></label>
                  <button onClick={openCamera} className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#77DD77] text-white font-bold text-sm rounded-xl hover:bg-[#5ec45e] transition-colors shadow-sm"><Camera size={16} />Camera</button>
                </div>
              </div>

              {/* Camera Modal */}
              {showCamera && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl">
                    <div className="flex items-center justify-between p-4 border-b border-[#e8dccf]">
                      <h3 className="font-bold text-[#2f2a26] flex items-center gap-2"><Camera size={18} className="text-[#77DD77]" />Scan Report</h3>
                      <button onClick={closeCamera} className="p-1.5 hover:bg-[#faf0e6] rounded-lg transition-colors"><X size={18} /></button>
                    </div>
                    <div className="relative bg-black"><video ref={videoRef} autoPlay playsInline className="w-full" style={{ maxHeight: '400px' }} /></div>
                    <div className="p-4 flex gap-3">
                      <button onClick={capturePhoto} className="btn-primary flex-1 justify-center py-3"><Camera size={18} />Capture Photo</button>
                      <button onClick={closeCamera} className="btn-dark flex-1 justify-center py-3">Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="w-full my-5 relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e8dccf]" /></div><div className="relative flex justify-center"><span className="bg-white px-3 text-[#a89b8d] text-xs font-bold">OR PASTE LINK</span></div></div>
              <input type="text" value={link} onChange={e => setLink(e.target.value)} placeholder="https://example.com/report" className="input-field text-sm" />
              {(files.length > 0 || link.trim()) && (
                <div className="mt-5 space-y-3">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#77DD77]/5 border border-[#77DD77]/20">
                      <span className="text-lg">{fileIcon(f.name)}</span>
                      <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-[#2f2a26] truncate">{f.name}</p><p className="text-xs text-[#a89b8d]">{(f.size / 1024).toFixed(1)} KB</p></div>
                      <button onClick={() => setFiles([])} className="text-[#a89b8d] hover:text-red-500 p-1"><Trash2 size={14} /></button>
                    </div>
                  ))}
                  <button onClick={handleUpload} disabled={uploading} className="btn-primary w-full justify-center text-base py-3.5">
                    {uploading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : <><BrainCircuit size={18} /> Run AI Analysis</>}
                  </button>
                </div>
              )}
              {error && <div className="mt-4 p-4 bg-red-50 text-red-600 font-semibold rounded-xl text-sm border border-red-200 flex items-start gap-3"><AlertCircle size={18} className="shrink-0 mt-0.5" />{error}</div>}
              {status && !uploading && !error && <div className="mt-4 p-4 bg-[#e8fbe8] text-[#3a8f3a] font-semibold rounded-xl text-sm border border-[#77DD77]/30 flex items-center gap-2"><CheckCircle size={16} />{status}</div>}
            </div>

            {/* Server */}
            <div className="card flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${serverOk === false ? 'bg-red-100 text-red-500' : 'bg-[#77DD77]/15 text-[#77DD77]'}`}><Server size={18} /></div>
              <div><p className="text-xs font-bold text-[#a89b8d] uppercase tracking-wider">Backend</p>
                {serverOk === null ? <p className="text-[#a89b8d] text-sm">Checking...</p> : serverOk ? <p className="text-[#77DD77] font-bold text-sm flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#77DD77] animate-pulse" />Online</p> : <p className="text-red-500 text-sm font-medium">Offline</p>}
              </div>
            </div>

            {/* Past Files */}
            {pastFiles.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-[#2f2a26] text-sm flex items-center gap-2"><FileText size={16} /> File Vault</h3><span className="bg-[#faf0e6] text-[#a89b8d] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#e8dccf]">{pastFiles.length}</span></div>
                <div className="space-y-2 max-h-48 overflow-y-auto">{pastFiles.map((f, i) => (
                  <div key={i} className="flex items-center group rounded-xl hover:bg-[#faf0e6] p-2 transition-colors">
                    <span className="mr-2">{fileIcon(f.name)}</span>
                    <a href={f.path} target="_blank" rel="noopener noreferrer" className="text-sm text-[#2f2a26] font-medium flex-1 truncate hover:text-[#77DD77]">{f.name}</a>
                    <button onClick={() => deleteFile(f.id)} className="p-1.5 opacity-0 group-hover:opacity-100 text-[#a89b8d] hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                  </div>
                ))}</div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT ═══ */}
          <div className="lg:col-span-8 space-y-6">

            {/* ═══ VITALS CARDS ═══ */}
            {vitals.length > 0 && (
              <div className="animate-fadeInUp">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#2f2a26] text-lg flex items-center gap-2"><Heart className="text-[#77DD77]" size={20} /> Extracted Vitals</h3>
                  <span className="text-xs font-bold text-[#a89b8d] bg-[#faf0e6] px-3 py-1.5 rounded-lg border border-[#e8dccf]">{vitals.length} metrics found</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {vitals.map((v, i) => (
                    <div key={i} className={`p-4 rounded-2xl border-2 ${statusColor(v.status)} transition-all hover:scale-[1.02]`} style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xl">{v.icon}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${v.status === 'high' ? 'bg-red-200 text-red-700' : v.status === 'low' ? 'bg-amber-200 text-amber-700' : 'bg-[#c8f5c8] text-[#3a8f3a]'}`}>{v.status}</span>
                      </div>
                      <p className={`text-2xl font-black ${statusText(v.status)}`}>{v.value}</p>
                      <p className="text-xs text-[#a89b8d] font-medium">{v.unit}</p>
                      <p className="text-[#2f2a26] font-bold text-xs mt-1">{v.name}</p>
                      <p className="text-[10px] text-[#a89b8d] mt-0.5">Normal: {v.normalRange}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analysis Panel */}
            <div className="card min-h-[500px] flex flex-col !p-0">
              <div className="px-6 py-5 border-b border-[#e8dccf] flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#77DD77] flex items-center justify-center text-white shadow-md"><BrainCircuit size={22} /></div>
                <div className="flex-1"><h2 className="text-[#2f2a26] font-bold text-lg">AI Analysis</h2><p className="text-[#a89b8d] text-xs font-medium">Groq LLM</p></div>
                {/* ═══ ACTION BUTTONS ═══ */}
                {analysis && (
                  <div className="flex items-center gap-2">
                    <button onClick={toggleVoice} className={`p-2.5 rounded-xl border transition-all ${speaking ? 'bg-[#77DD77] text-white border-[#77DD77]' : 'bg-white border-[#e8dccf] text-[#a89b8d] hover:text-[#77DD77] hover:border-[#77DD77]'}`} title={speaking ? 'Stop' : 'Read aloud'}>
                      {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <button onClick={downloadPDF} className="p-2.5 rounded-xl border border-[#e8dccf] bg-white text-[#a89b8d] hover:text-[#77DD77] hover:border-[#77DD77] transition-all" title="Download PDF">
                      <Download size={16} />
                    </button>
                    <button onClick={shareReport} className="p-2.5 rounded-xl border border-[#e8dccf] bg-white text-[#a89b8d] hover:text-[#77DD77] hover:border-[#77DD77] transition-all" title="Share">
                      <Share2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 p-6 relative overflow-y-auto">
                {!analysis && !uploading && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16">
                    <Activity size={56} strokeWidth={1} className="mb-5 text-[#e8dccf]" />
                    <p className="font-bold text-lg text-[#2f2a26] mb-1">Awaiting Clinical Data</p>
                    <p className="text-sm text-[#a89b8d] max-w-sm">Upload a medical report to generate AI analysis with extracted vitals.</p>
                  </div>
                )}
                {uploading && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16">
                    <BrainCircuit size={56} strokeWidth={1.5} className="mb-5 text-[#77DD77] animate-pulse" />
                    <p className="font-bold text-xl text-[#2f2a26] mb-2">Processing Report</p>
                    <p className="text-sm text-[#a89b8d]">Extracting → Parsing vitals → AI analysis...</p>
                    <div className="flex gap-2 mt-6">{['Extracting', 'Parsing', 'Analyzing'].map((t, i) => (
                      <span key={t} className="text-xs font-semibold text-[#4aad4a] bg-[#77DD77]/10 px-4 py-2 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>{t}</span>
                    ))}</div>
                  </div>
                )}

                {analysis && !uploading && (
                  <div className="space-y-5 animate-fadeInUp">
                    {/* Share URL */}
                    {shareUrl && (
                      <div className="p-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-200 text-sm flex items-start gap-3">
                        <Share2 size={16} className="shrink-0 mt-0.5" />
                        <div><p className="font-bold mb-1">Link copied to clipboard!</p><p className="text-xs break-all opacity-70">{shareUrl.substring(0, 80)}...</p></div>
                      </div>
                    )}
                    {/* Risk */}
                    {riskAlert && (
                      <div className="bg-red-50 p-5 rounded-2xl border border-red-200 flex items-start gap-3">
                        <AlertCircle className="text-red-600 mt-0.5 shrink-0" size={20} />
                        <div><h4 className="text-red-700 font-bold text-sm uppercase mb-1">Emergency Risk</h4><p className="text-sm text-red-600">Critical values detected — consult a doctor.</p></div>
                      </div>
                    )}
                    {/* Score */}
                    {score !== null && (
                      <div className="bg-white p-5 rounded-2xl border border-[#e8dccf] flex flex-col sm:flex-row items-center gap-5">
                        <div className="relative w-20 h-20 shrink-0">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36"><path className="text-[#e8dccf]" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path className={score > 80 ? 'text-[#77DD77]' : score > 50 ? 'text-amber-400' : 'text-red-500'} strokeDasharray={`${score}, 100`} strokeWidth="3" stroke="currentColor" fill="none" strokeLinecap="round" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-xl font-black">{score}</span><span className="text-[9px] uppercase font-bold text-[#a89b8d]">/ 100</span></div>
                        </div>
                        <div className="flex-1"><h4 className="font-bold text-lg mb-1">Health Score: {score}/100</h4><p className="text-sm text-[#a89b8d]">{score > 80 ? "Healthy" : score > 50 ? "Moderate risks" : "Critical"}</p></div>
                        <button onClick={() => setShowChart(!showChart)} className="flex items-center gap-1.5 px-4 py-2 bg-[#77DD77]/10 text-[#4aad4a] font-bold text-xs rounded-xl border border-[#77DD77]/30"><TrendingUp size={14} />{showChart ? "Hide" : "Trends"}</button>
                      </div>
                    )}
                    {showChart && score !== null && (
                      <div className="bg-white p-5 rounded-2xl border border-[#e8dccf]">
                        <h4 className="font-bold mb-4 text-sm flex items-center gap-2"><TrendingUp size={16} className="text-[#77DD77]" />Trajectory</h4>
                        <div className="h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" stroke="#f0e6db" /><XAxis dataKey="date" stroke="#a89b8d" fontSize={12} /><YAxis stroke="#a89b8d" fontSize={12} /><Tooltip /><Legend /><Line type="monotone" name="BP" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} /><Line type="monotone" name="Sugar" dataKey="sugar" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
                      </div>
                    )}
                    {/* Analysis text */}
                    <div className="bg-white p-6 rounded-2xl border border-[#e8dccf]">
                      <h4 className="font-bold text-[#2f2a26] mb-3 text-sm flex items-center gap-2"><BrainCircuit size={16} className="text-[#77DD77]" /> Detailed Analysis</h4>
                      <p className="leading-relaxed whitespace-pre-wrap text-[#403933] text-[15px]">{analysis}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
