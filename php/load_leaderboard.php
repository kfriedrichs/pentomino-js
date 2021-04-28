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
	
	$sql =<<<EOF
	SELECT NAME, CORRECT, TIME, SCORE FROM LEADERBOARD ORDER BY SCORE DESC;
	EOF;
	
	$ret = $db->query($sql);
	if ($ret->numColumns() && $ret->columnType(0) != SQLITE3_NULL) {
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

