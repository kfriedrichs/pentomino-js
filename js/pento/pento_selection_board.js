$(document).ready(function () {

	this.PentoSelectionBoard = class PentoSelectionBoard extends document.PentoBoard {
	
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
		 * @return a shape that has not been selected yet (= is still invisible)
		 */
		get next_shape() {
			for (let l of this.pento_canvas_ref.getLayers()) {
				if (l.name != 'grid' && !l.visible) {
					return l;
				}
			}
			return null;
		}
		
		/**
		 * Override function from pento_board: no arrows here
		 * Move shape to foreground and highlight it
		 * @param {PentoShape to set active} shape
		 */
		set_active(shape) {
			if (this.pento_active_shape != null){
				this.pento_active_shape.set_deactive();
			}
			this.pento_canvas_ref.moveLayer(shape.name, -1);
			this.pento_active_shape = shape;
			shape.set_active();
		}
		
		/**
		 * Override PentoBoard function: No shape dragging, just removing at click here.
		 * Place and draw a shape on the canvas.
		 * {PentoShape to place} shape
		 */
		place_shape(shape) {
			var offsetX = this.get_offsets(shape.type)[0];
			var offsetY = this.get_offsets(shape.type)[1];
			var self = this;

			this.pento_canvas_ref.drawPentoShape({
				layer: true,
				name: shape.name,
				block_size: this.pento_block_size,
				draggable: false,
				x: shape.x, y: shape.y,
				offsetX: offsetX,
				offsetY: offsetY,
				width: this.pento_block_size * shape.get_grid_width(),
				height: this.pento_block_size * shape.get_grid_width(),
				shape: shape,
				fromCenter: true,
				mouseover: function (layer) {
					if (!self.pento_read_only) {
						self.set_active(shape);
					}
				},
				click: function (layer) {
					if (!self.pento_read_only) {
						// remove the shape from the selection board
						//self.destroy_shape(shape);
						self.fire_event('shape_selected', self.pento_active_shape.name, {});
					}
				}
			});
			this.shapes[shape.name] = shape;
			this.draw();
		}
		
		/**
		 * Returns true if shape is present on the board.
		 * @param {shape name to check for} shape
		 */
		_has_shape(shape) {
			return (Object.keys(this.shapes).indexOf(shape) != -1)
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
				this.pento_canvas_ref.setLayers({
					visible: is_visible
				})
				.drawLayers();
			} else {
				this.pento_canvas_ref.setLayer(shape, {
					visible: is_visible
				})
				.drawLayers();
			}
		}
	};
})
