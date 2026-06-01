<?php
// ── Cabeceras ────────────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

include 'db.php';

$action = $_GET['action'] ?? '';

// ── LOGIN ────────────────────────────────────────────────────
if ($action === 'login') {
    $data = json_decode(file_get_contents('php://input'), true);
    $nombre = trim($data['user'] ?? '');
    $pass   = $data['pass'] ?? '';

    if ($nombre === '' || $pass === '') {
        echo json_encode(['success' => false, 'error' => 'Datos incompletos']); exit;
    }

    $stmt = $pdo->prepare("SELECT id, nombre FROM usuarios WHERE nombre = ? AND password = ?");
    $stmt->execute([$nombre, $pass]);
    $user = $stmt->fetch();

    if ($user) {
        echo json_encode(['success' => true, 'nombre' => $user['nombre']]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Usuario o contraseña incorrectos']);
    }
    exit;
}

// ── REGISTRO ─────────────────────────────────────────────────
if ($action === 'register') {
    $data     = json_decode(file_get_contents('php://input'), true);
    $nombre   = trim($data['nombre']   ?? '');
    $apellidos= trim($data['apellidos']?? '');
    $telefono = trim($data['telefono'] ?? '');
    $correo   = trim($data['correo']   ?? '');
    $password = $data['password']      ?? '';

    if ($nombre === '' || $apellidos === '' || $telefono === '' || $correo === '' || $password === '') {
        echo json_encode(['success' => false, 'error' => 'Todos los campos son obligatorios']); exit;
    }
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'error' => 'Correo electrónico inválido']); exit;
    }
    if (strlen($password) < 4) {
        echo json_encode(['success' => false, 'error' => 'La contraseña debe tener al menos 4 caracteres']); exit;
    }

    try {
        $sql = "INSERT INTO usuarios (nombre, apellidos, telefono, correo, password)
                VALUES (?, ?, ?, ?, ?)";
        $pdo->prepare($sql)->execute([$nombre, $apellidos, $telefono, $correo, $password]);
        echo json_encode(['success' => true, 'nombre' => $nombre]);
    } catch (PDOException $e) {
        // Código 23000 = violación de UNIQUE
        if ($e->getCode() == 23000) {
            echo json_encode(['success' => false, 'error' => 'El nombre de usuario o correo ya está registrado']);
        } else {
            echo json_encode(['success' => false, 'error' => 'Error al registrar usuario']);
        }
    }
    exit;
}

// ── OBTENER EMPLEADOS ────────────────────────────────────────
if ($action === 'get_users') {
    $stmt = $pdo->query("SELECT nombre, apellidos, telefono, correo,
                                DATE_FORMAT(fechaRegistro,'%d/%m/%Y') AS fechaRegistro
                         FROM usuarios ORDER BY id DESC");
    echo json_encode($stmt->fetchAll());
    exit;
}

// ── ELIMINAR EMPLEADO ────────────────────────────────────────
if ($action === 'delete_user') {
    $data = json_decode(file_get_contents('php://input'), true);
    $nombre = $data['nombre'] ?? '';
    if ($nombre === '') { echo json_encode(['success' => false]); exit; }
    $pdo->prepare("DELETE FROM usuarios WHERE nombre = ?")->execute([$nombre]);
    echo json_encode(['success' => true]);
    exit;
}

// ── ENVIAR PEDIDO ────────────────────────────────────────────
if ($action === 'submit_order') {
    $data = json_decode(file_get_contents('php://input'), true);
    $sql  = "INSERT INTO pedidos (numero, mesa, mesero, items, notas, hora, estado, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $pdo->prepare($sql)->execute([
        $data['numero']   ?? '000',
        $data['mesa']     ?? 'General',
        $data['mesero']   ?? 'Anónimo',
        json_encode($data['items'] ?? [], JSON_UNESCAPED_UNICODE),
        $data['notas']    ?? '',
        $data['hora']     ?? date('H:i'),
        $data['estado']   ?? 'pendiente',
        $data['timestamp']?? time() * 1000
    ]);
    $newId = $pdo->lastInsertId();
    echo json_encode(['success' => true, 'id' => $newId]);
    exit;
}

// ── OBTENER PEDIDOS ──────────────────────────────────────────
if ($action === 'get_orders') {
    $estado = $_GET['estado'] ?? null;

    if ($estado === 'despachado') {
        $stmt = $pdo->query("SELECT * FROM pedidos WHERE estado = 'despachado'
                             ORDER BY createdAt DESC LIMIT 50");
    } elseif ($estado === 'activos') {
        $stmt = $pdo->query("SELECT * FROM pedidos WHERE estado != 'despachado'
                             ORDER BY timestamp ASC");
    } else {
        $stmt = $pdo->query("SELECT * FROM pedidos ORDER BY timestamp DESC");
    }

    $orders = $stmt->fetchAll();
    foreach ($orders as &$o) {
        $o['items'] = json_decode($o['items'], true) ?? [];
    }
    echo json_encode($orders);
    exit;
}

// ── ACTUALIZAR ESTADO DE PEDIDO ──────────────────────────────
if ($action === 'update_status') {
    $data        = json_decode(file_get_contents('php://input'), true);
    $id          = intval($data['id']          ?? 0);
    $nuevoEstado = $data['nuevoEstado'] ?? 'pendiente';

    if ($id === 0) { echo json_encode(['success' => false, 'error' => 'ID inválido']); exit; }

    $extra = '';
    $params = [$nuevoEstado, $id];

    // Si se despacha, guardar hora de despacho
    if ($nuevoEstado === 'despachado') {
        $extra = ', horaDespacho = ?';
        array_splice($params, 1, 0, [date('H:i')]);
    }

    $pdo->prepare("UPDATE pedidos SET estado = ? $extra WHERE id = ?")->execute($params);
    echo json_encode(['success' => true]);
    exit;
}

// ── ESTADÍSTICAS PARA ADMIN ──────────────────────────────────
if ($action === 'get_stats') {
    $completados = $pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado = 'despachado'")->fetchColumn();
    $activos     = $pdo->query("SELECT COUNT(*) FROM pedidos WHERE estado != 'despachado'")->fetchColumn();
    $empleados   = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();

    // Ingresos totales (de pedidos despachados)
    $stmt = $pdo->query("SELECT items FROM pedidos WHERE estado = 'despachado'");
    $ingresos = 0;
    foreach ($stmt->fetchAll() as $row) {
        $items = json_decode($row['items'], true) ?? [];
        foreach ($items as $item) {
            $precio   = $item['precio'] ?? $item['p'] ?? 0;
            $cantidad = $item['qty']    ?? $item['cantidad'] ?? 1;
            $ingresos += $precio * $cantidad;
        }
    }
    $promedio = $completados > 0 ? round($ingresos / $completados) : 0;

    echo json_encode([
        'completados' => (int)$completados,
        'activos'     => (int)$activos,
        'empleados'   => (int)$empleados,
        'ingresos'    => $ingresos,
        'promedio'    => $promedio,
    ]);
    exit;
}

// ── LIMPIAR PEDIDOS ──────────────────────────────────────────
if ($action === 'clear_orders') {
    $pdo->exec("DELETE FROM pedidos");
    echo json_encode(['success' => true]);
    exit;
}

// ── REINICIAR TODO ───────────────────────────────────────────
if ($action === 'clear_all') {
    $pdo->exec("DELETE FROM pedidos");
    $pdo->exec("DELETE FROM usuarios WHERE nombre != 'admin'");
    echo json_encode(['success' => true]);
    exit;
}

// ── ACCIÓN NO ENCONTRADA ─────────────────────────────────────
http_response_code(400);
echo json_encode(['success' => false, 'error' => "Acción '$action' no reconocida"]);
?>