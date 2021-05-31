$(function(){
	// randomly assign a design number in interval 1-10
	window.PARTICIPANT = Math.ceil(Math.random()*10);
	
	
	// Warning: Should find a better solution for the future here: a timestamp id
	// is used to match personal information and collected data. The id is saved
	// with the collected data, but the file name is a different timestamp
	// (might be confusing).
	/** Register a participant of the study by saving name and email.
	 * Sets window.ID and loads the study at success.
	 * @param {participant name} name
	 * @param {participant email address} email
	 */
	function registerParticipant(name, email) {
		let id = Date.now();
		let register_script = '../php/register_participant.php';
		$.ajax({
			method: 'POST',
			url: register_script,
			data: { name: name, email: email, id: id }
		}).done(function( response ) {
			if (response == "1") { // invalid input
				alert('Bitte gib eine gültige E-Mail-Adresse ein, wenn du an der Studie teilnehmen möchtest.');
				$('#email').css('borderColor', 'red');
			} else if (response == "0"){
				// id is a time stamp
				window.ID = id;
				$('#includedContent').load('pento_ui.html');
			} else { // 2 or unknown response: database / internal error?
				alert('Es scheint etwas schiefgegangen zu sein. Versuche es nochmal oder wähle den Demo-Modus.');
			}
		});
	}

	// --- Pop-ups ---
	// open a popup element
	document.open_popup = function(popup) {
		popup.showModal();
		}

	var welcome				= document.getElementById('welcome');
	var privacy_study		= document.getElementById('privacy_study');

	// polyfill is used to help with browsers without native support for 'dialog'
	dialogPolyfill.registerDialog(welcome);
	dialogPolyfill.registerDialog(privacy_study);

	// --- Button functions ---

	// move on to audiotest
	$('#welcome_done').click(function() {
		welcome.close();

		// Check for mobile browsers
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
			alert("Diese Studie kann nicht auf mobilen Endgeräten durchgeführt werden. Bitte versuche es auf einem Computer.");
		}

		// Check for browser
		if(! /Firefox|Chrome|Safari|Opera/i.test(navigator.userAgent) ) {
			alert("Diese Studie funktioniert am besten mit Firefox oder Chrome. Wenn möglich, verwende einen dieser Browser.");
		}
	});
	
	$('#open_privacy_study').click(function() { document.open_popup(privacy_study); });
	$('#close_privacy_study').click(function() { privacy_study.close(); });

	$('#load_demo').click(function() {
		window.DEMO = true;
		// uncomment these two lines instead of loading pento_ui for debugging purposes:
		// jump straight to the leaderboard with a dummy score
//		window.SCORE = {'nickname': 'DU', 'correct':0, 'time':0, 'score':0};
//		$('#includedContent').load('leaderboard.html');
		$('#includedContent').load('pento_ui.html');
	});

	$('#load_study').click(function() {
		let sonaId = $('#sonaId')[0];
		let name = $('#name').val();
		// only one of them is used
		let email = $('#email').val();
		
		if (!$('#consent_agree').is(':checked')) {
			alert('Bitte bestätige deine Einwilligung zur Teilnahme an der Studie.');
		} else if (sonaId) {
			if (!sonaId.checkValidity()) {
				alert('Bitte gib eine gültige Sona-ID ein.');
				$('#sonaId').css('borderColor', 'red');
			} else {
				window.MINOR = $('#minor').is(':checked');
				window.DEMO = false;
				// Use the sona Id as file name and load the game
				window.ID = sonaId.value;
				$('#includedContent').load('pento_ui.html');
			}
		} else {
			// email regex copied from https://www.w3resource.com/javascript/form/email-validation.php
			let allowed = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/
			if (name == "") {
				alert('Bitte gib deinen Namen ein.');
				$('#name').css('borderColor', 'red');
			} else if (email && (email == "" || !email.match(allowed))) {
				alert('Bitte gib eine gültige E-Mail-Adresse ein.');
				$('#email').css('borderColor', 'red');
			} else {
				window.MINOR = $('#minor').is(':checked');
				window.DEMO = false;
				// try registering the given name and email, php makes additional checks
				registerParticipant(name, email);
			}
		}
	});

	// --- Start ---

	document.open_popup(welcome);
});
