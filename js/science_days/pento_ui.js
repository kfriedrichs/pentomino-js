$(document).ready(function() {
	// --- Boards ---
	var WITH_GRID				= false;
	var SELECTION_BOARD_NAME	= 'selection_board';
	var TASK_BOARD_NAME			= 'task_board';
	var elephant_c 				= 0; // number of current elephant pic
	var START_QUEST 			= true; // Whether to use the introduction/example dialog for the first task
	// DEMO mode skips all the questionnaires. No data is collected
	if (!window.DEMO) {
		window.DEMO				= false;
	}

	var FILES					= ['../resources/tasks/start.json',
								   '../resources/tasks/z.json',
								   '../resources/tasks/l.json',
								   '../resources/tasks/n.json',
								   '../resources/tasks/v.json',
								   '../resources/tasks/t.json',
								   '../resources/tasks/y.json',
								   '../resources/tasks/w.json',
								   '../resources/tasks/x.json',
								   '../resources/tasks/f.json',
								   '../resources/tasks/u.json',
								   '../resources/tasks/p.json',
								   '../resources/tasks/i.json']

	var current_file = 0; // increment as tasks are loaded

	let selboard_size_str = $(`#${SELECTION_BOARD_NAME}`).css('width');
	let selboard_size = Number(selboard_size_str.slice(0, selboard_size_str.length-2));
	this.selection_board = new document.PentoSelectionBoard(`#${SELECTION_BOARD_NAME}`, SELECTION_BOARD_NAME, WITH_GRID, new document.PentoConfig(board_size=selboard_size));

	// Board which is automatically filled as pieces are selected
	let taskboard_size_str = $(`#${TASK_BOARD_NAME}`).css('width');
	let taskboard_size = Number(taskboard_size_str.slice(0, taskboard_size_str.length-2));
	this.task_board = new document.PentoSelectionBoard(`#${TASK_BOARD_NAME}`, TASK_BOARD_NAME, WITH_GRID, new document.PentoConfig(board_size=taskboard_size), read_only=true,);
	// Use audio path variable to access German audios
	this.instruction_manager = new document.InstructionManager(this.selection_board, this.task_board, audio_path='../resources/audio/de/');

	// Helper function to pause the study for a moment
	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	// --- Mouse tracking at mouse move ---
	// Browsers seem to use variables layerX/layerY differently. For consistent
	// coordinates, pageX/pageY is now used, but this requires the total top/left
	// offset of the canvas from the page
	this.mouse_pos			= {x: -1, y: -1};
	var canvas_offset_top	= getTotalOffsetTop(this.selection_board.canvas);
	var	canvas_offset_left	= getTotalOffsetLeft(this.selection_board.canvas);

	/**
	 * Computes the offset of an object from the page top in pixels.
	 * @param {some object to check offset for} obj
	 * @return offset from page top in pixels
	 */
	function getTotalOffsetTop(obj) {
		if (!obj.offsetParent) { return obj.offsetTop; }
		// recursively add up current and parent's offset
		else { return obj.offsetTop + getTotalOffsetTop(obj.offsetParent); }
	}
	/**
	 * Computes the offset of an object from the left page side in pixels.
	 * @param {some object to check offset for} obj
	 * @return offset from left page edge in pixels
	 */
	function getTotalOffsetLeft(obj) {
		if (!obj.offsetParent) { return obj.offsetLeft; }
		// recursively add up current and parent's offset
		else { return obj.offsetLeft + getTotalOffsetLeft(obj.offsetParent); }
	}

	/**
	 * Updates the current mouse position.
	 * If the mouse is not on the selection board, the coordinates will be set to (-1, -1).
	 */
	function handle_mouse_move(event) {
		if (event.target.id == SELECTION_BOARD_NAME) {
			this.mouse_pos = { x: event.pageX - canvas_offset_left,
							   y: event.pageY - canvas_offset_top};
		} else { // -1 signifies the mouse is of the board
			this.mouse_pos = {x: -1, y: -1};
		}
	}
	/**
	 * @return current mouse coordinates
	 */
	this.get_mouse_pos = function() {
		return this.mouse_pos;
	};
	// Update the mouse position every time the mouse is moved
	// Can be skipped in demo mode
	if (!window.DEMO) {
		this.onmousemove = handle_mouse_move;
	}

	/**
	 * Read next file if unprocessed file is left. Parse contents as JSON, construct boards and start task.
	 * @return true if a file was processed, false if no file left
	 */
	function loadNewFile() {
		if (FILES.length > current_file) {
			// load new task
			$.ajax({url:FILES[current_file],
					dataType:'json',
					async   : true,
					complete: function(data, msg) {
						let json = data.responseJSON;
						document.selection_board.fromJSON(json['initial']);
						document.task_board.fromJSON(json['task']);
						// enable selecting pieces on the board
						document.selection_board.pento_read_only = false;
						// make all pieces on task board invisible
						document.task_board.toggle_visibility(false);
						// register new task
						document.instruction_manager.new_task(FILES[current_file -1]);
						// give first instruction
						document.instruction_manager.generate_instruction();
						}
					});
			startTimer();
			// increment file counter
			current_file += 1;
			return true;
		}
		return false;
	}

	// --- Timer ---
	var timerId;
	/**
	 * Sets up a timer and starts an update loop
	 * Saves the id of timer loop in global timerId; use stopTimer(id) to stop the timer
	 */
	function startTimer() {
		var start_time = Date.now()
		var m; // minutes since start
		var s; // seconds since start
		// id is used to stop timer later
		document.timerId = setInterval(updateTimer, 500, start_time);
	}

	/**
	 * Stops the update loop for a timer
	 * @param {id returned by startTimer function} timerId
	 */
	function stopTimer() {
		clearInterval(document.timerId);
	}

	/**
	 * Updates the timer to depict the time passed since some start_time
	 * @param {point of time in milliseconds since 01/01/1970 00:00:00 UTC} start_time
	 */
	function updateTimer(start_time) {
		let time_passed = Date.now() - start_time;
		m = Math.floor(time_passed / 60000);
		s = Math.floor((time_passed % 60000) / 1000);
		$('#timer').html(`<span style="color:red">${_timeToString(m)}:${_timeToString(s)}</span>`);
	}

	/**
	 * Converts number of hours/minutes/seconds to printable string
	 * @param {hours, minutes or seconds as int} time
	 * @return string with 0 added to numbers below 10
	 */
	function _timeToString(time){
		// add zero in front of numbers < 10
		if (time < 10) {
			return "0" + time.toString();
		}
		return time.toString();
	}

	// --- Correct counter ---
	/**
	 * Update the display of correct guesses
	 */
	this.updateCorrectCounter = function() {
		if (document.instruction_manager) {
			$('#correct_counter').html(`Correct: <span style="color:green">${document.instruction_manager.correct_counter}</span> / 12`);
		}
	}

	// --- Progress bar ---
	/**
	 * Updates the displayed progress bar
	 * @param {Completion in percent (int)} completion
	 */
	function updateProgressBar(completion) {
		// update width
		$('#progress_bar').css('width', `${completion}%`);
		// update number
		$('#progress_bar').html(`${completion}%`);
	}

	// Buttons
	var selection_handler = {
		handle: async function(event) {
			if (event.type == 'shape_selected')
				// task board will check whether correct shape was selected
				// and make correct pieces visible on the task board
				if (document.instruction_manager) {
					document.instruction_manager.complete_instruction(event.object_id);
					document.updateCorrectCounter();
					// Try to give new instruction, is task is already finished,
					// show questionnaire
					if (!document.instruction_manager.generate_instruction()) {
						// make selection_board read-only
						document.selection_board.pento_read_only = true;
						stopTimer();
						if (window.DEMO) {
							// load next task & update elephant
							// small breather for the participant
							updateProgressBar(Math.floor(100 * current_file / FILES.length));
							await sleep(2000);
							let tasks_remaining = loadNewFile();

							// update elephant image
							document.getElementById('elephant').src='../resources/img/elephant'+elephant_c+'.png';
							elephant_c = elephant_c + 1;

							// finish the run
							if (!tasks_remaining) {
								updateProgressBar(100);
								document.instruction_manager.well_done();
								document.open_popup(endscreen);
							}
						} else {
							if (!START_QUEST) {
								document.open_popup(questionnaire);
							} else {
								document.open_popup(start_questionnaire);
							}
							START_QUEST = false;
						}
					}
				} else {
					// simply make the shape disappear
					document.task_board.handle_selection(event.object_id);
				}
		}
	};
	this.selection_board.register_event_handler(selection_handler);

	// --- Pop-ups ---

	var audiotest			= document.getElementById('audiotest');
	var prelim_question		= document.getElementById('prelim_question');
	var start_questionnaire	= document.getElementById('start_questionnaire');
	var questionnaire		= document.getElementById('questionnaire');
	var demographic			= document.getElementById('demographic');
	var endscreen			= document.getElementById('endscreen');


	dialogPolyfill.registerDialog(audiotest);
	dialogPolyfill.registerDialog(prelim_question);
	dialogPolyfill.registerDialog(start_questionnaire);
	dialogPolyfill.registerDialog(questionnaire);
	dialogPolyfill.registerDialog(demographic);
	dialogPolyfill.registerDialog(endscreen);

	// open popup element
	this.open_popup = function(popup) {
		popup.showModal();
		}

	// DEMO mode: start tasks. STUDY mode: move on to prelim_question
	$('#audiotest_done').click(function() {
		if (window.DEMO) {
			// textbox does not have to be filled out for demo mode
			audiotest.close();
			let tasks_remaining = loadNewFile();
			if (!tasks_remaining) {
				alert('Fehler, Pentomino konnte nicht geladen werden!');
				document.open_popup(endscreen);
			}
		} else {
			let transcript = $('#transcript').val();
			if (transcript == '') { // input is missing
				alert('Bitte gib die gehörte Nachricht in das Textfeld ein');
				$('#transcript').css('borderColor', 'red');
			} else {
				document.instruction_manager.add_info('audiotest', transcript);
				audiotest.close();
				document.open_popup(prelim_question);
			}
		}
	});

	// move on to the first task
	$('#prelim_question_done').click(function() {
		let follow_agent = $('input[name="follow_agent"]:checked').val();
		if (!follow_agent) {
			alert('Bitte wähle eine der Optionen aus');
		} else {
			// PARTICIPANT, NAME and EMAIL were given in index
			document.instruction_manager.add_info('participant', window.PARTICIPANT);
			document.instruction_manager.add_info('browser_os_info', window.navigator.userAgent);
			document.instruction_manager.add_info('name', window.NAME);
			document.instruction_manager.add_info('email', window.EMAIL);
			document.instruction_manager.add_info('follow_agent', follow_agent);
			document.instruction_manager.add_info('start_time', new Date().toString());

			// send initial data to email when a user starts
			let user_data = document.instruction_manager.data_to_JSON();
			let email_script = '../php/send_userdata.php';
			fetch(email_script, {
				method: 'POST',
				body: user_data,
			}).then((response) => {
				// if something went wrong, log to console
				let resp_code = response.status;
				if (resp_code < 200 || resp_code >= 300) {
					console.log(`Error: Something went wrong during sending of collected data. Response code: ${resp_code}`);
				}
			})

			prelim_question.close();
			let tasks_remaining = loadNewFile();
			if (!tasks_remaining) {
				alert('Fehler, Pentomino konnte nicht geladen werden!');
				document.open_popup(endscreen);
			}
		}
	});

	// start task, load new task
	$('#start_questionnaire_done').click(async function() {
		start_questionnaire.close();

		// small breather for the participant
		await sleep(1000);
		let tasks_remaining = loadNewFile();
		if (!tasks_remaining) {
			alert('Fehler, Pentomino konnte nicht geladen werden!');
			document.open_popup(endscreen);
		}

		// update elephant image
		document.getElementById('elephant').src='../resources/img/elephant'+elephant_c+'.png';
		elephant_c = elephant_c + 1;
	})

	// submit task questionnaire, load new task or move to demographic questionnaire
	$('#questionnaire_done').click(async function() {
		// get and save the questionnaire answer
		// all questions are mandatory!
		clear = $('input[name="clear"]:checked').val();
		humanlike = $('input[name="humanlike"]:checked').val();
		info = $('input[name="info"]:checked').val();
		effort = $('input[name="effort"]:checked').val();

		if ((!clear) || (!humanlike) || (!info) || (!effort)) {
			alert("Bitte beantworte alle Fragen")
		} else {
			if (document.instruction_manager) {
				// save all answers
				document.instruction_manager.add_info('clarity', clear, 'task');
				document.instruction_manager.add_info('humanlike', humanlike, 'task');
				document.instruction_manager.add_info('information', info, 'task');
				document.instruction_manager.add_info('effort', effort, 'task');
				document.instruction_manager.add_info('error', $('#task_error').is(":checked"), 'task');
			}

			// clear selections
			$('input[name="clear"]').prop('checked', false);
			$('input[name="humanlike"]').prop('checked', false);
			$('input[name="info"]').prop('checked', false);
			$('input[name="effort"]').prop('checked', false);
			$('#task_error').prop('checked', false);

			questionnaire.close();
			updateProgressBar(Math.floor(100 * current_file / FILES.length));
			// small breather for the participant
			await sleep(1000);
			let tasks_remaining = loadNewFile();

			// update elephant image
			document.getElementById('elephant').src='../resources/img/elephant'+elephant_c+'.png';
			elephant_c = elephant_c + 1;

			// finish the run
			if (!tasks_remaining) {
				updateProgressBar(100);
				document.open_popup(demographic);
			}
		}
	})

	// submit demographic questionnaire, save data and move on to endscreen
	$('#demographic_done').click(function() {
		if (document.instruction_manager) {
			// make sure form is filled out
			let freeform_input	= new Map([['age', 'Bitte gib dein Alter ein oder schreibe "none".'],
									['gender', 'Bitte gib dein Geschlecht ein oder schreibe "none".'],
									['education', 'Bitte gib deinen Bildungsgrad ein.'],
									['language', 'Bitte gib deine Muttersprache ein.']]);
			
			let likert_input	= new Map([['fluent', 'Bitte gib deine Sprachfähigkeit für Deutsch an.'],
									['understanding', 'Bitte bewerte die Verständlichkeit.'],
									['complete', 'Bitte bewerte die Vollständigkeit.'],
									['helpful', 'Bitte bewerte, wie hilfreich die Beschreibungen waren.'],
									['collaborative', 'Bitte bewerte, wie kollaborativ Matthias war.'],
									['like', 'Bitte gib an, wie sehr du Matthias mochtest.'],
									['friendly', 'Bitte bewerte Matthias\' Freundlichkeit.'],
									['kind', 'Bitte bewerte, wie nett Matthias war.'],
									['pleasant', 'Bitte bewerte, wie angenehm Matthias war.'],
									['nice', 'Bitte bewerte, wie nett Matthias war.'],
									['competent', 'Bitte bewerte Matthias\' Kompetenz.'],
									['knowledgeable', 'Bitte bewerte Matthias\' Wissen.'],
									['responsible', 'Bitte bewerte Matthias\' Verantwortungsbewusstsein.'],
									['intelligent', 'Bitte bewerte Matthias\' Intelligenz.'],
									['sensible', 'Bitte bewerte Matthias\' Sensibilität.'],
									['comply', 'Bitte gib an, wie sehr du den Anweisungen gefolgt bist.'],
									['easy', 'Bitte gib die Schwierigkeit an.']]);
			
			for (v of freeform_input.keys()) {
				let input = $(`#${v}`).val();
				// if some input is missing, emit an error message and return to demographic
				if (!input) {
					alert(freeform_input.get(v));
					$(`#${v}`).css('borderColor', 'red');
					return;
				}
				// else, save the input
				document.instruction_manager.add_info(v, input);
			}
			
			for (v of likert_input.keys()) {
				let input = $(`input[name="${v}"]:checked`).val();
				// if some input is missing, emit an error message and return to demographic
				if (!input) {
					alert(likert_input.get(v));
					return;
				}
				// else, save the input
				document.instruction_manager.add_info(v, input);
			}

			// track device must either be one of the preset options or 'other' and manually specified other_device
			let track_device = $('input[name="track_device"]:checked').val();
			track_device = (track_device=='other') ? $('#other_device').val() : track_device;
	
			if (!track_device) {
				alert('Bitte gib an, mit welchem Gerät du den Mauszeiger bedient hast.');
				$('#track_device').css('borderColor', 'red');
				return;
			}
			document.instruction_manager.add_info('track_device', track_device);
			// add other (partially optional) inputs
			document.instruction_manager.add_info('end_time', new Date().toString());
			for (checkbox of ['ci_before', 'robot_before', 'played_pento_before']) {
				document.instruction_manager.add_info(checkbox, $(`#${checkbox}`).is(':checked'));
			}
			for (optional of ['know_want', 'greatest_difficulty', 'best_strategy', 'worst_strategy', 'why_study', 'comments']) {
				document.instruction_manager.add_info(optional, $(`#${optional}`).val());
			}

			// save collected data to server-side resource/data_collection directory
			let data = document.instruction_manager.data_to_JSON();
			let file_saver_script = '../php/save_userdata.php';
			fetch(file_saver_script, {
				method: 'POST',
				body: data,
			}).then((response) => {
				// if something went wrong, log to console
				let resp_code = response.status;
				if (resp_code < 200 || resp_code >= 300) {
					console.log(`Error: Something went wrong during saving of collected data. Response code: ${resp_code}`);
				}
			})

			// proceed to endscreen
			document.instruction_manager.well_done();
			demographic.close();
			document.open_popup(endscreen);
			
		} else { // no instruction manager
			demographic.close();
			document.open_popup(endscreen);
		}
	});

	// --- Start ---
	document.open_popup(audiotest);
	this.instruction_manager.audiotest();
})
