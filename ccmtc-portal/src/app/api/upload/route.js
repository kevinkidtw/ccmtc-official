import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function isValidToken(req) {
  const token = req.nextUrl.searchParams.get('token');
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN;
}

export async function POST(req) {
  if (!isValidToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: '無上傳檔案' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // Generate unique safe name
    const originalExt = path.extname(file.name).toLowerCase();
    const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${originalExt}`;
    const filePath = path.join(uploadsDir, safeName);

    // Save file
    await fs.writeFile(filePath, buffer);

    const fileUrl = `/api/uploads/${safeName}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName: file.name
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
