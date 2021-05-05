$(document).ready(function () {

	this.Block = class Block {
		constructor(x, y, width, height, color) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
			this.color = color;
			this.border_color = 'black';
			this.rotation = 0;

			this.shape_center_x = 0;
			this.shape_center_y = 0;

			this.create_vertices();
		}

		get_x(){
			return this._vertices[0][0]
		}

		get_y(){
			return this._vertices[0][1]
		}

		get_center(){
			var x_sum = 0;
			var y_sum = 0;
			for (var vertex_index in this._vertices) {
				var vertex = this._vertices[vertex_index];
				x_sum += vertex[0];
				y_sum += vertex[1];
			}
			return [x_sum/this._vertices.length, y_sum/this._vertices.length]
		}

		set_shape_center(center_dx, center_dy) {
			this.shape_center_x = center_dx || 0;
			this.shape_center_y = center_dy || 0;
		}

		is_inside(bbox, offsetX, offsetY) {
			for (var vertex_index in this._vertices) {
				var vertex = this._vertices[vertex_index];
				var point_x = vertex[0] + offsetX;
				var point_y = vertex[1] + offsetY;
				if (point_x < bbox[0] || point_x > bbox[0] + bbox[2] || point_y > bbox[1] + bbox[3] || point_y < bbox[1]) {
					return false
				}
			}
			return true
		}

		/**
		 * Returs a deepcopy of this block
		 */
		copy() {
			var block_copy = Block(this.x, this.y, this.width, this.height, this.color);
			return block_copy
		}

		create_vertices() {
			this._vertices = [
				[this.x, this.y],
				[this.x + this.width, this.y],
				[this.x + this.width, this.y + this.height],
				[this.x, this.y + this.height]
			];

			this._edge_style = [0.5,0.5,0.5,0.5];
		}

		get_vertices(){
			return this._vertices
		}

		get_edge_style(row){
			return this._edge_style[row]
		}

		set_edge_style(row, style){
			this._edge_style[row] = style;
		}

		get_vertex(row, col) {
			return this._vertices[row][col]
		}

		set_vertex(row, col, value) {
			this._vertices[row][col] = value;
		}

		_move(dx, dy) {
			this.x += dx;
			this.y += dy;
			this._update_vertices(dx, dy);
		}

		_update_vertices(dx, dy) {
			for (var i = 0; i < this._vertices.length; i++) {
				var vertex = this._vertices[i];
				vertex[0] += dx;
				vertex[1] += dy;
			}
		}

		/**
		 * Rotate the whole shape
		 * @param {Angle of rotation in degrees} angle 
		 */
		rotate(delta_angle, new_angle) {
			// move to center
			this._move(-this.shape_center_x, -this.shape_center_y);

			// do rotation of vertices
			for (var i = 0; i < this._vertices.length; i++) {
				var vertex = this._vertices[i];
				var x = vertex[0];
				var y = vertex[1];
				this.set_vertex(i, 0, Math.cos(delta_angle * Math.PI / 180) * x - Math.sin(delta_angle * Math.PI / 180) * y);
				this.set_vertex(i, 1, Math.sin(delta_angle * Math.PI / 180) * x + Math.cos(delta_angle * Math.PI / 180) * y);
			}

			// move back to original position
			this._move(this.shape_center_x, this.shape_center_y);

			// store current rotation
			this.rotation = new_angle;
		}
		
		/**
		 * Rotates the shape by angle. This implementation rearranges the blocks on the
		 * internal matrix. Only angles 90, -90, 180 and -180 are possible
		 * @param {turning angle, one of [90,-90,180,-180]} angle
		 * @param {true to log the action to the changes array} track
		 */
		rotateByRearrange(delta_angle, new_angle) {
			if (delta_angle == 90 || delta_angle == -270) {
				// new x is (-1) * old y; new y is old x
				this._move((-1) * this.y - this.x, this.x - this.y);
			} else if (delta_angle == -90 || delta_angle == 270) {
				// new x is old y; new y is (-1) * old x
				this._move(this.y - this.x, (-1) * this.x  - this.y);
			} else if (Math.abs(delta_angle) == 180) {
				// new x is (-1) * old x; new y is (-1) * old y
				this._move((-1) * this.x - this.x, (-1) * this.y - this.y);
			} else {
				console.log(`Angle ${delta_angle} not applicable to method rotateByRearrange. ` +
					'Only angles [90,-90,180,-180] allowed, use method rotate otherwise');
				return;
			}
			// store current rotation
			this.rotation = new_angle;
		}
		
		/**
		 * Moves the block to perform a shape flip
		 * @param {reflection axis: one of [horizontal, vertical]} axis
		 */
		flip(axis) {
			if (axis == 'horizontal') {
				this._move(0, (-2) * this.y);
			} else if (axis == 'vertical') {
				this._move((-2) * this.x, 0);
			} else {
				console.log(`Unknown axis: ${axis} at PentoBlock.flip(). `+
					'Options: [horizontal, vertical');
			}
		}
		
		/**
		 * Resizes the block and adapts its coordinates to match a new board size.
		 * @param {new size} block_size
		 * @param {new board size / old board size} pos_factor
		 */
		scale(block_size, pos_factor) {
			this.width = block_size;
			this.height = block_size;
			this.x *= pos_factor;
			this.y *= pos_factor;
		}

		/**
		 * Calculates an overlap of two polygons using their vertices and the SAT method (Separating Axis Theorem)
		 * @param {block for comparison} block 
		 * @param {delta of shapes x coord} dx 
		 * @param {delta of shapes y coord} dy 
		 */
		hits(block, dx, dy) {
			// create a copy of own vertices
			var a = [];
			for (var vi in this._vertices.slice()) {
				a.push([this._vertices[vi][0] + 0, this._vertices[vi][1] + 0]);
			}
			var b = block._vertices.slice()

			// apply delta of shapes positions
			for (var i = 0; i < a.length; i++) {
				var vertex = a[i];
				vertex[0] += dx;
				vertex[1] += dy;
			}

			var rectangles = [a, b];
			var minA, maxA, projected, i, i1, j, minB, maxB;

			for (i = 0; i < rectangles.length; i++) {

				// for each polygon, look at each edge of the polygon, and determine if it separates
				// the two shapes
				var rectangle = rectangles[i];
				for (i1 = 0; i1 < rectangle.length; i1++) {

					// grab 2 vertices to create an edge
					var i2 = (i1 + 1) % rectangle.length;
					var p1 = rectangle[i1];
					var p2 = rectangle[i2];

					// find the line perpendicular to this edge
					var normal = { x: p2[1] - p1[1], y: p1[0] - p2[0] };

					minA = maxA = undefined;
					// for each vertex in the first shape, project it onto the line perpendicular to the edge
					// and keep track of the min and max of these values
					for (j = 0; j < a.length; j++) {
						projected = normal.x * a[j][0] + normal.y * a[j][1];
						if (minA == undefined || projected < minA) {
							minA = projected;
						}
						if (maxA == undefined || projected > maxA) {
							maxA = projected;
						}
					}

					// for each vertex in the second shape, project it onto the line perpendicular to the edge
					// and keep track of the min and max of these values
					minB = maxB = undefined;
					for (j = 0; j < b.length; j++) {
						projected = normal.x * b[j][0] + normal.y * b[j][1];
						if (minB == undefined || projected < minB) {
							minB = projected;
						}
						if (maxB == undefined || projected > maxB) {
							maxB = projected;
						}
					}

					// if there is no overlap between the projects, the edge we are looking at separates the two
					// polygons, and we know there is no overlap
					if (maxA < minB || maxB < minA) {
						return false;
					}
				}
			}
			return true;
		}

	};

	this.pento_create_block = function (x, y, block_size, color) {
		return new this.Block(x, y, block_size, block_size, color)
	};
})

