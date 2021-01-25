
'use strict';

$(document).ready(function () {

	this.PentoGenerator = class PentoGenerator {
		constructor(form_fields, config, pento_config, target_name='target', initial_name='initial') {
			// reference to configuration objects
			this.form_fields = form_fields;
			this.config = config;
			this.pento_config = pento_config;

			// specific for pentomino
			this.pento_grid_rows = 19;
			this.pento_grid_cols = 19;
			this.pento_grid_col_min = 1;
			this.pento_grid_row_min = 1;

			// draw board frames/headers
			let with_tray = false;
			let with_grid = true;
			this.pento_board_target = new document.PentoBoard(`#${target_name}`, 'Target', with_tray, with_grid, this.pento_config);
			this.pento_board_initial = new document.PentoBoard(`#${initial_name}`, 'Initial', with_tray, with_grid, this.pento_config);

			// events and event handler
			this.events = ['target_updated', 'initial_updated', 'generation_finished'];
			this.event_handler = [[],[],[]];

			// prefix for current generation
			this.prefix_max = 10000;
			this.prefix_log = [];
		}

		/**
		 * Generates a prefix for data stored in this generation session
		 */
		generate_prefix() {
			var new_prefix = Math.floor(Math.random() * this.prefix_max).toString();
			if (this.prefix_log.indexOf(new_prefix)!=-1){
				this.generate_prefix();
			} else {
				this.prefix_log.push(new_prefix);
			}
		}

		/**
		 * Retrieves the latest prefix
		 */
		get_prefix() {
			return this.prefix_log[this.prefix_log.length-1];
		}
		
		/**
		 * Updates the properties 'readonly' and 'showgrid' for both boards.
		 */
		update() {
			this.pento_board_target.set('readonly', this.config['readonly']);
			this.pento_board_target.set('showgrid', this.config['showgrid']);

			this.pento_board_initial.set('readonly', this.config['readonly']);
			this.pento_board_initial.set('showgrid', this.config['showgrid']);
		}

		/**
		 * Register function(data) for an event ``event``
		 * @param {*} event
		 * @param {*} handler
		 */
		register_handler(event, handler) {
			var event_index = this.events.indexOf(event);
			if (event_index > -1) {
				this.event_handler[event_index].push(handler);
			}
		}

		/**
		 * Notifies event handler about change
		 * @param {*} event
		 * @param {*} data
		 */
		_fire_event(event, data) {
			var event_index = this.events.indexOf(event);
			for(var i=0; i < this.event_handler[event_index].length; i++){
				this.event_handler[event_index][i](data);
			}
		}

		/**
		 * Retrieve random number rn with rn >= min and rn <= max
		 *
		 * @param {int} min
		 * @param {int} max
		 * @param {int} step
		 */
		random_in_range(min, max, step=1) {
			return (Math.floor(Math.random() * ((max - min)/step)) + min) * step
			//return Math.floor(Math.random() * (max - min)) + min
		}

		/**
		 *
		 * @param {randomly selected shape} rand_shape
		 * @param {randomly selected action} action_type
		 * @param {copy of target shapes} shapes
		 */
		generate_params(rand_shape, action_type, shapes) {
			var max = this.pento_config.board_size;
			var min = 0;
			var rotations = [45, 90, 135, 180, 225, 270, 315];

			switch (action_type) {
				case 'move':
					var rand_x = this.random_in_range(min, max, this.pento_config.block_size);
					var rand_y = this.random_in_range(min, max, this.pento_config.block_size);
					return { 'x': rand_x, 'y': rand_y }
				case 'rotate':
					var rand_angle = rotations[Math.floor(Math.random() * rotations.length)];
					return { 'rotation': rand_angle }
				case 'connect':
					var random_other = shapes[Math.floor(Math.random() * shapes.length)];
					return { 'other_shape': random_other }
				default:
					console.log('Not implemented: ' + action_type);
					return
			}
		}

		/**
		 * Create initial state by manipulating the target state by n actions
		 * @param {copy of target shapes} shapes
		 * @param {actions} nactions
		 */
		create_initial_state(shapes, nactions) {
			$('.snapshots').empty();
			var pento_generator_actions = {};

			for (var shape_index in shapes) {
				var shape = shapes[shape_index];
				this.pento_board_initial.place_shape(shape);
			}

			var actions = this.pento_board_initial.actions;
			for (var i = 0; i < nactions; i++) {
				// select shape
				var shape_index = Math.floor(Math.random() * shapes.length);
				var random_shape = shapes[shape_index];

				var action_index = Math.floor(Math.random() * actions.length);
				var random_action = actions[action_index];
				var params = this.generate_params(random_shape, random_action, shapes);
				this.pento_board_initial.execute_action(random_action, random_shape, params);

				// check whether shape and action are valid
				if (this.pento_board_initial.isValidAction(random_action, random_shape, params)) {
					if (!pento_generator_actions.hasOwnProperty(random_shape.name)) {
						// if no action was applied to this shape and the action is valid, execute it
						pento_generator_actions[random_shape.name] = [random_action];

					} else if (pento_generator_actions[random_shape.name].length == 3 ||
						pento_generator_actions[random_shape.name].indexOf(random_action) != -1) {
						// if all possible actions where applied to this shape, select a new action and shape
						i -= 1;
						continue;
					}
					this.pento_board_initial.draw()
					pento_generator_actions[random_shape.name].push(random_action);
					this._fire_event(this.events[1], {'shape': random_shape, 'action': random_action, 'params': params});
					
				} else {
					random_shape.rollback(1);
					i -= 1;
				}
			}

			// target final
			this._fire_event(this.events[2], {'index': i});
			
		}

		/**
		 * Generates target and initial state
		 */
		generate() {
			// remove all previously generated shapesx
			this.pento_board_target.destroy_all_shapes();
			this.pento_board_initial.destroy_all_shapes();

			// set value ranges for random selection
			var columns = [...Array(this.pento_grid_cols).keys()];
			var rows = [...Array(this.pento_grid_rows).keys()];

			if (!this.config['colors']) {
				var colors = this.pento_config.get_pento_colors();
			} else {
				var colors = ['lightblue']; // all pieces get same color
			}

			var pento_types = this.pento_config.get_pento_types();
			pento_types = pento_types.filter((shape_type) => this.config['_shapes_filter'].indexOf(shape_type) == -1);

			if (this.config['shapes']) {
				var pento_types = [pento_types[Math.floor(Math.random() * pento_types.length)]];
			}

			if (pento_types.length == 0)
				return

			var rotations = [45, 90, 135, 180, 225, 270, 315];

			var rotation_counter = 0;
			var flip_counter = 0;
			var generated_shapes = [];
			var r = 0;
			var nshapes = this.config['all_selected_once'] ? pento_types.length : this.config['nshapes'];
			
			while (r < nshapes) {

				// generate random type or use each type exactly once
				var rand_type = this.config['all_selected_once'] ? pento_types[r] : pento_types[Math.floor(Math.random() * pento_types.length)];
				var rand_color = colors[Math.floor(Math.random() * colors.length)];

				// random position
				var rand_col = Math.max(columns[Math.floor(Math.random() * columns.length)], this.pento_grid_col_min);
				var rand_row = Math.max(rows[Math.floor(Math.random() * rows.length)], this.pento_grid_row_min);

				if (rotation_counter < this.config['nrotations']) {
					var rand_rot = rotations[Math.floor(Math.random() * rotations.length)];
					rotation_counter += 1;
				} else {
					rand_rot = 0;
				}

				if (flip_counter < this.config['nflips']) {
					var do_mirror = true;
					flip_counter += 1;
				} else {
					var do_mirror = false;
				}


				// create and place
				var coords = this.pento_board_target.grid_cell_to_coordinates(rand_col, rand_row);
				var block_size = this.pento_board_target.pento_block_size;
				var new_shape = document.pento_create_shape(r, coords[0], coords[1], rand_type, rand_color, do_mirror, rand_rot, block_size);

				if (this.pento_board_target.isValidAction('place', new_shape, {})) {
					this.pento_board_target.place_shape(new_shape);
					generated_shapes.push(new_shape.copy(r));
					r++;

				} else {
					this.pento_board_target.destroy_shape(new_shape);
				}
			}
			// draw current board
			this.pento_board_target.draw();

			// make an initial state and draw it on the second canvas
			this.create_initial_state(generated_shapes, this.config['nchanges']);
			this.pento_board_initial.draw();

			// change prefix for export
			this.generate_prefix();
		}
	};
})
