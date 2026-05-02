<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

error_log("save_project.php: Iniciando salvamento de imagens");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$rawInput = file_get_contents('php://input');
error_log("save_project.php: Tamanho do input: " . strlen($rawInput) . " bytes");

$data = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido: ' . json_last_error_msg()]);
    exit;
}

if (!isset($data['projectName']) || !isset($data['images'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Dados incompletos', 'received' => array_keys($data)]);
    exit;
}

$projectName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $data['projectName']);
$projectPath = __DIR__ . '/../projects/' . $projectName;

error_log("save_project.php: Salvando em: " . $projectPath);

// Criar estrutura de pastas
if (!file_exists($projectPath)) {
    if (!mkdir($projectPath, 0777, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Não foi possível criar pasta do projeto']);
        exit;
    }
}

$imagesPath = $projectPath . '/imagens';

if (!file_exists($imagesPath)) {
    mkdir($imagesPath, 0777, true);
}

$imagesSaved = 0;

// Salvar imagens
foreach ($data['images'] as $testNum => $testData) {
    if ($testNum === 'photo' || !is_array($testData)) continue;
    
    $testPath = $imagesPath . '/Teste' . $testNum;
    if (!file_exists($testPath)) {
        mkdir($testPath, 0777, true);
    }
    
    // Salvar foto da amostra se existir
    if (isset($testData['photo']) && is_string($testData['photo'])) {
        $photoData = $testData['photo'];
        if (preg_match('/^data:image\/(\w+);base64,/', $photoData, $type)) {
            $photoData = substr($photoData, strpos($photoData, ',') + 1);
            $photoData = base64_decode($photoData);
            $extension = strtolower($type[1]);
            if ($extension === 'jpeg') $extension = 'jpg';
            file_put_contents($testPath . '/T' . $testNum . '.' . $extension, $photoData);
            $imagesSaved++;
        }
    }
    
    foreach ($testData as $sampleNum => $sampleData) {
        if ($sampleNum === 'photo' || !is_array($sampleData)) continue;
        
        $samplePath = $testPath . '/Amostra' . $sampleNum;
        if (!file_exists($samplePath)) {
            mkdir($samplePath, 0777, true);
        }
        
        foreach ($sampleData as $zoom => $imageData) {
            if (isset($imageData['src']) && is_string($imageData['src'])) {
                $imgData = $imageData['src'];
                if (preg_match('/^data:image\/(\w+);base64,/', $imgData, $type)) {
                    $imgData = substr($imgData, strpos($imgData, ',') + 1);
                    $imgData = base64_decode($imgData);
                    $extension = strtolower($type[1]);
                    if ($extension === 'jpeg') $extension = 'jpg';
                    $filename = 'T' . $testNum . $sampleNum . '-' . $zoom . '.' . $extension;
                    file_put_contents($samplePath . '/' . $filename, $imgData);
                    $imagesSaved++;
                }
            }
        }
    }
}

error_log("save_project.php: Imagens salvas: " . $imagesSaved);

// Salvar info do projeto
$projectInfo = [
    'name' => $projectName,
    'created' => date('Y-m-d H:i:s'),
    'lastModified' => date('Y-m-d H:i:s'),
    'imageCount' => $imagesSaved
];
file_put_contents($projectPath . '/project.json', json_encode($projectInfo, JSON_PRETTY_PRINT));

error_log("save_project.php: Salvamento concluído com sucesso");

echo json_encode([
    'success' => true,
    'projectName' => $projectName,
    'path' => $projectPath,
    'imagesSaved' => $imagesSaved
]);
?>
