import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

// Central event emitter for IDE events
export const ideEvents = new EventEmitter();

/**
 * Starts a file watcher on a specified directory using native fs.watch.
 * @param directory The directory to watch for file changes.
 * @param onChange Callback executed when a file changes.
 */
export function startFileWatcher(directory: string, onChange: (file: string) => void) {
    if (!fs.existsSync(directory)) {
        console.warn(`[IDE Server] Directory not found: ${directory}`);
        return;
    }

    console.log(`[IDE Server] Started watching directory: ${directory}`);

    fs.watch(directory, { recursive: true }, (eventType, filename) => {
        if (filename) {
            const filePath = path.join(directory, filename);
            
            // Exclude common noise like node_modules or .git
            if (filename.includes('node_modules') || filename.includes('.git')) {
                return;
            }

            // Trigger the callback
            onChange(filePath);

            // Broadcast the event to SSE listeners
            ideEvents.emit('file-change', {
                eventType,
                filename,
                filePath,
                timestamp: Date.now()
            });
        }
    });
}

/**
 * Express/HTTP handler for Server-Sent Events (SSE).
 * Broadcasts file changes to the frontend UI in real-time.
 */
export function createSSEHandler(req: any, res: any) {
    // Set headers for SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*' // Adjust according to your security requirements
    });

    // Send an initial heartbeat/connection success message
    res.write('data: {"type": "connected", "message": "IDE Sync Engine Active"}\n\n');

    // Listener for file changes
    const onFileChange = (data: any) => {
        const payload = JSON.stringify({ type: 'file-change', data });
        res.write(`data: ${payload}\n\n`);
    };

    ideEvents.on('file-change', onFileChange);

    // Clean up when the client disconnects
    req.on('close', () => {
        ideEvents.off('file-change', onFileChange);
    });
}
