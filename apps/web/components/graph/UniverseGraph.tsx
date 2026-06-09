'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(
    () => import('react-force-graph').then((mod) => mod.ForceGraph2D),
    { ssr: false, loading: () => (
        <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg">
            <div className="text-gray-400">Loading universe graph...</div>
        </div>
    )}
);

interface GraphNode {
    id: string;
    slug?: string;
    name: string;
    genre: string;
    size: number;
}

interface GraphLink {
    source: string;
    target: string;
    weight: number;
    type: string;
}

interface UniverseGraphProps {
    universeId: string;
    depth?: number;
}

export function UniverseGraph({ universeId, depth = 2 }: UniverseGraphProps) {
    const router = useRouter();
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; links: GraphLink[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const [width, setWidth] = useState(800);

    useEffect(() => {
        setWidth(typeof window !== 'undefined' ? window.innerWidth - 100 : 800);
    }, []);

    useEffect(() => {
        fetchGraph();
    }, [universeId, depth]);

    const fetchGraph = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/graph?universeId=${universeId}&type=graph&depth=${depth}&limit=30`);
            const { data } = await response.json();

            const nodes: GraphNode[] = (data ?? []).map((node: Record<string, unknown>) => ({
                id: String(node.node_id ?? node.id ?? ''),
                slug: node.slug ? String(node.slug) : undefined,
                name: String(node.node_name ?? node.name ?? ''),
                genre: String(node.node_genre ?? node.genre ?? 'other'),
                size: 10 + (Number(node.similarity_score ?? 0.5)) * 20
            }));

            const links: GraphLink[] = [];
            (data ?? []).forEach((node: Record<string, unknown>) => {
                const path = node.path as string[] | undefined;
                if (path && path.length > 1) {
                    for (let i = 0; i < path.length - 1; i++) {
                        links.push({
                            source: path[i],
                            target: path[i + 1],
                            weight: 1 / path.length,
                            type: 'connected'
                        });
                    }
                }
            });

            setGraphData({ nodes, links });
        } catch {
            setGraphData({ nodes: [], links: [] });
        } finally {
            setLoading(false);
        }
    };

    const getNodeColor = (node: Record<string, unknown>) => {
        const colors: Record<string, string> = {
            action: '#FF4757',
            adventure: '#00CEC9',
            rpg: '#6C5CE7',
            scifi: '#00D2D3',
            fantasy: '#FF6B6B',
            horror: '#2D3436'
        };
        return colors[String(node.genre ?? '')] || '#95A5A6';
    };

    const handleNodeClick = (node: Record<string, unknown>) => {
        if (node.slug) {
            router.push(`/universe/${String(node.slug)}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-900 rounded-lg">
                <div className="text-gray-400">Loading universe graph...</div>
            </div>
        );
    }

    return (
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
            <div className="absolute top-4 left-4 z-10 bg-black/70 p-3 rounded-lg text-sm">
                <h3 className="text-white font-semibold mb-2">Knowledge Graph</h3>
                <div className="text-gray-300 text-xs">
                    <div>🎯 Center: <span className="text-blue-400">{graphData.nodes.find(n => n.id === universeId)?.name}</span></div>
                    <div>🔗 Connections: {graphData.links.length}</div>
                    <div>🌐 Nodes: {graphData.nodes.length}</div>
                </div>
                {hoveredNode && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                        <div className="font-semibold text-yellow-400">{hoveredNode.name}</div>
                        <div className="text-gray-400 text-xs">Genre: {hoveredNode.genre}</div>
                    </div>
                )}
            </div>

            <ForceGraph2D
                graphData={graphData}
                nodeLabel="name"
                nodeAutoColorBy="genre"
                nodeVal="size"
                nodeColor={getNodeColor}
                linkWidth={(link) => (link as GraphLink).weight * 3}
                linkColor={() => '#666666'}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                onNodeHover={(node) => setHoveredNode((node as GraphNode) ?? null)}
                onNodeClick={(node) => handleNodeClick(node as Record<string, unknown>)}
                cooldownTicks={100}
                height={600}
                width={width}
            />

            <div className="absolute bottom-4 right-4 z-10 bg-black/70 p-2 rounded text-xs text-gray-400">
                Drag to explore • Click node to view
            </div>
        </div>
    );
}
