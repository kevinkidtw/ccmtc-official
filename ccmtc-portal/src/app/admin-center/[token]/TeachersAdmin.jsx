'use client';
import { useState, useEffect } from 'react';

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit',
};
const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 };
const smallBtn = (color = 'var(--theme-color)') => ({
  padding: '5px 10px', borderRadius: 8, border: `1.5px solid ${color}`, background: 'transparent',
  fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginRight: 6, whiteSpace: 'nowrap',
});

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '—';
}

/**
 * 教師帳號管理：建立帳號、重設密碼、停用、切換「直接發布」權限。
 * 初始密碼由伺服器產生，只在這裡顯示一次，請轉交教師；教師登入後可自行修改。
 */
export default function TeachersAdmin({ token }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', name: '', school: '', canPublish: false });
  const [issued, setIssued] = useState(null); // { username, name, password }
  const [msg, setMsg] = useState(null);
  const api = id => `/api/admin/teachers${id ? `/${id}` : ''}?token=${token}`;

  const fetchList = async () => {
    const res = await fetch(api());
    if (res.ok) setList(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetchList(); }, []);

  const show = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4000); };

  const create = async e => {
    e.preventDefault();
    const res = await fetch(api(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { show(d.error || '建立失敗', false); return; }
    setIssued({ username: d.teacher.username, name: d.teacher.name, password: d.initialPassword });
    setForm({ username: '', name: '', school: '', canPublish: false });
    fetchList();
  };

  const update = async (t, body, done) => {
    const res = await fetch(api(t.id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await res.json();
    if (!res.ok) { show(d.error || '更新失敗', false); return; }
    if (d.initialPassword) setIssued({ username: t.username, name: t.name, password: d.initialPassword });
    if (done) show(done);
    fetchList();
  };

  const resetPassword = t => {
    if (!window.confirm(`重設「${t.name}」的密碼？該教師目前的登入會全部失效。`)) return;
    update(t, { resetPassword: true });
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', borderLeft: '4px solid var(--theme-color)', paddingLeft: 12 }}>教師帳號</h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.25rem', lineHeight: 1.7 }}>
        教師從 <a href="/news-admin" target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>/news-admin</a> 登入發布消息。
        未勾「直接發布」的帳號，發文會進入上方「待審核」，由您按「通過」後才會出現在官網。
      </p>

      {msg && (
        <div style={{ padding: '10px 16px', borderRadius: 10, marginBottom: '1rem', fontWeight: 600, fontSize: '0.88rem',
          background: msg.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: msg.ok ? '#065f46' : '#991b1b' }}>{msg.text}</div>
      )}

      {issued && (
        <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: '1.25rem', background: '#fffbeb', border: '1.5px solid #fcd34d' }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>🔑 {issued.name}（{issued.username}）的登入密碼</div>
          <code style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.08em', userSelect: 'all' }}>{issued.password}</code>
          <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: 6 }}>
            這組密碼只顯示這一次，請直接轉交教師本人，並提醒登入後到「修改密碼」自行更換。
          </div>
          <button type="button" onClick={() => setIssued(null)} style={{ ...smallBtn('#d97706'), marginTop: 10 }}>我已轉交，關閉</button>
        </div>
      )}

      <form onSubmit={create} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '0.9rem', alignItems: 'end', marginBottom: '1.5rem' }}>
        <div>
          <label style={labelStyle}>帳號 *（小寫英數）</label>
          <input style={inputStyle} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="例：wang.hc" />
        </div>
        <div>
          <label style={labelStyle}>姓名 *</label>
          <input style={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="王老師" />
        </div>
        <div>
          <label style={labelStyle}>學校</label>
          <input style={inputStyle} value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} placeholder="車城國中" />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', fontWeight: 600, paddingBottom: 10 }}>
          <input type="checkbox" checked={form.canPublish} onChange={e => setForm(f => ({ ...f, canPublish: e.target.checked }))}
            style={{ width: 18, height: 18, accentColor: 'var(--theme-color)' }} />
          直接發布（免審核）
        </label>
        <button type="submit" style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: 'var(--theme-color)', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          ＋ 建立帳號
        </button>
      </form>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>載入中…</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>尚未建立教師帳號</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--theme-color)' }}>
                {['帳號', '姓名／學校', '權限', '發文', '最近登入', '操作'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9', opacity: t.isActive ? 1 : 0.5 }}>
                  <td style={{ padding: '8px 10px', fontFamily: 'ui-monospace,monospace', fontSize: '0.85rem' }}>{t.username}</td>
                  <td style={{ padding: '8px 10px', fontSize: '0.88rem' }}>{t.name}<div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.school || ''}</div></td>
                  <td style={{ padding: '8px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                    {!t.isActive ? '已停用' : t.canPublish ? '直接發布' : '需審核'}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: '0.85rem' }}>{t.postCount}</td>
                  <td style={{ padding: '8px 10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(t.lastLoginAt)}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <button type="button" style={smallBtn()} onClick={() => update(t, { canPublish: !t.canPublish }, '已更新權限')}>
                      {t.canPublish ? '改為需審核' : '改為直接發布'}
                    </button>
                    <button type="button" style={smallBtn('#94a3b8')} onClick={() => resetPassword(t)}>重設密碼</button>
                    <button type="button" style={smallBtn(t.isActive ? 'rgba(239,68,68,0.5)' : '#10b981')}
                      onClick={() => update(t, { isActive: !t.isActive }, t.isActive ? '已停用' : '已啟用')}>
                      {t.isActive ? '停用' : '啟用'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
