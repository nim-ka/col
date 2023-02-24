const { sins, coss, atan2s } = require("./math.js")
const col = require("./collision.js")
const Controller = require("./controller.js")

class Mario {
	static INPUT_NONZERO_ANALOG         = 0x0001
	static INPUT_A_PRESSED              = 0x0002
	static INPUT_OFF_FLOOR              = 0x0004
	static INPUT_ABOVE_SLIDE            = 0x0008
	static INPUT_FIRST_PERSON           = 0x0010
	static INPUT_UNKNOWN_5              = 0x0020
	static INPUT_SQUISHED               = 0x0040
	static INPUT_A_DOWN                 = 0x0080
	static INPUT_IN_POISON_GAS          = 0x0100
	static INPUT_IN_WATER               = 0x0200
	static INPUT_STOMPED                = 0x0400
	static INPUT_INTERACT_OBJ_GRABBABLE = 0x0800
	static INPUT_UNKNOWN_12             = 0x1000
	static INPUT_B_PRESSED              = 0x2000
	static INPUT_Z_DOWN                 = 0x4000
	static INPUT_Z_PRESSED              = 0x8000

	unk00 = 0
	input = 0
	flags = 0
	particleFlags = 0
	action = 0
	prevAction = 0
	terrainSoundAddend = 0
	actionState = 0
	actionTimer = 0
	actionArg = 0
	intendedMag = 0
	intendedYaw = 0
	invincTimer = 0
	framesSinceA = 0
	framesSinceB = 0
	wallKickTimer = 0
	doubleJumpTimer = 0
	faceAngle = new Int16Array(3)
	angleVel = new Int16Array(3)
	slideYaw = 0
	twirlYaw = 0
	pos = new Float32Array(3)
	vel = new Float32Array(3)
	forwardVel = 0
	slideVelX = 0
	slideVelZ = 0
	wall = null
	ceil = null
	floor = null
	ceilHeight = 0
	floorHeight = 0
	floorAngle = 0
	waterLevel = 0
	interactObj = null
	heldObj = null
	usedObj = null
	riddenObj = null
	marioObj = null
	spawnInfo = null
	area = null
	statusForCamera = null
	marioBodyState = null
	controller = null
	animList = null
	collidedObjInteractTypes = 0
	numCoins = 0
	numStars = 0
	numKeys = 0
	numLives = 0
	health = 0
	unkB0 = 0
	hurtCounter = 0
	healCounter = 0
	squishTimer = 0
	fadeWarpOpacity = 0
	capTimer = 0
	prevNumStarsForDialog = 0
	peakHeight = 0
	quicksandDepth = 0
	unkC4 = 0

	cameraYaw = 0
	forcedIntendedYaw = 0
	queuedCUp = false
	slideTerrain = true

	constructor(controller) {
		this.controller = controller
	}

	set_int_yaw(n) {
		this.forcedIntendedYaw = n
	}

	update_inputs() {
		this.input = 0

		this.update_button_inputs()
		this.update_joystick_inputs()
		this.update_geometry_inputs()

		if (this.queuedCUp) {
			this.input |= Mario.INPUT_FIRST_PERSON
		}

		if (this.controller.buttonPressed & Controller.U_CBUTTONS) {
			this.queuedCUp = true
		} else {
			this.queuedCUp = false
		}

		if (!(this.input & (Mario.INPUT_NONZERO_ANALOG | Mario.INPUT_A_PRESSED))) {
			this.input |= Mario.INPUT_UNKNOWN_5
		}

		if (this.wallKickTimer > 0) {
			this.wallKickTimer--
		}

		if (this.doubleJumpTimer > 0) {
			this.doubleJumpTimer--
		}
	}

	update_button_inputs() {
		if (this.controller.buttonPressed & Controller.A_BUTTON) {
			this.input |= Mario.INPUT_A_PRESSED
		}

		if (this.controller.buttonDown & Controller.A_BUTTON) {
			this.input |= Mario.INPUT_A_DOWN
		}

		if (this.squishTimer == 0) {
			if (this.controller.buttonPressed & Controller.B_BUTTON) {
				this.input |= Mario.INPUT_B_PRESSED
			}

			if (this.controller.buttonDown & Controller.Z_BUTTON) {
				this.input |= Mario.INPUT_Z_DOWN
			}

			if (this.controller.buttonPressed & Controller.Z_BUTTON) {
				this.input |= Mario.INPUT_Z_PRESSED
			}
		}

		if (this.input & Mario.INPUT_A_PRESSED) {
			this.framesSinceA = 0
		} else if (this.framesSinceA < 0xFF) {
			this.framesSinceA++
		}

		if (this.input & Mario.INPUT_B_PRESSED) {
			this.framesSinceB = 0
		} else if (this.framesSinceB < 0xFF) {
			this.framesSinceB++
		}
	}

	update_joystick_inputs() {
		let mag = (this.controller.stickMag / 64) * (this.controller.stickMag / 64) * 64

		if (this.squishTimer == 0) {
			this.intendedMag = mag / 2
		} else {
			this.intendedMag = mag / 8
		}

		if (this.intendedMag > 0) {
			this.intendedYaw = new Int16Array([atan2s(-this.controller.stickY, this.controller.stickX) + this.cameraYaw])[0]
			this.input |= Mario.INPUT_NONZERO_ANALOG
		} else {
			this.intendedYaw = this.faceAngle[1]
		}

		if (this.forcedIntendedYaw != null) {
			this.intendedYaw = this.forcedIntendedYaw
			this.forcedIntendedYaw = null
		}
	}

	update_geometry_inputs() {
		({ x: this.pos[0], y: this.pos[1], z: this.pos[2] } = col.find_wall_collision(this.pos[0], this.pos[1], this.pos[2], 60, 50));
		({ x: this.pos[0], y: this.pos[1], z: this.pos[2] } = col.find_wall_collision(this.pos[0], this.pos[1], this.pos[2], 30, 24));

		({ floor: this.floor, height: this.floorHeight } = col.find_floor(this.pos[0], this.pos[1], this.pos[2]));
		({ ceil: this.ceil, height: this.ceilHeight } = col.vec3f_find_ceil(this.pos, this.floorHeight));

		this.floorAngle = new Int16Array([atan2s(this.floor.normal.z, this.floor.normal.x)])[0]

		if (this.floor_is_slippery()) {
			this.input |= Mario.INPUT_ABOVE_SLIDE
		}

		if (this.pos[1] > this.floorHeight + 100) {
			this.input |= Mario.INPUT_OFF_FLOOR
		}
	}

	floor_is_slippery() {
		if (this.slideTerrain && this.floor.normal.y < 0.9998477) {
			return true
		}

		let normY

		switch (this.get_floor_class()) {
			case "SURFACE_VERY_SLIPPERY":
				normY = 0.9848077
				break

			case "SURFACE_SLIPPERY":
				normY = 0.9396926
				break

			default:
				normY = 0.7880108
				break

			case "SURFACE_NOT_SLIPPERY":
				normY = 0
				break
		}

		return this.floor.normal.y <= normY
	}

	floor_is_slope() {
		if (this.slideTerrain && this.floor.normal.y < 0.9998477) {
			return true
		}

		let normY

		switch (this.get_floor_class()) {
			case "SURFACE_VERY_SLIPPERY":
				normY = 0.9961947
				break

			case "SURFACE_SLIPPERY":
				normY = 0.9848077
				break

			default:
				normY = 0.9659258
				break

			case "SURFACE_NOT_SLIPPERY":
				normY = 0.9396926
				break
		}

		return this.floor.normal.y <= normY
	}

	get_floor_class() {
		let floorClass

		if (this.slideTerrain) {
			floorClass = "SURFACE_CLASS_VERY_SLIPPERY"
		} else {
			floorClass = "SURFACE_CLASS_DEFAULT"
		}

		switch (this.floor.type) {
			case "SURFACE_NOT_SLIPPERY":
			case "SURFACE_HARD_NOT_SLIPPERY":
			case "SURFACE_SWITCH":
				floorClass = "SURFACE_CLASS_NOT_SLIPPERY"
				break

			case "SURFACE_SLIPPERY":
			case "SURFACE_NOISE_SLIPPERY":
			case "SURFACE_HARD_SLIPPERY":
			case "SURFACE_NO_CAM_COL_SLIPPERY":
				floorClass = "SURFACE_CLASS_SLIPPERY"
				break

			case "SURFACE_VERY_SLIPPERY":
			case "SURFACE_ICE":
			case "SURFACE_HARD_VERY_SLIPPERY":
			case "SURFACE_NOISE_VERY_SLIPPERY_73":
			case "SURFACE_NOISE_VERY_SLIPPERY_74":
			case "SURFACE_NOISE_VERY_SLIPPERY":
			case "SURFACE_NO_CAM_COL_VERY_SLIPPERY":
				floorClass = "SURFACE_CLASS_VERY_SLIPPERY"
				break
		}

		return floorClass
	}

	facing_downhill(turnYaw) {
		let yaw = this.faceAngle[1]

		if (turnYaw && this.forwardVel < 0) {
			yaw += 0x8000
		}

		yaw = new Int16Array([this.floorAngle - yaw])[0]

		return -0x4000 < yaw && yaw < 0x4000
	}

	set_forward_vel(vel) {
		this.forwardVel = vel

		this.slideVelX = sins(this.faceAngle[1]) * this.forwardVel
		this.slideVelZ = coss(this.faceAngle[1]) * this.forwardVel

		this.vel[0] = this.slideVelX
		this.vel[2] = this.slideVelZ
	}

	bonk_reflection(negateSpeed) {
		if (this.wall) {
			let wallAngle = new Int16Array([atan2s(this.wall.normal.z, this.wall.normal.x)])[0]
			this.faceAngle[1] = this.faceAngle[1] - wallAngle
			this.faceAngle[1] = wallAngle - this.faceAngle[1]
		}

		if (negateSpeed) {
			this.set_forward_vel(-this.forwardVel)
		} else {
			this.faceAngle[1] += 0x8000
		}
	}
}

module.exports = Mario
