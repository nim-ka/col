/* const */ fs = require("fs")
/* const */ repl = require("node:repl")

/* const */ s16 = require("./math.js").s16

/* const */ processCol = require("./process.js").process
/* const */ col = require("./collision.js")

/* const */ Controller = require("./controller.js")
/* const */ Mario = require("./mario.js")
/* const */ action = require("./action.js")

processCol(fs.readFileSync("./pss/areas/1/collision.inc.c", "utf8")).flat().forEach(col.add_static)

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

		if (res == 2 || res == 3) {
			if (criterion(mario, res)) {
				return state
			} else {
				return false
			}
		}

/*
		if (res == 3) {
			return false
		}

		let dist = Math.hypot(pos[0] - 993, pos[2] - -5614)

		if (dist < 200) {
			if (criterion(mario)) {
				state.dist = dist
				return state
			}
		}
*/
	}

	return false
}

testx = function(x, criterion = () => true, dbg) {
	let p = []

	for (let angle = 8192; angle >= -8192; angle -= 16) {
		for (let spd = -380; spd > -440; spd--) {
			let res = test(x, angle, spd, (m, r) => m.pos[1] > -4200 && criterion(m, r))

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

const center = s16(-12000)
const range = s16(4096)

goodyaw = function(m) {
	let yaw = m.faceAngle[1]
	let ryaw = s16(yaw + 32768)

	return m.forwardVel >= 0 && Math.abs(s16(yaw - center)) < range ||
		m.forwardVel <= 0 && Math.abs(s16(ryaw - center)) < range
}

let start = +process.argv[2]
let end = +process.argv[3]
let dbg = process.argv[4] == "true"

if (!start || !end) {
	repl.start("> ")
} else {
	console.log(start, end, dbg)

	let l = 0
	let p = new Map()

	for (let x = start; x > end; x--) {
		framesExecuted = 0

		let startTime = performance.now()
		let reses = testx(x, (m, r) => m.pos[1] < -2000 && m.pos[2] < -5597.5 && goodyaw(m), dbg)
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
