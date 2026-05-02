<?php
// Aumentar limites de memória e tempo
ini_set('memory_limit', '512M');
ini_set('max_execution_time', '300');
set_time_limit(300);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

error_log("load_project.php: Iniciando carregamento de imagens");

if (!isset($_GET['project'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Nome do projeto não fornecido']);
    exit;
}

$projectName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $_GET['project']);
$projectPath = __DIR__ . '/../projects/' . $projectName;

error_log("load_project.php: Carregando de: " . $projectPath);

if (!file_exists($projectPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Projeto não encontrado: ' . $projectName]);
    exit;
}

// Carregar info do projeto
$projectInfo = [];
if (file_exists($projectPath . '/project.json')) {
    $projectInfo = json_decode(file_get_contents($projectPath . '/project.json'), true);
}

// Carregar imagens
$images = [];
$imagesPath = $projectPath . '/imagens';
$imageCount = 0;
$totalSize = 0;

if (file_exists($imagesPath)) {
    $tests = scandir($imagesPath);
    
    foreach ($tests as $test) {
        if ($test === '.' || $test === '..') continue;
        
        $testPath = $imagesPath . '/' . $test;
        if (!is_dir($testPath)) continue;
        
        // Extrair número do teste
        preg_match('/Teste(\d+)/', $test, $matches);
        $testNum = $matches[1] ?? $test;
        
        $images[$testNum] = [];
        
        // Verificar foto da amostra
        $photoFiles = glob($testPath . '/T' . $testNum . '.*');
        if (!empty($photoFiles)) {
            $photoFile = $photoFiles[0];
            $fileSize = filesize($photoFile);
            $totalSize += $fileSize;
            
            $photoData = base64_encode(file_get_contents($photoFile));
            $extension = pathinfo($photoFile, PATHINFO_EXTENSION);
            $images[$testNum]['photo'] = 'data:image/' . $extension . ';base64,' . $photoData;
            $imageCount++;
            
            error_log("Carregada foto teste $testNum: " . number_format($fileSize / 1024, 2) . " KB");
        }
        
        // Carregar amostras
        $samples = scandir($testPath);
        foreach ($samples as $sample) {
            if ($sample === '.' || $sample === '..' || !is_dir($testPath . '/' . $sample)) continue;
            
            preg_match('/Amostra(\d+)/', $sample, $matches);
            $sampleNum = $matches[1] ?? $sample;
            
            $images[$testNum][$sampleNum] = [];
            
            $samplePath = $testPath . '/' . $sample;
            $imageFiles = scandir($samplePath);
            
            foreach ($imageFiles as $imageFile) {
                if ($imageFile === '.' || $imageFile === '..') continue;
                
                // Extrair zoom
                preg_match('/-(\d{2})\./', $imageFile, $matches);
                $zoom = $matches[1] ?? null;
                
                if ($zoom) {
                    $imagePath = $samplePath . '/' . $imageFile;
                    $fileSize = filesize($imagePath);
                    $totalSize += $fileSize;
                    
                    $imageData = base64_encode(file_get_contents($imagePath));
                    $extension = pathinfo($imageFile, PATHINFO_EXTENSION);
                    
                    $images[$testNum][$sampleNum][$zoom] = [
                        'src' => 'data:image/' . $extension . ';base64,' . $imageData,
                        'filename' => $imageFile
                    ];
                    $imageCount++;
                }
            }
        }
    }
}

error_log("load_project.php: Imagens carregadas: " . $imageCount);
error_log("load_project.php: Tamanho total: " . number_format($totalSize / 1024 / 1024, 2) . " MB");

$response = [
    'success' => true,
    'projectName' => $projectName,
    'projectInfo' => $projectInfo,
    'images' => $images,
    'imageCount' => $imageCount,
    'totalSizeMB' => round($totalSize / 1024 / 1024, 2)
];

// Tentar enviar a resposta
$jsonResponse = json_encode($response);

if ($jsonResponse === false) {
    error_log("load_project.php: ERRO ao codificar JSON: " . json_last_error_msg());
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao codificar resposta: ' . json_last_error_msg()]);
    exit;
}

error_log("load_project.php: Tamanho da resposta JSON: " . number_format(strlen($jsonResponse) / 1024 / 1024, 2) . " MB");

echo $jsonResponse;
?>
