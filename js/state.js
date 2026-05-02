// Estado global da aplicação
const AppState = {
    images: {},
    currentTest: null,
    currentSample: null,
    tool: 'pen',
    corrosionType: 'circular',
    penSize: 10,
    depth: 0,
    opacity: 60,
    scales: {
        '01': 500,
        '02': 100,
        '03': 100,
        '04': 50,
        '05': 10
    },
    markers: {},
    pixelRatios: {},
    rulerDetections: {},
    calibrationMode: false,
    calibrationPoints: [],
    calibrationTarget: null,
    isDrawing: false,
    drawStart: null,
    hoveredMarker: null,
    editingMarker: null
};
