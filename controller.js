const { sqrtf } = require("./math.js")

class Controller {
	static A_BUTTON     = 0x8000
	static B_BUTTON     = 0x4000
	static L_TRIG	    = 0x0020
	static R_TRIG	    = 0x0010
	static Z_TRIG	    = 0x2000
	static START_BUTTON = 0x1000
	static U_JPAD	    = 0x0800
	static L_JPAD	    = 0x0200
	static R_JPAD	    = 0x0100
	static D_JPAD	    = 0x0400
	static U_CBUTTONS   = 0x0008
	static L_CBUTTONS   = 0x0002
	static R_CBUTTONS   = 0x0001
	static D_CBUTTONS   = 0x0004

	rawStickX = 0
	rawStickY = 0
	stickX = 0
	stickY = 0
	stickMag = 0
	buttonDown = 0
	buttonPressed = 0

	reset() {
		this.rawStickX = 0
		this.rawStickY = 0
		this.buttonPressed = 0
		this.buttonDown = 0
		this.stickX = 0
		this.stickY = 0
		this.stickMag = 0
	}

	setStick(x, y) {
		this.rawStickX = x
		this.rawStickY = y

		this.stickX = 0
		this.stickY = 0

		if (x <= -8) {
			this.stickX = x + 6
		}

		if (x >= 8) {
			this.stickX = x - 6
		}

		if (y <= -8) {
			this.stickY = y + 6
		}

		if (y >= 8) {
			this.stickY = y - 6
		}

		this.stickMag = sqrtf(this.stickX * this.stickX + this.stickY * this.stickY)

		if (this.stickMag > 64) {
			this.stickX *= 64 / this.stickMag
			this.stickY *= 64 / this.stickMag
			this.stickMag = 64
		}
	}

	setButtons(button) {
		this.buttonPressed = button & (button ^ this.buttonDown)
		this.buttonDown = button
	}
}

module.exports = Controller
