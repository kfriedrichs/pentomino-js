$(document).ready(function() {

	// Leaderboard save location
	var SCORE_FILE = '../resources/leaderboard/leaderboard.json';

	/**
	 * Takes a time in milliseconds and returns a more human-readable string.
	 * @param {time to convert in milliseconds} ms
	 * @return string: given time converted to format m:ss
	 */
	this.prettifyTime = function(ms) {
		let s = Math.floor((ms%60000)/1000);
		s = (s < 10) ? "0" + s : s.toString();
		return `${Math.floor(ms/60000)}:${s}`;
	};
	
	/**
	 * Inserts the user's score into a score array and returns the user's rank.
	 * @param {Array of user score objects. New score is inserted in-place.} scores
	 * @return rank of window.SCORE, counting from 0
	 */
	this.insertUser = function(scores) {
		let user_rank;
		// special case: user on first place
		if (window.SCORE.score > scores[0].score) {
			//TODO: Insert text: YOU MADE A NEW HIGHSCORE!
			user_rank = 0;
			scores.unshift(window.SCORE);
		// user on last place
		} else if (window.SCORE.score < scores[scores.length-1].score) {
			user_rank = scores.length;
			scores.push(window.SCORE);
		} else {
			for (let rank=1; rank<scores.length; rank++) {
				if (window.SCORE.score > scores[rank].score) {
					user_rank = rank;
					scores.splice(rank, 0, window.SCORE);
					break;
				}
			}
		}
		return user_rank;
	}
	
	/**
	 * Renders a table of leading scores.
	 * @param {array of user score objects} scores
	 * @param {rank (counting from 0) that will be  displayed in any case and highlighted} user_rank
	 */
	this.displayLeaderboard = function(scores, user_rank) {
		// empty the table
		$('#leaderboard tbody').html('');
		let top_n; // number of entries in the top leaderboard
		// If user is exactly place 11 (index 10 of array), just add their score at the end
		// of the top 10.
		if (user_rank == 10) {
			top_n = 11;
		} else {
			top_n = Math.min(10, scores.length);
		}
		// display top_n scores
		for (let rank=0; rank<top_n; rank++) {
			let style = '';
			// highlight the user's score
			if (rank == user_rank) { style = 'style="background-color: #f08080;"'; }
			$('#leaderboard tbody').append(`<tr ${style}>
												<td>${rank+1}</td>
												<td>${scores[rank].nickname}</td>
												<td>${scores[rank].correct}/12</td>
												<td>${document.prettifyTime(scores[rank].time)}</td>
												<td>${scores[rank].score}</td>
											</tr>`);
		}
		
		// display the user's score if they are below top 10
		if (user_rank > 10) {
			$('#leaderboard tbody').append(`<tr><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>`);
			$('#leaderboard tbody').append(`<tr style ="background-color: #f08080;";>
											<td>${user_rank+1}</td>
											<td>${scores[user_rank].nickname}</td>
											<td>${scores[user_rank].correct}/12</td>
											<td>${document.prettifyTime(scores[user_rank].time)}</td>
											<td>${scores[user_rank].score}</td>
										</tr>`);
			// add one more empty row unless they are last on the list
			if (user_rank < scores.length-1) {
				$('#leaderboard tbody').append(`<tr><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>`);
			}
		}
	}
	
	/**
	 * Verifies user nickname that is meant to be displayed on the page afterwards.
	 * Only [a-z,A-Z,0-9] and spaces are allowed.
	 * @param {user input to be checked} input
	 */
	function verifyNickname(input) {
		if (input.length == 0) {
			return "Gib einen Spitznamen ein, um dich in die Rangliste einzutragen.";
		} else {
			// We don't want any scripts inserted here, so a strict character policy is applied.
			let allowed = /^[A-Za-z0-9 äöüÄÖÜ]*$/
			if (!input.match(allowed)) {
				return "Der Spitzname darf nur aus den Buchstaben a-z, A-Z, Umlauten und Leerzeichen bestehen."
			}
			return "";
		}
	}
	
	/**
	 * Write the updated scores to SCORE_FILE.
	 */
	function saveScores() {
		// Put the scores pack into an object with the key 'scores' and create a blob of the data
		let file_contents = new Blob([JSON.stringify({'scores': document.sorted_scores}, null, 2)], {type: 'application/json'});
		// Save to file
		let leaderboard_saver_script = '../php/save_leaderboard.php';
		fetch(leaderboard_saver_script, {
			method: 'POST',
			body: file_contents,
		}).then((response) => {
			// if something went wrong, log to console
			let resp_code = response.status;
			if (resp_code < 200 || resp_code >= 300) {
				console.log(`Error: Something went wrong during saving of the leaderboard. Response code: ${resp_code}`);
			}
		})
	}

	
	// get input nickname. Verify for only letters + space
	// save to json, remove Input, display Congrats, Thanks for participating.
	$('#save_score').click(function() {
		// verify the nickname input is non-empty and contains only allowed characters
		let input = $(`#nickname`).val()
		let msg = verifyNickname(input);
		// If the input didn't pass, display the error message
		if (msg) {
			alert(msg);
			return;
		} else if (!document.sorted_scores) {
			// Scores are not loaded yet?
			alert("Irgendetwas ist schiefgegangen. Versuche es in ein paar Sekunden erneut.");
		} else {
			// Insert the nickname and redraw the table
			document.sorted_scores[document.user_rank].nickname = input;
			document.displayLeaderboard(document.sorted_scores, document.user_rank);
			// Save the updated scores
			saveScores();
		}
		
	});
	
	// load the ranking. The scores are already sorted in the JSON file
	// Display the scores in a table, highlighting where the current user would score (using window.SCORE)
	$.ajax({
		url:SCORE_FILE,
		dataType:'json',
		async   : true,
		complete: function(data, msg) {
			let json = data.responseJSON;
			// determine the user's rank and insert the new score
			document.user_rank = document.insertUser(json.scores);
			// Save the scores so we can insert the nickname and save later
			document.sorted_scores = json.scores;
			// display the leaderboard
			document.displayLeaderboard(json.scores, document.user_rank);
		}
	});
});

