$(document).ready(function () {
	/**
	 * Class to generate instructions and collect data of the task following process.
	 *
	 * @author clpresearch / Karla Friedrichs
	 */
	var START = 1;

	this.InstructionManager = class InstructionManager {
		/**
		 * Constructor
		 * Tasks can be created using the 'task creator' interface.
		 *
		 * @param {board pieces are selected from} selection_board
		 * @param {board to represent task} task_board
		 * @param {'audio' or 'video'. With any other value, instructions are logged to the console. Default: 'audio'.} mode
		 * @param {jquery selector of the video panel for instructions. Only for 'video' mode.} video_selector
		 * @param {directory of audio/video files. Default: '../resources/audio/'} resource_path
		 * @param {frequency of mouse tracking in milliseconds. Default: 200} track_interval
		 */
		constructor(selection_board, task_board, mode='audio', resource_path='../resources/audio/', video_selector='', track_interval=200) {
			this.selection_board		= selection_board;
			this.task_board 			= task_board;
			
			// for each task and each instruction, log mouse movement, time, selected piece
			this.follower_data 			= {};
			this.task_name; // name of current task (e.g. file name)
			
			// Type of instruction giving
			this.mode					= mode;
			this.resource_path			= resource_path;
			// Make sure we know where to play videos
			if (mode == 'video') {
				if (video_selector) {
					this.video_panel = $(video_selector);
					this.video_src = $(video_selector + ' source');
				}
				else {
				console.log('WARNING: \'video\' mode was selected for an instruction_manager instance but no reference to video panel was passed!');
				// try falling back to audio and default path
				this.mode = 'audio';
				this.resource_path = '../resources/audio/';
				}
			}
			this.add_info('instruction_mode', this.mode);
			
			// for current instruction
			this.shape; // shape name
			this.instruction; // audio of current instruction
			this.current_start_time 	= Date.now();
			this.track_id; // interval id if tracking is running
			this.track_interval			= track_interval; // how often is mouse position checked (milliseconds)
			this.current_mouse_movement = [];
			this.correct_counter		= 0; // number of correct guesses by participant
		}

		/**
		 * Registers the start of a new task
		 * @param {optional task name, number is used otherwise} name
		 */
		new_task(name=null) {
			if (name) {
				let name_start = Math.max(name.lastIndexOf("/")+1, 0);
				this.task_name = name.slice(name_start, name.length) || name;
			} else {
				this.task_name = Object.keys(this.follower_data).length.toString();
			}
			this.add_info(this.task_name, {});
		}

		/**
		 * Generate a new instruction.
		 * @param {true to play instruction as audio, false for console output. default: true} audio
		 * @return true if instruction was generated, false if task is complete
		 */
		generate_instruction() {
			let next_shape = this.task_board.next_shape;
			if (!next_shape) {
				return false;
			} else {
				// remove red and green highlights
				this.remove_highlights();
				this.shape = next_shape.name;
				// save the target shape coordinates
				let target = this.selection_board.get_shape(this.shape);
				this.add_info(this.shape, {
					'target_x': Math.floor(target.x * this.selection_board.scale_to_source_size()),
					'target_y': Math.floor(target.y * this.selection_board.scale_to_source_size())
				}, 'task');
				let instr_file;
				switch (this.mode) {
					case 'audio':
						// get audio for instruction and play it
						if (START) {
							instr_file = this.resource_path + 'start.mp3';
						} else {
							instr_file = this.resource_path + `p/${PARTICIPANT}/${this.selection_board.get_shape(this.shape).type}.mp3`;
						}
						this.instruction = new Audio(instr_file);
						// start instruction as soon as audio is loaded sufficiently
						this.instruction.oncanplaythrough = (event) => {
							this.instruction.play();
							this._start_instruction(); // start tracking etc.
							this.add_info('audio_duration', this.instruction.duration, 'shape');
						};
						break;
					//TODO: Video instructions not yet generated
					case 'video':
						// get video for instruction and play it
						if (START) {
							instr_file = this.resource_path + 'start.ogg';
						} else {
							console.log("WARNING: video instructions not yet implemented")
							instr_file = '../resources/video/Z.mp4';
						}
						this.video_panel.attr('loop', false);
						this.video_src.attr('src', instr_file);
						this.video_panel.get(0).load();
						this.video_panel.get(0).play(); //TODO: can remove?
						let panel = this.video_panel;
						let src = this.video_panel;
						let rsrc = this.resource_path;
						this.video_panel.on('ended', function() {
							panel.attr('loop', true);
							src.attr('src', rsrc + 'idle.mp4');
						});
						this._start_instruction(); // start tracking etc.
						//TODO: add video length instead
//						this.add_info('audio_duration', this.instruction.duration, 'shape');
						break;
					default:
						console.log(`Please select ${this.shape}`);
						this._start_instruction(); // start tracking etc.
				}
				return true;
			}
		}

		/**
		 * Start data collection for current instruction
		 */
		_start_instruction() {
			this.current_start_time = Date.now();
			this._start_mouse_track();
		}
		
		_abort_instruction() {
			switch (this.mode) {
				case "audio":
					this.instruction.pause(); // stop audio
					break;
				case "video":
					this._idle_video();
			}
		}
		
		/**
		 * Change the current video display to a loop of this.resource_path+"idle.mp4"
		 */
		_idle_video() {
			this.video_panel.attr('loop', true);
			this.video_src.attr('src', this.resource_path + 'idle.mp4');
		}

		/**
		 * Stop data collection for current instruction and handle the follower action.
		 * @param {name of shape selected by follower} selected_shape
		 * @return true if selection was correct, false if incorrect, undefined if START
		 */
		complete_instruction(selected_shape) {
			this.add_info('selected', selected_shape, 'shape');
			this._stop_mouse_track(); // saves mouse movement
			this._abort_instruction(); // stop audio or video
			// Note: The highlighting only really makes sense for single-piece tasks,
			// as the highlights are removed as soon as the next instruction is generated
			// highlight correct shape in green
			// START is used to not perform highlighting for the first (tutorial) task
			let correct;
			if (!START) {
				this.highlight_correct();
				// correct shape selected
				if (this.shape == selected_shape) {
					correct = true;
					this.correct_counter += 1;
					this.correct_piece();
				// incorrect shape selected
				} else {
					correct = false;
					// highlight shape as incorrect
					this.highlight_incorrect(selected_shape);
					// handle the incorrectly selected shape
					this.task_board.handle_selection(selected_shape);
					this.incorrect_piece();
				}
				this.add_info('correct', correct, 'shape');
			}
			START = 0;
			// make task_board handle the selection
			this.task_board.handle_selection(this.shape);
			return correct;
		}

		/**
		 * Highlight the goal shape in green and redraw the board to apply change.
		 */
		highlight_correct() {
			this.selection_board.get_shape(this.shape).set_highlight('green');
			this.selection_board.draw();
		}

		/**
		 * Highlight a given shape in red and redraw the board to apply change.
		 * @param {name of incorrect shape} shape
		 */
		highlight_incorrect(shape) {
			this.selection_board.get_shape(shape).set_highlight('red');
			this.selection_board.draw();
		}

		/**
		 * Remove all highlights
		*/
		remove_highlights() {
			for (let s of Object.values(this.selection_board.shapes)) {
				s.remove_highlight();
			}
		}

		/**
		 * Play an example audiofile
		 */
		audiotest() {
			let test_file = this.resource_path + 'intro.mp3';
			let test_audio = new Audio(test_file);
			test_audio.oncanplaythrough = (event) => {test_audio.play();};
		}

		/**
		 * Emit a 'well done' message
		 * @param {pass true to enable audio. default: true} audio
		 */
		well_done(audio=true) {
			if (audio) {
				let well_done_file = this.resource_path + 'done.mp3';
				let well_done_audio = new Audio(well_done_file);
				well_done_audio.oncanplaythrough = (event) => {
					well_done_audio.play();
				}
			} else {
				console.log("Well done!");
			}
		}

		/**
		 * Emit a 'correct' message
		 * @param {pass true to enable audio. default: true} audio
		 */
		correct_piece(audio=true) {
			var random_num = 0;
			if (audio) {
				random_num = Math.floor(Math.random() * 3) + 1
				let correct_piece_file = this.resource_path + 'correct' + random_num + '.mp3';
				let correct_piece_audio = new Audio(correct_piece_file);
				correct_piece_audio.oncanplaythrough = (event) => {
					correct_piece_audio.play();
				}
			} else {
				console.log("This was correct!");
			}
		}

		/**
		 * Emit an 'incorrect' message
		 * @param {pass true to enable audio. default: true} audio
		 */
		incorrect_piece(audio=true) {
			var random_num = 0;
			if (audio) {
				random_num = Math.floor(Math.random() * 3) + 1
				let incorrect_piece_file = this.resource_path + 'incorrect' + random_num + '.mp3';
				let incorrect_piece_audio = new Audio(incorrect_piece_file);
				incorrect_piece_audio.oncanplaythrough = (event) => {
					incorrect_piece_audio.play();
				}
			} else {
				console.log("This was incorrect!");
			}
		}

		/**
		 * Save additional info to current follower data.
		 * Data can be added at three levels:
		 * 		'global': add to root of info dictionary
		 *		'task': add to current task
		 *		'shape': add to current shape of the running task
		 * @param {a descriptive name for the new information} key
		 * @param {content to assign to key} value
		 * @param {one of ['global', 'task', 'shape']. Defines insertion point to the data.}
		 */
		add_info(key, value, level='global') {
			switch(level) {
				case 'global':
					this.follower_data[key] = value;
					break;
				case 'task':
					if (!this.task_name) {
						console.log("Error: Trying to save info with no running task.")
					} else {
						this.follower_data[this.task_name][key] = value;
					}
					break;
				case 'shape':
					if (!this.task_name || !this.shape) {
						console.log("Error: Trying to save info, but no task running or no target shape.")
					} else {
						this.follower_data[this.task_name][this.shape][key] = value;
					}
					break;
				default:
					// Don't save anything, emit error message
					console.log(`Error: Undefined insertion level to save data ${key} = ${value}: ${level}`)
			}
		}

		/**
		 * @return collected data as a JSON string
		 */
		data_to_JSON() {
			return JSON.stringify(this.follower_data, null, 2);
		}

		/**
		 * Write collected data to savefile
		 * @param {file to save to} filename
		 */
		save_data(filename) {
			// Create a blob of the data
			let file_contents = new Blob([JSON.stringify(this.follower_data, null, 2)], {type: 'application/json'});
			// Save to file
			saveAs(file_contents, filename);
		}

		/**
		 * @return time passed since start of current instruction in milliseconds
		 */
		_time_passed() {
			return Date.now() - this.current_start_time;
		}

		/**
		 * Start tracking mouse coordinates as it is moved
		 */
		_start_mouse_track() {
			this.current_mouse_movement = [];
			var self = this;
			var coord_scaling = this.selection_board.scale_to_source_size();
			// start tracking loop
			this.track_id = setInterval(function() {
				let mousePos = document.get_mouse_pos();
				// save a single time-coordinate pair of the current mouse position
				self.current_mouse_movement.push({time: self._time_passed(),
												x: Math.floor(mousePos.x * coord_scaling),
												y: Math.floor(mousePos.y * coord_scaling)});
				}, this.track_interval);
		}

		/**
		 * Stop mouse tracking and store tracking info for current piece
		 */
		_stop_mouse_track() {
			if (this.track_id) {
				this.track_id = clearInterval(this.track_id);
			}
			this.add_info('movement', this.current_mouse_movement, 'shape');
		}
	};
})
