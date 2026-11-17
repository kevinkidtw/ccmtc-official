import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type');
    const response = await fetch('http://results_web:3010/results/api/upload', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: request.body,
      duplex: 'half',
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
