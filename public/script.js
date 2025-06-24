class LinkIndexPro {
    constructor() {
        this.isProcessing = false;
        this.currentSession = null;
        this.logEntries = [];
        this.initializeElements();
        this.bindEvents();
        this.loadFiles();
    }

    initializeElements() {
        // Input elements
        this.urlInput = document.getElementById('urlInput');
        this.startBtn = document.getElementById('startBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.resetBtn = document.getElementById('resetBtn');

        // Options
        this.simulateTrafficCheck = document.getElementById('simulateTraffic');
        this.checkIndexingCheck = document.getElementById('checkIndexing');
        this.createRSSCheck = document.getElementById('createRSS');
        this.createBacklinksCheck = document.getElementById('createBacklinks');

        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.currentStep = document.getElementById('currentStep');

        // Log elements
        this.logContainer = document.getElementById('logContainer');
        this.saveLogBtn = document.getElementById('saveLogBtn');
        this.clearLogBtn = document.getElementById('clearLogBtn');

        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsGrid = document.getElementById('resultsGrid');

        // Files elements
        this.filesList = document.getElementById('filesList');

        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startProcessing());
        this.clearBtn.addEventListener('click', () => this.clearInput());
        this.resetBtn.addEventListener('click', () => this.resetApplication());
        this.saveLogBtn.addEventListener('click', () => this.saveLog());
        this.clearLogBtn.addEventListener('click', () => this.clearLog());

        // Auto-resize textarea
        this.urlInput.addEventListener('input', () => {
            this.urlInput.style.height = 'auto';
            this.urlInput.style.height = Math.max(150, this.urlInput.scrollHeight) + 'px';
        });

        // Enable/disable start button based on input
        this.urlInput.addEventListener('input', () => {
            const hasUrls = this.getUrls().length > 0;
            this.startBtn.disabled = !hasUrls || this.isProcessing;
        });
    }

    getUrls() {
        return this.urlInput.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url && this.isValidUrl(url));
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    clearInput() {
        this.urlInput.value = '';
        this.urlInput.style.height = '150px';
        this.startBtn.disabled = true;
    }

    resetApplication() {
        this.clearInput();
        this.clearLog();
        this.hideProgress();
        this.hideResults();
        this.isProcessing = false;
        this.currentSession = null;
        this.updateButtonStates();
        this.loadFiles();
    }

    async startProcessing() {
        const urls = this.getUrls();
        
        if (urls.length === 0) {
            this.addLogEntry('error', 'Nenhuma URL válida encontrada!');
            return;
        }

        this.isProcessing = true;
        this.updateButtonStates();
        this.showProgress();
        this.hideResults();

        const options = {
            simulateTraffic: this.simulateTrafficCheck.checked,
            checkIndexing: this.checkIndexingCheck.checked,
            createRSS: this.createRSSCheck.checked,
            createBacklinks: this.createBacklinksCheck.checked
        };

        this.addLogEntry('info', `Iniciando processamento de ${urls.length} URL(s)...`);
        this.updateProgress(0, 'Iniciando processamento...');

        try {
            const response = await fetch('/api/process-urls', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ urls, options })
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            this.handleServerUpdate(data);
                        } catch (e) {
                            console.error('Erro ao parsear dados do servidor:', e);
                        }
                    }
                }
            }

        } catch (error) {
            this.addLogEntry('error', `Erro durante o processamento: ${error.message}`);
            this.updateProgress(0, 'Erro no processamento');
        } finally {
            this.isProcessing = false;
            this.updateButtonStates();
            this.loadFiles();
        }
    }

    handleServerUpdate(data) {
        switch (data.type) {
            case 'start':
                this.addLogEntry('info', data.message);
                break;

            case 'progress':
                if (data.step && data.message) {
                    this.updateProgress(this.getStepProgress(data.step), data.message);
                    this.addLogEntry('info', `[${data.step.toUpperCase()}] ${data.message}`);
                }
                
                if (data.url && data.status) {
                    this.addLogEntry('success', `[${data.step.toUpperCase()}] ${data.url} - ${data.status}`);
                }
                break;

            case 'complete':
                this.updateProgress(100, 'Processamento concluído!');
                this.addLogEntry('success', 'Processamento concluído com sucesso!');
                this.showResults(data.results);
                this.currentSession = data.results;
                break;

            case 'error':
                this.addLogEntry('error', data.message || 'Erro desconhecido');
                break;
        }
    }

    getStepProgress(step) {
        const steps = {
            'ping': 15,
            'rss': 30,
            'publish': 45,
            'shorten': 60,
            'backlinks': 75,
            'traffic': 85,
            'indexing': 95
        };
        return steps[step] || 0;
    }

    updateProgress(percentage, message) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `${percentage}%`;
        this.currentStep.textContent = message;
    }

    showProgress() {
        this.progressSection.style.display = 'block';
        this.progressSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
    }

    showResults(results) {
        this.resultsSection.style.display = 'block';
        this.populateResults(results);
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    populateResults(results) {
        const grid = this.resultsGrid;
        grid.innerHTML = '';

        // URLs processadas
        const urlsCard = this.createResultCard(
            'fas fa-link',
            'URLs Processadas',
            `${results.urls} URLs foram processadas com sucesso`
        );
        grid.appendChild(urlsCard);

        // Ping results
        if (results.results.ping) {
            const pingSuccess = results.results.ping.filter(p => 
                p.ping.some(ping => ping.status === 'success')
            ).length;
            
            const pingCard = this.createResultCard(
                'fas fa-satellite-dish',
                'Ping Services',
                `${pingSuccess}/${results.urls} URLs enviadas para serviços de ping`
            );
            grid.appendChild(pingCard);
        }

        // RSS
        if (results.results.rss) {
            const rssCard = this.createResultCard(
                'fas fa-rss',
                'RSS Feed',
                'Arquivo RSS criado com sucesso'
            );
            grid.appendChild(rssCard);
        }

        // Publishing
        if (results.results.publishing) {
            const pubCard = this.createResultCard(
                'fas fa-share-alt',
                'Publicação',
                'Links publicados em serviços externos'
            );
            grid.appendChild(pubCard);
        }

        // Shortened URLs
        if (results.results.shortened) {
            const shortCard = this.createResultCard(
                'fas fa-compress-alt',
                'URLs Encurtadas',
                'Links encurtados gerados com sucesso'
            );
            grid.appendChild(shortCard);
        }

        // Traffic simulation
        if (results.results.traffic) {
            const trafficSuccess = results.results.traffic.filter(t => t.status === 'success').length;
            const trafficCard = this.createResultCard(
                'fas fa-chart-line',
                'Simulação de Tráfego',
                `${trafficSuccess}/${results.urls} URLs receberam tráfego simulado`
            );
            grid.appendChild(trafficCard);
        }

        // Indexing check
        if (results.results.indexing) {
            const indexedCount = results.results.indexing.filter(i => i.indexed).length;
            const indexCard = this.createResultCard(
                'fas fa-search',
                'Verificação de Indexação',
                `${indexedCount}/${results.urls} URLs já estão indexadas`
            );
            grid.appendChild(indexCard);
        }
    }

    createResultCard(iconClass, title, content) {
        const card = document.createElement('div');
        card.className = 'result-item';
        card.innerHTML = `
            <h4><i class="${iconClass}"></i> ${title}</h4>
            <div class="result-content">${content}</div>
        `;
        return card;
    }

    addLogEntry(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = {
            timestamp,
            type,
            message,
            id: Date.now()
        };

        this.logEntries.push(entry);

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `
            <span class="timestamp">[${timestamp}]</span>
            <span class="message">${message}</span>
        `;

        this.logContainer.appendChild(logEntry);
        this.logContainer.scrollTop = this.logContainer.scrollHeight;

        // Enable save log button
        this.saveLogBtn.disabled = false;
    }

    clearLog() {
        this.logContainer.innerHTML = '';
        this.logEntries = [];
        this.saveLogBtn.disabled = true;
        
        // Add initial message
        this.addLogEntry('info', 'Log limpo. Aguardando novas operações...');
    }

    saveLog() {
        const logContent = this.logEntries
            .map(entry => `[${entry.timestamp}] ${entry.type.toUpperCase()}: ${entry.message}`)
            .join('\n');

        const blob = new Blob([logContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `linkindex-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        this.addLogEntry('success', 'Log salvo com sucesso!');
    }

    async loadFiles() {
        try {
            const response = await fetch('/api/files');
            const files = await response.json();

            const filesList = this.filesList;
            
            if (files.length === 0) {
                filesList.innerHTML = `
                    <div class="no-files">
                        <i class="fas fa-file-alt"></i>
                        <p>Nenhum arquivo gerado ainda</p>
                    </div>
                `;
                return;
            }

            filesList.innerHTML = files.map(file => `
                <div class="file-item">
                    <i class="file-icon ${this.getFileIcon(file.name)}"></i>
                    <div class="file-info">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            ${this.formatFileSize(file.size)} • 
                            ${new Date(file.modified).toLocaleString('pt-BR')}
                        </div>
                    </div>
                    <a href="/api/download/${file.name}" class="file-download" download>
                        <i class="fas fa-download"></i>
                    </a>
                </div>
            `).join('');

        } catch (error) {
            console.error('Erro ao carregar arquivos:', error);
        }
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'xml': 'fas fa-code',
            'html': 'fas fa-code',
            'txt': 'fas fa-file-alt',
            'json': 'fas fa-file-code',
            'csv': 'fas fa-file-csv'
        };
        return icons[ext] || 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateButtonStates() {
        this.startBtn.disabled = this.isProcessing || this.getUrls().length === 0;
        this.clearBtn.disabled = this.isProcessing;
        this.resetBtn.disabled = this.isProcessing;
        
        // Update button text
        if (this.isProcessing) {
            this.startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
        } else {
            this.startBtn.innerHTML = '<i class="fas fa-rocket"></i> Iniciar Indexação';
        }
    }

    showLoading() {
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.linkIndexPro = new LinkIndexPro();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.linkIndexPro) {
        // Reload files when page becomes visible
        window.linkIndexPro.loadFiles();
    }
});

// Handle errors globally
window.addEventListener('error', (event) => {
    console.error('Erro global:', event.error);
    if (window.linkIndexPro) {
        window.linkIndexPro.addLogEntry('error', `Erro: ${event.error.message}`);
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promise rejeitada:', event.reason);
    if (window.linkIndexPro) {
        window.linkIndexPro.addLogEntry('error', `Erro de Promise: ${event.reason}`);
    }
});

