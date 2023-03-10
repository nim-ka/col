/* const */ fs = require("fs")
/* const */ repl = require("repl")

/* const */ math = require("./math.js")

/* const */ processCol = require("./process.js")
/* const */ col = require("./collision.js")

/* const */ Controller = require("./controller.js")
/* const */ Mario = require("./mario.js")
/* const */ action = require("./action.js")

/* const */ Surface = require("./surface.js").Surface
/* const */ step = require("./step.js")

processCol(fs.readFileSync("./pss/areas/1/collision.inc.c", "utf8")).flat().forEach((surf) => col.add(surf, false))

/* const */ controller = new Controller()
/* const */ mario = new Mario(controller)

controller.reset()
controller.setStick(127, 0)
controller.setButtons(Controller.U_CBUTTONS)

/* let */ framesExecuted = 0

frame = function() {
	let res = action.execute_mario_action(mario)

	framesExecuted++

	return res
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
		let state = { res, start, end: [...pos, mario.faceAngle[1], mario.forwardVel] }

		if (dbg) {
			console.log(state)
		}

/*
		if (res == 2 || res == 3) {
			if (criterion(mario, res)) {
				return state
			} else {
				return false
			}
		}
*/

		if (res == 2) {
			return false
		}

		if (res != 3) {
			continue
		}

		let dist = Math.hypot(pos[0] - -5315, pos[2] - -3500)

		if (dist < 100) {
			if (criterion(mario)) {
				state.dist = dist
				return state
			} else {
				return false
			}
		} else {
			return false
		}
	}

	return false
}

testx = function(x, criterion = () => true, dbg) {
	let p = []

	for (let angle = 8192; angle >= -8192; angle -= 16) {
		for (let spd = -340; spd > -380; spd--) {
			let res = test(x, angle, spd, (m, r) => m.pos[1] > -4500 && criterion(m, r))

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

const center = math.s16(-1233)
const range = math.s16(1233)

goodyaw = function(m) {
	let yaw = m.faceAngle[1]
	let ryaw = math.s16(yaw + 32768)

	return m.forwardVel >= 0 && Math.abs(math.s16(yaw - center)) < range ||
		m.forwardVel <= 0 && Math.abs(math.s16(ryaw - center)) < range
}

let start = +process.argv[2]
let end = +process.argv[3]
let dbg = process.argv[4] == "true"

if (!start || !end) {
	mario.action = Mario.ACT_DECELERATING
	mario.queuedCUp = true
	mario.pos = new Float32Array([-77.8649291992188,-2619.91333007813,-5776.58349609375])
	mario.forwardVel = -484
	mario.faceAngle[1] = 32752
	repl.start("> ")
} else {
	console.log(start, end, dbg)

	let l = 0
	let p = new Map()

	for (let x = start; x > end; x--) {
		framesExecuted = 0

		let startTime = performance.now()
		let reses = testx(x, (m, r) => goodyaw(m), dbg)
		let endTime = performance.now()

		for (let res of reses) {
			let hash = res.start[2] + ";" + res.end.join(",")
			let newRes = { r: res.res, s: [res.start[0], res.start[3], res.start[4]], e: res.end.map(e => Math.round(e * 1000) / 1000) }

			if (res.dist) {
				newRes.d = Math.round(res.dist * 1000) / 1000
			}

			p.set(hash, newRes)
		}

		let timeElapsed = (endTime - startTime) / 1000
		let fps = framesExecuted / timeElapsed
		console.log(`x = ${x};\t${timeElapsed.toFixed(2)} sec;\t${fps.toFixed(0)} fps;\t${p.size} total pts`)
	}

        fs.writeFileSync(`tests/out${start}${end}-${(Math.random() * 100000).toFixed(0).padStart(5, "0")}.json`, JSON.stringify([...p.values()]))
}
