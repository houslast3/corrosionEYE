// Módulo de comunicação com servidor PHP
const ServerAPI = {
    baseURL: 'api/',

    async saveProject(projectName) {
        try {
            // Salvar APENAS imagens no servidor (sem marcadores)
            const data = {
                projectName: projectName,
                images: AppState.images
            };

            console.log('Salvando imagens no servidor:', projectName);
            console.log('Total de testes:', Object.keys(AppState.images).length);

            const response = await fetch(this.baseURL + 'save_project.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Resposta do servidor:', errorText);
                throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
            }

            const result = await response.json();

            if (result.success) {
                console.log('Imagens salvas com sucesso:', result);
                return result;
            } else {
                throw new Error(result.error || 'Erro ao salvar imagens');
            }
        } catch (error) {
            console.error('Erro ao salvar imagens:', error);
            throw error;
        }
    },

    async listProjects() {
        try {
            const response = await fetch(this.baseURL + 'list_projects.php');
            const result = await response.json();

            if (result.success) {
                return result.projects;
            } else {
                throw new Error(result.error || 'Erro ao listar projetos');
            }
        } catch (error) {
            console.error('Erro ao listar projetos:', error);
            throw error;
        }
    },

    async loadProject(projectName) {
        try {
            const url = this.baseURL + 'load_project.php?project=' + encodeURIComponent(projectName);
            
            console.log('Carregando imagens do projeto:', projectName);
            
            const response = await fetch(url);
            
            // Verificar se a resposta é válida
            if (!response.ok) {
                throw new Error(`Erro HTTP ${response.status}`);
            }
            
            // Tentar ler como texto primeiro para ver o tamanho
            const text = await response.text();
            console.log('Tamanho da resposta:', text.length, 'caracteres');
            
            // Tentar parsear o JSON
            let result;
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                console.error('Erro ao parsear JSON:', parseError);
                console.error('Primeiros 1000 caracteres:', text.substring(0, 1000));
                console.error('Últimos 1000 caracteres:', text.substring(text.length - 1000));
                throw new Error('Resposta do servidor está corrompida ou incompleta. Tamanho: ' + text.length + ' caracteres');
            }

            if (result.success) {
                return result;
            } else {
                throw new Error(result.error || 'Erro ao carregar imagens');
            }
        } catch (error) {
            console.error('Erro ao carregar imagens:', error);
            throw error;
        }
    },

    showSaveDialog() {
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
                width: 90%;
            `;

            content.innerHTML = `
                <h3 style="color: #4a9eff; margin-bottom: 20px;">Salvar Projeto</h3>
                <p style="color: #e0e0e0; margin-bottom: 15px;">Digite o nome do projeto:</p>
                <input type="text" id="projectNameInput" placeholder="Ex: Analise_Corrosao_2024" style="
                    width: 100%;
                    padding: 12px;
                    background: #333;
                    border: 1px solid #555;
                    border-radius: 4px;
                    color: #e0e0e0;
                    font-size: 14px;
                    margin-bottom: 20px;
                ">
                <div style="display: flex; gap: 10px;">
                    <button id="saveProjectBtn" style="
                        flex: 1;
                        padding: 12px;
                        background: #4a9eff;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">💾 Salvar</button>
                    <button id="cancelSaveBtn" style="
                        flex: 1;
                        padding: 12px;
                        background: #d32f2f;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Cancelar</button>
                </div>
            `;

            modal.appendChild(content);
            document.body.appendChild(modal);

            const input = content.querySelector('#projectNameInput');
            input.focus();

            const saveBtn = content.querySelector('#saveProjectBtn');
            const cancelBtn = content.querySelector('#cancelSaveBtn');

            const cleanup = () => {
                document.body.removeChild(modal);
            };

            saveBtn.addEventListener('click', () => {
                const name = input.value.trim();
                if (name) {
                    resolve(name);
                    cleanup();
                } else {
                    alert('Por favor, digite um nome para o projeto');
                }
            });

            cancelBtn.addEventListener('click', () => {
                resolve(null);
                cleanup();
            });

            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    saveBtn.click();
                }
            });
        });
    },

    async showLoadDialog() {
        try {
            const projects = await this.listProjects();

            if (projects.length === 0) {
                alert('Nenhum projeto encontrado no servidor');
                return null;
            }

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
                    max-width: 600px;
                    width: 90%;
                    max-height: 70vh;
                    overflow-y: auto;
                `;

                let html = '<h3 style="color: #4a9eff; margin-bottom: 20px;">Carregar Imagens do Servidor</h3>';
                
                projects.forEach(project => {
                    html += `
                        <div class="project-item" style="
                            padding: 15px;
                            margin: 10px 0;
                            background: #333;
                            border-radius: 6px;
                            cursor: pointer;
                            border: 2px solid transparent;
                            transition: all 0.3s;
                        " data-project="${project.name}">
                            <div style="color: #4a9eff; font-size: 16px; font-weight: bold; margin-bottom: 5px;">
                                📁 ${project.displayName}
                            </div>
                            <div style="color: #888; font-size: 12px;">
                                Criado: ${project.created}
                            </div>
                            <div style="color: #888; font-size: 12px;">
                                Modificado: ${project.lastModified}
                            </div>
                        </div>
                    `;
                });

                html += `
                    <button id="cancelLoadBtn" style="
                        margin-top: 20px;
                        padding: 12px;
                        background: #d32f2f;
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        width: 100%;
                        font-size: 14px;
                    ">Cancelar</button>
                `;

                content.innerHTML = html;
                modal.appendChild(content);
                document.body.appendChild(modal);

                const cleanup = () => {
                    document.body.removeChild(modal);
                };

                content.querySelectorAll('.project-item').forEach(item => {
                    item.addEventListener('click', () => {
                        resolve(item.dataset.project);
                        cleanup();
                    });
                    item.addEventListener('mouseenter', () => {
                        item.style.background = '#4a9eff';
                        item.style.borderColor = '#4a9eff';
                    });
                    item.addEventListener('mouseleave', () => {
                        item.style.background = '#333';
                        item.style.borderColor = 'transparent';
                    });
                });

                content.querySelector('#cancelLoadBtn').addEventListener('click', () => {
                    resolve(null);
                    cleanup();
                });
            });
        } catch (error) {
            alert('Erro ao listar projetos: ' + error.message);
            return null;
        }
    }
};
