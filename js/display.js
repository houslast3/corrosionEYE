// Módulo de exibição de amostras
const Display = {
    showAllSamples() {
        if (!AppState.currentTest) {
            alert('Selecione um teste primeiro');
            return;
        }
        
        const container = document.getElementById('samplesContainer');
        container.innerHTML = '';
        
        const testData = AppState.images[AppState.currentTest];
        const samples = Object.keys(testData).filter(key => key !== 'photo').sort();
        
        samples.forEach(sample => {
            this.createSampleSection(container, sample);
        });
        
        document.getElementById('comparisonSection').classList.add('active');
        Reports.updateComparisonCharts();
    },

    displaySingleSample(sample) {
        const container = document.getElementById('samplesContainer');
        container.innerHTML = '';
        this.createSampleSection(container, sample);
        Reports.updateSampleReport(sample);
        document.getElementById('comparisonSection').classList.remove('active');
    },

    createSampleSection(container, sample) {
        const section = document.createElement('div');
        section.className = 'sample-section';
        section.dataset.sample = sample;
        
        const title = document.createElement('h2');
        title.textContent = `Teste ${AppState.currentTest} - Amostra ${sample}`;
        section.appendChild(title);
        
        // Foto da amostra
        const photoDiv = document.createElement('div');
        photoDiv.className = 'sample-photo';
        const photoContainer = document.createElement('div');
        photoContainer.className = 'image-container';
        
        const testData = AppState.images[AppState.currentTest];
        if (testData.photo) {
            const img = document.createElement('img');
            img.src = testData.photo;
            photoContainer.appendChild(img);
        }
        photoDiv.appendChild(photoContainer);
        section.appendChild(photoDiv);
        
        // Linha superior (zooms 01, 02, 03)
        const topRow = document.createElement('div');
        topRow.className = 'zoom-row top-row';
        ['01', '02', '03'].forEach(zoom => {
            const imgContainer = this.createImageContainer(sample, zoom, false);
            topRow.appendChild(imgContainer);
        });
        section.appendChild(topRow);
        
        // Linha inferior (zooms 04, 05)
        const bottomRow = document.createElement('div');
        bottomRow.className = 'zoom-row bottom-row';
        ['04', '05'].forEach(zoom => {
            const imgContainer = this.createImageContainer(sample, zoom, true);
            bottomRow.appendChild(imgContainer);
        });
        section.appendChild(bottomRow);
        
        // Relatório da amostra
        const reportDiv = document.createElement('div');
        reportDiv.className = 'report-panel';
        reportDiv.innerHTML = '<h3>Relatório da Amostra</h3><div class="report-content"></div>';
        section.appendChild(reportDiv);
        
        container.appendChild(section);
    },

    createImageContainer(sample, zoom, editable) {
        const container = document.createElement('div');
        container.className = 'image-container editable'; // Todas editáveis agora
        container.dataset.zoom = zoom;
        container.dataset.sample = sample;
        
        const sampleData = AppState.images[AppState.currentTest][sample];
        
        if (sampleData && sampleData[zoom]) {
            const img = document.createElement('img');
            img.src = sampleData[zoom].src;
            img.onload = () => {
                Canvas.setupCanvas(container, img, zoom, sample);
                Calibration.detectRuler(img, zoom, container);
                if (zoom === '04' || zoom === '05') {
                    this.addDepthLegend(container);
                }
                this.addImageLegend(container, sample, zoom);
            };
            container.appendChild(img);
        } else {
            const placeholder = document.createElement('span');
            placeholder.className = 'placeholder';
            placeholder.textContent = `Zoom ${zoom} (${AppState.scales[zoom]}µm)`;
            container.appendChild(placeholder);
        }
        
        return container;
    },

    addImageLegend(container, sample, zoom) {
        const existingLegend = container.querySelector('.image-legend');
        if (existingLegend) existingLegend.remove();
        
        const key = `${AppState.currentTest}-${sample}`;
        const markers = AppState.markers[key];
        
        if (!markers) return;
        
        const markerArray = Object.values(markers).filter(m => m.zoom === zoom);
        if (markerArray.length === 0) return;
        
        const totalPoints = markerArray.length;
        const avgDepth = (markerArray.reduce((sum, m) => sum + m.depth, 0) / totalPoints).toFixed(3);
        const circular = markerArray.filter(m => m.type === 'circular').length;
        const irregular = markerArray.filter(m => m.type === 'irregular').length;
        const generalized = markerArray.filter(m => m.type === 'generalized').length;
        
        // Calcular diâmetro médio
        const markersWithDiameter = markerArray.filter(m => m.diameter);
        const avgDiameter = markersWithDiameter.length > 0 
            ? (markersWithDiameter.reduce((sum, m) => sum + m.diameter, 0) / markersWithDiameter.length).toFixed(2)
            : null;
        
        const legend = document.createElement('div');
        legend.className = 'image-legend';
        legend.innerHTML = `
            <div><strong>P:</strong> ${totalPoints}</div>
            ${avgDiameter ? `<div><strong>Dₘ:</strong> ${avgDiameter}µm</div>` : ''}
            <div><strong>Pₘ:</strong> ${avgDepth}µm</div>
            ${circular > 0 ? `<div><strong>C:</strong> ${circular}</div>` : ''}
            ${irregular > 0 ? `<div><strong>I:</strong> ${irregular}</div>` : ''}
            ${generalized > 0 ? `<div><strong>G:</strong> ${generalized}</div>` : ''}
        `;
        
        container.appendChild(legend);
    },

    addDepthLegend(container) {
        const existingLegend = container.querySelector('.depth-legend');
        if (existingLegend) existingLegend.remove();
        
        const legend = document.createElement('div');
        legend.className = 'depth-legend';
        
        const depths = [
            { value: 0, label: '0.00', color: 'rgb(0, 102, 255)' },
            { value: 0.83, label: '0.83', color: 'rgb(0, 255, 0)' },
            { value: 1.67, label: '1.67', color: 'rgb(255, 255, 0)' },
            { value: 2.5, label: '2.50', color: 'rgb(255, 0, 0)' }
        ];
        
        let html = '<div class="depth-legend-title">Prof. (µm)</div>';
        depths.forEach(d => {
            html += `
                <div class="depth-legend-item">
                    <div class="depth-color-box" style="background: ${d.color}; border: 1px solid #fff;"></div>
                    <span>${d.label}</span>
                </div>
            `;
        });
        
        legend.innerHTML = html;
        container.appendChild(legend);
    }
};
