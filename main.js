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

	if (framesExecuted % 100000 == 0) {
		console.log(framesExecuted)
	}

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
	let ryaw = s16(-yaw)
	return yaw > 14300 - 4096 && yaw < 14300 + 4096 ||
		ryaw > 14300 - 4096 && ryaw < 14300 + 4096
}

let start = +process.argv[2]
let end = +process.argv[3]

if (!start || !end) {
	repl.start("> ")
} else {
	let l = 0

	for (let x = start; x > end; x--) {
		let p = testx(x, goodyaw)
		console.log(x, l += p.length, p.length)
	        fs.writeFileSync(`tests/points${x}.txt`, JSON.stringify(p))
	}
}

