// Módulo de relatórios e gráficos
const Reports = {
    updateSampleReport(sample) {
        const section = document.querySelector(`.sample-section[data-sample="${sample}"]`);
        if (!section) return;
        
        const reportContent = section.querySelector('.report-content');
        if (!reportContent) return;
        
        const key = `${AppState.currentTest}-${sample}`;
        const markers = AppState.markers[key];
        
        if (!markers || Object.keys(markers).length === 0) {
            reportContent.innerHTML = '<p class="no-data">Sem marcações</p>';
            return;
        }
        
        const markerArray = Object.values(markers);
        const circularMarkers = markerArray.filter(m => m.type === 'circular');
        const irregularMarkers = markerArray.filter(m => m.type === 'irregular');
        const generalizedMarkers = markerArray.filter(m => m.type === 'generalized');
        
        const totalPoints = markerArray.length;
        const avgDepth = (markerArray.reduce((sum, m) => sum + m.depth, 0) / totalPoints).toFixed(3);
        
        // Calcular diâmetro médio apenas dos que têm diâmetro
        const markersWithDiameter = markerArray.filter(m => m.diameter);
        const avgDiameter = markersWithDiameter.length > 0 
            ? (markersWithDiameter.reduce((sum, m) => sum + m.diameter, 0) / markersWithDiameter.length).toFixed(2)
            : '0.00';
        
        const report = `
            <div class="report-item"><strong>Total de Pontos:</strong> ${totalPoints}</div>
            ${markersWithDiameter.length > 0 ? `<div class="report-item"><strong>Diâmetro Médio:</strong> ${avgDiameter} µm</div>` : ''}
            <div class="report-item"><strong>Profundidade Média:</strong> ${avgDepth} µm</div>
            <div class="report-item"><strong>Circulares:</strong> ${circularMarkers.length}</div>
            <div class="report-item"><strong>Irregulares:</strong> ${irregularMarkers.length}</div>
            <div class="report-item"><strong>Generalizadas:</strong> ${generalizedMarkers.length}</div>
        `;
        
        reportContent.innerHTML = report;
        
        // Atualizar legendas nas imagens
        ['01', '02', '03', '04', '05'].forEach(zoom => {
            const container = section.querySelector(`[data-zoom="${zoom}"]`);
            if (container) {
                Display.addImageLegend(container, sample, zoom);
            }
        });
    },

    updateAllReports() {
        if (!AppState.currentTest) return;
        
        const testData = AppState.images[AppState.currentTest];
        const samples = Object.keys(testData).filter(key => key !== 'photo');
        
        samples.forEach(sample => {
            this.updateSampleReport(sample);
        });
    },

    updateComparisonCharts() {
        if (!AppState.currentTest) return;
        
        const testData = AppState.images[AppState.currentTest];
        const samples = Object.keys(testData).filter(key => key !== 'photo').sort();
        
        const data = {
            labels: samples.map(s => `Amostra ${s}`),
            points: [],
            diameters: [],
            depths: [],
            circular: [],
            irregular: []
        };
        
        let totalPoints = 0;
        let totalDiameter = 0;
        let totalDepth = 0;
        let totalCircular = 0;
        let totalIrregular = 0;
        let samplesWithData = 0;
        
        samples.forEach(sample => {
            const key = `${AppState.currentTest}-${sample}`;
            const markers = AppState.markers[key];
            
            if (markers && Object.keys(markers).length > 0) {
                const markerArray = Object.values(markers);
                const circularMarkers = markerArray.filter(m => m.type === 'circular');
                const irregularMarkers = markerArray.filter(m => m.type === 'irregular');
                
                const avgDiameter = markerArray.reduce((sum, m) => sum + m.diameter, 0) / markerArray.length;
                const avgDepth = markerArray.reduce((sum, m) => sum + m.depth, 0) / markerArray.length;
                
                data.points.push(markerArray.length);
                data.diameters.push(avgDiameter.toFixed(2));
                data.depths.push(avgDepth.toFixed(3));
                data.circular.push(circularMarkers.length);
                data.irregular.push(irregularMarkers.length);
                
                totalPoints += markerArray.length;
                totalDiameter += avgDiameter;
                totalDepth += avgDepth;
                totalCircular += circularMarkers.length;
                totalIrregular += irregularMarkers.length;
                samplesWithData++;
            } else {
                data.points.push(0);
                data.diameters.push(0);
                data.depths.push(0);
                data.circular.push(0);
                data.irregular.push(0);
            }
        });
        
        this.updateSummaryReport({
            totalSamples: samples.length,
            totalPoints,
            avgDiameter: samplesWithData > 0 ? (totalDiameter / samplesWithData).toFixed(2) : 0,
            avgDepth: samplesWithData > 0 ? (totalDepth / samplesWithData).toFixed(3) : 0,
            totalCircular,
            totalIrregular
        });
        
        Charts.drawUnifiedChart('chartComparison', data);
    },

    updateSummaryReport(summary) {
        const grid = document.getElementById('summaryGrid');
        
        grid.innerHTML = `
            <div class="summary-item">
                <div class="label">Total de Amostras</div>
                <div class="value">${summary.totalSamples}</div>
            </div>
            <div class="summary-item">
                <div class="label">Total de Pontos</div>
                <div class="value">${summary.totalPoints}</div>
            </div>
            <div class="summary-item">
                <div class="label">Diâmetro Médio</div>
                <div class="value">${summary.avgDiameter}<span class="unit">µm</span></div>
            </div>
            <div class="summary-item">
                <div class="label">Profundidade Média</div>
                <div class="value">${summary.avgDepth}<span class="unit">µm</span></div>
            </div>
            <div class="summary-item">
                <div class="label">Corrosões Circulares</div>
                <div class="value">${summary.totalCircular}</div>
            </div>
            <div class="summary-item">
                <div class="label">Corrosões Irregulares</div>
                <div class="value">${summary.totalIrregular}</div>
            </div>
        `;
    }
};
