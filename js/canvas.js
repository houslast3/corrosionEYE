// Módulo de canvas e marcações
const Canvas = {
    setupCanvas(container, img, zoom, sample) {
        const canvas = document.createElement('canvas');
        canvas.className = 'edit-canvas';
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        container.appendChild(canvas);
        
        // Criar popup de profundidade
        const depthPopup = document.createElement('div');
        depthPopup.className = 'depth-slider-popup';
        depthPopup.innerHTML = `
            <div class="depth-value">0.00µm</div>
            <input type="range" min="0" max="250" value="0" step="1">
        `;
        container.appendChild(depthPopup);
        
        const depthSlider = depthPopup.querySelector('input');
        const depthValue = depthPopup.querySelector('.depth-value');
        
        canvas.addEventListener('mousedown', (e) => {
            if (AppState.calibrationMode) {
                Calibration.handleCalibrationClick(e, canvas, zoom, sample, container);
                return;
            }
            
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            // Verificar se clicou em marcador existente
            const clickedMarker = this.findMarkerAt(x, y, sample, zoom);
            if (clickedMarker) {
                if (AppState.tool === 'eraser') {
                    this.deleteMarker(clickedMarker.id, sample);
                    this.redrawCanvas(canvas, zoom, sample);
                    Reports.updateSampleReport(sample);
                    Reports.updateComparisonCharts();
                } else if (AppState.tool === 'pen') {
                    // Entrar em modo de edição
                    AppState.editingMarker = clickedMarker;
                    const displayX = e.clientX - rect.left;
                    const displayY = e.clientY - rect.top;
                    
                    depthPopup.style.left = (displayX + 20) + 'px';
                    depthPopup.style.top = (displayY - 30) + 'px';
                    depthPopup.classList.add('active');
                    
                    depthSlider.value = clickedMarker.marker.depth * 100;
                    depthValue.textContent = clickedMarker.marker.depth.toFixed(2) + 'µm';
                }
                return;
            }
            
            if (AppState.tool === 'pen') {
                AppState.isDrawing = true;
                AppState.drawStart = { x, y };
            }
        });
        
        canvas.addEventListener('mousemove', (e) => {
            // Se está editando, não fazer nada no mousemove
            if (AppState.editingMarker) {
                return;
            }
            
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            
            // Verificar hover sobre marcador (apenas se não estiver desenhando)
            if (!AppState.isDrawing && AppState.tool === 'pen') {
                const hoveredMarker = this.findMarkerAt(x, y, sample, zoom);
                if (hoveredMarker) {
                    canvas.style.cursor = 'pointer';
                } else {
                    canvas.style.cursor = 'crosshair';
                }
            }
            
            if (AppState.isDrawing && AppState.drawStart) {
                this.redrawCanvas(canvas, zoom, sample);
                this.drawPreview(canvas, AppState.drawStart, { x, y });
            }
        });
        
        canvas.addEventListener('mouseup', (e) => {
            if (AppState.isDrawing && AppState.drawStart) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                this.createMarker(AppState.drawStart, { x, y }, canvas, zoom, sample);
                AppState.isDrawing = false;
                AppState.drawStart = null;
            }
        });
        
        canvas.addEventListener('mouseleave', () => {
            if (AppState.isDrawing) {
                AppState.isDrawing = false;
                AppState.drawStart = null;
                this.redrawCanvas(canvas, zoom, sample);
            }
        });
        
        // Clicar fora para sair do modo de edição
        canvas.addEventListener('click', (e) => {
            if (AppState.editingMarker) {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const x = (e.clientX - rect.left) * scaleX;
                const y = (e.clientY - rect.top) * scaleY;
                
                const clickedMarker = this.findMarkerAt(x, y, sample, zoom);
                if (!clickedMarker || clickedMarker.id !== AppState.editingMarker.id) {
                    // Clicou fora, sair do modo de edição
                    AppState.editingMarker = null;
                    depthPopup.classList.remove('active');
                }
            }
        });
        
        depthSlider.oninput = (ev) => {
            if (AppState.editingMarker) {
                const newDepth = parseInt(ev.target.value) / 100;
                depthValue.textContent = newDepth.toFixed(2) + 'µm';
                AppState.editingMarker.marker.depth = newDepth;
                this.redrawCanvas(canvas, zoom, sample);
                Reports.updateSampleReport(sample);
                Storage.saveState();
            }
        };
        
        setTimeout(() => this.redrawCanvas(canvas, zoom, sample), 100);
    },

    createMarker(start, end, canvas, zoom, sample) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 5) return; // Muito pequeno
        
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const radius = distance / 2;
        
        // Calcular diâmetro em µm
        const pixelRatio = AppState.pixelRatios[`${AppState.currentTest}-${sample}-${zoom}`] || 1;
        const diameterPixels = distance;
        const diameterUm = (diameterPixels * pixelRatio).toFixed(2);
        
        const markerId = `${AppState.currentTest}-${sample}-${zoom}-${Date.now()}`;
        
        const marker = {
            x: centerX,
            y: centerY,
            radius: radius,
            diameter: parseFloat(diameterUm),
            type: AppState.corrosionType,
            depth: AppState.depth,
            zoom,
            sample
        };
        
        const key = `${AppState.currentTest}-${sample}`;
        if (!AppState.markers[key]) {
            AppState.markers[key] = {};
        }
        AppState.markers[key][markerId] = marker;
        
        this.redrawCanvas(canvas, zoom, sample);
        Reports.updateSampleReport(sample);
        Reports.updateComparisonCharts();
        Storage.saveState();
    },

    findMarkerAt(x, y, sample, zoom) {
        const key = `${AppState.currentTest}-${sample}`;
        if (!AppState.markers[key]) return null;
        
        for (const [id, marker] of Object.entries(AppState.markers[key])) {
            if (marker.zoom === zoom) {
                const dist = Math.sqrt((marker.x - x) ** 2 + (marker.y - y) ** 2);
                if (dist <= marker.radius) {
                    return { id, marker };
                }
            }
        }
        return null;
    },

    deleteMarker(markerId, sample) {
        const key = `${AppState.currentTest}-${sample}`;
        if (AppState.markers[key] && AppState.markers[key][markerId]) {
            delete AppState.markers[key][markerId];
            Storage.saveState();
        }
    },

    drawPreview(canvas, start, end) {
        const ctx = canvas.getContext('2d');
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const centerX = (start.x + end.x) / 2;
        const centerY = (start.y + end.y) / 2;
        const radius = distance / 2;
        
        const color = this.getDepthColor(AppState.depth);
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        if (AppState.corrosionType === 'circular' || AppState.corrosionType === 'generalized') {
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        } else {
            this.drawIrregular(ctx, centerX, centerY, radius);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    },

    redrawCanvas(canvas, zoom, sample) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const key = `${AppState.currentTest}-${sample}`;
        if (!AppState.markers[key]) return;
        
        Object.values(AppState.markers[key]).forEach(marker => {
            if (marker.zoom === zoom) {
                const color = this.getDepthColor(marker.depth);
                
                ctx.strokeStyle = color;
                ctx.lineWidth = 3;
                ctx.fillStyle = 'transparent';
                
                ctx.beginPath();
                if (marker.type === 'circular' || marker.type === 'generalized') {
                    ctx.arc(marker.x, marker.y, marker.radius, 0, Math.PI * 2);
                } else {
                    this.drawIrregular(ctx, marker.x, marker.y, marker.radius);
                }
                ctx.stroke();
                
                // Mostrar diâmetro se existir
                if (marker.diameter) {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                    const labelWidth = 60;
                    const labelX = marker.x + marker.radius + 5;
                    const labelY = marker.y - 10;
                    ctx.fillRect(labelX, labelY, labelWidth, 20);
                    ctx.fillStyle = 'white';
                    ctx.font = '11px Arial';
                    ctx.fillText(`${marker.diameter}µm`, labelX + 5, labelY + 14);
                }
            }
        });
    },

    drawIrregular(ctx, x, y, radius) {
        const points = 12;
        const seed = x + y;
        ctx.moveTo(x + radius, y);
        for (let i = 1; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const variance = 0.6 + (Math.sin(seed + i) * 0.5 + 0.5) * 0.7;
            const r = radius * variance;
            ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
        }
        ctx.closePath();
    },

    getDepthColor(depth) {
        const ratio = depth / 2.5;
        
        if (ratio <= 0.33) {
            const r = 0;
            const g = Math.round(102 + (255 - 102) * (ratio / 0.33));
            const b = Math.round(255 - (255 * (ratio / 0.33)));
            return `rgb(${r}, ${g}, ${b})`;
        } else if (ratio <= 0.66) {
            const localRatio = (ratio - 0.33) / 0.33;
            const r = Math.round(255 * localRatio);
            const g = 255;
            const b = 0;
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            const localRatio = (ratio - 0.66) / 0.34;
            const r = 255;
            const g = Math.round(255 - (255 * localRatio));
            const b = 0;
            return `rgb(${r}, ${g}, ${b})`;
        }
    },

    redrawAllCanvases() {
        document.querySelectorAll('.edit-canvas').forEach(canvas => {
            const zoom = canvas.closest('[data-zoom]').dataset.zoom;
            const sample = canvas.closest('[data-sample]').dataset.sample;
            if (zoom && sample) {
                this.redrawCanvas(canvas, zoom, sample);
            }
        });
    },

    clearAllMarkers() {
        if (!AppState.currentTest) return;
        
        if (AppState.currentSample) {
            const key = `${AppState.currentTest}-${AppState.currentSample}`;
            if (AppState.markers[key]) {
                delete AppState.markers[key];
            }
        } else {
            Object.keys(AppState.markers).forEach(key => {
                if (key.startsWith(AppState.currentTest + '-')) {
                    delete AppState.markers[key];
                }
            });
        }
        
        document.querySelectorAll('.edit-canvas').forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
        
        Reports.updateAllReports();
        Reports.updateComparisonCharts();
        Storage.saveState();
    }
};
