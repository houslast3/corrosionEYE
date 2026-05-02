// Módulo de gerenciamento de sistema de arquivos
const FileSystem = {
    projectHandle: null,
    imagesHandle: null,
    savedHandle: null,

    async initializeProject() {
        try {
            // Solicitar acesso a uma pasta para o projeto
            this.projectHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            // Criar subpastas
            this.imagesHandle = await this.projectHandle.getDirectoryHandle('imagens', { create: true });
            this.savedHandle = await this.projectHandle.getDirectoryHandle('salvos', { create: true });

            console.log('Projeto inicializado em:', this.projectHandle.name);
            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Erro ao inicializar projeto:', err);
            }
            return false;
        }
    },

    async saveImageToFolder(file, testName, sampleName, zoom) {
        if (!this.imagesHandle) {
            console.warn('Pasta de imagens não inicializada');
            return;
        }

        try {
            // Criar pasta do teste se não existir
            const testHandle = await this.imagesHandle.getDirectoryHandle(testName, { create: true });
            
            // Criar pasta da amostra se não existir
            const sampleHandle = await testHandle.getDirectoryHandle(sampleName, { create: true });
            
            // Salvar arquivo
            const fileName = `${testName}${sampleName}-${zoom}${this.getFileExtension(file.name)}`;
            const fileHandle = await sampleHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(file);
            await writable.close();
            
            console.log(`Imagem salva: ${testName}/${sampleName}/${fileName}`);
        } catch (err) {
            console.error('Erro ao salvar imagem:', err);
        }
    },

    async saveSamplePhoto(file, testName) {
        if (!this.imagesHandle) {
            console.warn('Pasta de imagens não inicializada');
            return;
        }

        try {
            const testHandle = await this.imagesHandle.getDirectoryHandle(testName, { create: true });
            const fileName = `${testName}${this.getFileExtension(file.name)}`;
            const fileHandle = await testHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(file);
            await writable.close();
            
            console.log(`Foto da amostra salva: ${testName}/${fileName}`);
        } catch (err) {
            console.error('Erro ao salvar foto da amostra:', err);
        }
    },

    async saveJSON(data, fileName) {
        if (!this.savedHandle) {
            console.warn('Pasta de salvos não inicializada');
            // Fallback para download normal
            Storage.exportData();
            return;
        }

        try {
            const jsonFileName = fileName || `analise_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
            const fileHandle = await this.savedHandle.getFileHandle(jsonFileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
            
            console.log(`JSON salvo: salvos/${jsonFileName}`);
            return jsonFileName;
        } catch (err) {
            console.error('Erro ao salvar JSON:', err);
            // Fallback para download
            Storage.exportData();
        }
    },

    async loadJSONFromFolder() {
        if (!this.savedHandle) {
            console.warn('Pasta de salvos não inicializada');
            return null;
        }

        try {
            // Listar arquivos JSON na pasta salvos
            const files = [];
            for await (const entry of this.savedHandle.values()) {
                if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                    files.push(entry.name);
                }
            }

            if (files.length === 0) {
                alert('Nenhum arquivo JSON encontrado na pasta salvos');
                return null;
            }

            // Mostrar lista para usuário escolher
            const fileName = await this.showFileSelector(files);
            if (!fileName) return null;

            const fileHandle = await this.savedHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch (err) {
            console.error('Erro ao carregar JSON:', err);
            return null;
        }
    },

    async showFileSelector(files) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;

            const content = document.createElement('div');
            content.style.cssText = `
                background: #252525;
                padding: 30px;
                border-radius: 8px;
                max-width: 500px;
                max-height: 70vh;
                overflow-y: auto;
            `;

            let html = '<h3 style="color: #4a9eff; margin-bottom: 20px;">Selecione um arquivo JSON</h3>';
            files.forEach(file => {
                html += `
                    <div class="json-file-item" style="
                        padding: 12px;
                        margin: 8px 0;
                        background: #333;
                        border-radius: 4px;
                        cursor: pointer;
                        color: #e0e0e0;
                    " data-file="${file}">
                        📄 ${file}
                    </div>
                `;
            });
            html += `
                <button style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #d32f2f;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    width: 100%;
                " id="cancelFileSelect">Cancelar</button>
            `;

            content.innerHTML = html;
            modal.appendChild(content);
            document.body.appendChild(modal);

            content.querySelectorAll('.json-file-item').forEach(item => {
                item.addEventListener('click', () => {
                    resolve(item.dataset.file);
                    document.body.removeChild(modal);
                });
                item.addEventListener('mouseenter', () => {
                    item.style.background = '#4a9eff';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.background = '#333';
                });
            });

            content.querySelector('#cancelFileSelect').addEventListener('click', () => {
                resolve(null);
                document.body.removeChild(modal);
            });
        });
    },

    getFileExtension(filename) {
        return filename.substring(filename.lastIndexOf('.'));
    },

    async autoSaveJSON() {
        if (!this.savedHandle) return;

        const data = {
            markers: AppState.markers,
            pixelRatios: AppState.pixelRatios,
            rulerDetections: AppState.rulerDetections,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const fileName = `autosave_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        await this.saveJSON(data, fileName);
    },

    isSupported() {
        return 'showDirectoryPicker' in window;
    }
};
