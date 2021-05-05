$(document).ready(function () {

	//--- Define variables
	// fields the user can edit
	// insert new fields by tuple [id_of_html_element_without, default_value, is_bool?]
	var form_fields = [
		['nshapes', 1],
		['nchanges', 0], // no changes in generation since we do them manually
		['colors', false, true],
		['shapes', false, true],
		['all_selected_once', false, true], // use this mode to generate exactly one piece of each type
		['showgrid', true, true],
		['readonly', false, true]
	];

	// save settings
	// specific for generator
	var config = {};
	config['_shapes_filter'] = [];
	for (var i = 0; i < form_fields.length; i++) {
		var value = localStorage.getItem(form_fields[i]);
		config[form_fields[i][0]] = value === null ? form_fields[i][1] : value;
	}

	var pento_config = new document.PentoConfig();
	// target board contains the task goal, initial board the start positions
	let target_name = 'board';
	let initial_name = 'initial';

	//--- initiate generator
	var generator = new document.PentoGenerator(form_fields, config, pento_config, target_name=target_name, initial_name=initial_name);

	//-- generator utility
	/**
	 * Updates internal states and configurations
	 * based on User input
	 */
	var update = function (config, pento_config) {
		for (var key in config) {
			if (!key.startsWith('_')) {
				var is_bool = (key == 'colors' || key == 'readonly' || key == 'shapes' || key == 'showgrid' || key=='all_selected_once');
				let user_set_value = get_ui_value(key, is_bool);
				// user_set_value === user_set_value is used to ignore NaN
				config[key] = user_set_value === user_set_value ? user_set_value : config[key];
			}
		}

		// store data
		store_inputs();
		var shapes = pento_config.get_pento_types();
		shapes.forEach(function (item, index) {
			var value = $('input.shape-type-' + item).is(':checked') ? '1' : '0';
			localStorage.setItem('exclude_' + item, value);
		})

		// update shape type filter
		$('input#ntype').each(function (index, item) {
			if (!$(item).is(':checked')) {
				config['_shapes_filter'].push($(item).attr('shape_type'));
			} else {
				config['_shapes_filter'] = config['_shapes_filter'].filter((element) => element != $(item).attr('shape_type'));
			}
		})

		// update boards
		generator.update();
	}

	//--- export and import boards

	this.export_as_png = function () {
		var rand_prefix = generator.get_prefix();
		this.save_boards_as_image(rand_prefix);
	};

	/**
	 * Makes an image copy of the boards and triggers download
	 */
	this.save_boards_as_image = function (rand_prefix) {
		generator.pento_board_initial.clear_selections();
		generator.pento_board_target.clear_selections();

		generator.pento_board_initial.saveBoard(rand_prefix);
		generator.pento_board_target.saveBoard(rand_prefix);
	};

	this.export_as_json = function (rand_prefix) {
		var json_content = {};
		var file_name = (rand_prefix == null ? '' : rand_prefix) + '_pento_task.json';


		json_content['initial'] = generator.pento_board_initial.toJSON();
		json_content['task'] = generator.pento_board_target.toJSON();

		// Create a blob of the data
		var fileToSave = new Blob([JSON.stringify(json_content, null, 2)], {
			type: 'application/json',
			name: file_name
		});

		// Save the file
		saveAs(fileToSave, file_name);
	};

	/**
	* Initiates form
	*/
	var init_form = function (pento_config) {

		var shapes = pento_config.get_pento_types();
		shapes.forEach(function (item, index) {
			var checked = localStorage.getItem('exclude_' + item);
			if (checked == '1') {
				checked = 'checked=\'1\'';
			} else {
				checked = '';
			}
			$('.shape-select').append(
				'<div class=\'one column\'><label>' + item + '&nbsp;</label><input id=\'ntype\' shape_type=\'' + item
				+ '\' class=\'shape-type-' + item + '\' type=\'checkbox\' ' + checked + '/><br></div>');
		});

		for (var i = 0; i < form_fields.length; i++) {
			set_ui_value(form_fields[i][0], form_fields[i][1], form_fields[i].length > 2 ? form_fields[i][2] : null);
		}

	};

	/**
	 * Set value of UI Widget
	 */
	var set_ui_value = function (id, default_value, is_check) {
		if (is_check === true) {
			$('input#' + id).prop('checked', localStorage.getItem(id) === 'true');
		} else {
			$('input#' + id).val(localStorage.getItem(id) == null ? default_value : localStorage.getItem(id));
		}
	};

	/**
	 * Retrieve current value of UI Widget
	 */
	var get_ui_value = function (id, is_bool) {
		if (is_bool) {
			return $('input#' + id).is(':checked');
		} else {
			return parseInt($('input#' + id).val());
		}
	};

	/**
	 * Toggles selection of all shapes
	 */
	this.toggle_shape_select = function () {
		var shapes = pento_config.get_pento_types();
		shapes.forEach(function (item, index) {
			var shape_widget = $('input.shape-type-' + item);
			var toggle = shape_widget.is(':checked') ? false : true;
			shape_widget.prop('checked', toggle);
		});
		update(config, pento_config);
	}

	/**
	 * Saves values of input widgets in local storage
	 */
	var store_inputs = function () {
		for (var key in config) {
			localStorage.setItem(key, config[key]);
		}
	};

	this.generate = function () {
		generator.generate();
		// Shapes in task board are removable at right-click
		generator.pento_board_initial.set("remove_at_rightclick", true);
		generator.pento_board_target.set("remove_at_rightclick", true);
	};

	//--- start
	init_form(pento_config);
	update(config, pento_config);

	//--- User event handeling
	$('input').change(function () {
		update(config, pento_config);
	});

})
