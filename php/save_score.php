<?php
	class ScienceDayDB extends SQLite3 {
		function __construct() {
		$this->open("../resources/db/science_days.db");
		}
	}
	
	$data = $_POST['score'];
	$nickname = $data['nickname'];
	$correct = $data['correct'];
	$time = $data['time'];
	$score = $data['score'];

	$db = new ScienceDayDB();
	if(!$db){
		echo $db->lastErrorMsg();
	}
	
	$stmt = $db->prepare('INSERT INTO LEADERBOARD (NAME, CORRECT, TIME, SCORE) VALUES (:nick, :corr, :time, :score);');
	$stmt->bindValue(':nick', $nickname, SQLITE3_TEXT);
	$stmt->bindValue(':corr', $correct, SQLITE3_INTEGER);
	$stmt->bindValue(':time', $time, SQLITE3_INTEGER);
	$stmt->bindValue(':score', $score, SQLITE3_INTEGER);

	$ret = $stmt->execute();
	if(!$ret) {
		echo $db->lastErrorMsg();
	} else {
		echo "Successfully saved\n";
	}

	$db->close();
?>
