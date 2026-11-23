import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';
import { isAllowedUpload } from '@/lib/newsFormat.mjs';
import { requireTeacher, json } from '@/lib/teacherSession';

/** 教師上傳附件：副檔名白名單 + 20 MB 上限，檔名一律由伺服器產生。 */
export async function POST(req) {
  const { error } = await requireTeacher(req, { write: true });
  if (error) return error;
  let file;
  try { file = (await req.formData()).get('file'); } catch { return json({ error: '上傳格式錯誤' }, 400); }
  if (!file || typeof file === 'string') return json({ error: '沒有收到檔案' }, 400);
  const check = isAllowedUpload(file.name, file.size);
  if (!check.ok) return json({ error: check.error }, 400);

  const dir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  const safeName = `${Date.now()}-${randomBytes(5).toString('hex')}${check.ext}`;
  await fs.writeFile(path.join(dir, safeName), Buffer.from(await file.arrayBuffer()));
  return json({ fileUrl: `/api/uploads/${safeName}`, fileName: String(file.name).slice(0, 200) });
}
