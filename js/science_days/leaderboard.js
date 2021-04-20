$(document).ready(function() {

	/**
	 * Load the ranking and display the scores in a table, highlighting where the current user would score (using window.SCORE).
	 */
	this.loadLeaderboard = function() {
		let leaderboard_loader_script = '../php/load_leaderboard.php';
		$.ajax({
			method: 'POST',
			url: leaderboard_loader_script,
		}).done(function( response ) {
			if (response == 'error') {
				// display user as only table entry
				document.displayLeaderboard([], 0);
			} else {
				// scores are already sorted in the response
				let scores = JSON.parse(response);
				let user_rank = document.getUserRank(scores);
				
				// Congratulation
				if (user_rank == 0) {
					$('#congrats').css('display', 'inline');
				} else {
					$('#congrats').css('display', 'none');
				}
				
				document.displayLeaderboard(scores, user_rank);
			}
		});
	}
	
	/**
	 * Returns the user's rank in the leaderboard
	 * @param {Array of user score objects} scores
	 * @return rank of window.SCORE, counting from 0
	 */
	this.getUserRank = function(scores) {
		for (let rank = 0; rank<scores.length; rank++) {
			if (window.SCORE.score > scores[rank].SCORE) {
				return rank;
			}
		}
		// user made last place
		return scores.length;
	}
	
	/**
	 * Renders a table of leading scores.
	 * @param {array of user score objects} scores
	 * @param {rank (counting from 0) that will be  displayed in any case and highlighted} user_rank
	 */
	this.displayLeaderboard = function(scores, user_rank) {
		// empty the table
		$('#leaderboard tbody').html('');
		let top_n = Math.min(10, scores.length); // number of entries in the top leaderboard
		// If user is exactly place 11 (index 10 of array), just add their score at the end
		// of the top 10.

		// display top_n scores
		let rank_offset = 1
		let inserted = false;
		for (let rank=0; rank<top_n; rank++) {
			// highlight the user's score
			if (rank == user_rank) {
				$('#leaderboard tbody').append(_createUserTableRow(user_rank));
				rank_offset = 2; // from now on, all other ranks need to be incremented by 2
				inserted = true;
			}
			// if the user entry was inserted, we need to skip the last entry to not
			// display more than top_n entries
			if (inserted && rank == top_n-1) { break; }
			$('#leaderboard tbody').append(`<tr>
												<td>${rank+rank_offset}</td>
												<td>${scores[rank].NAME}</td>
												<td>${scores[rank].CORRECT}/12</td>
												<td>${document.prettifyTime(scores[rank].TIME)}</td>
												<td>${scores[rank].SCORE}</td>
											</tr>`);
		}
		
		if (user_rank == top_n) { // user's score is directly at the end of the table
			$('#leaderboard tbody').append(_createUserTableRow(user_rank));
		} else if (user_rank > top_n) { // display the user's score if they are below top 10
			$('#leaderboard tbody').append(`<tr><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>`);
			$('#leaderboard tbody').append(_createUserTableRow(user_rank));
			// add one more empty row unless they are last on the list
			if (user_rank < scores.length-1) {
				$('#leaderboard tbody').append(`<tr><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>`);
			}
		}
	}

	/**
	 * Takes a time in milliseconds and returns a more human-readable string.
	 * @param {time to convert in milliseconds} ms
	 * @return string: given time converted to format m:ss
	 */
	this.prettifyTime = function(ms) {
		let s = Math.floor((ms%60000)/1000);
		s = (s < 10) ? '0' + s : s.toString();
		return `${Math.floor(ms/60000)}:${s}`;
	};
	
	/**
	 * Returns the html for a highlighted table row displaying the user's score.
	 * @param {user rank} rank
	 * @return html for <tr> element with 5 columns
	 */
	function _createUserTableRow(rank) {
		return `<tr style ="background-color: #f08080;">
					<td>${rank+1}</td>
					<td>${window.SCORE.nickname}</td>
					<td>${window.SCORE.correct}/12</td>
					<td>${document.prettifyTime(window.SCORE.time)}</td>
					<td>${window.SCORE.score}</td>
				</tr>`;
	}
	
	/**
	 * Verifies user nickname that is meant to be displayed on the page afterwards.
	 * Only [a-z,A-Z,0-9] and spaces are allowed.
	 * @param {user input to be checked} input
	 */
	function verifyNickname(input) {
		if (input.length == 0) {
			return 'Gib einen Spitznamen ein, um dich in die Rangliste einzutragen.';
		} else {
			// We don't want any scripts inserted here, so a strict character policy is applied.
			let allowed = /^[A-Za-z0-9 äöüÄÖÜ]*$/
			if (!input.match(allowed)) {
				return 'Der Spitzname darf nur aus den Buchstaben a-z, A-Z, Umlauten und Leerzeichen bestehen.'
			}
			return '';
		}
	}
	
	/**
	 * Save the user's score
	 */
	function saveScore() {
		// Save to file
		let leaderboard_saver_script = '../php/save_score.php';
		$.ajax({
			method: 'POST',
			url: leaderboard_saver_script,
			data: { score: window.SCORE }
		}).done(function( response ) {
			console.log(response);
		});
	}

	//TODO: You can't save multiple TIMES!
	// get input nickname. Verify for only letters + space
	// save to database, remove Input, display Congrats, Thanks for participating.
	$('#save_score').click(function() {
		// verify the nickname input is non-empty and contains only allowed characters
		let input = $(`#nickname`).val()
		let msg = verifyNickname(input);
		// If the input didn't pass, display the error message
		if (msg) {
			alert(msg);
			return;
		} else {
			// Change the nickname, redraw the table save the score
			window.SCORE.nickname = input;
			document.loadLeaderboard();
			saveScore();
			// remove the input so that a score can't be saved multiple times
			$('#leaderboard_input').css('display', 'none');
		}
		
	});
	
	// --- Start ---
	this.loadLeaderboard();
	
});

