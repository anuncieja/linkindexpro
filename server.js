const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const UserAgent = require('user-agents');
const RSS = require('rss');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configurações globais
const OUTPUT_DIR = path.join(__dirname, 'output');
const RSS_FILE = path.join(OUTPUT_DIR, 'links.xml');
const BACKLINKS_FILE = path.join(OUTPUT_DIR, 'backlinks.html');

// Criar diretório de saída se não existir
fs.ensureDirSync(OUTPUT_DIR);

// Serviços de ping
const PING_SERVICES = [
    'http://rpc.pingomatic.com/',
    'http://blogsearch.google.com/ping/RPC2',
    'http://ping.feedburner.com/',
    'http://www.blogdigger.com/RPC2',
    'http://services.newsgator.com/ngws/xmlrpcping.aspx'
];

// Encurtadores de URL
const URL_SHORTENERS = {
    'tinyurl': async (url) => {
        try {
            const response = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
            return response.data;
        } catch (error) {
            console.error('Erro no TinyURL:', error.message);
            return null;
        }
    },
    'is.gd': async (url) => {
        try {
            const response = await axios.post('https://is.gd/create.php', 
                `format=simple&url=${encodeURIComponent(url)}`,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            return response.data;
        } catch (error) {
            console.error('Erro no is.gd:', error.message);
            return null;
        }
    }
};

// Função para enviar ping
async function sendPing(url, title = 'Link Index') {
    const results = [];
    
    for (const service of PING_SERVICES) {
        try {
            const xmlPayload = `<?xml version="1.0"?>
                <methodCall>
                    <methodName>weblogUpdates.ping</methodName>
                    <params>
                        <param><value><string>${title}</string></value></param>
                        <param><value><string>${url}</string></value></param>
                    </params>
                </methodCall>`;
            
            const response = await axios.post(service, xmlPayload, {
                headers: { 'Content-Type': 'text/xml' },
                timeout: 10000
            });
            
            results.push({ service, status: 'success', response: response.status });
        } catch (error) {
            results.push({ service, status: 'error', error: error.message });
        }
    }
    
    return results;
}

// Função para criar RSS
async function createRSS(urls) {
    const feed = new RSS({
        title: 'LinkIndex PRO - Indexed Links',
        description: 'Links indexados automaticamente pelo LinkIndex PRO',
        feed_url: 'http://localhost:3000/rss.xml',
        site_url: 'http://localhost:3000',
        language: 'pt-BR',
        pubDate: new Date()
    });

    urls.forEach(url => {
        feed.item({
            title: `Link: ${url}`,
            description: `Link indexado: ${url}`,
            url: url,
            date: new Date()
        });
    });

    const xml = feed.xml();
    await fs.writeFile(RSS_FILE, xml);
    return RSS_FILE;
}

// Função para publicar no Pastebin (simulado)
async function publishToPastebin(content) {
    try {
        // Simulação - em produção seria necessário API key do Pastebin
        console.log('Publicando no Pastebin (simulado):', content.substring(0, 100) + '...');
        return { status: 'success', url: 'https://pastebin.com/simulated' };
    } catch (error) {
        return { status: 'error', error: error.message };
    }
}

// Função para publicar no JustPaste.it (simulado)
async function publishToJustPaste(content) {
    try {
        // Simulação - implementação real dependeria da API
        console.log('Publicando no JustPaste.it (simulado):', content.substring(0, 100) + '...');
        return { status: 'success', url: 'https://justpaste.it/simulated' };
    } catch (error) {
        return { status: 'error', error: error.message };
    }
}

// Função para encurtar URLs
async function shortenUrls(urls) {
    const results = {};
    
    for (const url of urls) {
        results[url] = {};
        
        for (const [service, shortener] of Object.entries(URL_SHORTENERS)) {
            try {
                const shortUrl = await shortener(url);
                results[url][service] = shortUrl;
            } catch (error) {
                results[url][service] = { error: error.message };
            }
        }
    }
    
    return results;
}

// Função para criar backlinks HTML
async function createBacklinks(urls) {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backlinks - LinkIndex PRO</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .link { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        a { color: #0066cc; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <h1>Backlinks Gerados - LinkIndex PRO</h1>
    <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
    
    ${urls.map((url, index) => `
        <div class="link">
            <h3>Link ${index + 1}</h3>
            <a href="${url}" target="_blank" rel="noopener">${url}</a>
        </div>
    `).join('')}
    
    <footer>
        <p>Total de links: ${urls.length}</p>
        <p>Gerado por LinkIndex PRO</p>
    </footer>
</body>
</html>`;

    await fs.writeFile(BACKLINKS_FILE, html);
    return BACKLINKS_FILE;
}

// Função para simular tráfego
async function simulateTraffic(urls) {
    const results = [];
    const userAgent = new UserAgent();
    
    for (const url of urls) {
        try {
            // Múltiplas requisições com user-agents diferentes
            for (let i = 0; i < 3; i++) {
                const response = await axios.head(url, {
                    headers: {
                        'User-Agent': userAgent.toString(),
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
                        'Accept-Encoding': 'gzip, deflate',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1'
                    },
                    timeout: 10000
                });
                
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay entre requisições
            }
            
            results.push({ url, status: 'success', requests: 3 });
        } catch (error) {
            results.push({ url, status: 'error', error: error.message });
        }
    }
    
    return results;
}

// Função para verificar indexação no Google
async function checkGoogleIndexing(urls) {
    const results = [];
    
    for (const url of urls) {
        try {
            const searchQuery = `site:${new URL(url).hostname}`;
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });
            
            const $ = cheerio.load(response.data);
            const resultStats = $('#result-stats').text();
            const isIndexed = resultStats && !resultStats.includes('0 resultados');
            
            results.push({ url, indexed: isIndexed, stats: resultStats });
        } catch (error) {
            results.push({ url, indexed: false, error: error.message });
        }
    }
    
    return results;
}

// Rota principal para processar URLs
app.post('/api/process-urls', async (req, res) => {
    try {
        const { urls, options = {} } = req.body;
        
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'URLs são obrigatórias' });
        }

        const sessionId = uuidv4();
        const results = {
            sessionId,
            timestamp: new Date().toISOString(),
            urls: urls.length,
            results: {}
        };

        // Enviar status inicial
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Transfer-Encoding': 'chunked'
        });

        const sendUpdate = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        sendUpdate({ type: 'start', message: 'Iniciando processamento...' });

        // 1. Enviar pings
        sendUpdate({ type: 'progress', step: 'ping', message: 'Enviando pings...' });
        const pingResults = [];
        for (const url of urls) {
            const ping = await sendPing(url);
            pingResults.push({ url, ping });
            sendUpdate({ type: 'progress', step: 'ping', url, status: 'completed' });
        }
        results.results.ping = pingResults;

        // 2. Criar RSS
        sendUpdate({ type: 'progress', step: 'rss', message: 'Criando arquivo RSS...' });
        const rssFile = await createRSS(urls);
        results.results.rss = { file: rssFile, status: 'created' };
        sendUpdate({ type: 'progress', step: 'rss', status: 'completed' });

        // 3. Publicar em serviços
        sendUpdate({ type: 'progress', step: 'publish', message: 'Publicando em serviços...' });
        const content = urls.join('\n');
        const pastebin = await publishToPastebin(content);
        const justpaste = await publishToJustPaste(content);
        results.results.publishing = { pastebin, justpaste };
        sendUpdate({ type: 'progress', step: 'publish', status: 'completed' });

        // 4. Encurtar URLs
        sendUpdate({ type: 'progress', step: 'shorten', message: 'Encurtando URLs...' });
        const shortenedUrls = await shortenUrls(urls);
        results.results.shortened = shortenedUrls;
        sendUpdate({ type: 'progress', step: 'shorten', status: 'completed' });

        // 5. Criar backlinks
        sendUpdate({ type: 'progress', step: 'backlinks', message: 'Criando backlinks...' });
        const backlinksFile = await createBacklinks(urls);
        results.results.backlinks = { file: backlinksFile, status: 'created' };
        sendUpdate({ type: 'progress', step: 'backlinks', status: 'completed' });

        // 6. Simular tráfego
        if (options.simulateTraffic !== false) {
            sendUpdate({ type: 'progress', step: 'traffic', message: 'Simulando tráfego...' });
            const trafficResults = await simulateTraffic(urls);
            results.results.traffic = trafficResults;
            sendUpdate({ type: 'progress', step: 'traffic', status: 'completed' });
        }

        // 7. Verificar indexação
        if (options.checkIndexing !== false) {
            sendUpdate({ type: 'progress', step: 'indexing', message: 'Verificando indexação...' });
            const indexingResults = await checkGoogleIndexing(urls);
            results.results.indexing = indexingResults;
            sendUpdate({ type: 'progress', step: 'indexing', status: 'completed' });
        }

        sendUpdate({ type: 'complete', results });
        res.end();

    } catch (error) {
        console.error('Erro no processamento:', error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para servir arquivos gerados
app.get('/api/download/:file', (req, res) => {
    const file = req.params.file;
    const filePath = path.join(OUTPUT_DIR, file);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'Arquivo não encontrado' });
    }
});

// Rota para listar arquivos gerados
app.get('/api/files', async (req, res) => {
    try {
        const files = await fs.readdir(OUTPUT_DIR);
        const fileList = await Promise.all(files.map(async (file) => {
            const filePath = path.join(OUTPUT_DIR, file);
            const stats = await fs.stat(filePath);
            return {
                name: file,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
            };
        }));
        
        res.json(fileList);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`LinkIndex PRO rodando em http://localhost:${PORT}`);
    console.log(`Diretório de saída: ${OUTPUT_DIR}`);
});

module.exports = app;

