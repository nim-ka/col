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

	mario.action = "ACT_WALKING"
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
let l = 0

for (let x = start; x > start - 50; x--) {
	let p = testx(x, goodyaw)
	console.log(x, l += p.length, p.length)
        fs.writeFileSync(`tests/points${x}.txt`, JSON.stringify(p))
}
