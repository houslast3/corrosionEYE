// Módulo de calibração de régua
const Calibration = {
    toggleCalibrationMode() {
        AppState.calibrationMode = !AppState.calibrationMode;
        const btn = document.getElementById('calibrateBtn');
        const info = document.getElementById('calibrationInfo');
        
        if (AppState.calibrationMode) {
            btn.classList.add('active');
            btn.textContent = '❌ Cancelar Calibração';
            info.textContent = 'Clique em 2 pontos da régua nas imagens 04 ou 05';
            info.classList.add('active');
            AppState.calibrationPoints = [];
            AppState.calibrationTarget = null;
            
            document.querySelectorAll('.editable').forEach(container => {
                container.classList.add('calibration-mode');
            });
        } else {
            btn.classList.remove('active');
            btn.textContent = '📏 Calibrar Régua';
            info.textContent = '';
            info.classList.remove('active');
            AppState.calibrationPoints = [];
            AppState.calibrationTarget = null;
            
            document.querySelectorAll('.editable').forEach(container => {
                container.classList.remove('calibration-mode');
            });
            
            document.querySelectorAll('.calibration-point, .calibration-line').forEach(el => el.remove());
        }
    },

    handleCalibrationClick(e, canvas, zoom, sample, container) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        
        const displayX = e.clientX - rect.left;
        const displayY = e.clientY - rect.top;
        
        AppState.calibrationPoints.push({ x, y, displayX, displayY });
        AppState.calibrationTarget = { zoom, sample, container };
        
        // Mostrar ponto visual
        const point = document.createElement('div');
        point.className = 'calibration-point';
        point.style.left = displayX + 'px';
        point.style.top = displayY + 'px';
        container.appendChild(point);
        
        const info = document.getElementById('calibrationInfo');
        
        if (AppState.calibrationPoints.length === 1) {
            info.textContent = 'Clique no segundo ponto da régua';
        } else if (AppState.calibrationPoints.length === 2) {
            const p1 = AppState.calibrationPoints[0];
            const p2 = AppState.calibrationPoints[1];
            const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
            
            // Mostrar linha
            const line = document.createElement('div');
            line.className = 'calibration-line';
            const angle = Math.atan2(p2.displayY - p1.displayY, p2.displayX - p1.displayX);
            line.style.left = p1.displayX + 'px';
            line.style.top = p1.displayY + 'px';
            line.style.width = Math.sqrt((p2.displayX - p1.displayX) ** 2 + (p2.displayY - p1.displayY) ** 2) + 'px';
            line.style.transform = `rotate(${angle}rad)`;
            line.style.transformOrigin = '0 0';
            container.appendChild(line);
            
            const scaleUm = AppState.scales[zoom];
            const pixelRatio = scaleUm / distance;
            
            // Aplicar calibração para TODAS as amostras do teste no mesmo zoom
            const testData = AppState.images[AppState.currentTest];
            const samples = Object.keys(testData).filter(key => key !== 'photo');
            
            samples.forEach(s => {
                const key = `${AppState.currentTest}-${s}-${zoom}`;
                AppState.pixelRatios[key] = pixelRatio;
            });
            
            info.textContent = `✓ Calibrado para TODAS as amostras: ${distance.toFixed(1)}px = ${scaleUm}µm (${pixelRatio.toFixed(4)}µm/px)`;
            
            setTimeout(() => {
                this.toggleCalibrationMode();
            }, 3000);
        }
    },

    detectRuler(img, zoom, container) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const rulerInfo = this.findRulerLength(imageData, canvas.width, canvas.height);
            
            if (rulerInfo && rulerInfo.length > 0) {
                const scaleUm = AppState.scales[zoom];
                const pixelRatio = scaleUm / rulerInfo.length;
                const key = `${AppState.currentTest}-${container.dataset.sample}-${zoom}`;
                AppState.pixelRatios[key] = pixelRatio;
                AppState.rulerDetections[key] = rulerInfo;
                
                console.log(`Zoom ${zoom}: ${rulerInfo.length}px = ${scaleUm}µm, Ratio: ${pixelRatio.toFixed(4)}µm/px`);
                
                this.showRulerIndicator(container, rulerInfo, scaleUm);
            }
        } catch (e) {
            console.warn('Não foi possível detectar a régua automaticamente', e);
            const key = `${AppState.currentTest}-${container.dataset.sample}-${zoom}`;
            AppState.pixelRatios[key] = AppState.scales[zoom] / 100;
        }
    },

    findRulerLength(imageData, width, height) {
        const startY = Math.floor(height * 0.80);
        const startX = Math.floor(width * 0.60);
        
        for (let y = startY; y < height - 5; y++) {
            let whiteStreak = 0;
            let whiteStart = -1;
            
            for (let x = startX; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = imageData.data[idx];
                const g = imageData.data[idx + 1];
                const b = imageData.data[idx + 2];
                
                const isWhite = r > 200 && g > 200 && b > 200;
                
                if (isWhite) {
                    if (whiteStart === -1) whiteStart = x;
                    whiteStreak++;
                } else if (whiteStreak > 30) {
                    break;
                }
            }
            
            if (whiteStreak > 30) {
                const whiteEnd = whiteStart + whiteStreak;
                const centerY = y;
                
                let rulerStart = -1;
                let rulerEnd = -1;
                
                for (let scanX = whiteStart; scanX < whiteEnd; scanX++) {
                    const scanIdx = (centerY * width + scanX) * 4;
                    const scanR = imageData.data[scanIdx];
                    const scanG = imageData.data[scanIdx + 1];
                    const scanB = imageData.data[scanIdx + 2];
                    
                    const isBlack = scanR < 50 && scanG < 50 && scanB < 50;
                    
                    if (isBlack) {
                        if (rulerStart === -1) {
                            rulerStart = scanX;
                        }
                        rulerEnd = scanX;
                    }
                }
                
                if (rulerStart > 0 && rulerEnd > rulerStart) {
                    const length = rulerEnd - rulerStart;
                    if (length > 20 && length < 600) {
                        return {
                            length: length,
                            startX: rulerStart,
                            endX: rulerEnd,
                            y: centerY,
                            whiteBoxStart: whiteStart,
                            whiteBoxEnd: whiteEnd
                        };
                    }
                }
            }
        }
        
        return null;
    },

    showRulerIndicator(container, rulerInfo, scaleUm) {
        const existingIndicator = container.querySelector('.ruler-indicator');
        if (existingIndicator) existingIndicator.remove();
        
        const existingLabel = container.querySelector('.ruler-label');
        if (existingLabel) existingLabel.remove();
        
        const img = container.querySelector('img');
        if (!img) return;
        
        const indicator = document.createElement('div');
        indicator.className = 'ruler-indicator';
        
        const rect = img.getBoundingClientRect();
        const scaleX = rect.width / img.naturalWidth;
        const scaleY = rect.height / img.naturalHeight;
        
        const left = rulerInfo.startX * scaleX;
        const top = rulerInfo.y * scaleY;
        const width = (rulerInfo.endX - rulerInfo.startX) * scaleX;
        
        indicator.style.left = left + 'px';
        indicator.style.top = top + 'px';
        indicator.style.width = width + 'px';
        indicator.style.height = '2px';
        
        const label = document.createElement('div');
        label.className = 'ruler-label';
        label.textContent = `${rulerInfo.length}px = ${scaleUm}µm`;
        label.style.left = left + 'px';
        label.style.top = (top - 25) + 'px';
        
        container.appendChild(indicator);
        container.appendChild(label);
    }
};
