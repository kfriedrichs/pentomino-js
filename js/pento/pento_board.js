$(document).ready(function () {

	this.PentoBoard = class PentoBoard {

		/**
		 *
		 * @param {id of html canvas} canvas_id
		 * @param {} title
		 * @param {*} with_tray
		 * @param {*} with_grid
		 */
		constructor(canvas_id, title, with_tray, with_grid, config) {
			this.canvas_id = canvas_id;
			this.pento_canvas_ref = $(canvas_id);
			this.pento_canvas_ref.clearCanvas();

			this.title = title;
			this.config = config;
			this.pento_shapes = {};

			// board size and grid parameters
			this.pento_grid_cols	= config.n_blocks;
			this.pento_grid_rows	= config.n_blocks;
			this.width				= config.board_size;
			this.height				= config.board_size;
			this.pento_block_size	= config.block_size;
			this.pento_grid_color = 'gray';
			this.pento_grid_x = 0;
			this.pento_grid_y = 0;
			this.source_board_size; // size of source board when board is created from JSON

			// pento game parameters
			this.show_grid = with_grid;
			this.pento_read_only = false;
			this.pento_lock_on_grid = true;			// make pieces jump to full grid cells
			this.pento_prevent_collision = false;
			this.pento_active_shape = null;
			this.pento_with_tray = with_tray;
			this.remove_at_rightclick = false;		// delete shapes by right-clicking them
			this.deactivate_at_canvasleave = true;	// reset active shape when leaving the canvas

			// event handler
			this.event_handlers = [];

			// actions
			//this.actions = ['move', 'rotate', 'connect', 'flip'] // might implement these later
			this._actions = ['move', 'rotate'];

			this.init_board();
			this.init_grid();

			// register event handler
			var self = this;
			this.pento_canvas_ref.on('mouseleave', function (event) {
				if (self.deactivate_at_canvasleave) {
					self.clear_selections();
				}
			});

			$(document).keydown(function (event) {
				var dx = 2;
				var dy = 2;
				switch(event.keyCode) {
					case 37:
						self.move_active(-dx, 0);
						break;
					case 38:
						self.move_active(0, -dy);
						break;
					case 39:
						self.move_active(dx, 0);
						break;
					case 40:
						self.move_active(0, dy);
						break;
				}
				//event.preventDefault();
				self.draw();
			});

			// init actions
			//this.setup_canvas();
			this.draw();
		}
		
		get canvas() {
			return this.pento_canvas_ref[0];
		}
		

		get shapes() {
			return this.pento_shapes;
		}
		
		get actions() {
			return this._actions;
		}
		
		/**
		 * @return shape with given name
		 */
		get_shape(name) {
			return this.shapes[name];
		}

		
		
		// functions to access grid borders
		
		left_edge() {
			return this.pento_grid_x
		}
		
		right_edge() {
			return this.pento_grid_x + this.width
		}
		
		upper_edge() {
			return this.pento_grid_y
		}
		
		lower_edge() {
			return this.pento_grid_y + this.height
		}

		/**
		 * Unselect the currently active shape
		 */
		clear_selections() {
			if (this.pento_active_shape != null){
				this.pento_active_shape.set_deactive();
			}
			this.pento_active_shape = null;
			this.remove_arrows();

			this.draw();
		}

		/**
		 * Adapt the JCanvas to the boards dimension
		 */
		setup_canvas() {
			$(this.canvas_id).prop('width', this.width);
			$(this.canvas_id).prop('height', this.height);
		}


		set(key, value) {
			switch (key) {
				case 'readonly':
					this.pento_read_only = value;
					this.clear_selections();
					break;
				case 'showgrid':
					this.show_grid = value;
					this._update_grid();
					break;
				case 'remove_at_rightclick':
					this.remove_at_rightclick = value;
					break;
				default:
					console.log('unknown config option: ' + key);
			}
		}
		
		/**
		 * Draw the canvas contents to the screen
		 */
		draw() {
			this.pento_canvas_ref.drawLayers();
		}
		
		/**
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
			this.pento_canvas_ref.drawLine({
				layer: true,
				name: name,
				groups: ['grid'],
				strokeStyle: color,
				strokeWidth: 1,
				x1: x, y1: y,
				x2: x2, y2: y2
			});
		}

		draw_text(x, y, text) {
			this.pento_canvas_ref.drawText({
				layer: true,
				name: text.replace(' ', '_'),
				fillStyle: 'black',
				strokeWidth: 2,
				x: x, y: y,
				fontSize: 16,
				text: text,
				fromCenter: false
			});
		}

		destroy_board() {
			this.pento_canvas_ref.removeLayer('game_board');
			this.pento_canvas_ref.removeLayer('tray');
			this.pento_canvas_ref.removeLayer('separator');
		}

		init_board() {
			this.destroy_board();
			if (this.pento_with_tray) {
				this.pento_canvas_ref.attr('height', this.height+200);
				this.draw_line(this.pento_grid_x, this.pento_grid_y+this.height, this.pento_grid_x + this.width+200, this.pento_grid_y+this.height, 'black', 'separator');
				this.draw_text(this.pento_grid_x+40, this.pento_grid_y+ this.height+10, 'Tray');
			}
			this.draw();
		}
		
		/**
		 * Draw or remove the grid.
		 */
		_update_grid() {
			if (this.show_grid) {
				this.init_grid();
			} else {
				this.remove_grid();
			}
		}

		/**
		 * Delete the 'grid' layer from the canvas and redraw
		 */
		remove_grid() {
			this.pento_canvas_ref.removeLayer('grid');
			this.pento_canvas_ref.removeLayerGroup('grid');
			this.draw();
		}

		/**
		 * Add a grid layer to the canvas. Does not redraw automatically.
		 */
		init_grid() {
			this.pento_canvas_ref.addLayer({
				type: 'rectangle',
				name: 'grid',
				fillStyle: 'white',
				x: this.pento_grid_x, y: this.pento_grid_y,
				width: this.width, height: this.height,
				fromCenter: false
			});

			if (this.show_grid) {
				for (var i = 0; i <= this.pento_grid_rows; i++) {
					this.draw_line(this.pento_grid_x, this.pento_grid_y + i * this.pento_block_size,
						this.pento_grid_x + this.width, this.pento_grid_y + i * this.pento_block_size, this.pento_grid_color);
				}

				for (var i = 0; i <= this.pento_grid_cols; i++) {
					this.draw_line(this.pento_grid_x + i * this.pento_block_size, this.pento_grid_y + 0,
						this.pento_grid_x + i * this.pento_block_size, this.pento_grid_y + this.height, this.pento_grid_color);
				}
			}
		}
		
		/**
		 * Move shape to a grid square
		 * @param {canvas layer representing shape} layer
		 */
		lock_shape_on_grid(layer) {
			// stay inside the grid
			let new_x	= Math.max(layer.x, this.left_edge());
			new_x		= Math.min(new_x, this.right_edge() - this.pento_block_size);
			let new_y	= Math.max(layer.y, this.upper_edge());
			new_y		= Math.min(new_y, this.lower_edge() - this.pento_block_size);

			// lock shape on a grid square
			new_x = Math.floor((new_x - this.pento_grid_x + layer.offsetX) / this.pento_block_size) * this.pento_block_size;
			new_y = Math.floor((new_y - this.pento_grid_y + layer.offsetY) / this.pento_block_size) * this.pento_block_size;
			
			layer.x = new_x + this.pento_grid_x - layer.offsetX;
			layer.y = new_y + this.pento_grid_y - layer.offsetY;
			
			this.draw();
		}

		/**
		 * Is true when at least one shape collides with this shape
		 * @param {shape to check for} shape
		 */
		has_collisions(shape) {
			return this.get_collisions(shape).length > 0
		}

		/**
		 * Returns a list of shapes colliding with shape
		 * @param {shape to check for} shape
		 */
		get_collisions(shape) {
			var hits = [];
			for (var key in this.pento_shapes) {
				var other_shape = this.pento_shapes[key];

				if (other_shape.name != shape.name) {
					if (shape.hits(other_shape)) {
						hits.push(other_shape);
					}
				}
			}
			return hits
		}
		
		/**
		 * Rotates the active shape by the given angle
		 * @param {angle in degrees} angle
		 */
		rotate_shape(angle) {
			this.pento_active_shape.rotate(angle);
			this.draw();
		}
		
		/**
		 * Remove a shape from canvas and internal structure.
		 * @param {shape name or PentoShape object to remove} shape
		 */
		destroy_shape(shape) {
			var name = shape.name || shape;
			this.pento_canvas_ref.removeLayer(name);
			this.draw();
			delete this.shapes[name];
		}

		/**
		 * Remove all shapes
		 */
		destroy_all_shapes() {
			this.clear_selections();

			for (var index in this.shapes) {
				var shape = this.shapes[index];
				this.destroy_shape(shape);
			}
		}
		
		update_layer_pos(layer, new_x, new_y) {
			this.pento_canvas_ref.setLayer(layer, {
				x: new_x,
				y: new_y
				});
		}

		redraw_arrows(layer) {
			if (this.pento_active_shape != null) {
				this.remove_arrows();
			}

			var offsetX = this.get_offsets(layer.type)[0];
			var offsetY = this.get_offsets(layer.type)[1];

			var x = layer.x + offsetX;
			var y = layer.y + offsetY;
			var width = layer.block_size;
			var strokeWidth = 5;
			var rotation = this.config.rotation_step;
			var rounding = layer.block_size / 2;
			var self = this;

			// here, 'this' will be the canvas object, so we use self to refer to the board
			this.pento_canvas_ref.drawPath({
				layer: true,
				name: 'arrow_left',
				strokeStyle: '#000',
				fillStyle: 'transparent',
				strokeWidth: strokeWidth,
				p1: {
					type: 'quadratic',
					x1: x + width, y1: y + width / 2,
					cx1: x + width + rounding, cy1: y - rounding + width / 2,
					x2: x + width * 2, y2: y + width / 2,
					endArrow: true,
					rounded: true,
					arrowAngle: 60,
					arrowRadius: 10
				},
				click: function () {
					self.rotate_shape(rotation);
					self.fire_event('shape_rotated', self.pento_active_shape.name, {'angle': self.pento_active_shape.rotation});
				},
				mousedown: async function () {
					self._multi_rotation = true;
					var reduction = 0.05;
					var sleep_time = 400;
					await new Promise(r => setTimeout(r, sleep_time));

					while (self._multi_rotation && !self._multi_rotation_2) {
						self.rotate_shape(rotation);
						await new Promise(r => setTimeout(r, sleep_time));

						if (sleep_time >= 80) {
							sleep_time -= sleep_time * reduction;
						}
					}
				},
				mouseup: function () {
					self.fire_event('shape_rotated', self.pento_active_shape.name, {'angle': self.pento_active_shape.rotation});
					self._multi_rotation = false;
				}
			});

			this.pento_canvas_ref.drawPath({
				layer: true,
				name: 'arrow_right',
				strokeStyle: '#000',
				fillStyle: 'transparent',
				strokeWidth: strokeWidth,
				p1: {
					type: 'quadratic',
					x1: x, y1: y + width / 2,
					cx1: x + rounding - width, cy1: y - rounding + width / 2,
					x2: x - width, y2: y + width / 2,
					endArrow: true,
					arrowAngle: -60,
					arrowRadius: 10
				},
				click: function () {
					self.rotate_shape(-rotation);
					self.fire_event('shape_rotated', self.pento_active_shape.name, {'angle': self.pento_active_shape.rotation});
				},
				mousedown: async function () {
					self._multi_rotation_2 = true
					var reduction = 0.05
					var sleep_time = 400
					await new Promise(r => setTimeout(r, sleep_time));

					while (self._multi_rotation_2 && !self._multi_rotation) {
						self.rotate_shape(-rotation)
						await new Promise(r => setTimeout(r, sleep_time));

						if (sleep_time >= 80) {
							sleep_time -= sleep_time * reduction
						}
					}
				},
				mouseup: function () {
					self.fire_event('shape_rotated', self.pento_active_shape.name, {'angle': self.pento_active_shape.rotation});
					self._multi_rotation_2 = false;
				}
			});
		}
		
		/**
		 * Delete the arrows from the canvas.
		 */
		remove_arrows() {
			this.pento_canvas_ref.removeLayer('arrow_left');
			this.pento_canvas_ref.removeLayer('arrow_right');
		}

		update_arrows(layer, is_drag) {
			var dx = layer.dx;
			var dy = layer.dy;
			var arrow_left = this.pento_canvas_ref.getLayer('arrow_left');
			arrow_left.x += dx;
			arrow_left.y += dy;

			var arrow_right = this.pento_canvas_ref.getLayer('arrow_right');
			arrow_right.x += dx;
			arrow_right.y += dy;

			if (is_drag) {
				this.pento_active_shape.shadowColor = 'black';
				this.pento_active_shape.shadowX = 1;
				this.pento_active_shape.shadowY = -1;
				this.pento_active_shape.shadowBlur = 3;
			} else {
				this.pento_active_shape.shadowColor = 'transparent';
			}
		}
		
		/**
		 * Move shape to foreground and highlight it
		 * @param {PentoShape to set active} shape
		 */
		set_active(shape) {
			if (this.pento_active_shape != null){
				this.pento_active_shape.set_deactive();
			}
			this.pento_canvas_ref.moveLayer(shape.name, -1);
			this.pento_active_shape = shape;
			this.redraw_arrows(shape);
			shape.set_active();
		}

		//TODO: remove this function?
		get_offsets(type) {
			// returns offsets for (x,y) coordinates to position
			// drawing in the middle of the shape area
			return [0, 0];
		}
		
		/**
		 * Place and draw a shape on the canvas.
		 * {PentoShape to place} shape
		 */
		place_shape(shape) {
			var offsetX = this.get_offsets(shape.type)[0];
			var offsetY = this.get_offsets(shape.type)[1];
			var last_x;
			var last_y;
			var self = this;

			this.pento_canvas_ref.drawPentoShape({
				layer: true,
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
				mouseover: function (layer) {
					if (!self.pento_read_only) {
						self.set_active(shape);
					}
				},
				click: function (layer) {
					if (!self.pento_read_only) {
						self.set_active(shape);
					}
				},
				dragstart: function (layer) {
					// code to run when dragging starts
					if (!self.pento_read_only) {
						self.update_arrows(layer, true);
						layer.x = shape.x;
						layer.y = shape.y;
						last_x = layer.x;
						last_y = layer.y;
					}
				},
				drag: function (layer) {
					// code to run as layer is being dragged
					if (!self.pento_read_only) {
						self.update_arrows(layer, true);
						shape.x = layer.x;
						shape.y = layer.y;
					}
				},
				dragstop: function (layer) {
					if (!self.pento_read_only) {
						// code to run when dragging stops
						var layer_x = layer.x + layer.width / 2;
						var layer_y = layer.y + layer.height / 2;

						if (self.pento_lock_on_grid) {
							self.lock_shape_on_grid(layer);
						}

						if (self.has_collisions(layer['shape']) && self.pento_prevent_collision) {
							layer.x = last_x;
							layer.y = last_y;
						} else {
							shape.moveTo(layer.x, layer.y);
						}
						self.update_arrows(layer, false);
						self.set_active(layer.shape);

						self.fire_event('shape_moved', shape.name, { 'x': layer.x, 'y': layer.y });
					}
				},
				contextmenu: function (layer) {
					if (self.remove_at_rightclick) {
						self.destroy_shape(shape);
					}
				}
			});
			this.pento_shapes[shape.name] = shape;
			this.draw();
		}

		grid_cell_to_coordinates(col, row) {
			return [col * this.pento_block_size, row * this.pento_block_size]
		}

		/**
		 * Checks if action and shape are valid considering the current board state
		 * @param {*} action_name
		 * @param {*} shape
		 * @param {*} params
		 */
		isValidAction(action_name, shape, params) {
			// make extra check for place as this is a one time action
			if ((this.actions.indexOf(action_name) != -1 || action_name == 'place') &&
				shape.is_inside(this.pento_grid_x, this.pento_grid_y, this.pento_grid_x+this.width, this.pento_grid_y+this.height)) {
				switch (action_name) {
					case 'connect':
						if (!params['other_shape'].is_connected(shape) && shape.name != params['other_shape']) {
							return true;
						}
						break;
					case 'place':
						if (!this.has_collisions(shape)) {
							return true;
						}
						break;
					case 'move':
						if (!this.has_collisions(shape) && !shape.has_connections()) {
							return true;
						}
						break;
					case 'rotate':
						if (!this.has_collisions(shape) && !shape.has_connections()) {
							return true;
						}
						break;
					case 'flip':
						if (!this.has_collisions(shape) && !shape.has_connections()) {
							return true;
						}
						break;
				}
			}
			return false;
		}

		execute_action(action_name, shape, params) {
			switch (action_name) {
				case 'move':
					shape.moveTo(params['x'], params['y']);
					// layer needs to be updated for change to take effect
					this.update_layer_pos(shape.name, params['x'], params['y']);
					this.fire_event('shape_moved', shape.name, { 'x': params['x'], 'y': params['y'] });
					break;
				case 'rotate':
					shape.rotate(params['rotation']);
					this.fire_event('shape_rotated', shape.name, { 'rotation': params['rotation'] });
					break;
				case 'connect':
					var group_id = shape.connect_to(params['other_shape']);
					this.fire_event('shape_connected', shape.name, {
						'other_shape': params['other_shape'].name,
						'group_id': group_id
					});
					break;
				default:
					console.log('Unknown action: ' + action_name);
			}
		}

		/**
		 * Move active shape by a delta x, y
		 * @param {*} dx
		 * @param {*} dy
		 */
		move_active(dx, dy) {
			if (this.pento_active_shape) {
				var coords = this.pento_active_shape.get_coords();
				this.pento_active_shape.moveTo(coords[0] + dx, coords[1] + dy);
			}
			this.draw();
		}

		// event functions
		/**
		 * Add an event handler
		 * @param {handler object with 'handle' attribute: function(event){}} handler
		*/
		register_event_handler(handler) {
			this.event_handlers.push(handler);
		}
		
		/**
		 * Pass event to event handlers
		 * @param {info for event handlers} event_type
		 * @param {info for event handlers} event_object_id
		 * @param {info for event handlers} event_changes
		 */
		fire_event(event_type, event_object_id, event_changes) {
			var event = {
				'type': event_type,
				'object_id': event_object_id,
				'changes': event_changes
			};

			this.event_handlers.forEach(handler => handler.handle(event));
		}

		// utility
		saveBoard(shared_name) {
			var self = this;
			this.canvas.toBlob(function (data) {
				saveAs(data, (shared_name == null ? '' : shared_name) + '_'+ self.title +'.png')
			});
		}

		toJSON() {
			var shapes = Object.assign({}, this.pento_shapes);

			for (var shape_index in shapes) {
				var shape = shapes[shape_index];

				var sum_changes = [
					{'name': 'move', 'x': 0, 'y':0},
					{'name':'rotate', 'angle': 0}
				];
				for (var i=1; i < shape.changes.length; i++) {
					var change = shape.changes[i];
					if (change['name'] == 'move') {
						sum_changes[0]['x'] = change['x'];
						sum_changes[0]['y'] = change['y'];
					} else if (change['name'] == 'rotate') {
						sum_changes[1]['angle'] += change['angle'];
					}
				}
				
				if (sum_changes[1]['angle'] == 0) {
					sum_changes = sum_changes.slice(0,1);
				} else {
					sum_changes[1]['angle'] = 360 % sum_changes[1]['angle'];
				}

				if (sum_changes[0]['x'] == 0 && sum_changes[0]['y'] == 0) {
					sum_changes = sum_changes.slice(0,0);
				}

				shape.changes = sum_changes;
			}
			return shapes;
		}
		
				/**
		 * @return factor to scale pieces from source JSON size to this board's size
		 */
		scale_to_target_size() { return this.width/this.source_board_size; }
		/**
		 * @return factor to scale this board's pieces to the original JSON's size
		 */
		scale_to_source_size() { return this.source_board_size/this.width; }

		/**
		 * Import canvas config from data read from a json file
		 * @param {json object containing shape objects} shapes
		 * @param {size of canvas described by the json file. default: 400} saved_board_size
		 */
		fromJSON(shapes, saved_board_size=400) {
			this.destroy_all_shapes();
			this.source_board_size = saved_board_size;
			for (var s in shapes) {
				var shape = Object.assign(new document.Shape, shapes[s]);
				// adapt shapes to this board's settings
				shape.scale(this.pento_block_size, this.scale_to_target_size());
				shape.close();
				// apply given rotation
				shape.rotate(shape.rotation);
				this.place_shape(shape);
			}
			this.draw();
		}

//		fromJSON(shapes) {
//			this.destroy_all_shapes();
//
//			for (var s in shapes) {
//				var shape = Object.assign(new document.Shape, shapes[s]);
//
//				var blocks = [];
//				for (var b in shape.get_blocks()) {
//					var block_data = shape.get_blocks()[b];
//					var block = Object.assign(new document.Block, block_data);
//					blocks.push(block);
//				}
//				shape.blocks = blocks;
//
//				shape.close();
//				// apply given rotation
//				shape.rotate(shape.rotation);
//				this.place_shape(shape);
//			}
//			this.draw();
//		}

		hashCode() {
			var s = this.toJSON().toString();
			for (var i = 0, h = 0; i < s.length; i++)
				h = Math.imul(31, h) + s.charCodeAt(i) | 0;
			return h
		}
	};

})

