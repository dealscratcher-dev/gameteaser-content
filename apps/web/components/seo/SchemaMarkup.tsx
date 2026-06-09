'use client';

import { useEffect } from 'react';

interface SchemaMarkupProps {
    data: Record<string, any>;
}

export function SchemaMarkup({ data }: SchemaMarkupProps) {
    useEffect(() => {
        // Remove any existing script with the same id
        const existingScript = document.getElementById('schema-markup');
        if (existingScript) {
            existingScript.remove();
        }
        
        // Add new schema script
        const script = document.createElement('script');
        script.id = 'schema-markup';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(data);
        document.head.appendChild(script);
        
        return () => {
            const scriptToRemove = document.getElementById('schema-markup');
            if (scriptToRemove) {
                scriptToRemove.remove();
            }
        };
    }, [data]);
    
    return null;
}