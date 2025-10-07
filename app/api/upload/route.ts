import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');

function sanitizeName(name: string): string {
  const base = path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.length ? base : `upload_${Date.now()}`;
}

export async function POST(request: Request) {
  const isDevUploadEnabled =
    process.env.NEXT_PUBLIC_DEV_UPLOAD === '1' && process.env.NODE_ENV !== 'production';

  if (!isDevUploadEnabled) {
    return NextResponse.json(
      { error: 'upload route is available only in local development' },
      { status: 403 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof Blob) || typeof (file as any).name !== 'string') {
      return NextResponse.json({ error: 'file field is required' }, { status: 400 });
    }
    const name = sanitizeName((file as any).name as string);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const fullPath = path.join(UPLOAD_DIR, name);
    await fs.writeFile(fullPath, buffer);
    return NextResponse.json({ fileName: name, sourcePath: fullPath });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'upload failed' }, { status: 500 });
  }
}
