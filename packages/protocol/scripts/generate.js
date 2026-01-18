#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateTypes() {
  try {
    console.log('🚀 Generating TypeScript types and client from OpenAPI spec...');
    
    // Ensure src directory exists
    const srcDir = path.join(__dirname, '..', 'src');
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    // Use CLI approach which is more reliable
    const inputPath = path.join(__dirname, '..', 'openapi.yaml');
    const outputPath = srcDir;
    
    execSync(`npx @hey-api/openapi-ts -i "${inputPath}" -o "${outputPath}" -c @hey-api/client-fetch --services false --exportCore false`, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });

    // Create custom index.ts with proper ES module exports
    const indexContent = `// Export all generated types
export * from './types.gen.js';

// Export schemas  
export * from './schemas.gen.js';

// Note: Services and core exports are disabled to avoid compilation issues
// This provides a clean interface with just types and schemas
`;
    
    fs.writeFileSync(path.join(srcDir, 'index.ts'), indexContent);

    console.log('✅ TypeScript types and client generated successfully!');
    console.log('📁 Generated files in src/:');
    
    // List generated files
    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
      console.log(`   - ${file}`);
    });
    
  } catch (error) {
    console.error('❌ Error generating types:', error);
    process.exit(1);
  }
}

generateTypes();
