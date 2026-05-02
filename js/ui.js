// Módulo de interface do usuário
const UI = {
    updateTestSelector() {
        const testSelect = document.getElementById('testSelect');
        testSelect.innerHTML = '<option value="">Selecione um teste</option>';
        
        Object.keys(AppState.images).sort().forEach(test => {
            const option = document.createElement('option');
            option.value = test;
            option.textContent = `Teste ${test}`;
            testSelect.appendChild(option);
        });
    },

    updateSampleSelector() {
        const sampleSelect = document.getElementById('sampleSelect');
        sampleSelect.innerHTML = '<option value="">Selecione uma amostra</option>';
        
        if (AppState.currentTest && AppState.images[AppState.currentTest]) {
            Object.keys(AppState.images[AppState.currentTest])
                .filter(key => key !== 'photo')
                .sort()
                .forEach(sample => {
                    const option = document.createElement('option');
                    option.value = sample;
                    option.textContent = `Amostra ${sample}`;
                    sampleSelect.appendChild(option);
                });
        }
    },

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const btn = document.getElementById('toggleSidebar');
        const mainContent = document.querySelector('.main-content');
        
        sidebar.classList.toggle('collapsed');
        btn.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
        
        if (sidebar.classList.contains('collapsed')) {
            mainContent.classList.add('sidebar-hidden');
            btn.style.right = '0';
        } else {
            mainContent.classList.remove('sidebar-hidden');
            btn.style.right = '370px';
        }
    },

    clearDisplay() {
        document.getElementById('samplesContainer').innerHTML = '';
        document.getElementById('comparisonSection').classList.remove('active');
    }
};
