<?php
	class ScienceDayDB extends SQLite3 {
		function __construct() {
		$this->open("../resources/db/science_days.db");
		}
	}
	
	// escape special chars and validate to prevent CSS
	$name	= trim(htmlspecialchars($_POST['name']));
	$email	= trim(htmlspecialchars($_POST['email']));
	$email	= filter_var($email, FILTER_VALIDATE_EMAIL);
	$id		= filter_var($_POST['id'], FILTER_VALIDATE_INT);
	if ($email === false || $id === false) {
		exit("1");
	}
	
	$db = new ScienceDayDB();
	if(!$db){
		exit("2");
	}
	
	$stmt = $db->prepare('INSERT INTO PARTICIPANTS (ID, NAME, EMAIL) VALUES (:i, :n, :e);');
	$stmt->bindValue(':i', $id, SQLITE3_INTEGER);
	$stmt->bindValue(':n', $name, SQLITE3_TEXT);
	$stmt->bindValue(':e', $email, SQLITE3_TEXT);

	$ret = $stmt->execute();
	if(!$ret) {
		$db->close();
		exit("2");
	} else {
		$db->close();
		exit("0");
	}
?>

