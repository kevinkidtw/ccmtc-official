import { getTeacher, json, publicTeacher } from '@/lib/teacherSession';

export async function GET(req) {
  const t = await getTeacher(req);
  return json({ teacher: publicTeacher(t) });
}
