$(function(){
	// randomly assign a design number in interval 1-25
	window.PARTICIPANT = Math.ceil(Math.random()*25);

	// --- Pop-ups ---
	// open a popup element
	document.open_popup = function(popup) {
		popup.showModal();
		}

	var welcome				= document.getElementById('welcome');

	// polyfill is used to help with browsers without native support for 'dialog'
	dialogPolyfill.registerDialog(welcome);

	// --- Button functions ---

	// move on to audiotest
	$('#welcome_done').click(function() {
		welcome.close();

		// Check for mobile browsers
		if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
			alert("Diese Studie kann nicht auf mobilen Endgeräten durchgeführt werden. Bitte versuche es auf einem Computer.");
		}

		// Check for Firefox or Chrome
		//TODO: Opera?
		if(! /Firefox|Chrome/i.test(navigator.userAgent) ) {
			alert("Diese Studie funktioniert am besten mit Firefox oder Chrome. Wenn möglich, verwende einen dieser Browser.");
		}
	});

	$('#load_demo').click(function() {
		window.DEMO = true;
		$('#includedContent').load('pento_ui.html');
	});

	$('#load_study').click(function() {
		window.NAME = $('#name').val();
		window.EMAIL = $('#email').val();
		window.MINOR = $('#minor').is(':checked');
		if (window.NAME == "") {
			alert('Bitte gib deinen Namen ein, wenn du an der Studie teilnehmen möchtest.');
			$('#name').css('borderColor', 'red');
		} else if (window.EMAIL == "") {
			alert('Bitte gib deine E-Mail-Adresse ein, wenn du an der Studie teilnehmen möchtest.');
			$('#email').css('borderColor', 'red');
		} else if (!$('#consent_agree').is(':checked')) {
			alert('Bitte bestätige deine Einwilligung zur Teilnahme an der Studie.');
		} else {
			window.DEMO = false;
			$('#includedContent').load('pento_ui.html');
		}
	});

	// --- Start ---

	document.open_popup(welcome);
});
