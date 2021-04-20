<?php
	class LeaderboardDB extends SQLite3 {
		function __construct() {
		$this->open("../resources/leaderboard/leaderboard.db");
		}
	}
	
	$data = $_POST['score'];
	$nickname = $data['nickname'];
	$correct = $data['correct'];
	$time = $data['time'];
	$score = $data['score'];

	$db = new LeaderboardDB();
	if(!$db){
		echo $db->lastErrorMsg();
	}
	
	$sql =<<<EOF
	INSERT INTO LEADERBOARD (NAME, CORRECT, TIME, SCORE) VALUES ("$nickname", $correct, $time, $score);
	EOF;
	
	$ret = $db->exec($sql);
	if(!$ret) {
		echo $db->lastErrorMsg();
	} else {
		echo "Successfully saved\n";
	}

	$db->close();
?>
