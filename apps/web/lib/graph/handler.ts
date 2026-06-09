import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { KnowledgeGraph } from '@/lib/graph/knowledgeGraph';

function getKnowledgeGraph() {
    return new KnowledgeGraph(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export async function handleGraphGet(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const universeId = searchParams.get('universeId');
        const type = searchParams.get('type') || 'related';
        const limit = parseInt(searchParams.get('limit') || '10');
        const depth = parseInt(searchParams.get('depth') || '2');

        if (!universeId) {
            return NextResponse.json({ error: 'universeId required' }, { status: 400 });
        }

        const kg = getKnowledgeGraph();
        let data;

        switch (type) {
            case 'graph':
                data = await kg.getUniverseGraph(universeId, depth, limit);
                break;
            case 'path': {
                const targetId = searchParams.get('targetId');
                if (!targetId) {
                    return NextResponse.json({ error: 'targetId required for path' }, { status: 400 });
                }
                data = await kg.findPath(universeId, targetId);
                break;
            }
            case 'stats':
                data = await kg.getRelationshipStats(universeId);
                break;
            case 'matrix':
                data = await kg.getSimilarityMatrix(universeId);
                break;
            default:
                data = await kg.getRelatedUniverses(universeId, limit);
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Graph API error:', error);
        return NextResponse.json({ error: 'Failed to fetch graph data' }, { status: 500 });
    }
}

export async function handleGraphPost(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { sourceId, targetId, relationshipType, confidence } = body;

        if (!sourceId || !targetId || !relationshipType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const kg = getKnowledgeGraph();
        const relationshipId = await kg.addConnection(
            sourceId,
            targetId,
            relationshipType,
            user.id,
            confidence || 0.5
        );

        return NextResponse.json({ success: true, relationshipId });
    } catch (error) {
        console.error('Add connection error:', error);
        return NextResponse.json({ error: 'Failed to add connection' }, { status: 500 });
    }
}

export async function handleGraphPut(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { relationshipId, vote, confidence } = body;

        if (!relationshipId || vote === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const kg = getKnowledgeGraph();
        await kg.voteOnRelationship(relationshipId, user.id, vote, confidence || 0.5);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Vote error:', error);
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 });
    }
}
