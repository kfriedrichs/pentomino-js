$(document).ready(function() {
	// --- Boards ---
	var WITHGRID	= true;
	var BOARDNAME	= 'elephant';
	
	// Elephant is 11x9 blocks in size
	// -> Use 19x19 blocks canvas to center it nicely
	let nBlocks = 19;
	let boardSizeStr = $(`#${BOARDNAME}`).css('width');
	let boardSize = Number(boardSizeStr.slice(0, boardSizeStr.length-2));
	this.board = new document.PentoElephantBoard(`#${BOARDNAME}`, BOARDNAME, WITHGRID, new document.PentoConfig(board_size=boardSize, nBlocks));
	
	// --- Button functions ---
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
		if (this.board.pento_active_shape) {
			// start interval
			switch (dir) {
				case 'up':
					moveId = setInterval(this.moveActiveOnBoard, interval, this.board,
						0, -step);
					break;
				case 'down':
					moveId = setInterval(this.moveActiveOnBoard, interval, this.board,
						0, step);
					break;
				case 'left':
					moveId = setInterval(this.moveActiveOnBoard, interval, this.board,
						-step, 0);
					break;
				case 'right':
					moveId = setInterval(this.moveActiveOnBoard, interval, this.board,
						step, 0);
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
		this.board.lockActiveOnGrid();
	}
	
	/**
	* Rotate active shape 90 degrees to the left
	*/
	this.rotateLeft = function() {
		if (this.board.pento_active_shape) {
			this.board.rotate_shape(-90);
		} else {
			console.log('No active shape');
		}
	}
	
	/**
	* Rotate active shape 90 degrees to the right
	*/
	this.rotateRight = function() {
		if (this.board.pento_active_shape) {
			this.board.rotate_shape(90);
		} else {
			console.log('No active shape');
		}
	}
	
	/**
	 * Flips the active shape horizontally
	 */
	this.flipHorizontally = function() {
		if (this.board.pento_active_shape) {
			this.board.flip_shape('horizontal');
		} else {
			console.log('No active shape');
		}
	}
	
	/**
	 * Flips the active shape vertically
	 */
	this.flipVertically = function() {
		if (this.board.pento_active_shape) {
			this.board.flip_shape('vertical');
		} else {
			console.log('No active shape');
		}
	}

})
