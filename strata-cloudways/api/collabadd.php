<?php
require "config.php";

$json = file_get_contents('php://input');
$data = json_decode($json, true); // Decode as an associative array

// Log the raw JSON data for debugging
error_log("Received JSON: " . $json);

// Check for JSON decoding errors
if (json_last_error() !== JSON_ERROR_NONE) {
    error_log("JSON Decode Error: " . json_last_error_msg());
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Retrieve data from the decoded JSON
$reportId = $data['reportId'] ?? '';
$collaborator = $data['collaborator'] ?? '';

// Retrieve user ID from the session
$sharedBy = $_SESSION['user_id'] ?? '';

// Debugging: Log the received data to a file or error log
error_log(print_r($data, true));

// Check for required fields
$missingFields = [];
if (!$reportId) {
    $missingFields[] = 'reportId';
}
if (!$collaborator) {
    $missingFields[] = 'collaborator';
}
if (!$sharedBy) {
    $missingFields[] = 'shared_by (session user ID)';
}

if (!empty($missingFields)) {
    error_log('Missing fields: ' . implode(', ', $missingFields));
    echo json_encode(['error' => 'All fields are required', 'missing' => $missingFields]);
    exit;
}

// Check if the same row already exists
$checkQuery = "SELECT * FROM shared_reports WHERE report_id = ? AND collaborator = ? AND shared_by = ?";
$checkStmt = $mysqli->prepare($checkQuery);

if ($checkStmt) {
    $checkStmt->bind_param("isi", $reportId, $collaborator, $sharedBy);
    $checkStmt->execute();
    $checkStmt->store_result();

    if ($checkStmt->num_rows > 0) {
        // If the row exists, return a success message stating the report was already shared
        echo json_encode(['success' => 'Report was already shared with this user']);
    } else {
        // If the row does not exist, proceed with the insertion
        $query = "INSERT INTO shared_reports (report_id, collaborator, shared_by) VALUES (?, ?, ?)";
        $stmt = $mysqli->prepare($query);

        if ($stmt) {
            $stmt->bind_param("isi", $reportId, $collaborator, $sharedBy);
            if ($stmt->execute()) {
                $sharedReportId = $mysqli->insert_id; // Get the last inserted ID
                echo json_encode(['success' => 'Report shared successfully', 'sharedReportId' => $sharedReportId]);
            } else {
                error_log('MySQL execute error: ' . $stmt->error);
                echo json_encode(['error' => 'Report sharing failed', 'sql_error' => $stmt->error]);
            }
            $stmt->close();
        } else {
            error_log('MySQL prepare error: ' . $mysqli->error);
            echo json_encode(['error' => 'Error preparing statement', 'sql_error' => $mysqli->error]);
        }
    }

    $checkStmt->close();
} else {
    error_log('MySQL prepare error: ' . $mysqli->error);
    echo json_encode(['error' => 'Error preparing check statement', 'sql_error' => $mysqli->error]);
}

$mysqli->close();
?>