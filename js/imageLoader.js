// Módulo de carregamento de imagens
const ImageLoader = {
    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        let processed = 0;
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const filename = file.name;
                const parsed = this.parseFilename(filename);
                
                if (parsed) {
                    if (!AppState.images[parsed.test]) {
                        AppState.images[parsed.test] = {};
                    }
                    if (!AppState.images[parsed.test][parsed.sample]) {
                        AppState.images[parsed.test][parsed.sample] = {};
                    }
                    
                    AppState.images[parsed.test][parsed.sample][parsed.zoom] = {
                        src: event.target.result,
                        filename: filename
                    };
                } else if (filename.match(/^T\d+\.(jpg|jpeg|png|gif)$/i)) {
                    const testNum = filename.match(/T(\d+)/)[1];
                    if (!AppState.images[testNum]) {
                        AppState.images[testNum] = {};
                    }
                    AppState.images[testNum].photo = event.target.result;
                }
                
                processed++;
                if (processed === files.length) {
                    setTimeout(() => UI.updateTestSelector(), 100);
                }
            };
            reader.readAsDataURL(file);
        });
    },

    parseFilename(filename) {
        const match = filename.match(/T(\d)(\d)\s*-\s*(\d{2})/i);
        if (match) {
            return {
                test: match[1],
                sample: match[2],
                zoom: match[3]
            };
        }
        return null;
    }
};
