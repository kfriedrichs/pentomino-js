<?php
header("Content-Type: application/json");
$data = file_get_contents("php://input");

if (!empty($data)) {
	$fname = mktime() . ".json";
	$file = fopen("../resources/data_collection/" .$fname, 'w');
	fwrite($file, $data);
	fclose($file);
}
?>
