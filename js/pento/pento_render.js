$(document).ready(function () {

	/**
	 * draw a block (smallest unit of pentomino shape)
	 * @param {*} ctx 
	 * @param {*} block 
	 * @param {*} offsetX 
	 * @param {*} offsetY 
	 */
	var draw_block = function (ctx, block, offsetX, offsetY, active, highlight=null) {
		if (highlight) {
			ctx.shadowColor = highlight;
			ctx.shadowBlur = 10;
		} else if (active) {
			ctx.shadowColor = 'grey';
			ctx.shadowBlur = 10;
		}
		ctx.fillStyle = block.color;
		ctx.strokeStyle = 'lightgray';
		ctx.lineWidth = 1;
		ctx.moveTo(block.get_vertex(0, 0) + offsetX, block.get_vertex(0, 1) + offsetY);

		for (var row = 1; row <= block.get_vertices().length; row++) {
			draw_line(ctx, block, row < block.get_vertices().length ? row : 0, offsetX, offsetY);
		}
		ctx.fill();
	};

	/**
	 * Makes outer borders thicker
	 * @param {*} ctx 
	 * @param {*} block 
	 * @param {*} offsetX 
	 * @param {*} offsetY 
	 * @param {*} is_border 
	 */
	var draw_border = function (ctx, block, offsetX, offsetY) {

		var start_x = block.get_x() + offsetX;
		var start_y = block.get_y() + offsetY;

		for (var row = 1; row <= block.get_vertices().length; row++) {
			ctx.beginPath();
			ctx.moveTo(start_x, start_y);
			var row_index = row < block.get_vertices().length ? row: 0;

			
			ctx.lineWidth = block.get_edge_style(row_index);
			ctx.strokeStyle = block.get_edge_style(row_index)==1? 'gray': block.border_color;
			
			var to_x = block.get_vertex(row_index, 0) + offsetX;
			var to_y = block.get_vertex(row_index, 1) + offsetY;
			ctx.lineTo(to_x, to_y);

			ctx.stroke();
			ctx.closePath();

			start_x = block.get_vertex(row_index, 0) + offsetX;
			start_y = block.get_vertex(row_index, 1) + offsetY;
		}
	}

	/**
	 * Draws outer borders for all blocks
	 * @param {*} ctx 
	 * @param {*} shape 
	 * @param {*} params 
	 */
	var draw_shape_border = function (ctx, shape, params) {
		// Draw blocks
		for (var i = 0; i < shape.get_blocks().length; i++) {
			var block = shape.get_blocks()[i];
			draw_border(ctx, block, shape.x + params.offsetX, shape.y + params.offsetY);
		}
	}

	/**
	 * Draws a line on the board
	 * @param {*} ctx 
	 * @param {*} block 
	 * @param {*} row 
	 * @param {*} offsetX 
	 * @param {*} offsetY 
	 */
	var draw_line = function (ctx, block, row, offsetX, offsetY) {
		var to_x = block.get_vertex(row, 0) + offsetX;
		var to_y = block.get_vertex(row, 1) + offsetY;
		ctx.lineTo(to_x, to_y);
	}

	var draw_shape = function (ctx, shape, params) {
		ctx.beginPath();
		// Draw blocks
		for (var i = 0; i < shape.get_blocks().length; i++) {
			var block = shape.get_blocks()[i];
			draw_block(ctx, block, shape.x + params.offsetX, shape.y + params.offsetY, shape.is_active(), shape.highlight);
		}
	}

	// Create a drawPentoShape() method
	$.jCanvas.extend({
		name: 'drawPentoShape',
		type: 'quadratic',
		fromCenter: true,
		props: {
			offsetX: 0,
			offsetY: 0,
			shape: null
		},
		fn: function (ctx, params) {
			// Enable layer transformations like scale and rotate
			$.jCanvas.transformShape(this, ctx, params);
			// drawing
			draw_shape(ctx, params.shape, params);

			// Call the detectEvents() function to enable jCanvas events
			// Be sure to pass it these arguments, too!
			$.jCanvas.detectEvents(this, ctx, params);

			// Call the closePath() functions to fill, stroke, and close the path
			// This function also enables masking support and events
			// It accepts the same arguments as detectEvents()
			$.jCanvas.closePath(this, ctx, params);

			// draw extra stuff
			draw_shape_border(ctx, params.shape, params);
		}
	});
})
