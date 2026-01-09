import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');

    if (!filename) {
        return NextResponse.json({ error: 'Filename missing' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), 'content', filename);

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return new NextResponse(fileContent);
    } catch (error) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
}
