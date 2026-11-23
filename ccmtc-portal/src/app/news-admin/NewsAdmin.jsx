'use client';
import { useState, useEffect, useRef } from 'react';
import { NEWS_CATEGORIES, STATUS_LABEL, TEACHER_UPLOAD_EXT, MAX_UPLOAD_BYTES, LIMITS } from '@/lib/newsFormat.mjs';

const input = {
  width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0',
  fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', background: '#fff',
};
const label = { display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 };
const panel = { background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: '1.6rem 1.75rem', marginBottom: '1.5rem' };
const primary = { padding: '10px 22px', borderRadius: 10, border: 'none', background: 'var(--theme-color)', color: '#1a1a2e', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.92rem' };
const ghost = { padding: '8px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' };
const STATUS_COLOR = { published: ['#dcfce7', '#166534'], pending: ['#fef3c7', '#92400e'], rejected: ['#fee2e2', '#991b1b'] };
const EMPTY = { title: '', content: '', category: '一般公告', siteKey: '', fileUrl: null, fileName: null };

async function api(url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...(opts.body && !(opts.body instanceof FormData) && { 'Content-Type': 'application/json' }), ...opts.headers } });
  let data = {};
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

function formatDate(d) {
  return d ? new Date(d).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async e => {
    e.preventDefault();
    setBusy(true); setError('');
    const r = await api('/api/news/login', { method: 'POST', body: JSON.stringify({ username, password }) });
    setBusy(false);
    if (r.ok) onLogin(r.data.teacher); else setError(r.data.error || '登入失敗');
  };
  return (
    <div style={{ ...panel, maxWidth: 420, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 0.4rem' }}>教師登入</h1>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 1.25rem', lineHeight: 1.7 }}>
        登入後可發布課程、競賽與活動消息到官網「最新消息」。帳號請洽車城自造中心（08-882-1045 分機 19）。
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div><label style={label} htmlFor="u">帳號</label>
          <input id="u" style={input} autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} autoFocus /></div>
        <div><label style={label} htmlFor="p">密碼</label>
          <input id="p" type="password" style={input} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></div>
        {error && <div role="alert" style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.88rem' }}>{error}</div>}
        <button type="submit" style={primary} disabled={busy}>{busy ? '登入中…' : '登入'}</button>
      </form>
    </div>
  );
}

function PasswordForm({ onDone }) {
  const [f, setF] = useState({ current: '', next: '', again: '' });
  const [error, setError] = useState('');
  const submit = async e => {
    e.preventDefault();
    if (f.next !== f.again) { setError('兩次輸入的新密碼不同'); return; }
    const r = await api('/api/news/password', { method: 'POST', body: JSON.stringify({ current: f.current, next: f.next }) });
    if (r.ok) onDone('密碼已更新'); else setError(r.data.error || '更新失敗');
  };
  return (
    <form onSubmit={submit} style={{ ...panel, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '0.9rem', alignItems: 'end' }}>
      <div><label style={label}>目前密碼</label><input type="password" autoComplete="current-password" style={input} value={f.current} onChange={e => setF({ ...f, current: e.target.value })} /></div>
      <div><label style={label}>新密碼（至少 8 字）</label><input type="password" autoComplete="new-password" style={input} value={f.next} onChange={e => setF({ ...f, next: e.target.value })} /></div>
      <div><label style={label}>再輸入一次</label><input type="password" autoComplete="new-password" style={input} value={f.again} onChange={e => setF({ ...f, again: e.target.value })} /></div>
      <button type="submit" style={primary}>更新密碼</button>
      {error && <div role="alert" style={{ gridColumn: '1/-1', color: '#b91c1c', fontWeight: 700, fontSize: '0.88rem' }}>{error}</div>}
    </form>
  );
}

function PostForm({ teacher, sites, editing, onSaved, onCancel }) {
  const [form, setForm] = useState(editing ? { ...EMPTY, ...editing, siteKey: editing.siteKey || '' } : EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => { setForm(editing ? { ...EMPTY, ...editing, siteKey: editing.siteKey || '' } : EMPTY); setError(''); }, [editing]);

  const upload = async file => {
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { setError('檔案超過 20 MB'); return; }
    setBusy(true); setError('');
    const fd = new FormData(); fd.append('file', file);
    const r = await api('/api/news/upload', { method: 'POST', body: fd });
    setBusy(false);
    if (r.ok) setForm(f => ({ ...f, fileUrl: r.data.fileUrl, fileName: r.data.fileName }));
    else setError(r.data.error || '上傳失敗');
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setError('');
    const body = JSON.stringify({ ...form, siteKey: form.siteKey || null });
    const r = editing
      ? await api(`/api/news/posts/${editing.id}`, { method: 'PUT', body })
      : await api('/api/news/posts', { method: 'POST', body });
    setBusy(false);
    if (!r.ok) { setError(r.data.error || '儲存失敗'); return; }
    setForm(EMPTY);
    onSaved(r.data.status === 'published' ? '已發布到官網' : '已送出，待中心審核後就會出現在官網');
  };

  return (
    <form onSubmit={submit} style={panel}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 0.3rem' }}>{editing ? '修改消息' : '發布新消息'}</h2>
      <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 1.1rem' }}>
        {teacher.canPublish ? '您的帳號可直接發布，送出後立即出現在官網。' : '送出後由中心審核，通過後才會出現在官網。'}
        {editing && !teacher.canPublish && editing.status === 'published' && ' 已發布的消息修改後需重新審核，審核期間暫不顯示。'}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={label} htmlFor="t">標題 *</label>
          <input id="t" style={input} maxLength={LIMITS.title} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="例：115 學年度 micro:bit 研習報名開始" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
          <div>
            <label style={label} htmlFor="c">分類</label>
            <select id="c" style={input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {NEWS_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={label} htmlFor="s">相關網站（選填）</label>
            <select id="s" style={input} value={form.siteKey} onChange={e => setForm({ ...form, siteKey: e.target.value })}>
              <option value="">（無）</option>
              {sites.map(s => <option key={s.key} value={s.key}>{s.icon} {s.short}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={label} htmlFor="b">內容 *</label>
          <textarea id="b" rows={9} maxLength={LIMITS.content} style={{ ...input, resize: 'vertical', lineHeight: 1.7 }} value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder={'直接輸入文字即可，換行會保留，網址會自動變成連結。\n例：報名網址 https://…'} />
        </div>
        <div>
          <label style={label}>附件（選填，20 MB 以內：PDF、Office 文件、圖片、ZIP）</label>
          {form.fileUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <a href={form.fileUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>📎 {form.fileName}</a>
              <button type="button" style={ghost} onClick={() => setForm({ ...form, fileUrl: null, fileName: null })}>移除附件</button>
            </div>
          ) : (
            <input ref={fileRef} type="file" accept={TEACHER_UPLOAD_EXT.join(',')} onChange={e => upload(e.target.files[0])} disabled={busy} />
          )}
        </div>
        {error && <div role="alert" style={{ color: '#b91c1c', fontWeight: 700, fontSize: '0.88rem' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          {editing && <button type="button" style={ghost} onClick={onCancel}>取消修改</button>}
          <button type="submit" style={primary} disabled={busy}>
            {busy ? '處理中…' : teacher.canPublish ? '發布' : '送出審核'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function NewsAdmin({ sites }) {
  const [teacher, setTeacher] = useState(undefined); // undefined = 讀取中，null = 未登入
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [msg, setMsg] = useState('');

  const loadPosts = async () => {
    const r = await api('/api/news/posts');
    if (r.status === 401) { setTeacher(null); return; }
    if (r.ok) setPosts(r.data);
  };

  useEffect(() => {
    api('/api/news/me').then(r => setTeacher(r.data.teacher || null));
  }, []);
  useEffect(() => { if (teacher) loadPosts(); }, [teacher]);

  const flash = text => { setMsg(text); setTimeout(() => setMsg(''), 5000); };

  if (teacher === undefined) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>載入中…</div>;
  if (!teacher) return <Login onLogin={setTeacher} />;

  const logout = async () => { await api('/api/news/logout', { method: 'POST' }); setTeacher(null); setPosts([]); };
  const remove = async p => {
    if (!window.confirm(`確定刪除「${p.title}」？刪除後無法復原。`)) return;
    const r = await api(`/api/news/posts/${p.id}`, { method: 'DELETE' });
    flash(r.ok ? '已刪除' : r.data.error || '刪除失敗');
    if (editing?.id === p.id) setEditing(null);
    loadPosts();
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 800 }}>👩‍🏫 {[teacher.school, teacher.name].filter(Boolean).join(' ')}</div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: teacher.canPublish ? '#dcfce7' : '#fef3c7', color: teacher.canPublish ? '#166534' : '#92400e' }}>
          {teacher.canPublish ? '可直接發布' : '發文需審核'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <a href="/news" style={{ ...ghost, textDecoration: 'none', color: 'inherit' }}>看官網消息</a>
          <button type="button" style={ghost} onClick={() => setShowPw(v => !v)}>修改密碼</button>
          <button type="button" style={ghost} onClick={logout}>登出</button>
        </div>
      </div>

      {msg && <div role="status" style={{ ...panel, padding: '0.9rem 1.25rem', background: '#ecfdf5', color: '#065f46', fontWeight: 700 }}>{msg}</div>}
      {showPw && <PasswordForm onDone={t => { setShowPw(false); flash(t); }} />}

      <PostForm teacher={teacher} sites={sites} editing={editing}
        onSaved={t => { setEditing(null); flash(t); loadPosts(); }} onCancel={() => setEditing(null)} />

      <div style={panel}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 900, margin: '0 0 1rem' }}>我發布的消息（{posts.length}）</h2>
        {posts.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '0.5rem 0' }}>還沒有發布過消息。</div>
        ) : posts.map(p => {
          const [bg, fg] = STATUS_COLOR[p.status] || ['#f1f5f9', '#334155'];
          return (
            <div key={p.id} style={{ borderTop: '1px solid #f1f5f9', padding: '0.9rem 0', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 800, padding: '2px 8px', borderRadius: 999, background: bg, color: fg }}>{STATUS_LABEL[p.status] || p.status}</span>
                  <span>{p.category}</span>
                  <span>{formatDate(p.updatedAt)}</span>
                </div>
                <div style={{ fontWeight: 800, margin: '0.3rem 0' }}>
                  {p.status === 'published' ? <a href={`/news/${p.id}`} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>{p.title}</a> : p.title}
                </div>
                {p.status === 'rejected' && p.reviewNote && (
                  <div style={{ fontSize: '0.84rem', color: '#991b1b', background: '#fef2f2', padding: '6px 10px', borderRadius: 8 }}>退回原因：{p.reviewNote}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" style={ghost} onClick={() => { setEditing(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>修改</button>
                <button type="button" style={{ ...ghost, color: '#dc2626', borderColor: 'rgba(239,68,68,0.4)' }} onClick={() => remove(p)}>刪除</button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
