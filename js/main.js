// Arquivo principal - inicialização e event listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

function initializeEventListeners() {
    // Upload de imagens
    document.getElementById('imageUpload').addEventListener('change', (e) => {
        ImageLoader.handleImageUpload(e);
    });
    
    // Seleção de teste e amostra
    document.getElementById('testSelect').addEventListener('change', (e) => {
        AppState.currentTest = e.target.value;
        UI.updateSampleSelector();
        UI.clearDisplay();
    });
    
    document.getElementById('sampleSelect').addEventListener('change', (e) => {
        AppState.currentSample = e.target.value;
        if (AppState.currentSample) {
            Display.displaySingleSample(AppState.currentSample);
        }
    });
    
    document.getElementById('showAllSamples').addEventListener('click', () => {
        Display.showAllSamples();
    });
    
    // Ferramentas
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.id === 'calibrateBtn') return;
            
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            AppState.tool = e.target.dataset.tool;
        });
    });
    
    document.querySelectorAll('.corrosion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.corrosion-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            AppState.corrosionType = e.target.dataset.type;
        });
    });
    
    // Sliders
    document.getElementById('penSize').addEventListener('input', (e) => {
        AppState.penSize = parseInt(e.target.value);
        document.getElementById('penSizeValue').textContent = AppState.penSize;
    });
    
    document.getElementById('depthSlider').addEventListener('input', (e) => {
        AppState.depth = parseInt(e.target.value) / 100;
        document.getElementById('depthValue').textContent = AppState.depth.toFixed(2);
    });
    
    document.getElementById('opacitySlider').addEventListener('input', (e) => {
        AppState.opacity = parseInt(e.target.value);
        document.getElementById('opacityValue').textContent = AppState.opacity;
        Canvas.redrawAllCanvases();
    });
    
    // Calibração
    document.getElementById('calibrateBtn').addEventListener('click', () => {
        Calibration.toggleCalibrationMode();
    });
    
    // Limpar marcações
    document.getElementById('clearMarks').addEventListener('click', () => {
        Canvas.clearAllMarkers();
    });
    
    // Toggle sidebar
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        UI.toggleSidebar();
    });
    
    // Exportar/Importar dados
    document.getElementById('exportData').addEventListener('click', () => {
        Storage.exportData();
    });
    
    document.getElementById('importDataBtn').addEventListener('click', () => {
        document.getElementById('importData').click();
    });
    
    document.getElementById('importData').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            Storage.importData(e.target.files[0]);
        }
    });
}
