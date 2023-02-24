const { atan2s } = require("./math.js")
const col = require("./collision.js")

function perform_ground_step(m) {
	let stepResult
	let intendedPos = new Float32Array(3)

	for (let i = 0; i < 4; i++) {
		intendedPos[0] = m.pos[0] + m.floor.normal.y * (m.vel[0] / 4)
		intendedPos[2] = m.pos[2] + m.floor.normal.y * (m.vel[2] / 4)
		intendedPos[1] = m.pos[1]

		stepResult = perform_ground_quarter_step(m, intendedPos)

		if (stepResult == "GROUND_STEP_LEFT_GROUND" || stepResult == "GROUND_STEP_HIT_WALL_STOP_QSTEPS") {
			break
		}
	}

	if (stepResult == "GROUND_STEP_HIT_WALL_CONTINUE_QSTEPS") {
		stepResult = "GROUND_STEP_HIT_WALL"
	}

	return stepResult
}

function perform_ground_quarter_step(m, nextPos) {
	let lowerWall = resolve_and_return_wall_collisions(nextPos, 30, 24)
	let upperWall = resolve_and_return_wall_collisions(nextPos, 60, 50)

	let { floor, height: floorHeight } = col.find_floor(nextPos[0], nextPos[1], nextPos[2])
	let { ceil, height: ceilHeight } = col.vec3f_find_ceil(nextPos, floorHeight)

	m.wall = upperWall

	if (nextPos[1] > floorHeight + 100) {
		if (nextPos[1] + 160 >= ceilHeight) {
			return "GROUND_STEP_HIT_WALL_STOP_QSTEPS"
		}

		m.pos[0] = nextPos[0]
		m.pos[1] = nextPos[1]
		m.pos[2] = nextPos[2]
		m.floor = floor
		m.floorHeight = floorHeight
		return "GROUND_STEP_LEFT_GROUND"
	}

	if (floorHeight + 160 >= ceilHeight) {
		return "GROUND_STEP_HIT_WALL_STOP_QSTEPS"
	}

	m.pos[0] = nextPos[0]
	m.pos[1] = floorHeight
	m.pos[2] = nextPos[2]
	m.floor = floor
	m.floorHeight = floorHeight

	if (upperWall != null) {
		let wallDYaw = new Int16Array([atan2s(upperWall.normal.z, upperWall.normal.x) - m.faceAngle[1]])[0]

		if (
			wallDYaw >= 0x2AAA && wallDYaw <= 0x5555 ||
			wallDYaw <= -0x2AAA && wallDYaw >= -0x5555) {
			return "GROUND_STEP_NONE"
		}

		return "GROUND_STEP_HIT_WALL_CONTINUE_QSTEPS"
	}

	return "GROUND_STEP_NONE"
}

function resolve_and_return_wall_collisions(pos, offset, radius) {
	let colData = new col.WallCollisionData(pos[0], pos[1], pos[2], offset, radius)
	let wall = null

	if (col.find_wall_collisions(colData)) {
		wall = colData.walls[colData.numWalls - 1]
	}

	pos[0] = colData.x
	pos[1] = colData.y
	pos[2] = colData.z

	return wall
}

module.exports = {
	perform_ground_step,
}
