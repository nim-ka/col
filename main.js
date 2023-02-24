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
	action.execute_mario_action(mario)
}

test = function(x, spd, criterion = () => false, dbg = false) {
	mario = new Mario(controller)

	mario.action = "ACT_WALKING"
	mario.pos[0] = x
	mario.pos[1] = -4587
	mario.pos[2] = 6475
	mario.forwardVel = spd
	mario.faceAngle[1] = 32768
	mario.set_int_yaw(32768)

	while (Math.abs(mario.forwardVel) > 317) {
		try {
			frame()

			if (dbg) {
				console.log([...mario.pos], mario.faceAngle[1], mario.forwardVel)
			}
		} catch (err) {
			if (dbg) {
				console.log(err)
			}

			return false
		}

		if (Math.hypot(mario.pos[0] - 993, mario.pos[2] - -5614) < 200 && criterion(mario)) {
			return { pos: mario.pos, spd: mario.forwardVel }
		}
	}

	return false
}

repl.start("> ")
