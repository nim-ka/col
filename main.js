/* const */ fs = require("fs")
/* const */ repl = require("node:repl")

/* const */ processCol = require("./process.js").process
/* const */ col = require("./collision.js")

/* const */ Controller = require("./controller.js")
/* const */ Mario = require("./mario.js")
/* const */ action = require("./action.js")

/* let */ staticFloors = []
/* let */ staticWalls = []
/* let */ staticCeilings = []

/* let */ dynamicFloors = []
/* let */ dynamicWalls = []
/* let */ dynamicCeilings = []

/* let */ levelTris = processCol(fs.readFileSync("./pss/areas/1/collision.inc.c", "utf8")).flat()

levelTris.forEach(surface => surface.addToList(staticFloors, staticWalls, staticCeilings))

col.set_static_floor_list(staticFloors)
col.set_dynamic_floor_list(dynamicFloors)
col.set_static_wall_list(staticWalls)
col.set_dynamic_wall_list(dynamicWalls)
col.set_static_ceil_list(staticCeilings)
col.set_dynamic_ceil_list(dynamicCeilings)

/* const */ controller = new Controller()
/* const */ mario = new Mario(controller)

controller.reset()
controller.setStick(127, 0)
controller.setButtons(Controller.U_CBUTTONS)

frame = function() {
	return action.execute_mario_action(mario)
}

test = function(x, angle, spd, criterion = (m) => m.pos[1] > -4200, dbg = false) {
        let y = -4587
        let z = 4250

	mario = new Mario(controller)

	mario.action = Mario.ACT_WALKING
	mario.pos[0] = x
	mario.pos[1] = y
	mario.pos[2] = z
	mario.forwardVel = spd
	mario.faceAngle[1] = angle
	mario.queuedCUp = true

        let start = [x, y, z, angle, spd]

	while (Math.abs(mario.forwardVel) > 250) {
		let res = frame()

		if (res == 1) {
			return false
		}

		let pos = [...mario.pos]
		let state = { start, end: [...pos, mario.faceAngle[1], mario.forwardVel] }

		if (dbg) {
			console.log(state)
		}

		if (res == 2) {
			if (criterion(mario)) {
				console.log(state)
				throw "a"
			}
		}

		let dist = Math.hypot(pos[0] - 993, pos[2] - -5614)

		if (dist < 200) {
			if (criterion(mario)) {
                                state.dist = dist
				return state
			}
		}
	}

	return false
}

testx = function(x, criterion = () => true, dbg) {
	let p = []

	for (let angle = 8192; angle >= -8192; angle -= 16) {
		for (let spd = -340; spd > -390; spd--) {
			let res = test(x, angle, spd, (m) => m.pos[1] > -4200 && criterion(m))

                        if (res) {
				p.push(res)
			}
		}

                if (dbg) {
                        console.log(angle, p.length)
                }
	}

	return p
}

goodyaw = function(m) {
	let yaw = m.faceAngle[1]
	let ryaw = new Int16Array([-yaw])[0]
	return yaw > 14300 - 4096 && yaw < 14300 + 4096 ||
		ryaw > 14300 - 4096 && ryaw < 14300 + 4096
}

let start = +process.argv[2]
let end = +process.argv[3]

const diff = Math.abs(start - end);

if (!start || !end) {
	repl.start("> ")
} else {
	let l = 0

	const startTime = process.hrtime.bigint(); // Monotonic clock, reports in nanoseconds.
	const timePoints = Array.from({ length: diff }, () => 0n);
	for (let x = start; x > end; x--) {
		let p = testx(x, goodyaw)
		console.log(x, l += p.length, p.length)
		fs.writeFileSync(`tests/points${x}.txt`, JSON.stringify(p))

		// Boilerplate for estimating completion
		const index = start - x;
		timePoints[index] = process.hrtime.bigint();
		const estimatedTotalTimeMS = Number(interpolateEndTime(startTime, timePoints) / 1_000_000n);
		const ratioRemaining = (diff - index - 1) / diff;
		console.log(`Estimated time remaining: ${timeString(estimatedTotalTimeMS * ratioRemaining)}`);
	}
	const endTime = process.hrtime.bigint();
	console.log(`Segment complete. Total time: ${timeString(Number(endTime - startTime) / 1_000_000)}`);
}

/**
 * Given a partially completed array of timePoints,
 * Accumulates all non-zero time points into an array,
 * So that a rate of progress is estimated.
 *
 * Using the length of the array, this rate of progress is used to estimate when the process is 'done'.
 * Where 'done' means 'when the last array element would be written'.
 *
 * @param startTime {bigint} starting time of the process
 * @param timePoints {bigint[]} array of measurements of time. Incomplete values are represented as 0.
 *
 * @return {bigint} Estimated total time in nanoseconds.
 */
function interpolateEndTime(startTime, timePoints) {
	// Not entirely accurate due to integer division in the average computation,
	// but it shouldn't matter because nanoseconds are overly accurate anyway.
	const rateOfProgress = timePoints
		.filter(v => v > 0n) // for measurements
		.map((v, i, array) => v - (array[i-1] ?? startTime)) // get differences
		.reduce((sum, v, _, { length }) => sum + (v / BigInt(length)), 0n); // compute average of differences.

	return BigInt(timePoints.length) * rateOfProgress;
}

function timeString(timeMS) {
	const h = Math.floor(timeMS / (1000 * 3600));
	timeMS -= h * 1000 * 3600;

	const m = Math.floor(timeMS / (1000 * 60));
	timeMS -= m * 1000 * 60;

	const s = Math.floor(timeMS / (1000));
	timeMS -= s * 1000;

	const ms = Math.floor(timeMS);

	const pad = (n) => n > 9 ? n.toString() : '0' + n.toString();

	return `${h}:${pad(m)}:${pad(s)}.${ms}`;
}
