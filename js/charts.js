// Módulo de gráficos
const Charts = {
    drawUnifiedChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = 500;
        
        ctx.clearRect(0, 0, width, height);
        
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Análise Comparativa - Todas as Métricas', width / 2, 30);
        
        if (data.points.every(d => d == 0)) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.fillText('Sem dados para exibir', width / 2, height / 2);
            return;
        }
        
        const padding = 80;
        const chartHeight = height - padding - 100;
        const chartWidth = width - padding * 2;
        const numSamples = data.labels.length;
        const groupWidth = chartWidth / numSamples;
        const barWidth = groupWidth / 6;
        
        const maxPoints = Math.max(...data.points);
        const maxDiameter = Math.max(...data.diameters.map(d => parseFloat(d)));
        const maxDepth = Math.max(...data.depths.map(d => parseFloat(d)));
        const maxCircular = Math.max(...data.circular);
        const maxIrregular = Math.max(...data.irregular);
        
        const normalize = (value, max) => max > 0 ? (value / max) * 100 : 0;
        
        // Eixos
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - 100);
        ctx.lineTo(width - padding, height - 100);
        ctx.stroke();
        
        // Linhas de grade
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
            
            ctx.fillStyle = '#888';
            ctx.font = '11px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`${100 - i * 20}%`, padding - 10, y + 4);
        }
        
        // Desenhar barras
        data.labels.forEach((label, sampleIndex) => {
            const groupX = padding + groupWidth * sampleIndex;
            const centerX = groupX + groupWidth / 2;
            
            const normalizedPoints = normalize(data.points[sampleIndex], maxPoints);
            const normalizedDiameter = normalize(parseFloat(data.diameters[sampleIndex]), maxDiameter);
            const normalizedDepth = normalize(parseFloat(data.depths[sampleIndex]), maxDepth);
            const normalizedCircular = normalize(data.circular[sampleIndex], maxCircular);
            const normalizedIrregular = normalize(data.irregular[sampleIndex], maxIrregular);
            
            const bars = [
                { value: normalizedPoints, color: '#4a9eff', label: data.points[sampleIndex] },
                { value: normalizedDiameter, color: '#00ff88', label: data.diameters[sampleIndex] },
                { value: normalizedDepth, color: '#ff6b6b', label: data.depths[sampleIndex] },
                { value: normalizedCircular, color: '#9c27b0', label: data.circular[sampleIndex] },
                { value: normalizedIrregular, color: '#ff9800', label: data.irregular[sampleIndex] }
            ];
            
            bars.forEach((bar, barIndex) => {
                const barHeight = (bar.value / 100) * chartHeight;
                const x = centerX - (barWidth * 2.5) + barWidth * barIndex;
                const y = height - 100 - barHeight;
                
                ctx.fillStyle = bar.color;
                ctx.fillRect(x, y, barWidth, barHeight);
                
                if (bar.label > 0) {
                    ctx.fillStyle = '#e0e0e0';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(bar.label, x + barWidth / 2, y - 3);
                }
            });
            
            ctx.fillStyle = '#e0e0e0';
            ctx.font = '13px Arial';
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(centerX, height - 80);
            ctx.rotate(-Math.PI / 6);
            ctx.fillText(label, 0, 0);
            ctx.restore();
        });
        
        // Legenda
        const legendX = padding;
        const legendY = height - 60;
        const legendItems = [
            { color: '#4a9eff', label: `Pontos (max: ${maxPoints})` },
            { color: '#00ff88', label: `Diâmetro µm (max: ${maxDiameter.toFixed(1)})` },
            { color: '#ff6b6b', label: `Profund. µm (max: ${maxDepth.toFixed(2)})` },
            { color: '#9c27b0', label: `Circular (max: ${maxCircular})` },
            { color: '#ff9800', label: `Irregular (max: ${maxIrregular})` }
        ];
        
        const legendItemWidth = (width - padding * 2) / legendItems.length;
        
        legendItems.forEach((item, index) => {
            const x = legendX + legendItemWidth * index;
            
            ctx.fillStyle = item.color;
            ctx.fillRect(x, legendY, 15, 15);
            
            ctx.fillStyle = '#e0e0e0';
            ctx.font = '11px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, x + 20, legendY + 12);
        });
        
        ctx.fillStyle = '#888';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('* Valores normalizados para escala 0-100% baseado no máximo de cada métrica', width / 2, height - 10);
    }
};
