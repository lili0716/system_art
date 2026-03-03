import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixUtf8(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            fixUtf8(fullPath);
        } else if (file.endsWith('.vue')) {
            let content = fs.readFileSync(fullPath);
            // Remove BOM if present
            if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
                content = content.slice(3);
                console.log(`Fixed BOM: ${fullPath}`);
                fs.writeFileSync(fullPath, content.toString('utf8'), 'utf8');
            } else {
                // Try to rewrite as utf8 to fix invalid byte sequences
                try {
                    const str = content.toString('utf8');
                    fs.writeFileSync(fullPath, str, 'utf8');
                } catch (e) {
                    console.error(`Error processing ${fullPath}:`, e);
                }
            }
        }
    }
}

console.log('Starting UTF-8 fix...');
fixUtf8(path.join(__dirname, '../src'));
console.log('UTF-8 fix complete.');
