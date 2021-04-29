<?php
	class ScienceDayDB extends SQLite3 {
		function __construct() {
		$this->open("../resources/db/science_days.db");
		}
	}

	$db = new ScienceDayDB();
	if(!$db){
		die("error");
	}
	
	$ret = $db->query("SELECT NAME, CORRECT, TIME, SCORE FROM LEADERBOARD ORDER BY SCORE DESC;");

	if ($ret->numColumns()) {
		// not empty
		$rows = array();
		while($row = $ret->fetchArray(SQLITE3_ASSOC)) {
			$rows[] = $row;
		}
		$jsonData = json_encode($rows);
		// return a json array
		echo $jsonData;
	} else {
		die("error");
	}

	$db->close();
?>

