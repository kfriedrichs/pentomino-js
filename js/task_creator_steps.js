$(document).ready(function () {
    //--- Self Test for collision detection system
    console.log("-----Self Test-----")
    var block1 = this.pento_create_block(10, 20, 20, "blue")
    var block2 = this.pento_create_block(11, 21, 20, "red")
    var block3 = this.pento_create_block(0, 0, 20, "red")

    var collision = block1.hits(block2)
    var collision2 = block3.hits(block2)
    console.log("Block Collision Test: " + (collision2 == collision))

    var shape1 = this.pento_create_shape(0, 10, 10, 'I', 'blue', false, 0, 20)
    var shape2 = this.pento_create_shape(1, 30, 91, 'I', 'red', false, 0, 20)
    console.log("Shape Collision Test: " + (shape1.hits(shape2) == shape2.hits(shape1)))

    //--- Define variables
    // fields the user can edit
    // insert new fields by tuple [id_of_html_element_without, default_value, is_bool?]
    // WARNING: nrotations, nflips and nconnections are not yet fully implemented
    var form_fields = [
        ["nshapes", 1],
        ["nrotations", 0],
        ["nflips", 0],
        ["nchanges", 1],
        ["nconnections", 0],
        ["colors", false, true],
        ["shapes", false, true],
        ["readonly", false, true],
        ["showgrid", true, true]
    ]

    // parameters
    // specific for generator
    var config = {}
    config["_shapes_filter"] = []
    for (var i = 0; i < form_fields.length; i++) {
        var value = localStorage.getItem(form_fields[i])
        config[form_fields[i][0]] = value === null ? form_fields[i][1] : value
    }

    var pento_config = new document.PentoConfig()

    //--- initiate generator
    var generator = new document.PentoGenerator(form_fields, config, pento_config)

    //-- generator utility
	/**
     * Updates internal states and configurations
     * based on User input
     */
    var update = function (config, pento_config) {
        for (var key in config) {
            if (!key.startsWith("_")) {
                var is_bool = (key == "colors" || key == "readonly" || key == "shapes" || key == "showgrid")
                config[key] = get_ui_value(key, is_bool)
            }
        }

        // store data
        store_inputs()
        var shapes = pento_config.get_pento_types()
        shapes.forEach(function (item, index) {
            var value = $('input.shape-type-' + item).is(":checked") ? "1" : "0"
            localStorage.setItem("exclude_" + item, value)
        })

        // update shape type filter
        $('input#ntype').each(function (index, item) {
            if (!$(item).is(":checked")) {
                config["_shapes_filter"].push($(item).attr("shape_type"))
            } else {
                config["_shapes_filter"] = config["_shapes_filter"].filter((element) => element != $(item).attr("shape_type"))
            }
        })

        // update boards
        generator.update()

        // update counters
        $(".complexity-actions").html(config["nchanges"])
    }

    /**
     * 
     * @param {index of screenshot} index 
     * @param {canvas to copy} canvas_id 
     * @param {action to display} action 
     * @param {if screenshot should be prepended or appended} do_prepend 
     */
    var make_board_screenshot = function (index, canvas_id, action, do_prepend) {
        var element = '<canvas class="snapshot center" id="snapshot_' + index + '" width="300px" height="300px"></canvas>'
        if (do_prepend) {
            $('.snapshots').prepend(element)
        } else {
            $('.snapshots').append(element)
        }


        //grab the context from your destination canvas
        var destCtx = $('#snapshot_' + index)[0].getContext('2d');

        //call its drawImage() function passing it the source canvas directly
        destCtx.drawImage($(canvas_id)[0], 0, 0, 300, 300);

        destCtx.font = "11px Arial";
        destCtx.fillText(action, 4, 300 - 4);
    }

    //--- generator event handeling
    generator.register_handler("initial_updated", function (data) {
        var paramString = ""
        var params = data["params"]
        var random_shape = data["shape"]
        var random_action = data["action"]

        for (var key in params) {
            paramString += key + "=" + params[key] + ","
        }
        make_board_screenshot(i, '#initial', random_action + " (" + paramString + "id=" + random_shape.name + ")", true)
    })

    generator.register_handler("generation_finished", function (data) {
        make_board_screenshot(data["index"] + 2, '#target', "END", false)
    })

    //--- export and import boards

    this.export_as_png = function () {
        var rand_prefix = generator.get_prefix()
        this.save_boards_as_image(rand_prefix)
    }

    /**
     * Makes an image copy of the boards and triggers download
     */
    this.save_boards_as_image = function (rand_prefix) {
        generator.pento_board_initial.clear_selections()
        generator.pento_board_target.clear_selections()

        generator.pento_board_initial.saveBoard(rand_prefix)
        generator.pento_board_target.saveBoard(rand_prefix)
    }

    this.export_as_json = function (rand_prefix) {
        var json_content = {}
        var file_name = (rand_prefix == null ? "" : rand_prefix) + '_pento_data.json';

        json_content["target"] = generator.pento_board_target.toJSON()
        json_content["initial"] = generator.pento_board_initial.toJSON()

        // Create a blob of the data
        var fileToSave = new Blob([JSON.stringify(json_content, null, 2)], {
            type: 'application/json',
            name: file_name
        });

        // Save the file
        saveAs(fileToSave, file_name);
    }

    this.import_json = function () {
        $("#target_file").click();
    }

    /**
 * Initiates form
 */
    var init_form = function (pento_config) {

        var shapes = pento_config.get_pento_types()
        shapes.forEach(function (item, index) {
            var checked = localStorage.getItem("exclude_" + item)
            if (checked == "1") {
                checked = "checked=\"1\""
            } else {
                checked = ""
            }
            $('.shape-select').append(
                '<div class="one column"><label>' + item + '&nbsp;</label><input id="ntype" shape_type="' + item
                + '" class="shape-type-' + item + '" type="checkbox" ' + checked + '/><br></div>')
        })

        for (var i = 0; i < form_fields.length; i++) {
            set_ui_value(form_fields[i][0], form_fields[i][1], form_fields[i].length > 2 ? form_fields[i][2] : null)
        }

    }

    /**
     * Set value of UI Widget
     */
    var set_ui_value = function (id, default_value, is_check) {
        if (is_check === true) {
            $("input#" + id).prop("checked", localStorage.getItem(id) === "true")
        } else {
            $("input#" + id).val(localStorage.getItem(id) == null ? default_value : localStorage.getItem(id))
        }
    }

    /**
     * Retrieve current value of UI Widget
     */
    var get_ui_value = function (id, is_bool) {
        if (is_bool) {
            return $("input#" + id).is(":checked");
        } else {
            return parseInt($("input#" + id).val());
        }
    }

    /**
     * Toggles selection of all shapes
     */
    this.toggle_shape_select = function () {
        var shapes = pento_config.get_pento_types()
        shapes.forEach(function (item, index) {
            var shape_widget = $('input.shape-type-' + item)
            var toggle = shape_widget.is(":checked") ? false : true
            shape_widget.prop("checked", toggle);
        })
        update(config, pento_config)
    }

    /**
     * Saves valuesd of input widgets in local storage
     */
    var store_inputs = function () {
        for (var key in config) {
            localStorage.setItem(key, config[key])
        }
    }

    this.generate = function () {
        generator.generate()
    }

    //--- start
    init_form(pento_config)
    update(config, pento_config)

    generator.generate()

    //--- User event handeling
    $("input").change(function () {
        update(config, pento_config)
    });

    //--- File handeling
    function handleFileSelect(e) {
        var files = e.target.files;
        if (files.length < 1) {
            alert('select a file...');
            return;
        }
        var file = files[0];
        var reader = new FileReader();
        reader.onload = onFileLoaded;
        reader.readAsDataURL(file);
    }

    function onFileLoaded(e) {
        var match = /^data:(.*);base64,(.*)$/.exec(e.target.result);
        if (match == null) {
            throw 'Could not parse result'; // should not happen
        }
        var content = atob(match[2]);
        var json = JSON.parse(content)

        generator.pento_board_initial.fromJSON(json["initial"])
        generator.pento_board_target.fromJSON(json["target"])
    }

    $('#target_file').change(handleFileSelect);
})
