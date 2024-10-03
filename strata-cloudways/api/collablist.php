<?php
require 'config.php';

// Check if email is set in the session
if (!isset($_SESSION['email'])) {
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

$collaboratorEmail = $_SESSION['email'];

// Assuming $mysqli is already created and connected to your database

// Prepare statement to join `units`, `shared_reports`, and `users` tables where collaborator email matches
$query = "
    SELECT units.*, users.fname, users.lname
    FROM units
    JOIN shared_reports ON units.id = shared_reports.report_id
    JOIN users ON shared_reports.shared_by = users.id
    WHERE shared_reports.collaborator = ?
    ORDER BY units.id DESC
";

$stmt = $mysqli->prepare($query);

if ($stmt) {
    // Bind collaborator email parameter
    $stmt->bind_param("s", $collaboratorEmail);

    // Execute query
    if ($stmt->execute()) {
        // Get the result of the query
        $result = $stmt->get_result();

        // Fetch all units as an associative array
        $units = $result->fetch_all(MYSQLI_ASSOC);

        // Check if units were found
        if ($units) {
            echo json_encode(['success' => 'Units retrieved successfully', 'units' => $units]);
        } else {
            echo json_encode(['error' => 'No units found for the provided collaborator']);
        }
    } else {
        // If execution fails
        echo json_encode(['error' => 'Failed to retrieve units']);
    }

    // Close statement
    $stmt->close();
} else {
    // If statement preparation fails
    echo json_encode(['error' => 'Error preparing statement']);
}

// Close database connection
$mysqli->close();
?>