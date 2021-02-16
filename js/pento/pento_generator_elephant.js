$(document).ready(function () {
	
	/**
	 * Generates two PentoSelectionBoards, one of which contains the shapes arranged in
	 * an elephant formation. The other contains the same pieces placed and rotated randomly.
	 * All pieces are used exactly once, colors are generated randomly.
	 */
	this.PentoGeneratorElephant = class PentoGeneratorElephant {
		constructor(pento_config, with_grid=true, read_only=false, target_name='target', initial_name='initial', layerless=false) {
			this.pento_config = pento_config;

			this.pento_grid_rows = pento_config.n_blocks;
			this.pento_grid_cols = pento_config.n_blocks;

			// draw board frames/headers
			let with_tray = false;
			if (layerless) {
				this.pento_board_elephant = new document.PentoLayerlessSelectionBoard(`#${target_name}`, 'Elephant', with_grid, this.pento_config, read_only=read_only);
				this.pento_board_initial = new document.PentoLayerlessSelectionBoard(`#${initial_name}`, 'Initial', with_grid, this.pento_config, read_only=read_only);
			} else {
				this.pento_board_elephant = new document.PentoSelectionBoard(`#${target_name}`, 'Elephant', with_grid, this.pento_config, read_only=read_only);
				this.pento_board_initial = new document.PentoSelectionBoard(`#${initial_name}`, 'Initial', with_grid, this.pento_config, read_only=read_only);
			}

			// events and event handler
			this.events = ['target_updated', 'initial_updated', 'generation_finished'];
			this.event_handler = [[],[],[]];
			
			// Setup for the elephant board
			// Output warning if canvas it too small
			if (this.pento_grid_cols < 11 || this.pento_grid_rows < 9) {
				console.log('Warning: Pentomino board is too small to fit an elephant. '
					+ 'Minimum size: 11x9 blocks');
			}
			// Find start coordinates to center the elephant
			// (all coordinates are given in terms of blocks)
			this.elephantX = Math.max(0, Math.floor((this.pento_grid_cols-11) / 2));
			this.elephantY = Math.max(0, Math.floor((this.pento_grid_rows-9) / 2));
			this.elephantCoords = {
				'F': {'x':4 , 'y':4},
				'I': {'x':3 , 'y':6},
				'L': {'x':10 , 'y':7},
				'N': {'x':4 , 'y':7},
				'P': {'x':7 , 'y':3},
				'T': {'x':8 , 'y':6},
				'U': {'x':0 , 'y':1},
				'V': {'x':1 , 'y':4},
				'W': {'x':9 , 'y':3},
				'X': {'x':2 , 'y':1},
				'Y': {'x':5 , 'y':2},
				'Z': {'x':7 , 'y':5}
			}
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
		 * @param {one of ['move', 'rotate']} action_type
		 * @param {copy of target shapes} shapes
		 */
		generate_params(rand_shape, action_type) {
			var max = this.pento_config.board_size;
			var min = 0;
			var rotations = [90, 180, 270];
			var axis = ['horizontal', 'vertical'];

			switch (action_type) {
				case 'move':
					let rand_x = this.random_in_range(min, max, this.pento_config.block_size);
					let rand_y = this.random_in_range(min, max, this.pento_config.block_size);
					return { 'x': rand_x, 'y': rand_y };
				case 'rotate':
					let rand_angle = rotations[Math.floor(Math.random() * rotations.length)];
					return { 'rotation': rand_angle };
				case 'flip':
					let rand_axis = axis[Math.floor(Math.random() * axis.length)];
					return { 'axis': rand_axis };
				default:
					console.log('Not implemented: ' + action_type);
					return;
			}
		}

		/**
		 * Create initial state by manipulating the target state by n actions
		 * @param {copy of target shapes} shapes
		 * @param {actions} nactions
		 */
		create_initial_state(shapes) {
			// likelihood of an action (rotate, flip) being performed
			let action_likelihood = 0.5;
			let action_counter = 0;
			
			let actions = this.pento_board_initial.actions;
			// remove action 'connect' if present
			if (actions.includes('connect')) {
				actions.splice(actions.indexOf('connect'), 1);
			}
			for (let shape of shapes) {
				this.pento_board_initial.place_shape(shape);
				
				// MOVE, ROTATE, FLIP
				for (let action of ['move', 'rotate', 'flip']) {
					if (!this.pento_board_initial.actions.includes(action)) {
						console.log(`${this.pento_board_initial.title} does not support action ${action}`);
					} else {
						// Always perform 'move'. Decide randomly whether to perform 'rotate' and 'flip'
						if (action == 'move' || Math.random() < action_likelihood) {
							// generate a valid set of parameters
							let params = this.generate_params(shape, action);
							this.pento_board_initial.execute_action(action, shape, params);
							let attempts = 0; // assure loop termination if action is impossible due to board size
							while (!this.pento_board_initial.isValidAction(action, shape, params) && attempts < 20) {
								shape.rollback(1);
								params = this.generate_params(shape, action);
								this.pento_board_initial.execute_action(action, shape, params);
								++attempts;
							}
							// emit warning if invalid parameters where used
							if (attempts >= 20) {
								console.log(`No valid parameters were found for shape ${shape.name} and action ${action} during ${attempts} iterations. Result may contain overlaps.`);
								continue;
							}
							
							this._fire_event(this.events[1], {'shape': shape, 'action': action, 'params': params});
							++action_counter;
						}
					}
				}
			}
			// fire event 'generation_finished'
			this._fire_event(this.events[2], {'index': action_counter});
		}
		
		generate() {
			// All shapes are used once to create the elephant
			// remove all previously generated shapes
			this.pento_board_elephant.destroy_all_shapes();
			this.pento_board_initial.destroy_all_shapes();

			// set value ranges for random selection
			var columns =			[...Array(this.pento_grid_cols).keys()];
			var rows =				[...Array(this.pento_grid_rows).keys()];
			
			// generation parameters
			var colors =			this.pento_config.get_pento_colors();
			var pento_types =		this.pento_config.get_pento_types();

			var generated_shapes = 	[];
			
			for (let id=0; id<pento_types.length; id++) {
				let rand_color = colors[Math.floor(Math.random() * colors.length)];
				
				// place on elephant board (predefined position)
				let eleX = this.elephantX + this.elephantCoords[pento_types[id]]['x'];
				let eleY = this.elephantY + this.elephantCoords[pento_types[id]]['y'];
				let coords = this.pento_board_elephant.grid_cell_to_coordinates(eleX, eleY);
				
				// create shape for the elephant board: without flip or rotation
				let new_shape = document.pento_create_shape(id, coords[0], coords[1], pento_types[id], rand_color, false, 0, this.pento_config.block_size);
				this.pento_board_elephant.place_shape(new_shape);
				generated_shapes.push(new_shape.copy(id));
			}
			
			// draw elphant board
			this.pento_board_elephant.draw();
			
			// now move, rotate, flip shape randomly to create initial board
			this.create_initial_state(generated_shapes);
			this.pento_board_initial.draw();
		}
	};
})
