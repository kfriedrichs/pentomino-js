<?php
	class ScienceDayDB extends SQLite3 {
		function __construct() {
		$this->open("../resources/db/science_days.db");
		}
	}
	
	$data = $_POST['score'];
	// escape special chars and validate to prevent CSS
	$nickname = trim(htmlspecialchars($data['nickname']));
	$correct = filter_var($data['correct'], FILTER_VALIDATE_INT);
	$time = filter_var($data['time'], FILTER_VALIDATE_INT);
	$score = filter_var($data['score'], FILTER_VALIDATE_INT);
	if ($correct === false || $time === false || $score === false) {
		die('error');
	}

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
