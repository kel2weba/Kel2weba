<?php
// Headers untuk CORS dan JSON response
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$host = "localhost";
$db_name = "vehicle_management";
$username = "root";
$password = "Aran3131"; // Sesuaikan dengan password MySQL Anda

// Connect to database
try {
    $pdo = new PDO("mysql:host={$host};dbname={$db_name};charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(array('message' => 'Database connection failed: ' . $e->getMessage()));
    exit();
}

// Get request method dan ID
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;

// Response helper function
function sendResponse($status_code, $data = null, $message = "", $errors = null) {
    http_response_code($status_code);
    $response = array("message" => $message);
    if ($data !== null) {
        $response["data"] = $data;
    }
    if ($errors !== null) {
        $response["errors"] = $errors;
    }
    echo json_encode($response, JSON_PRETTY_PRINT);
    exit();
}

// Sanitize input
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}

// Main routing
switch ($method) {
    case 'GET':
        // ===== GET: Ambil data kendaraan =====

        if (isset($_GET['stats']) && $_GET['stats'] === 'true') {
            // Get statistics
            $sql = "SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available,
                        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold,
                        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance,
                        SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved
                    FROM vehicles";

            try {
                $stmt = $pdo->query($sql);
                $stats = $stmt->fetch();
                sendResponse(200, $stats, "Statistics retrieved successfully");
            } catch (PDOException $e) {
                sendResponse(500, null, "Database error: " . $e->getMessage());
            }
        }
        elseif ($id !== null) {
            // Get single vehicle
            $sql = "SELECT * FROM vehicles WHERE id = ?";

            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute(array($id));
                $vehicle = $stmt->fetch();

                if ($vehicle) {
                    // Convert data types
                    $vehicle['id'] = (int)$vehicle['id'];
                    $vehicle['year'] = (int)$vehicle['year'];
                    $vehicle['price'] = (float)$vehicle['price'];
                    sendResponse(200, $vehicle, "Vehicle found");
                } else {
                    sendResponse(404, null, "Vehicle not found");
                }
            } catch (PDOException $e) {
                sendResponse(500, null, "Database error: " . $e->getMessage());
            }
        }
        else {
            // Get all vehicles with optional filtering
            $sql = "SELECT * FROM vehicles";
            $params = array();

            // Add search filter
            if (isset($_GET['search']) && !empty($_GET['search'])) {
                $search = "%" . sanitizeInput($_GET['search']) . "%";
                $sql .= " WHERE (brand LIKE ? OR model LIKE ? OR license_plate LIKE ? OR color LIKE ?)";
                $params = array($search, $search, $search, $search);
            }
            // Add status filter
            elseif (isset($_GET['status']) && !empty($_GET['status'])) {
                $allowedStatuses = array('available', 'sold', 'maintenance', 'reserved');
                $status = sanitizeInput($_GET['status']);
                if (in_array($status, $allowedStatuses)) {
                    $sql .= " WHERE status = ?";
                    $params = array($status);
                }
            }

            $sql .= " ORDER BY created_at DESC";

            // Add limit
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 100;
            $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
            $sql .= " LIMIT {$limit} OFFSET {$offset}";

            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $vehicles = $stmt->fetchAll();

                // Convert data types
                for ($i = 0; $i < count($vehicles); $i++) {
                    $vehicles[$i]['id'] = (int)$vehicles[$i]['id'];
                    $vehicles[$i]['year'] = (int)$vehicles[$i]['year'];
                    $vehicles[$i]['price'] = (float)$vehicles[$i]['price'];
                }

                sendResponse(200, $vehicles, "Vehicles retrieved successfully");
            } catch (PDOException $e) {
                sendResponse(500, null, "Database error: " . $e->getMessage());
            }
        }
        break;

    case 'POST':
        // ===== POST: Tambah kendaraan baru =====

        $input = file_get_contents("php://input");
        $data = json_decode($input, true);

        if (!$data) {
            sendResponse(400, null, "Invalid JSON data");
        }

        // Validation
        $errors = array();
        if (empty($data['brand'])) {
            $errors[] = "Brand is required";
        }
        if (empty($data['model'])) {
            $errors[] = "Model is required";
        }
        if (empty($data['year'])) {
            $errors[] = "Year is required";
        }
        if (empty($data['license_plate'])) {
            $errors[] = "License plate is required";
        }

        // Validate year
        if (!empty($data['year'])) {
            $year = (int)$data['year'];
            $currentYear = (int)date('Y');
            if ($year < 1900 || $year > ($currentYear + 1)) {
                $errors[] = "Year must be between 1900 and " . ($currentYear + 1);
            }
        }

        // Validate fuel type
        if (isset($data['fuel_type']) && !empty($data['fuel_type'])) {
            $allowedFuelTypes = array('gasoline', 'diesel', 'electric', 'hybrid');
            if (!in_array($data['fuel_type'], $allowedFuelTypes)) {
                $errors[] = "Invalid fuel type";
            }
        }

        // Validate status
        if (isset($data['status']) && !empty($data['status'])) {
            $allowedStatuses = array('available', 'sold', 'maintenance', 'reserved');
            if (!in_array($data['status'], $allowedStatuses)) {
                $errors[] = "Invalid status";
            }
        }

        // Check duplicate license plate
        if (!empty($data['license_plate'])) {
            $sql = "SELECT id FROM vehicles WHERE license_plate = ?";
            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute(array(sanitizeInput($data['license_plate'])));
                if ($stmt->fetch()) {
                    $errors[] = "License plate already exists";
                }
            } catch (PDOException $e) {
                sendResponse(500, null, "Database error: " . $e->getMessage());
            }
        }

        if (count($errors) > 0) {
            sendResponse(400, null, "Validation failed", $errors);
        }

        // Insert new vehicle
        $sql = "INSERT INTO vehicles (brand, model, year, color, license_plate, engine_type, fuel_type, price, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try {
            $stmt = $pdo->prepare($sql);
            $success = $stmt->execute(array(
                sanitizeInput($data['brand']),
                sanitizeInput($data['model']),
                (int)$data['year'],
                isset($data['color']) ? sanitizeInput($data['color']) : '',
                sanitizeInput($data['license_plate']),
                isset($data['engine_type']) ? sanitizeInput($data['engine_type']) : '',
                isset($data['fuel_type']) ? $data['fuel_type'] : 'gasoline',
                isset($data['price']) ? (float)$data['price'] : 0.0,
                isset($data['status']) ? $data['status'] : 'available'
            ));

            if ($success) {
                sendResponse(201, null, "Vehicle created successfully");
            } else {
                sendResponse(500, null, "Unable to create vehicle");
            }
        } catch (PDOException $e) {
            sendResponse(500, null, "Database error: " . $e->getMessage());
        }
        break;

    case 'PUT':
        // ===== PUT: Update kendaraan =====

        if ($id === null) {
            sendResponse(400, null, "Vehicle ID is required for update");
        }

        $input = file_get_contents("php://input");
        $data = json_decode($input, true);

        if (!$data) {
            sendResponse(400, null, "Invalid JSON data");
        }

        // Check if vehicle exists
        $sql = "SELECT * FROM vehicles WHERE id = ?";
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array($id));
            $existing = $stmt->fetch();

            if (!$existing) {
                sendResponse(404, null, "Vehicle not found");
            }
        } catch (PDOException $e) {
            sendResponse(500, null, "Database error: " . $e->getMessage());
        }

        // Validation
        $errors = array();
        if (isset($data['brand']) && empty($data['brand'])) {
            $errors[] = "Brand cannot be empty";
        }
        if (isset($data['model']) && empty($data['model'])) {
            $errors[] = "Model cannot be empty";
        }
        if (isset($data['year']) && empty($data['year'])) {
            $errors[] = "Year cannot be empty";
        }
        if (isset($data['license_plate']) && empty($data['license_plate'])) {
            $errors[] = "License plate cannot be empty";
        }

        // Validate year
        if (isset($data['year']) && !empty($data['year'])) {
            $year = (int)$data['year'];
            $currentYear = (int)date('Y');
            if ($year < 1900 || $year > ($currentYear + 1)) {
                $errors[] = "Year must be between 1900 and " . ($currentYear + 1);
            }
        }

        // Validate fuel type
        if (isset($data['fuel_type']) && !empty($data['fuel_type'])) {
            $allowedFuelTypes = array('gasoline', 'diesel', 'electric', 'hybrid');
            if (!in_array($data['fuel_type'], $allowedFuelTypes)) {
                $errors[] = "Invalid fuel type";
            }
        }

        // Validate status
        if (isset($data['status']) && !empty($data['status'])) {
            $allowedStatuses = array('available', 'sold', 'maintenance', 'reserved');
            if (!in_array($data['status'], $allowedStatuses)) {
                $errors[] = "Invalid status";
            }
        }

        // Check duplicate license plate (exclude current record)
        if (isset($data['license_plate']) && !empty($data['license_plate'])) {
            $sql = "SELECT id FROM vehicles WHERE license_plate = ? AND id != ?";
            try {
                $stmt = $pdo->prepare($sql);
                $stmt->execute(array(sanitizeInput($data['license_plate']), $id));
                if ($stmt->fetch()) {
                    $errors[] = "License plate already exists";
                }
            } catch (PDOException $e) {
                sendResponse(500, null, "Database error: " . $e->getMessage());
            }
        }

        if (count($errors) > 0) {
            sendResponse(400, null, "Validation failed", $errors);
        }

        // Build update query
        $updateFields = array();
        $params = array();

        if (isset($data['brand'])) {
            $updateFields[] = "brand = ?";
            $params[] = sanitizeInput($data['brand']);
        }
        if (isset($data['model'])) {
            $updateFields[] = "model = ?";
            $params[] = sanitizeInput($data['model']);
        }
        if (isset($data['year'])) {
            $updateFields[] = "year = ?";
            $params[] = (int)$data['year'];
        }
        if (isset($data['color'])) {
            $updateFields[] = "color = ?";
            $params[] = sanitizeInput($data['color']);
        }
        if (isset($data['license_plate'])) {
            $updateFields[] = "license_plate = ?";
            $params[] = sanitizeInput($data['license_plate']);
        }
        if (isset($data['engine_type'])) {
            $updateFields[] = "engine_type = ?";
            $params[] = sanitizeInput($data['engine_type']);
        }
        if (isset($data['fuel_type'])) {
            $updateFields[] = "fuel_type = ?";
            $params[] = $data['fuel_type'];
        }
        if (isset($data['price'])) {
            $updateFields[] = "price = ?";
            $params[] = (float)$data['price'];
        }
        if (isset($data['status'])) {
            $updateFields[] = "status = ?";
            $params[] = $data['status'];
        }

        $updateFields[] = "updated_at = CURRENT_TIMESTAMP";
        $params[] = $id;

        $sql = "UPDATE vehicles SET " . implode(", ", $updateFields) . " WHERE id = ?";

        try {
            $stmt = $pdo->prepare($sql);
            $success = $stmt->execute($params);

            if ($success) {
                sendResponse(200, null, "Vehicle updated successfully");
            } else {
                sendResponse(500, null, "Unable to update vehicle");
            }
        } catch (PDOException $e) {
            sendResponse(500, null, "Database error: " . $e->getMessage());
        }
        break;

    case 'DELETE':
        // ===== DELETE: Hapus kendaraan =====

        if ($id === null) {
            sendResponse(400, null, "Vehicle ID is required for deletion");
        }

        // Check if vehicle exists
        $sql = "SELECT id FROM vehicles WHERE id = ?";
        try {
            $stmt = $pdo->prepare($sql);
            $stmt->execute(array($id));

            if (!$stmt->fetch()) {
                sendResponse(404, null, "Vehicle not found");
            }
        } catch (PDOException $e) {
            sendResponse(500, null, "Database error: " . $e->getMessage());
        }

        // Delete vehicle
        $sql = "DELETE FROM vehicles WHERE id = ?";
        try {
            $stmt = $pdo->prepare($sql);
            $success = $stmt->execute(array($id));

            if ($success) {
                sendResponse(200, null, "Vehicle deleted successfully");
            } else {
                sendResponse(500, null, "Unable to delete vehicle");
            }
        } catch (PDOException $e) {
            sendResponse(500, null, "Database error: " . $e->getMessage());
        }
        break;

    default:
        // ===== Method tidak dikenali =====
        sendResponse(405, null, "Method not allowed");
        break;
}
?>