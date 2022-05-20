/* const */ fs = require("fs")
/* const */ repl = require("node:repl")

/* const */ processCol = require("./process.js").process
/* const */ col = require("./collision.js")

/* let */ staticFloors = []
/* let */ staticWalls = []
/* let */ staticCeilings = []

/* let */ dynamicFloors = []
/* let */ dynamicWalls = []
/* let */ dynamicCeilings = []

/* let */ levelTris = processCol(fs.readFileSync("./jrb/areas/1/collision.inc.c", "utf8")).flat()
/* let */ rockTris = processCol(fs.readFileSync("./jrb/rock/collision.inc.c", "utf8"), [-5332, 1434, 1023], [0, (315 * 32768 / 180) | 0, 0]).flat()

levelTris.forEach(surface => surface.addToList(staticFloors, staticWalls, staticCeilings))
rockTris.forEach(surface => surface.addToList(dynamicFloors, dynamicWalls, dynamicCeilings))

col.set_static_floor_list(staticFloors)
col.set_dynamic_floor_list(dynamicFloors)
col.set_static_ceil_list(staticCeilings)
col.set_dynamic_ceil_list(dynamicCeilings)

/* let */ test = function(x, z) {
	let { floor: f1, height: hf1 } = col.find_floor(x, 5000, z)
	let { floor: f2, height: hf2 } = col.find_floor(x, hf1 - 79, z)

	if (f1 == null || f2 == null) {
		return false
	}

	if (hf2 > 1024 - 40) {
		return false
	}

	if (hf1 - (hf2 | 0) > 78) {
		return false
	}

	let { ceil: c, height: hc } = col.find_ceil(x, (hf2 | 0) + 80, z)

	return c == null
}

/* let */ test2 = function(x, z) {
	let { floor: f1, height: hf1 } = col.find_floor(x, 950, z)
	let { floor: f2, height: hf2 } = col.find_floor(x, hf1, z)

	if (f2 != null && f2 != f1) {
		return false
	}

	let { ceil: c, height: hc } = col.find_ceil(x, (hf1 | 0) + 80, z)

	return c != null
}

/* let */ testrange = function(f = test, ...a) {
	/* let */ points = []

	for (let x = -5600; x < -5000; x++) {
		for (let z = 700; z < 1300; z++) {
			if (f(x - 0.5, z + 0.5, ...a)) {
				points.push([x, z])
			}
		}
	}

	console.log(points.length, points)

	return points
}

testrange()

write = function(file = "points.txt") {
	fs.writeFileSync(file, points.map(e => e.join(",")).join("\r\n"))
}

repl.start("> ")
