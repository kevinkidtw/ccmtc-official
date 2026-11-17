'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import ResourcesAdmin from './ResourcesAdmin';

const CATEGORIES = ['一般公告', '課程消息', '競賽資訊', '活動公告'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export default function AdminCenterPage({ params }) {
  const { token } = use(params);
  const router = useRouter();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: '一般公告', isPinned: false });
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const apiBase = `/api/admin/announcements?token=${token}`;

  const fetchList = async () => {
    const res = await fetch(apiBase);
    if (res.status === 401) { router.replace('/'); return; }
    setList(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchList(); }, []);

  const showMsg = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { showMsg('標題與內容為必填', false); return; }
    setSubmitting(true);

    let fileUrl = null;
    let fileName = null;

    if (selectedFile) {
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);

      try {
        const uploadRes = await fetch(`/api/upload?token=${token}`, {
          method: 'POST',
          body: uploadData,
        });
        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || '檔案上傳失敗');
        }
        const uploadResult = await uploadRes.json();
        fileUrl = uploadResult.fileUrl;
        fileName = uploadResult.fileName;
      } catch (err) {
        showMsg(err.message, false);
        setSubmitting(false);
        return;
      }
    }

    const res = await fetch(apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, fileUrl, fileName }),
    });
    setSubmitting(false);
    if (res.ok) {
      setForm({ title: '', content: '', category: '一般公告', isPinned: false });
      setSelectedFile(null);
      // Reset input element value if exists
      const fileInput = document.getElementById('file-upload-input');
      if (fileInput) fileInput.value = '';
      
      showMsg('公告新增成功！');
      fetchList();
    } else {
      const d = await res.json();
      showMsg(d.error || '新增失敗', false);
    }
  };

  const togglePin = async (item) => {
    await fetch(`/api/admin/announcements/${item.id}?token=${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !item.isPinned }),
    });
    fetchList();
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`確定要刪除「${item.title}」嗎？`)) return;
    await fetch(`/api/admin/announcements/${item.id}?token=${token}`, { method: 'DELETE' });
    showMsg('已刪除公告');
    fetchList();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', fontFamily: 'var(--font-family)' }}>
      {/* Banner */}
      <div style={{
        background: 'var(--theme-color)', padding: '0 2rem',
        height: '68px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 2px 16px rgba(242,183,5,0.3)'
      }}>
        <img src="/logo.jpg" alt="CCMTC" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.6)' }} />
        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1a1a2e' }}>CCMTC 網站管理後台</span>
        <a href="/" style={{ marginLeft: 'auto', fontSize: '0.875rem', fontWeight: 700, color: '#1a1a2e', textDecoration: 'none', background: 'rgba(0,0,0,0.1)', padding: '6px 14px', borderRadius: 999 }}>← 返回首頁</a>
      </div>

      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1.5rem' }}>

        {msg && (
          <div style={{
            padding: '12px 20px', borderRadius: 12, marginBottom: '1.5rem',
            background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
            color: msg.ok ? '#065f46' : '#991b1b', fontWeight: 600, fontSize: '0.9rem'
          }}>
            {msg.text}
          </div>
        )}

        {/* New Announcement Form */}
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', borderLeft: '4px solid var(--theme-color)', paddingLeft: 12 }}>新增公告</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>標題 *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="請輸入公告標題"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>內容 *</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="請輸入公告內容"
                rows={5}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>附件檔案 (選填，如 PDF、Word、圖片或壓縮檔)</label>
              <div 
                style={{
                  border: selectedFile ? '2px solid var(--theme-color)' : '1.5px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '16px',
                  background: selectedFile ? 'rgba(242,183,5,0.04)' : '#fafafa',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = 'var(--theme-color)';
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!selectedFile) e.currentTarget.style.borderColor = '#cbd5e1';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) setSelectedFile(file);
                }}
                onClick={() => document.getElementById('file-upload-input').click()}
              >
                <input 
                  id="file-upload-input"
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) setSelectedFile(file);
                  }}
                />
                {selectedFile ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.8rem' }}>📄</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        document.getElementById('file-upload-input').value = '';
                      }}
                      style={{
                        marginLeft: '12px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      清除
                    </button>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '6px' }}>📁</span>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>
                      拖曳檔案至此，或 <span style={{ color: 'var(--theme-dark, #1a1a2e)', textDecoration: 'underline', fontWeight: '600' }}>點此瀏覽檔案</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>分類</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: '0.9rem', background: '#fff', fontFamily: 'inherit' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', paddingTop: 22 }}>
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
                  style={{ width: 18, height: 18, accentColor: 'var(--theme-color)' }}
                />
                置頂公告
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: 22, marginLeft: 'auto' }}>
                <button type="button" onClick={() => setForm({ title: '', content: '', category: '一般公告', isPinned: false })}
                  style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  清除
                </button>
                <button type="submit" disabled={submitting}
                  style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: submitting ? '#e2e8f0' : 'var(--theme-color)', color: '#1a1a2e', fontSize: '0.875rem', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {submitting ? '新增中…' : '✓ 新增公告'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', borderLeft: '4px solid var(--theme-color)', paddingLeft: 12 }}>
            公告列表 <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>（共 {list.length} 筆）</span>
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>載入中…</div>
          ) : list.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>目前尚無公告</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--theme-color)' }}>
                    {['日期', '置頂', '分類', '標題', '操作'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: item.isPinned ? 'var(--theme-lighter)' : idx % 2 === 0 ? 'transparent' : 'rgba(248,250,252,0.5)' }}>
                      <td style={{ padding: '10px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(item.createdAt)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {item.isPinned && <span style={{ background: 'var(--theme-color)', color: '#1a1a2e', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>置頂</span>}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.8rem' }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: '#f1f5f9', color: 'var(--text-muted)' }}>{item.category}</span>
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 500, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.fileUrl && <span style={{ marginRight: 6, fontSize: '0.95rem', cursor: 'help' }} title={`附件: ${item.fileName}`}>📎</span>}
                        {item.title}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => togglePin(item)}
                          style={{ marginRight: 6, padding: '5px 12px', borderRadius: 8, border: '1.5px solid', borderColor: item.isPinned ? '#94a3b8' : 'var(--theme-color)', background: 'transparent', color: item.isPinned ? 'var(--text-muted)' : 'var(--theme-dark)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          {item.isPinned ? '取消置頂' : '置頂'}
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                          刪除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Course Resources Management */}
        <div style={{ margin: '2.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>課程資源管理</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>
        <ResourcesAdmin token={token} />
      </div>
    </div>
  );
}
