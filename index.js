const express = require('express');
const loadDatabase = require('./utils/db.js');
const { readFileSync, readdirSync, existsSync, statSync } = require('fs');
const path = require('path');
const cors = require('cors');
const readline = require('readline');

const db = loadDatabase('data.db');
const app = express();

app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true
}));

app.use(express.json());

db.createTable('files', [
    { name: 'id', type: 'INTEGER PRIMARY KEY' },
    { name: 'path', type: 'TEXT' },
    { name: 'title', type: 'TEXT' },
    { name: 'description', type: 'TEXT' },
    { name: 'category', type: 'TEXT' }
]);

function promptUser(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer);
        });
    });
}

function extractFirstLine(filePath) {
    try {
        const content = readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        // Find first non-empty line
        const firstLine = lines.find(line => line.trim().length > 0);
        return firstLine ? firstLine.trim().replace(/^#+\s*/, '').trim() : '';
    } catch (err) {
        return '';
    }
}

function extractDescription(filePath) {
    try {
        const content = readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const descriptionText = lines.slice(1).join('\n').trim();
        return descriptionText.substring(0, 150).replace(/\n/g, ' ').trim();
    } catch (err) {
        return '';
    }
}

function getAllMarkdownFiles(dir, category = '') {
    const files = [];
    try {
        const items = readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
                const subFiles = getAllMarkdownFiles(fullPath, item);
                files.push(...subFiles);
            } else if (item.endsWith('.md')) {
                files.push({
                    name: item,
                    fullPath,
                    relPath: path.relative(path.join(__dirname, 'files'), fullPath).replace(/\\/g, '/'),
                    category: category || ''
                });
            }
        }
    } catch (err) {
        console.error(`Error reading directory ${dir}:`, err);
    }
    return files;
}

async function scanForNewFiles() {
    const filesDir = path.join(__dirname, 'files');
    
    if (!existsSync(filesDir)) {
        console.log('⚠️  Files directory not found');
        return;
    }
    
    const markdownFiles = getAllMarkdownFiles(filesDir);
    let newFilesFound = 0;
    
    for (const file of markdownFiles) {
        const existing = db.getData('files', '*', { where: `path = '${file.relPath.replace(/'/g, "''")}'`, silent: true });
        if (existing.length > 0) {
            continue;
        }
        
        newFilesFound++;
        const title = extractFirstLine(file.fullPath);
        const description = extractDescription(file.fullPath);
        const category = file.category || 'uncategorized';
        
        console.log('\n' + '='.repeat(70));
        console.log('🔍 NEW FILE DETECTED');
        console.log('='.repeat(70));
        console.log(`📄 Path: ${file.relPath}`);
        console.log(`📁 Category: ${category}`);
        console.log(`📝 Title: ${title}`);
        console.log(`📋 Description: ${description}`);
        console.log('-'.repeat(70));
        
        const answer = await promptUser('✅ Does this look correct? (y/n): ');
        
        if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
            console.log('\n🔧 Adjusting metadata...');
            
            const newTitle = await promptUser('📝 Enter corrected title (leave blank to keep): ');
            const newDescription = await promptUser('📋 Enter corrected description (leave blank to keep): ');
            const newCategory = await promptUser(`📁 Enter category (current: ${category}, leave blank to keep): `);
            
            try {
                db.insertData('files', {
                    path: file.relPath,
                    title: newTitle.trim() ? newTitle : title,
                    description: newDescription.trim() ? newDescription : description,
                    category: newCategory.trim() ? newCategory : category
                });
                console.log('✅ File added to database\n');
            } catch (err) {
                console.error('❌ Error adding file to database:', err);
            }
        } else {
            try {
                db.insertData('files', {
                    path: file.relPath,
                    title: title || 'Untitled',
                    description: description || '',
                    category: category
                });
                console.log('✅ File added to database\n');
            } catch (err) {
                console.error('❌ Error adding file to database:', err);
            }
        }
    }
    
    if (newFilesFound === 0) {
    }
}

scanForNewFiles();

const SCAN_INTERVAL = process.env.SCAN_INTERVAL || 30000; 
setInterval(scanForNewFiles, SCAN_INTERVAL);



app.get("/api/files/:id", (req, res) => {
    const fileId = req.params.id;
    const fileInfo = db.getData('files', '*', { where: `id = ${fileId}` });
    if (!fileInfo || fileInfo.length === 0) {
        return res.status(404).json({ error: 'File not found' });
    }
    res.json(fileInfo[0]);
});

app.get("/api/files/:id/content", (req, res) => {
    const fileId = req.params.id;
    const fileInfo = db.getData('files', '*', { where: `id = ${fileId}` });
    if (!fileInfo || fileInfo.length === 0) {
        return res.status(404).json({ error: 'File not found' });
    }
    const filePath = path.join(__dirname, `files/${fileInfo[0].path}`);
    try {
        const content = readFileSync(filePath, 'utf8');
        res.json({ content, ...fileInfo[0] });
    } catch (err) {
        res.status(500).json({ error: 'Error reading file' });
    }
});

app.get("/api/files", (req, res) => {
    const category = req.query.category;
    let files;
    if (category) {
        files = db.getData('files', '*', { where: `category = '${category}'` });
    } else {
        files = db.getData('files');
    }
    res.json(files);
});

app.get("/api/categories", (req, res) => {
    const files = db.getData('files');
    const categories = [...new Set(files.map(f => f.category).filter(c => c))];
    
    // Sort to put 'uncategorized' at the top
    const sorted = categories.sort((a, b) => {
        if (a === 'uncategorized') return -1;
        if (b === 'uncategorized') return 1;
        return a.localeCompare(b);
    });
    
    res.json(sorted);
});

app.get("/api/docs", (req, res) => {
    const filesDir = path.join(__dirname, 'files');
    
    if (!existsSync(filesDir)) {
        return res.json({ docs: [], hasIndex: false });
    }
    
    try {
        const mdFiles = readdirSync(filesDir)
            .filter(f => f.endsWith('.md'))
            .sort();
        
        const docs = mdFiles.map(file => ({
            filename: file.replace('.md', ''),
            title: file.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            isIndex: file === 'index.md'
        }));
        
        res.json({
            docs,
            hasIndex: mdFiles.includes('index.md')
        });
    } catch (err) {
        res.status(500).json({ error: 'Error reading docs directory' });
    }
});

app.get("/api/docs/:filename", (req, res) => {
    const filename = req.params.filename;
    const filesDir = path.join(__dirname, 'files');
    const mdPath = path.join(filesDir, filename + '.md');
    
    if (!existsSync(mdPath)) {
        return res.status(404).json({ error: 'Document not found' });
    }
    
    try {
        const content = readFileSync(mdPath, 'utf8');
        res.json({
            filename,
            title: filename.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            content
        });
    } catch (err) {
        res.status(500).json({ error: 'Error reading document' });
    }
});

app.get("/api/categories/:category/files", (req, res) => {
    const { category } = req.params;
    const files = db.getData('files', '*', { where: `category = '${category}'` });
    res.json(files.sort((a, b) => a.id - b.id));
});

app.get("/api/categories/:category/files/:fileId", (req, res) => {
    const { category, fileId } = req.params;
    const files = db.getData('files');
    
    const fileInfo = files.find(f => f.id == fileId && f.category === category);
    if (!fileInfo) {
        return res.status(404).json({ error: 'File not found' });
    }
    

    const categoryFiles = files.filter(f => f.category === category).sort((a, b) => a.id - b.id);
    const currentIndex = categoryFiles.findIndex(f => f.id == fileId);
    const previousFile = currentIndex > 0 ? categoryFiles[currentIndex - 1] : null;
    const nextFile = currentIndex < categoryFiles.length - 1 ? categoryFiles[currentIndex + 1] : null;
    
    const filePath = path.join(__dirname, `files/${fileInfo.path}`);
    
    try {
        const content = readFileSync(filePath, 'utf8');
        res.json({
            ...fileInfo,
            content,
            previousFile,
            nextFile
        });
    } catch (err) {
        res.status(500).json({ error: 'Error reading file' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
});