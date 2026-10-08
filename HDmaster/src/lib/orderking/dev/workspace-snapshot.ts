import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

/**
 * Creates a standard POSIX ustar tar header in memory.
 */
function createTarHeader(name: string, size: number, mtime: number, isDir: boolean): Buffer {
    const header = Buffer.alloc(512);
    let offset = 0;

    // name (100)
    header.write(name.substring(0, 100), offset);
    offset += 100;

    // mode (8)
    header.write((isDir ? '0000755\0' : '0000644\0'), offset);
    offset += 8;

    // uid (8), gid (8)
    header.write('0001750\0', offset); offset += 8;
    header.write('0001750\0', offset); offset += 8;

    // size (12)
    header.write(size.toString(8).padStart(11, '0') + '\0', offset);
    offset += 12;

    // mtime (12)
    const mtimeOctal = Math.floor(mtime / 1000).toString(8).padStart(11, '0') + '\0';
    header.write(mtimeOctal, offset);
    offset += 12;

    // chksum (8) - placeholder
    const chksumOffset = offset;
    header.write('        ', offset);
    offset += 8;

    // typeflag (1)
    header.write(isDir ? '5' : '0', offset);
    offset += 1;

    // linkname (100)
    offset += 100;

    // magic (6)
    header.write('ustar\0', offset);
    offset += 6;

    // version (2)
    header.write('00', offset);
    offset += 2;

    // Calculate checksum
    let chksum = 0;
    for (let i = 0; i < 512; i++) {
        chksum += header[i];
    }
    
    header.write(chksum.toString(8).padStart(6, '0') + '\0 ', chksumOffset);
    
    return header;
}

/**
 * Recursively walks a directory, compresses it into an in-memory .tar.gz buffer,
 * and uploads it directly to Supabase Storage via REST API.
 */
export async function createSourceCodeBackup(): Promise<void> {
    const srcDir = path.resolve(process.cwd(), 'HDmaster/src');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_BACKUP_BUCKET || 'backups';
    
    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are missing in the environment variables.');
    }

    const buffers: Buffer[] = [];
    
    function walk(dir: string, base: string) {
        if (!fs.existsSync(dir)) return;
        
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const relativePath = path.posix.join(base, entry);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                buffers.push(createTarHeader(relativePath + '/', 0, stat.mtimeMs, true));
                walk(fullPath, relativePath);
            } else {
                const content = fs.readFileSync(fullPath);
                buffers.push(createTarHeader(relativePath, content.length, stat.mtimeMs, false));
                buffers.push(content);
                // Pad to 512 bytes
                const padding = (512 - (content.length % 512)) % 512;
                if (padding > 0) {
                    buffers.push(Buffer.alloc(padding));
                }
            }
        }
    }
    
    console.log(`Starting backup of ${srcDir}...`);
    walk(srcDir, 'src');
    
    // Two empty 512-byte blocks signify the end of the tar archive
    buffers.push(Buffer.alloc(1024)); 
    
    const tarBuffer = Buffer.concat(buffers);
    const gzippedBuffer = zlib.gzipSync(tarBuffer);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `workspace-snapshot-${timestamp}.tar.gz`;
    
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${filename}`;
    
    console.log(`Uploading snapshot (${gzippedBuffer.length} bytes) to Supabase bucket '${bucket}'...`);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
            'Content-Type': 'application/gzip',
            'x-upsert': 'true'
        },
        body: gzippedBuffer
    });
    
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Upload to Supabase failed [${response.status}]: ${errText}`);
    }
    
    console.log(`Successfully created and uploaded backup: ${filename}`);
}
