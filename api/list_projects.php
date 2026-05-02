<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$projectsPath = __DIR__ . '/../projects';

if (!file_exists($projectsPath)) {
    mkdir($projectsPath, 0777, true);
}

$projects = [];
$dirs = scandir($projectsPath);

foreach ($dirs as $dir) {
    if ($dir === '.' || $dir === '..') continue;
    
    $projectPath = $projectsPath . '/' . $dir;
    if (is_dir($projectPath)) {
        $projectInfoFile = $projectPath . '/project.json';
        
        if (file_exists($projectInfoFile)) {
            $info = json_decode(file_get_contents($projectInfoFile), true);
            $projects[] = [
                'name' => $dir,
                'displayName' => $info['name'] ?? $dir,
                'created' => $info['created'] ?? 'Desconhecido',
                'lastModified' => $info['lastModified'] ?? 'Desconhecido',
                'path' => $dir
            ];
        } else {
            $projects[] = [
                'name' => $dir,
                'displayName' => $dir,
                'created' => date('Y-m-d H:i:s', filemtime($projectPath)),
                'lastModified' => date('Y-m-d H:i:s', filemtime($projectPath)),
                'path' => $dir
            ];
        }
    }
}

// Ordenar por última modificação (mais recente primeiro)
usort($projects, function($a, $b) {
    return strtotime($b['lastModified']) - strtotime($a['lastModified']);
});

echo json_encode([
    'success' => true,
    'projects' => $projects
]);
?>
