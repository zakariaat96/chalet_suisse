<?php
require_once("../database/db.php");

$email = "maysaraza@example.com";
$plainPassword = "123456";
$hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO users (email, password, is_admin) VALUES (?, ?, ?)");
$stmt->execute([$email, $hashedPassword, 1]);

echo "User inserted successfully.";
?>
