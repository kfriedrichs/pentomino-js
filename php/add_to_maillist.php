<?php
	class ScienceDayDB extends SQLite3 {
		function __construct() {
			$this->open("../resources/db/science_days.db");
		}
	}
	
	$email = $_POST['email'];

	$db = new ScienceDayDB();
	if(!$db){
		echo $db->lastErrorMsg();
	}
	
	$stmt = $db->prepare('INSERT INTO MAILLIST (EMAIL) VALUES (:address);');
	$stmt->bindValue(':address', "$email", SQLITE3_TEXT);

	$ret = $stmt->execute();
	if(!$ret) {
		echo $db->lastErrorMsg();
	} else {
		echo "Successfully saved\n";
	}

	$db->close();
?>

