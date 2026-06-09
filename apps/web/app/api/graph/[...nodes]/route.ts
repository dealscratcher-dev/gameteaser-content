import { NextRequest } from 'next/server';
import { handleGraphGet, handleGraphPost, handleGraphPut } from '@/lib/graph/handler';

export async function GET(request: NextRequest) {
    return handleGraphGet(request);
}

export async function POST(request: NextRequest) {
    return handleGraphPost(request);
}

export async function PUT(request: NextRequest) {
    return handleGraphPut(request);
}
