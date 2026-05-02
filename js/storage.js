// Módulo de salvamento e carregamento de dados
const Storage = {
    saveState() {
        const data = {
            markers: AppState.markers,
            pixelRatios: AppState.pixelRatios,
            rulerDetections: AppState.rulerDetections,
            timestamp: new Date().toISOString()
        };
        
        const json = JSON.stringify(data, null, 2);
        localStorage.setItem('corrosion_analysis_data', json);
        
        // Também criar arquivo para download
        this.createDownloadLink(json);
    },

    loadState() {
        const saved = localStorage.getItem('corrosion_analysis_data');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                AppState.markers = data.markers || {};
                AppState.pixelRatios = data.pixelRatios || {};
                AppState.rulerDetections = data.rulerDetections || {};
                
                console.log('Dados carregados:', data.timestamp);
                return true;
            } catch (e) {
                console.error('Erro ao carregar dados:', e);
                return false;
            }
        }
        return false;
    },

    createDownloadLink(json) {
        const existingLink = document.getElementById('downloadDataLink');
        if (existingLink) existingLink.remove();
        
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.id = 'downloadDataLink';
        link.href = url;
        link.download = `analise_corrosao_${new Date().toISOString().split('T')[0]}.json`;
        link.textContent = '💾 Baixar Dados (JSON)';
        link.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #4a9eff;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 14px;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(link);
    },

    exportData() {
        const data = {
            markers: AppState.markers,
            pixelRatios: AppState.pixelRatios,
            rulerDetections: AppState.rulerDetections,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `analise_corrosao_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('Deseja carregar os dados salvos? Isso substituirá as marcações atuais.')) {
                    AppState.markers = data.markers || {};
                    AppState.pixelRatios = data.pixelRatios || {};
                    AppState.rulerDetections = data.rulerDetections || {};
                    
                    // Redesenhar tudo
                    Canvas.redrawAllCanvases();
                    Reports.updateAllReports();
                    Reports.updateComparisonCharts();
                    
                    alert('Dados carregados com sucesso!');
                }
            } catch (err) {
                alert('Erro ao carregar arquivo: ' + err.message);
            }
        };
        reader.readAsText(file);
    },

    clearAllData() {
        if (confirm('Deseja limpar TODOS os dados salvos? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('corrosion_analysis_data');
            AppState.markers = {};
            AppState.pixelRatios = {};
            AppState.rulerDetections = {};
            
            Canvas.redrawAllCanvases();
            Reports.updateAllReports();
            
            alert('Todos os dados foram limpos.');
        }
    }
};

// Auto-salvar a cada mudança
window.addEventListener('beforeunload', () => {
    Storage.saveState();
});

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    Storage.loadState();
});
