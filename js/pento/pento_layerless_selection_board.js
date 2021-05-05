$(document).ready(function () {

	this.PentoLayerlessSelectionBoard = class PentoLayerlessSelectionBoard extends document.PentoLayerlessBoard {
	
		/**
		 * Constructor
		 * @param {id of html canvas} canvas_id
		 * @param {name of the board} title
		 * @param {true for visible grid} with_grid
		 * @param {PentoConfig instance} config
		 * @param {true to stop changes. default:false} read_only
		 */
		constructor(canvas_id, title, with_grid, config, read_only=false) {
			super(canvas_id, title, false, with_grid, config); // no tray
			this.pento_read_only = read_only;
		}
		
		/**
		 * Returns true if shape is present on the board.
		 * @param {shape name to check for} shape
		 */
		_has_shape(shape) {
			let shape_name = shape.name || shape;
			return (Object.keys(this.shapes).indexOf(shape_name) != -1)
		}
		
		/**
		 * For task boards:
		 * check if selected shape is present, if applicable, make it visible on the board
		 * @param {name of selected shape} shape
		 */
		handle_selection(shape) {
			if (this._has_shape(shape)) {
				// show shape on the task board
				this.toggle_visibility(true, shape);
			}
		}
		
		/**
		 * Switch the visibility of a single shape
		 * @param {true = visible, false = invisible} visible
		 * @param {shape name or null for all shapes} shape
		 */
		toggle_visibility(is_visible, shape=null) {
			if (shape == null) {
				for (let shape_name in this.shapes) {
					this.shapes[shape_name].visible = is_visible;
				}
			} else {
				let shape_name = shape.name || shape;
				this.shapes[shape_name].visible = is_visible;
			}
			this.draw();
		}
	};
})

