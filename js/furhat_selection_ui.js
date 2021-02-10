$(document).ready(function() {
	// --- Boards ---
	var WITH_GRID				= true;
	var SELECTION_BOARD_NAME	= 'selection_board';
	var ELEPHANT_BOARD_NAME		= 'elephant_board';
	var TASK_FILE				= './resources/tasks/elephant_target.json';
	
	this.config = new document.PentoConfig();

	let selboard_size_str = $(`#${SELECTION_BOARD_NAME}`).css('width');
	let selboard_size = Number(selboard_size_str.slice(0, selboard_size_str.length-2));
	this.selection_board = new document.PentoSelectionBoard(`#${SELECTION_BOARD_NAME}`, SELECTION_BOARD_NAME, WITH_GRID, new document.PentoConfig(board_size=selboard_size), read_only=true);
	// Piece selection/activation is only manipulated by buttons, turn off mouse events
	this.selection_board.deactivate_at_canvasleave = false;

	// Board which is automatically filled as pieces are selected
	let elephant_size_str = $(`#${ELEPHANT_BOARD_NAME}`).css('width');
	let elephant_size = Number(elephant_size_str.slice(0, elephant_size_str.length-2));
	this.elephant_board = new document.PentoSelectionBoard(`#${ELEPHANT_BOARD_NAME}`, ELEPHANT_BOARD_NAME, WITH_GRID, new document.PentoConfig(board_size=elephant_size), read_only=true);

	// -------- Button functions ---------

	this.activeButton = null;

	/**
	 * Read next file if unprocessed file is left. Parse contents as JSON, construct boards and start task.
	 * @param {url of task file} file
	 * @return true if a file was processed, false if no file left
	 */
	this.loadNewFile = function(file) {
		$.ajax({url:file,
				dataType:'json',
				async   : true,
				complete: function(data, msg) {
					let json = data.responseJSON;
					document.selection_board.fromJSON(json['initial']);
					document.elephant_board.fromJSON(json['task']);
					// make all pieces on task board invisible
					document.elephant_board.toggle_visibility(false);
					document.setupButtons();
					}
				});
	}
	
	/**
	 * Given a shape, this returns a function to be used by the matching button.
	 * At activation (button click), the shape is highlighted (or an existing highlight
	 * is removed), and the document-wide activeButton is updated.
	 * @param {PentoShape object to bind to the returned function} shape
	 */
	this.createButtonFunction = function(shape) {
		return function(e) {
			if (document.activeButton == e.target) {
				document.activeButton = null;
				document.selection_board.clear_selections();
			} else {
				document.activeButton = e.target;
				document.selection_board.set_active(shape);
			}
			// redraw to apply highlight changes
			document.selection_board.draw();
		}
	}
	
	/**
	 * Should be called once boards are loaded. Creates a button for each shape on the
	 * selection board.
	 */
	this.setupButtons = function() {
		for (let shape of Object.values(document.selection_board.shapes)) {
			// hack to create a button name using the shape name:
			// the '#' character can't be included
			let btnID = shape.name.slice(0,shape.name.length-7) + shape.name.slice(shape.name.length-6, shape.name.length);
			let btn = `<button id="${btnID}">Select ${document.config.color_map[shape.color]} ${shape.type}</button>`;
			$('#pieceSelectors').append(btn);
			$(`#${btnID}`).on('click', this.createButtonFunction(shape));
		}
	}
	
	/**
	 * Function for 'Start new game' button
	 */
	this.startGame = function() {
		this.loadNewFile(TASK_FILE);
	}
	
	/**
	 * Function for 'Place selected' button
	 */
	this.placeSelected = function() {
		let activeShape = document.selection_board.pento_active_shape;
		if (activeShape) {
			// hide the corresponding button
			if (this.activeButton != null) {
				this.activeButton.style.visibility = 'hidden';
			}
			// remove the shape from the selection board
			document.selection_board.destroy_shape(activeShape);
			// show selected shape on the elephant board
			document.elephant_board.handle_selection(activeShape.name);
		}
	}

})

