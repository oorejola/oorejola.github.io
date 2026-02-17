(function() {
	var canvas = document.getElementById('mp-canvas');
	var ctx = canvas.getContext('2d');

	var NUM_BINS = 40;
	var BIN_MIN = 0;
	var BIN_MAX = 3.5;
	var BIN_WIDTH = (BIN_MAX - BIN_MIN) / NUM_BINS;
	var MAX_N = 5000;
	var TOTAL_FRAMES = 7200; // 2 minutes at 60fps

	var frame = 0;
	var bins = new Array(NUM_BINS).fill(0);

	// Pre-allocate tridiagonal storage at max size
	var tDiag = new Float64Array(MAX_N);
	var tOff = new Float64Array(MAX_N);

	// Marsaglia polar method state
	var spareReady = false;
	var spare = 0;

	function randn() {
		if (spareReady) {
			spareReady = false;
			return spare;
		}
		var u, v, s;
		do {
			u = Math.random() * 2 - 1;
			v = Math.random() * 2 - 1;
			s = u * u + v * v;
		} while (s >= 1 || s === 0);
		var mul = Math.sqrt(-2 * Math.log(s) / s);
		spare = v * mul;
		spareReady = true;
		return u * mul;
	}

	// Marsaglia-Tsang method for Gamma(alpha, 1), alpha >= 1
	function gammaRand(alpha) {
		if (alpha < 1) {
			return gammaRand(alpha + 1) * Math.pow(Math.random(), 1 / alpha);
		}
		var d = alpha - 1 / 3;
		var c = 1 / Math.sqrt(9 * d);
		var x, v, u;
		while (true) {
			do {
				x = randn();
				v = 1 + c * x;
			} while (v <= 0);
			v = v * v * v;
			u = Math.random();
			if (u < 1 - 0.0331 * x * x * x * x) return d * v;
			if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
		}
	}

	// Chi random variable: chi_k = sqrt(2 * Gamma(k/2, 1))
	function chiRand(k) {
		if (k <= 0) return 0;
		return Math.sqrt(2 * gammaRand(k / 2));
	}

	// Build tridiagonal matrix T = (1/m) B B^T using Dumitriu-Edelman model.
	// B is n x n bidiagonal with B_{k,k} ~ chi_{m-k}, B_{k,k+1} ~ chi_{n-1-k}
	// (0-indexed). Eigenvalues of T match those of (1/m) X X^T for n x m Gaussian X.
	function generateTridiagonal(n) {
		var m = 2 * n;
		var invM = 1 / m;

		var curC = chiRand(m);
		for (var k = 0; k < n - 1; k++) {
			var d = chiRand(n - 1 - k);
			var nextC = chiRand(m - k - 1);
			tDiag[k] = (curC * curC + d * d) * invM;
			tOff[k] = d * nextC * invM;
			curC = nextC;
		}
		tDiag[n - 1] = curC * curC * invM;
	}

	// Count eigenvalues of tridiagonal matrix below x via Sturm sequence
	function countBelow(x, n) {
		var count = 0;
		var q = tDiag[0] - x;
		if (q < 0) count++;
		for (var k = 1; k < n; k++) {
			if (q === 0) q = 1e-30;
			q = (tDiag[k] - x) - tOff[k - 1] * tOff[k - 1] / q;
			if (q < 0) count++;
		}
		return count;
	}

	function computeHistogram(n) {
		var prev = countBelow(BIN_MIN, n);
		for (var i = 0; i < NUM_BINS; i++) {
			var cur = countBelow(BIN_MIN + (i + 1) * BIN_WIDTH, n);
			bins[i] = cur - prev;
			prev = cur;
		}
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
		if (frame >= TOTAL_FRAMES) return;

		var t = frame / TOTAL_FRAMES;
		var n = Math.max(2, Math.round(2 + (MAX_N - 2) * Math.pow(t, 1.5)));

		generateTridiagonal(n);
		computeHistogram(n);
		draw();

		frame++;
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

	setupCanvas();
	window.addEventListener('resize', function() {
		setupCanvas();
	});
	requestAnimationFrame(loop);
})();
