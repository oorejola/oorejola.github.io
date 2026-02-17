(function() {
	var canvas = document.getElementById('clt-canvas');
	var ctx = canvas.getContext('2d');

	var NUM_BINS = 35;
	var BIN_MIN = -4;
	var BIN_MAX = 4;
	var BIN_WIDTH = (BIN_MAX - BIN_MIN) / NUM_BINS;
	var SAMPLES_PER_FRAME = 2;
	var MAX_SAMPLES = 1000000;

	var bins = [];
	var totalSamples = 0;

	function reset() {
		bins = new Array(NUM_BINS).fill(0);
		totalSamples = 0;
	}

	function sampleCLT() {
		var sum = 0;
		for (var i = 0; i < 12; i++) {
			sum += Math.random();
		}
		return sum - 6;
	}

	function addSample(value) {
		var binIndex = Math.floor((value - BIN_MIN) / BIN_WIDTH);
		if (binIndex >= 0 && binIndex < NUM_BINS) {
			bins[binIndex]++;
		}
		totalSamples++;
	}

	function draw() {
		var w = canvas.width;
		var h = canvas.height;

		ctx.clearRect(0, 0, w, h);

		var maxBin = 0;
		for (var i = 0; i < NUM_BINS; i++) {
			if (bins[i] > maxBin) maxBin = bins[i];
		}
		if (maxBin === 0) maxBin = 1;

		var padding = 20;
		var plotW = w - padding * 2;
		var plotH = h - padding * 2;
		var barW = plotW / NUM_BINS;

		ctx.fillStyle = '#333';
		for (var i = 0; i < NUM_BINS; i++) {
			var barH = (bins[i] / maxBin) * plotH;
			var x = padding + i * barW;
			var y = padding + plotH - barH;
			ctx.fillRect(x, y, barW - 1, barH);
		}
	}

	function loop() {
		for (var i = 0; i < SAMPLES_PER_FRAME; i++) {
			addSample(sampleCLT());
		}
		if (totalSamples >= MAX_SAMPLES) {
			reset();
		}
		draw();
		requestAnimationFrame(loop);
	}

	function setupCanvas() {
		var dpr = window.devicePixelRatio || 1;
		var rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);
		canvas.style.width = rect.width + 'px';
		canvas.style.height = rect.height + 'px';
	}

	reset();
	setupCanvas();
	window.addEventListener('resize', function() {
		setupCanvas();
	});
	requestAnimationFrame(loop);
})();
