<?php

header("Content-Type: application/json");
$data = file_get_contents("php://input");

if (!empty($data)) {
	$fname = "leaderboard.json";
	$file = fopen("../resources/leaderboard/" .$fname, 'w');
	fwrite($file, $data);
	fclose($file);
}
?>

