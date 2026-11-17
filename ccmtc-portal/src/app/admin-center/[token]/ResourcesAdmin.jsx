'use client';
import { useState, useEffect } from 'react';

const RESOURCE_TYPES = ['簡報', '教案', '學習單', '影片', '連結', '附件'];

const TYPE_ICONS = {
  '簡報': '📊', '教案': '📘', '學習單': '📝', '影片': '🎬', '連結': '🔗', '附件': '📎',
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit',
};

const labelStyle = {
  display: 'block', fontSize: '0.85rem', fontWeight: 600,
  color: 'var(--text-muted)', marginBottom: 6,
};

export default function ResourcesAdmin({ token }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    courseName: '', title: '', type: '簡報', externalUrl: '', note: '',
  });

  const apiBase = `/api/admin/resources?token=${token}`;

  const fetchList = async () => {
    const res = await fetch(apiBase);
    if (!res.ok) { setLoading(false); return; }
    setList(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchList(); }, []);

  const showMsg = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3000);
  };

  const courseNames = [...new Set(list.map(r => r.courseName))];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.courseName.trim() || !form.title.trim()) {
      showMsg('課程名稱與資源標題為必填', false);
      return;
    }
    if (!selectedFile && !form.externalUrl.trim()) {
      showMsg('請上傳檔案或填寫外部連結（至少一項）', false);
      return;
    }
    setSubmitting(true);

    let fileUrl = null;
    let fileName = null;

    if (selectedFile) {
      const uploadData = new FormData();
      uploadData.append('file', selectedFile);
      try {
        const uploadRes = await fetch(`/api/upload?token=${token}`, { method: 'POST', body: uploadData });
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
      setForm({ courseName: form.courseName, title: '', type: form.type, externalUrl: '', note: '' });
      setSelectedFile(null);
      const fileInput = document.getElementById('resource-file-input');
      if (fileInput) fileInput.value = '';
      showMsg('課程資源新增成功！');
      fetchList();
    } else {
      const d = await res.json();
      showMsg(d.error || '新增失敗', false);
    }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`確定要刪除「${item.courseName}」的「${item.title}」嗎？`)) return;
    await fetch(`/api/admin/resources/${item.id}?token=${token}`, { method: 'DELETE' });
    showMsg('已刪除課程資源');
    fetchList();
  };

  return (
    <>
      {msg && (
        <div style={{
          padding: '12px 20px', borderRadius: 12, marginBottom: '1.5rem',
          background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
          color: msg.ok ? '#065f46' : '#991b1b', fontWeight: 600, fontSize: '0.9rem',
        }}>
          {msg.text}
        </div>
      )}

      {/* New Resource Form */}
      <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', borderLeft: '4px solid var(--theme-color)', paddingLeft: 12 }}>
          新增課程資源
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 220 }}>
              <label style={labelStyle}>課程名稱 *（同名資源會自動歸為同一課程）</label>
              <input
                type="text"
                list="course-name-options"
                value={form.courseName}
                onChange={e => setForm(f => ({ ...f, courseName: e.target.value }))}
                placeholder="例：洛克霸出任務！麥克納姆輪全向移動挑戰"
                style={inputStyle}
              />
              <datalist id="course-name-options">
                {courseNames.map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={labelStyle}>資源類型</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ ...inputStyle, background: '#fff' }}
              >
                {RESOURCE_TYPES.map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>資源標題 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="例：教學簡報（PBL 四節課）"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={labelStyle}>上傳檔案（簡報、教案、學習單等）</label>
              <div
                style={{
                  border: selectedFile ? '2px solid var(--theme-color)' : '1.5px dashed #cbd5e1',
                  borderRadius: 12, padding: 14, textAlign: 'center', cursor: 'pointer',
                  background: selectedFile ? 'rgba(242,183,5,0.04)' : '#fafafa',
                }}
                onClick={() => document.getElementById('resource-file-input').click()}
              >
                <input
                  id="resource-file-input"
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files[0]; if (f) setSelectedFile(f); }}
                />
                {selectedFile ? (
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    📄 {selectedFile.name}（{(selectedFile.size / 1024 / 1024).toFixed(2)} MB）
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); document.getElementById('resource-file-input').value = ''; }}
                      style={{ marginLeft: 10, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      清除
                    </button>
                  </span>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>📁 點此選擇檔案</span>
                )}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={labelStyle}>或 外部連結（影片、雲端資料夾等）</label>
              <input
                type="url"
                value={form.externalUrl}
                onChange={e => setForm(f => ({ ...f, externalUrl: e.target.value }))}
                placeholder="https://youtube.com/..."
                style={inputStyle}
              />
              <label style={{ ...labelStyle, marginTop: 10 }}>備註（選填）</label>
              <input
                type="text"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="例：適用四節課版本"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => { setForm({ courseName: '', title: '', type: '簡報', externalUrl: '', note: '' }); setSelectedFile(null); }}
              style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              清除
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: submitting ? '#e2e8f0' : 'var(--theme-color)', color: '#1a1a2e', fontSize: '0.875rem', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
            >
              {submitting ? '新增中…' : '✓ 新增資源'}
            </button>
          </div>
        </form>
      </div>

      {/* Resource List */}
      <div className="glass-panel" style={{ padding: '1.75rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', borderLeft: '4px solid var(--theme-color)', paddingLeft: 12 }}>
          課程資源列表 <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>（共 {list.length} 筆）</span>
          <a href="/resources" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 12, fontSize: '0.8rem', fontWeight: 700, color: 'var(--theme-dark)' }}>
            檢視前台頁面 ↗
          </a>
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>載入中…</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>目前尚無課程資源</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--theme-color)' }}>
                  {['課程', '類型', '資源標題', '內容', '操作'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? 'transparent' : 'rgba(248,250,252,0.5)' }}>
                    <td style={{ padding: '10px 12px', fontSize: '0.82rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.courseName}>
                      {item.courseName}
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: '#f1f5f9', color: 'var(--text-muted)' }}>
                        {TYPE_ICONS[item.type] || '📎'} {item.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.875rem', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.8rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <a href={item.externalUrl || item.fileUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--theme-dark)', fontWeight: 600 }}>
                        {item.fileName || item.externalUrl || '—'}
                      </a>
                    </td>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => deleteItem(item)}
                        style={{ padding: '5px 12px', borderRadius: 8, border: '1.5px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#dc2626', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
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
    </>
  );
}
