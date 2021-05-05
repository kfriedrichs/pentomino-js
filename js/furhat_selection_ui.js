$(document).ready(function() {
	// --- Boards ---
	var WITH_GRID				= true;
	var SELECTION_BOARD_NAME	= 'selection_board';
	var ELEPHANT_BOARD_NAME		= 'elephant_board';

	this.config = new document.PentoConfig();
	// use only 90° rotation, this allows blocks to stay on the grid
	this.config.rotation_step = 90;

	let selboard_size_str = $(`#${SELECTION_BOARD_NAME}`).css('width');
	let selboard_size = Number(selboard_size_str.slice(0, selboard_size_str.length-2));
	let elephant_size_str = $(`#${ELEPHANT_BOARD_NAME}`).css('width');
	let elephant_size = Number(elephant_size_str.slice(0, elephant_size_str.length-2));
	if (selboard_size != elephant_size) {
		console.log('Warning: the two canvas should have the same size');
	}
	this.config = new document.PentoConfig(board_size=selboard_size);
	
	this.generator = new document.PentoGeneratorElephant(this.config,
														with_grid=WITH_GRID,
														read_only=true,
														target_name=ELEPHANT_BOARD_NAME,
														initial_name=SELECTION_BOARD_NAME,
														layerless=true);

	this.selection_board = this.generator.pento_board_initial;
	// Board which is automatically filled as pieces are selected
	this.elephant_board = this.generator.pento_board_elephant;
	// Piece selection/activation is only manipulated by buttons, turn off mouse events
	this.selection_board.deactivate_at_canvasleave = false;
	this.elephant_board.deactivate_at_canvasleave = false;

	// -------- Button functions ---------

	this.activeButton = null;

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
				document.elephant_board.clear_selections();
			} else {
				document.activeButton = e.target;
				document.selection_board.set_active(shape);
				// we need to pass name here, each board has its own shape objects
				document.elephant_board.set_active(shape.name);
				// redraw to apply highlight changes
				document.selection_board.draw();
				document.elephant_board.draw();
			}
		}
	}

	/**
	 * Should be called once boards are loaded. Creates a button for each shape on the
	 * selection board.
	 */
	this.setupButtons = function() {
		// remove eventual existing buttons
		$('#pieceSelectors').html('');
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
		// Generate boards. Deactivate build_elephant parameter to have all pieces
		// start in the corner of the elephant board (instead of in goal position
		this.generator.generate(build_elephant=false);
		// make all pieces on elephant board invisible
		document.elephant_board.toggle_visibility(false);
		document.setupButtons();
	}

	/**
	 * Function for 'Place selected' button
	 */
	this.placeSelected = function() {
		let activeShape = document.selection_board.pento_active_shape;
		if (activeShape) {
			// remove the shape from the selection board
			document.selection_board.destroy_shape(activeShape);
			// show selected shape on the elephant board
			document.elephant_board.handle_selection(activeShape.name);
			// check whether shape is already correctly placed
			this.fixCorrectlyPlaced();
		}
	}
	
	// --- Button functions: Moving shapes ---
	
	var MOVESPEED	= 5;
	var MOVEFREQ	= 200;
	var moveId		= null;
	
	/**
	* Move the active shape on some PentoBoard by a delta x, y
	* @param {PentoBoard reference} board
	* @param {x distance} dx
	* @param {y distance} dy
	*/
	this.moveActiveOnBoard = function (board, dx, dy) {
		board.move_active(dx, dy);
	}
	
	/**
	 * Stop current interval and set an interval for moving the active shape
	 * on the document.board
	 * @param {one of [up, down, left, right]} dir
	 * @param {move frequency in milliseconds, default:500} interval
	 * @param {distance of each step in pixels, default: 5} step
	 */
	this.startMove = function (dir, interval=500, step=5) {
		this.stopMove();
		if (this.elephant_board.pento_active_shape) {
			// start interval
			switch (dir) {
				case 'up':
					moveId = setInterval(this.moveActiveOnBoard, interval,
										this.elephant_board, 0, -step);
					break;
				case 'down':
					moveId = setInterval(this.moveActiveOnBoard, interval,
										this.elephant_board, 0, step);
					break;
				case 'left':
					moveId = setInterval(this.moveActiveOnBoard, interval,
										this.elephant_board, -step, 0);
					break;
				case 'right':
					moveId = setInterval(this.moveActiveOnBoard, interval,
										this.elephant_board, step, 0);
					break;
				default:
					console.log(`Unknown direction: ${dir} at startMove`);
			}
		} else {
			console.log('No active shape');
		}
	}
	
	// define functions referenced in html
	this.moveUp = function() {this.startMove('up', interval=MOVEFREQ, step=MOVESPEED);}
	this.moveDown = function() {this.startMove('down', interval=MOVEFREQ, step=MOVESPEED);}
	this.moveLeft = function() {this.startMove('left', interval=MOVEFREQ, step=MOVESPEED);}
	this.moveRight = function() {this.startMove('right', interval=MOVEFREQ, step=MOVESPEED);}
	
	/**
	* Stop moving the active shape and lock it to the nearest grid square
	*/
	this.stopMove = function() {
		clearInterval(moveId);
		if (this.elephant_board.pento_active_shape) {
			this.elephant_board.lock_shape_on_grid();
			// check whether the piece is correctly placed
			// if it is, remove button to fix the position
			this.fixCorrectlyPlaced();
		}
	}
	
	/**
	* Rotate active shape 90 degrees to the left
	*/
	this.rotateLeft = function() {
		if (this.elephant_board.pento_active_shape) {
			this.elephant_board.rotate_shape(-90);
			this.fixCorrectlyPlaced();
		} else {
			console.log('No active shape');
		}
	}
	
	/**
	* Rotate active shape 90 degrees to the right
	*/
	this.rotateRight = function() {
		if (this.elephant_board.pento_active_shape) {
			this.elephant_board.rotate_shape(90);
			this.fixCorrectlyPlaced();
		} else {
			console.log('No active shape');
		}
	}
	
	/**
	 * Flips the active shape horizontally
	 */
	this.flipHorizontally = function() {
		if (this.elephant_board.pento_active_shape) {
			this.elephant_board.flip_shape('horizontal');
			this.fixCorrectlyPlaced();
		} else {
			console.log('No active shape');
		}
	}
	
	/**
	 * Flips the active shape vertically
	 */
	this.flipVertically = function() {
		if (this.elephant_board.pento_active_shape) {
			this.elephant_board.flip_shape('vertical');
			this.fixCorrectlyPlaced();
		} else {
			console.log('No active shape');
		}
	}
	
	/**
	 * If the currently active shape is placed, rotated and flipped correctly on the elephant board,
	 * the corresponding button is hidden to stop any further changes by the user
	 */
	this.fixCorrectlyPlaced = function() {
		if (this.elephant_board.pento_active_shape &&
			this.isCorrectlyPlaced(this.elephant_board.pento_active_shape) &&
			this.activeButton) {
				this.elephant_board.clear_selections();
				this.activeButton.style.visibility = 'hidden';
		}
	}
	
	/**
	 * Checks whether the given shape is at its goal position and unmirrored,
	 * as defined by elephantCoords in the PentoGeneratorElephant instance
	 * @param {PentoShape object to check} shape
	 * @return true if shape is at goal position, rotation and flip is correct
	 */
	this.isCorrectlyPlaced = function(shape) {
		// no flip applied
		if (shape.is_mirrored) { return false; }
		let goalCoords = document.generator.elephantCoords[shape.type];
		goalCoords = this.elephant_board.grid_cell_to_coordinates(
						this.generator.elephantX + goalCoords['x'],
						this.generator.elephantY + goalCoords['y']);
		if (shape.x != goalCoords[0] || shape.y != goalCoords[1]) { return false };
		// goal rotation is 0. 'rotation attribute' of shape is not necessarily correct
		// because of the flip action. Using a hack here: Check whether the block arrangement
		// corresponds to that of a newly created shape of the same type
		let dummy_shape = this.pento_create_shape(42, 0, 0, shape.type, 'black', false, 0, 20);
		let shape_grid = shape.get_internal_grid();
		let dummy_grid = dummy_shape.get_internal_grid();
		for (let row = 0; row < shape.get_grid_height(); row++) {
			for (let col = 0; col < shape.get_grid_width(); col++) {
				if (dummy_grid[row] == undefined ||
					dummy_grid[row][col] == undefined || // grid sizes don't match (shouldn't happen)
					dummy_grid[row][col] != shape_grid[row][col]) {
					return false;
				}
			}
		}
		return true;
	}

})

