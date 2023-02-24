const { sqrtf, sins, coss, atan2s, approach_s32, approach_f32 } = require("./math.js")
const { Surface } = require("./surface.js")
const step = require("./step.js")
const Mario = require("./mario.js")

function act_walking(m) {
	if (check_common_moving_cancels(m)) {
		return true
	}

	if (should_begin_sliding(m)) {
		return set_mario_action(m, Mario.ACT_BEGIN_SLIDING, 0)
	}

	if (m.input & Mario.INPUT_FIRST_PERSON) {
		return begin_braking_action(m)
	}

	if (m.input & Mario.INPUT_A_PRESSED) {
		return set_jump_from_landing(m)
	}

	if (check_ground_dive_or_punch(m)) {
		return true
	}

	if (m.input & Mario.INPUT_UNKNOWN_5) {
		return begin_braking_action(m)
	}

	if (analog_stick_held_back(m) && m.forwardVel >= 16) {
		return set_mario_action(m, Mario.ACT_TURNING_AROUND, 0)
	}

	if (m.input & Mario.INPUT_Z_PRESSED) {
		return set_mario_action(m, Mario.ACT_CROUCH_SLIDE, 0)
	}

	m.actionState = 0

	let startPos = m.pos.slice()
	update_walking_speed(m)

	switch (step.perform_ground_step(m)) {
		case Mario.GROUND_STEP_LEFT_GROUND:
			set_mario_action(m, Mario.ACT_FREEFALL, 0)
			break

		case Mario.GROUND_STEP_NONE:
			break

		case Mario.GROUND_STEP_HIT_WALL:
			push_or_sidle_wall(m, startPos)
			m.actionTimer = 0
			break
	}

	//check_ledge_climb_down(m)
	return false
}

function act_decelerating(m) {
	if (!(m.input & Mario.INPUT_FIRST_PERSON)) {
		if (should_begin_sliding(m)) {
			return set_mario_action(m, Mario.ACT_BEGIN_SLIDING, 0)
		}

		if (m.input & Mario.INPUT_A_PRESSED) {
			return set_jump_from_landing(m)
		}

		if (check_ground_dive_or_punch(m)) {
			return true
		}

		if (m.input & Mario.INPUT_NONZERO_ANALOG) {
			return set_mario_action(m, Mario.ACT_WALKING, 0)
		}

		if (m.input & INPUT_Z_PRESSED) {
			return set_mario_action(m, Mario.ACT_CROUCH_SLIDE, 0)
		}
	}

	if (update_decelerating_speed(m)) {
		return set_mario_action(m, Mario.ACT_IDLE, 0)
	}

	switch (step.perform_ground_step(m)) {
		case Mario.GROUND_STEP_LEFT_GROUND:
			set_mario_action(m, Mario.ACT_FREEFALL, 0)
			break

		case Mario.GROUND_STEP_HIT_WALL:
			if (m.get_floor_class() == Surface.SURFACE_CLASS_VERY_SLIPPERY) {
				m.bonk_reflection(true)
			} else {
				m.set_forward_vel(0)
			}

			break
	}

	return false
}

function act_standing_against_wall(m) {
	if (m.input & (Mario.INPUT_NONZERO_ANALOG | Mario.INPUT_A_PRESSED | Mario.INPUT_OFF_FLOOR | Mario.INPUT_ABOVE_SLIDE)) {
		return check_common_action_exits(m)
	}

	if (m.input & Mario.INPUT_FIRST_PERSON) {
		return set_mario_action(m, Mario.ACT_FIRST_PERSON, 0)
	}

	if (m.input & Mario.INPUT_B_PRESSED) {
		return set_mario_action(m, Mario.ACT_PUNCHING, 0)
	}

	stationary_ground_step(m)
	return false
}

function check_common_action_exits(m) {
	if (m.input & Mario.INPUT_A_PRESSED) {
		return set_mario_action(m, Mario.ACT_JUMP, 0)
	}

	if (m.input & Mario.INPUT_OFF_FLOOR) {
		return set_mario_action(m, Mario.ACT_FREEFALL, 0)
	}

	if (m.input & Mario.INPUT_NONZERO_ANALOG) {
		return set_mario_action(m, Mario.ACT_WALKING, 0)
	}

	if (m.input & Mario.INPUT_ABOVE_SLIDE) {
		return set_mario_action(m, Mario.ACT_BEGIN_SLIDING, 0)
	}

	return false
}

function check_common_moving_cancels(m) {
	return false
}

function push_or_sidle_wall(m, startPos) {
	let dx = m.pos[0] - startPos[0]
	let dz = m.pos[2] - startPos[2]
	let movedDistance = sqrtf(dx * dx + dz * dz)

	if (m.forwardVel > 6) {
		m.set_forward_vel(6)
	}

	if (m.wall) {
		let wallAngle = new Int16Array([atan2s(m.wall.normal.z, m.wall.normal.x)])[0]
		let dWallAngle = new Int16Array([wallAngle - m.faceAngle[1]])[0]

		if (dWallAngle > -0x71C8 && dWallAngle < 0x71C8) {
			m.actionState = 1
			m.actionArg = new Int16Array([wallAngle + 0x8000])[0]
		}
	}
}

function should_begin_sliding(m) {
	if (m.input & Mario.INPUT_ABOVE_SLIDE) {
		if (m.slideTerrain || m.forwardVel <= -1 || m.facing_downhill(false)) {
			return true
		}
	}

	return false
}

function check_ground_dive_or_punch(m) {
	if (m.input & Mario.INPUT_B_PRESSED) {
		if (m.forwardVel >= 29 && m.controller.stickMag > 48) {
			m.vel[1] = 20
			return set_mario_action(m, Mario.ACT_DIVE, 1)
		}

		return set_mario_action(m, Mario.ACT_MOVE_PUNCHING, 0)
	}

	return false
}

function begin_braking_action(m) {
	if (m.actionState == 1) {
		m.faceAngle[1] = m.actionArg
		return set_mario_action(m, Mario.ACT_STANDING_AGAINST_WALL, 0)
	}

	if (m.forwardVel >= 16 && m.floor.normal.y >= 0.17364818) {
		return set_mario_action(m, Mario.ACT_BRAKING, 0)
	}

	return set_mario_action(m, Mario.ACT_DECELERATING, 0)
}

function analog_stick_held_back(m) {
	let intendedDYaw = new Int16Array([m.intendedYaw - m.faceAngle[1]])[0]
	return intendedDYaw < -0x471C || intendedDYaw > 0x471C
}

function update_decelerating_speed(m) {
	let stopped = false

	if ((m.forwardVel = approach_f32(m.forwardVel, 0, 1, 1)) == 0) {
		stopped = true
	}

	m.set_forward_vel(m.forwardVel)
	return stopped
}

function update_walking_speed(m) {
	let maxTargetSpeed

	if (m.floor.type == Surface.SURFACE_SLOW) {
		maxTargetSpeed = 24
	} else {
		maxTargetSpeed = 32
	}

	let targetSpeed = Math.min(m.intendedMag, maxTargetSpeed)

	if (m.forwardVel <= 0) {
		m.forwardVel += 1.1
	} else if (m.forwardVel <= targetSpeed) {
		m.forwardVel += 1.1 - m.forwardVel / 43
	} else if (m.floor.normal.y >= 0.95) {
		m.forwardVel -= 1
	}

	if (m.forwardVel > 48) {
		m.forwardVel = 48
	}

	m.faceAngle[1] = m.intendedYaw - approach_s32(new Int16Array([m.intendedYaw - m.faceAngle[1]])[0], 0, 0x800, 0x800)
	apply_slope_accel(m)
}

function apply_slope_accel(m) {
	let steepness = sqrtf(m.floor.normal.x * m.floor.normal.x + m.floor.normal.z * m.floor.normal.z)
	let floorDYaw = new Int16Array([m.floorAngle - m.faceAngle[1]])[0]

	if (m.floor_is_slope()) {
		let slopeAccel

		switch (m.get_floor_class()) {
			case Surface.SURFACE_CLASS_VERY_SLIPPERY:
				slopeAccel = 5.3
				break

			case Surface.SURFACE_CLASS_SLIPPERY:
				slopeAccel = 2.7
				break

			default:
				slopeAccel = 1.7
				break

			case Surface.SURFACE_CLASS_NOT_SLIPPERY:
				slopeAccel = 0
				break
		}

		if (floorDYaw > -0x4000 && floorDYaw < 0x4000) {
			m.forwardVel += slopeAccel * steepness
		} else {
			m.forwardVel -= slopeAccel * steepness
		}
	}

	m.slideYaw = m.faceAngle[1]

	m.slideVelX = m.forwardVel * sins(m.faceAngle[1])
	m.slideVelZ = m.forwardVel * coss(m.faceAngle[1])

	m.vel[0] = m.slideVelX
	m.vel[1] = 0
	m.vel[2] = m.slideVelZ
}

function execute_mario_action(m) {
	let inLoop = true

	m.update_inputs()

	if (m.floor == null) {
		throw "Error: OoB death"
	}

	while (inLoop) {
		switch (m.action) {
			case Mario.ACT_WALKING: inLoop = act_walking(m); break
			case Mario.ACT_DECELERATING: inLoop = act_decelerating(m); break
			case Mario.ACT_STANDING_AGAINST_WALL: inLoop = act_standing_against_wall(m); break
			case Mario.ACT_BUTT_SLIDE: return 2
			default: return 1
		}
	}

	return 0
}

function set_mario_action(m, action, actionArg) {
	switch (action) {
		case Mario.ACT_WALKING:
			let floorClass = m.get_floor_class(m)
			let mag = Math.min(m.intendedMag, 8)

			if (floorClass != Surface.SURFACE_CLASS_VERY_SLIPPERY) {
				if (0 <= m.forwardVel && m.forwardVel < mag) {
					m.forwardVel = mag
				}
			}

			break

		case Mario.ACT_BEGIN_SLIDING:
			if (m.facing_downhill(false)) {
				action = Mario.ACT_BUTT_SLIDE
			} else {
				action = Mario.ACT_HOLD_STOMACH_SLIDE
			}

			break
	}

	m.prevAction = m.action
	m.action = action
	m.actionArg = actionArg
	m.actionState = 0
	m.actionTimer = 0

	return true
}

module.exports = {
	execute_mario_action,
}
