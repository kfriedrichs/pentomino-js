$(document).ready(function () {

	/**
	* Board with the Pentomino Elephant in the background. Pieces can be selected
	* and moved using arrow buttons external to the boards
	*/
	this.PentoElephantBoard = class PentoElephantBoard extends document.PentoBoard {
		/**
		 * Constructor
		 * @param {id of html canvas} canvas_id
		 * @param {name of the board} title
		 * @param {true for visible grid} with_grid
		 * @param {PentoConfig instance} config
		 */
		constructor(canvas_id, title, with_grid, config) {
			super(canvas_id, title, false, with_grid, config); // no tray
			this.drawElephant();
			
			// Shapes should not be deactivated when mouse leaves the canvas
			this.deactivate_at_canvasleave = false;
			
			// for now just create a random shape
			let someShape = document.pento_create_shape("sampleShape",
														2*this.pento_block_size,
														2*this.pento_block_size,
														'F',
														'#FFB366',
														false,
														0,
														this.pento_block_size);
			this.place_shape(someShape);
			this.draw();
		}
		
		/**
		 * ! Overwrite parent function: ElephantBoard has dashed grid lines !
		 * draws a single line on the canvas
		 * @param {start x-coordinate} x
		 * @param {start y-coordinate} y
		 * @param {end x-coordinate} x2
		 * @param {end y-coordinate} y2
		 * @param {line color, can be string, rgb, rgba} color
		 * @param {name of jcanvas layer object} name
		 */
		draw_line(x, y, x2, y2, color, name) {
			if (name == undefined) {
				name = 'line' + Math.random();
			}
//			var ctx = this.canvas.getContext("2d");
//			ctx.moveTo(x,y);
//			ctx.lineTo(x2,y2);
			//ctx.stroke();
			this.pento_canvas_ref.drawLine({
				layer: true,
				name: name,
				//groups: ['grid'],
				strokeStyle: color,
				strokeWidth: 1,
				strokeDash: [5],
				x1: x, y1: y,
				x2: x2, y2: y2
			});
		}
		
//		draw() {
//			var ctx = this.canvas.getContext("2d");
//			ctx.stroke();
//		}
		
		/**
		 * Draw lines to form an elephant.
		 * ! PARAM GRID NOT YET IMPLEMENTED !
		 * {true: draw grid inside the elephant, false: only draw outline} grid
		 */
		drawElephant(grid=true) {
			// Output warning if canvas it too small
			if (this.pento_grid_cols < 11 || this.pento_grid_rows < 9) {
				console.log('Warning: Pentomino board is too small to fit an elephant. '
					+ 'Minimum size: 11x9 blocks');
			}
			// Find start coordinates to center the elephant
			var startX = this.pento_block_size * Math.max(0, Math.floor((this.pento_grid_cols-11) / 2));
			var startY = this.pento_block_size * Math.max(0, Math.floor((this.pento_grid_rows-9) / 2));
			// Draw outline
			var outlineCoords = [
				[0,0], // this is the top left / forehead
				[3,0],
				[3,1],
				[4,1],
				[4,2],
				[9,2],
				[9,3],
				[10,3],
				[10,4],
				[11,4],
				[11,9], // this is the bottom right / corner of hind leg
				[9,9],
				[9,7],
				[5,7],
				[5,9],
				[3,9],
				[3,4],
				[1,4],
				[1,6],
				[0,6]
			];
			// define layer object for outline
			var outline = {
				layer: true,
				name: 'elephantOutline',
				strokeStyle: 'black',
				strokeWidth: 3,
				closed: true
			}
			// add the coordinates
			for (let c = 0; c < outlineCoords.length; c += 1) {
				outline['x'+(c+1)] = startX + outlineCoords[c][0] * this.pento_block_size;
				outline['y'+(c+1)] = startY + outlineCoords[c][1] * this.pento_block_size;
			}
			// draw
			this.pento_canvas_ref.drawLine(outline);
		}
		
		/**
		 * ! Overwrite PentoBoard function: Here, the only interaction is clicking
		 * to activate a shape !
		 * Place and draw a shape on the canvas.
		 * {PentoShape to place} shape
		 */
		place_shape(shape) {
			var offsetX = this.get_offsets(shape.type)[0];
			var offsetY = this.get_offsets(shape.type)[1];
			var last_x;
			var last_y;
			var self = this;

			var s = {
				layer: false,
				name: shape.name,
				block_size: this.pento_block_size,
				draggable: !this.pento_read_only,
				x: shape.x, y: shape.y,
				offsetX: offsetX,
				offsetY: offsetY,
				width: this.pento_block_size * shape.get_grid_width(),
				height: this.pento_block_size * shape.get_grid_width(),
				shape: shape,
				fromCenter: true,
				click: function (layer) {
					if (!self.pento_read_only) {
						self.set_active(shape);
					}
				}
			};
			this.pento_canvas_ref.drawPentoShape(s);
			this.pento_shapes[shape.name] = shape;
			this.draw();
		}
		
		/**
		 * ! Overwrite PentoBoard function: use different rotation method that keeps
		 * shape on grid, but only allows for 90° steps !
		 * Rotates the active shape by the given angle
		 * @param {angle in degrees} angle
		 */
		rotate_shape(angle) {
			this.pento_active_shape.rotateByRearrange(angle, false);
			this.draw();
		}
		
		/**
		 * Flips the active shape
		 * @param {one of ['horizontal', 'vertical']} axis
		 * @param {true to log the action} track
		 */
		flipShape(axis) {
			this.pento_active_shape.flip(axis, false);
			this.draw();
		}
		
		
		/**
		 * ! Overwrite PentoBoard function to not draw arrows !
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
		 * Move the currently active shape to the nearest grid square
		 * (Similar to lock_shape_on_grid in PentoBoard, but here we're manipulating the
		 * shape's coordinates instead of the layer's)
		 */
		lockActiveOnGrid() {
			if (this.pento_active_shape) {
				let new_x	= Math.max(this.pento_active_shape.x, this.left_edge());
				new_x		= Math.min(new_x, this.right_edge() - this.pento_block_size);
				let new_y	= Math.max(this.pento_active_shape.y, this.upper_edge());
				new_y		= Math.min(new_y, this.lower_edge() - this.pento_block_size);
				
				// lock shape on a grid square
				new_x = Math.floor((new_x - this.pento_grid_x) / this.pento_block_size) * this.pento_block_size;
				new_y = Math.floor((new_y - this.pento_grid_y) / this.pento_block_size) * this.pento_block_size;
				this.pento_active_shape.x = new_x;
				this.pento_active_shape.y = new_y;
				this.draw();
			}
		}
	};
})

