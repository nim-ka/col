const { f32, sqrtf, sins, coss } = require("./math.js")

class Vertex {
	constructor(x, y, z) {
		this.x = x | 0
		this.y = y | 0
		this.z = z | 0
	}
}

class Normal {
	constructor(x, y, z) {
		this.x = f32(x)
		this.y = f32(y)
		this.z = f32(z)
	}
}

function lower_cell_index(coord) {
	coord += 8192

	if (coord < 0) {
		coord = 0
	}

	coord = s16(coord)

	let index = s16(coord / 1024)

	if (coord % 1024 < 50) {
		index--
	}

	if (index < 0) {
		index = 0
	}

	return index
}

function upper_cell_index(coord) {
	coord += 8192

	if (coord < 0) {
		coord = 0
	}

	coord = s16(coord)

	let index = s16(coord / 1024)

	if (coord % 1024 > 1024 - 50) {
		index++
	}

	if (index > 15) {
		index = 15
	}

	return index
}

class Surface {
	static COL_FLOOR = 0
	static COL_CEILING = 1
	static COL_WALL = 2

	static SURFACE_DEFAULT                      = 0x0000 // Environment default
	static SURFACE_BURNING                      = 0x0001 // Lava / Frostbite (in SL), but is used mostly for Lava
	static SURFACE_0004                         = 0x0004 // Unused, has no function and has parameters
	static SURFACE_HANGABLE                     = 0x0005 // Ceiling that Mario can climb on
	static SURFACE_SLOW                         = 0x0009 // Slow down Mario, unused
	static SURFACE_DEATH_PLANE                  = 0x000A // Death floor
	static SURFACE_CLOSE_CAMERA                 = 0x000B // Close camera
	static SURFACE_WATER                        = 0x000D // Water, has no action, used on some waterboxes below
	static SURFACE_FLOWING_WATER                = 0x000E // Water (flowing), has parameters
	static SURFACE_INTANGIBLE                   = 0x0012 // Intangible (Separates BBH mansion from merry-go-round, for room usage)
	static SURFACE_VERY_SLIPPERY                = 0x0013 // Very slippery, mostly used for slides
	static SURFACE_SLIPPERY                     = 0x0014 // Slippery
	static SURFACE_NOT_SLIPPERY                 = 0x0015 // Non-slippery, climbable
	static SURFACE_TTM_VINES                    = 0x0016 // TTM vines, has no action defined
	static SURFACE_MGR_MUSIC                    = 0x001A // Plays the Merry go round music, see handle_merry_go_round_music in bbh_merry_go_round.inc.c for more details
	static SURFACE_INSTANT_WARP_1B              = 0x001B // Instant warp to another area, used to warp between areas in WDW and the endless stairs to warp back
	static SURFACE_INSTANT_WARP_1C              = 0x001C // Instant warp to another area, used to warp between areas in WDW
	static SURFACE_INSTANT_WARP_1D              = 0x001D // Instant warp to another area, used to warp between areas in DDD, SSL and TTM
	static SURFACE_INSTANT_WARP_1E              = 0x001E // Instant warp to another area, used to warp between areas in DDD, SSL and TTM
	static SURFACE_SHALLOW_QUICKSAND            = 0x0021 // Shallow Quicksand (depth of 10 units)
	static SURFACE_DEEP_QUICKSAND               = 0x0022 // Quicksand (lethal, slow, depth of 160 units)
	static SURFACE_INSTANT_QUICKSAND            = 0x0023 // Quicksand (lethal, instant)
	static SURFACE_DEEP_MOVING_QUICKSAND        = 0x0024 // Moving quicksand (flowing, depth of 160 units)
	static SURFACE_SHALLOW_MOVING_QUICKSAND     = 0x0025 // Moving quicksand (flowing, depth of 25 units)
	static SURFACE_QUICKSAND                    = 0x0026 // Moving quicksand (60 units)
	static SURFACE_MOVING_QUICKSAND             = 0x0027 // Moving quicksand (flowing, depth of 60 units)
	static SURFACE_WALL_MISC                    = 0x0028 // Used for some walls, Cannon to adjust the camera, and some objects like Warp Pipe
	static SURFACE_NOISE_DEFAULT                = 0x0029 // Default floor with noise
	static SURFACE_NOISE_SLIPPERY               = 0x002A // Slippery floor with noise
	static SURFACE_HORIZONTAL_WIND              = 0x002C // Horizontal wind, has parameters
	static SURFACE_INSTANT_MOVING_QUICKSAND     = 0x002D // Quicksand (lethal, flowing)
	static SURFACE_ICE                          = 0x002E // Slippery Ice, in snow levels and THI's water floor
	static SURFACE_LOOK_UP_WARP                 = 0x002F // Look up and warp (Wing cap entrance)
	static SURFACE_HARD                         = 0x0030 // Hard floor (Always has fall damage)
	static SURFACE_WARP                         = 0x0032 // Surface warp
	static SURFACE_TIMER_START                  = 0x0033 // Timer start (Peach's secret slide)
	static SURFACE_TIMER_END                    = 0x0034 // Timer stop (Peach's secret slide)
	static SURFACE_HARD_SLIPPERY                = 0x0035 // Hard and slippery (Always has fall damage)
	static SURFACE_HARD_VERY_SLIPPERY           = 0x0036 // Hard and very slippery (Always has fall damage)
	static SURFACE_HARD_NOT_SLIPPERY            = 0x0037 // Hard and Non-slippery (Always has fall damage)
	static SURFACE_VERTICAL_WIND                = 0x0038 // Death at bottom with vertical wind
	static SURFACE_BOSS_FIGHT_CAMERA            = 0x0065 // Wide camera for BoB and WF bosses
	static SURFACE_CAMERA_FREE_ROAM             = 0x0066 // Free roam camera for THI and TTC
	static SURFACE_THI3_WALLKICK                = 0x0068 // Surface where there's a wall kick section in THI 3rd area, has no action defined
	static SURFACE_CAMERA_8_DIR                 = 0x0069 // Surface that enables far camera for platforms, used in THI
	static SURFACE_CAMERA_MIDDLE                = 0x006E // Surface camera that returns to the middle, used on the 4 pillars of SSL
	static SURFACE_CAMERA_ROTATE_RIGHT          = 0x006F // Surface camera that rotates to the right (Bowser 1 & THI)
	static SURFACE_CAMERA_ROTATE_LEFT           = 0x0070 // Surface camera that rotates to the left (BoB & TTM)
	static SURFACE_CAMERA_BOUNDARY              = 0x0072 // Intangible Area, only used to restrict camera movement
	static SURFACE_NOISE_VERY_SLIPPERY_73       = 0x0073 // Very slippery floor with noise, unused
	static SURFACE_NOISE_VERY_SLIPPERY_74       = 0x0074 // Very slippery floor with noise, unused
	static SURFACE_NOISE_VERY_SLIPPERY          = 0x0075 // Very slippery floor with noise, used in CCM
	static SURFACE_NO_CAM_COLLISION             = 0x0076 // Surface with no cam collision flag
	static SURFACE_NO_CAM_COLLISION_77          = 0x0077 // Surface with no cam collision flag, unused
	static SURFACE_NO_CAM_COL_VERY_SLIPPERY     = 0x0078 // Surface with no cam collision flag, very slippery with noise (THI)
	static SURFACE_NO_CAM_COL_SLIPPERY          = 0x0079 // Surface with no cam collision flag, slippery with noise (CCM, PSS and TTM slides)
	static SURFACE_SWITCH                       = 0x007A // Surface with no cam collision flag, non-slippery with noise, used by switches and Dorrie
	static SURFACE_VANISH_CAP_WALLS             = 0x007B // Vanish cap walls, pass through them with Vanish Cap
	static SURFACE_PAINTING_WOBBLE_A6           = 0x00A6 // Painting wobble (BoB Left)
	static SURFACE_PAINTING_WOBBLE_A7           = 0x00A7 // Painting wobble (BoB Middle)
	static SURFACE_PAINTING_WOBBLE_A8           = 0x00A8 // Painting wobble (BoB Right)
	static SURFACE_PAINTING_WOBBLE_A9           = 0x00A9 // Painting wobble (CCM Left)
	static SURFACE_PAINTING_WOBBLE_AA           = 0x00AA // Painting wobble (CCM Middle)
	static SURFACE_PAINTING_WOBBLE_AB           = 0x00AB // Painting wobble (CCM Right)
	static SURFACE_PAINTING_WOBBLE_AC           = 0x00AC // Painting wobble (WF Left)
	static SURFACE_PAINTING_WOBBLE_AD           = 0x00AD // Painting wobble (WF Middle)
	static SURFACE_PAINTING_WOBBLE_AE           = 0x00AE // Painting wobble (WF Right)
	static SURFACE_PAINTING_WOBBLE_AF           = 0x00AF // Painting wobble (JRB Left)
	static SURFACE_PAINTING_WOBBLE_B0           = 0x00B0 // Painting wobble (JRB Middle)
	static SURFACE_PAINTING_WOBBLE_B1           = 0x00B1 // Painting wobble (JRB Right)
	static SURFACE_PAINTING_WOBBLE_B2           = 0x00B2 // Painting wobble (LLL Left)
	static SURFACE_PAINTING_WOBBLE_B3           = 0x00B3 // Painting wobble (LLL Middle)
	static SURFACE_PAINTING_WOBBLE_B4           = 0x00B4 // Painting wobble (LLL Right)
	static SURFACE_PAINTING_WOBBLE_B5           = 0x00B5 // Painting wobble (SSL Left)
	static SURFACE_PAINTING_WOBBLE_B6           = 0x00B6 // Painting wobble (SSL Middle)
	static SURFACE_PAINTING_WOBBLE_B7           = 0x00B7 // Painting wobble (SSL Right)
	static SURFACE_PAINTING_WOBBLE_B8           = 0x00B8 // Painting wobble (Unused - Left)
	static SURFACE_PAINTING_WOBBLE_B9           = 0x00B9 // Painting wobble (Unused - Middle)
	static SURFACE_PAINTING_WOBBLE_BA           = 0x00BA // Painting wobble (Unused - Right)
	static SURFACE_PAINTING_WOBBLE_BB           = 0x00BB // Painting wobble (DDD - Left), makes the painting wobble if touched
	static SURFACE_PAINTING_WOBBLE_BC           = 0x00BC // Painting wobble (Unused, DDD - Middle)
	static SURFACE_PAINTING_WOBBLE_BD           = 0x00BD // Painting wobble (Unused, DDD - Right)
	static SURFACE_PAINTING_WOBBLE_BE           = 0x00BE // Painting wobble (WDW Left)
	static SURFACE_PAINTING_WOBBLE_BF           = 0x00BF // Painting wobble (WDW Middle)
	static SURFACE_PAINTING_WOBBLE_C0           = 0x00C0 // Painting wobble (WDW Right)
	static SURFACE_PAINTING_WOBBLE_C1           = 0x00C1 // Painting wobble (THI Tiny - Left)
	static SURFACE_PAINTING_WOBBLE_C2           = 0x00C2 // Painting wobble (THI Tiny - Middle)
	static SURFACE_PAINTING_WOBBLE_C3           = 0x00C3 // Painting wobble (THI Tiny - Right)
	static SURFACE_PAINTING_WOBBLE_C4           = 0x00C4 // Painting wobble (TTM Left)
	static SURFACE_PAINTING_WOBBLE_C5           = 0x00C5 // Painting wobble (TTM Middle)
	static SURFACE_PAINTING_WOBBLE_C6           = 0x00C6 // Painting wobble (TTM Right)
	static SURFACE_PAINTING_WOBBLE_C7           = 0x00C7 // Painting wobble (Unused, TTC - Left)
	static SURFACE_PAINTING_WOBBLE_C8           = 0x00C8 // Painting wobble (Unused, TTC - Middle)
	static SURFACE_PAINTING_WOBBLE_C9           = 0x00C9 // Painting wobble (Unused, TTC - Right)
	static SURFACE_PAINTING_WOBBLE_CA           = 0x00CA // Painting wobble (Unused, SL - Left)
	static SURFACE_PAINTING_WOBBLE_CB           = 0x00CB // Painting wobble (Unused, SL - Middle)
	static SURFACE_PAINTING_WOBBLE_CC           = 0x00CC // Painting wobble (Unused, SL - Right)
	static SURFACE_PAINTING_WOBBLE_CD           = 0x00CD // Painting wobble (THI Huge - Left)
	static SURFACE_PAINTING_WOBBLE_CE           = 0x00CE // Painting wobble (THI Huge - Middle)
	static SURFACE_PAINTING_WOBBLE_CF           = 0x00CF // Painting wobble (THI Huge - Right)
	static SURFACE_PAINTING_WOBBLE_D0           = 0x00D0 // Painting wobble (HMC & COTMC - Left), makes the painting wobble if touched
	static SURFACE_PAINTING_WOBBLE_D1           = 0x00D1 // Painting wobble (Unused, HMC & COTMC - Middle)
	static SURFACE_PAINTING_WOBBLE_D2           = 0x00D2 // Painting wobble (Unused, HMC & COTMC - Right)
	static SURFACE_PAINTING_WARP_D3             = 0x00D3 // Painting warp (BoB Left)
	static SURFACE_PAINTING_WARP_D4             = 0x00D4 // Painting warp (BoB Middle)
	static SURFACE_PAINTING_WARP_D5             = 0x00D5 // Painting warp (BoB Right)
	static SURFACE_PAINTING_WARP_D6             = 0x00D6 // Painting warp (CCM Left)
	static SURFACE_PAINTING_WARP_D7             = 0x00D7 // Painting warp (CCM Middle)
	static SURFACE_PAINTING_WARP_D8             = 0x00D8 // Painting warp (CCM Right)
	static SURFACE_PAINTING_WARP_D9             = 0x00D9 // Painting warp (WF Left)
	static SURFACE_PAINTING_WARP_DA             = 0x00DA // Painting warp (WF Middle)
	static SURFACE_PAINTING_WARP_DB             = 0x00DB // Painting warp (WF Right)
	static SURFACE_PAINTING_WARP_DC             = 0x00DC // Painting warp (JRB Left)
	static SURFACE_PAINTING_WARP_DD             = 0x00DD // Painting warp (JRB Middle)
	static SURFACE_PAINTING_WARP_DE             = 0x00DE // Painting warp (JRB Right)
	static SURFACE_PAINTING_WARP_DF             = 0x00DF // Painting warp (LLL Left)
	static SURFACE_PAINTING_WARP_E0             = 0x00E0 // Painting warp (LLL Middle)
	static SURFACE_PAINTING_WARP_E1             = 0x00E1 // Painting warp (LLL Right)
	static SURFACE_PAINTING_WARP_E2             = 0x00E2 // Painting warp (SSL Left)
	static SURFACE_PAINTING_WARP_E3             = 0x00E3 // Painting warp (SSL Medium)
	static SURFACE_PAINTING_WARP_E4             = 0x00E4 // Painting warp (SSL Right)
	static SURFACE_PAINTING_WARP_E5             = 0x00E5 // Painting warp (Unused - Left)
	static SURFACE_PAINTING_WARP_E6             = 0x00E6 // Painting warp (Unused - Medium)
	static SURFACE_PAINTING_WARP_E7             = 0x00E7 // Painting warp (Unused - Right)
	static SURFACE_PAINTING_WARP_E8             = 0x00E8 // Painting warp (DDD - Left)
	static SURFACE_PAINTING_WARP_E9             = 0x00E9 // Painting warp (DDD - Middle)
	static SURFACE_PAINTING_WARP_EA             = 0x00EA // Painting warp (DDD - Right)
	static SURFACE_PAINTING_WARP_EB             = 0x00EB // Painting warp (WDW Left)
	static SURFACE_PAINTING_WARP_EC             = 0x00EC // Painting warp (WDW Middle)
	static SURFACE_PAINTING_WARP_ED             = 0x00ED // Painting warp (WDW Right)
	static SURFACE_PAINTING_WARP_EE             = 0x00EE // Painting warp (THI Tiny - Left)
	static SURFACE_PAINTING_WARP_EF             = 0x00EF // Painting warp (THI Tiny - Middle)
	static SURFACE_PAINTING_WARP_F0             = 0x00F0 // Painting warp (THI Tiny - Right)
	static SURFACE_PAINTING_WARP_F1             = 0x00F1 // Painting warp (TTM Left)
	static SURFACE_PAINTING_WARP_F2             = 0x00F2 // Painting warp (TTM Middle)
	static SURFACE_PAINTING_WARP_F3             = 0x00F3 // Painting warp (TTM Right)
	static SURFACE_TTC_PAINTING_1               = 0x00F4 // Painting warp (TTC Left)
	static SURFACE_TTC_PAINTING_2               = 0x00F5 // Painting warp (TTC Medium)
	static SURFACE_TTC_PAINTING_3               = 0x00F6 // Painting warp (TTC Right)
	static SURFACE_PAINTING_WARP_F7             = 0x00F7 // Painting warp (SL Left)
	static SURFACE_PAINTING_WARP_F8             = 0x00F8 // Painting warp (SL Middle)
	static SURFACE_PAINTING_WARP_F9             = 0x00F9 // Painting warp (SL Right)
	static SURFACE_PAINTING_WARP_FA             = 0x00FA // Painting warp (THI Tiny - Left)
	static SURFACE_PAINTING_WARP_FB             = 0x00FB // Painting warp (THI Tiny - Middle)
	static SURFACE_PAINTING_WARP_FC             = 0x00FC // Painting warp (THI Tiny - Right)
	static SURFACE_WOBBLING_WARP                = 0x00FD // Pool warp (HMC & DDD)
	static SURFACE_TRAPDOOR                     = 0x00FF // Bowser Left trapdoor, has no action defined

	static SURFACE_CLASS_DEFAULT       = 0x0000
	static SURFACE_CLASS_VERY_SLIPPERY = 0x0013
	static SURFACE_CLASS_SLIPPERY      = 0x0014
	static SURFACE_CLASS_NOT_SLIPPERY  = 0x0015

	constructor(type, v1, v2, v3, normal, originOffset, lowerY, upperY) {
		this.col = undefined
		this.type = type
		this.v1 = v1
		this.v2 = v2
		this.v3 = v3
		this.normal = normal
		this.originOffset = f32(originOffset)
		this.lowerY = lowerY
		this.upperY = upperY
		this.proj = "z"
	}

	addToCell(data, dynamic, cellX, cellZ) {
		let sortDir

		if (this.normal.y > 0.01) {
			this.col = Surface.COL_FLOOR
			sortDir = 1
		} else if (this.normal.y < -0.01) {
			this.col = Surface.COL_CEILING
			sortDir = -1
		} else {
			this.col = Surface.COL_WALL
			sortDir = 0

			if (this.normal.x < -0.707 || this.normal.x > 0.707) {
				this.proj = "x"
			}
		}

		let surfList = data[dynamic ? "dynamic" : "static"][cellZ][cellX][this.col]
		let thisPriority = this.v1.y * sortDir

		let i = 0

		for (; i < surfList.length; i++) {
			let thatPriority = surfList[i].v1.y * sortDir

			if (thisPriority > thatPriority) {
				break
			}
		}

		surfList.splice(i, 0, this)
	}

	addToData(data, dynamic) {
		let minX = Math.min(this.v1.x, this.v2.x, this.v3.x)
		let minZ = Math.min(this.v1.z, this.v2.z, this.v3.z)
		let maxX = Math.max(this.v1.x, this.v2.x, this.v3.x)
		let maxZ = Math.max(this.v1.z, this.v2.z, this.v3.z)

		let minCellX = lower_cell_index(minX)
		let maxCellX = upper_cell_index(maxX)
		let minCellZ = lower_cell_index(minZ)
		let maxCellZ = upper_cell_index(maxZ)

		for (let cellZ = minCellZ; cellZ <= maxCellZ; cellZ++) {
			for (let cellX = minCellX; cellX <= maxCellX; cellX++) {
				this.addToCell(data, dynamic, cellX, cellZ)
			}
		}
	}

	static createSurface(type, vtxList, i1, i2, i3, translation = [0, 0, 0], rotation = [0, 0, 0]) {
		let v1 = vtxList[i1]
		let v2 = vtxList[i2]
		let v3 = vtxList[i3]

		let sx = sins(rotation[0])
		let sy = sins(rotation[1])
		let sz = sins(rotation[2])

		let cx = coss(rotation[0])
		let cy = coss(rotation[1])
		let cz = coss(rotation[2])

		let mat = [
			[cy * cz + sx * sy * sz, cx * sz, -sy * cz + sx * cy * sz, 0],
			[-cy * sz + sx * sy * cz, cx * cz, sy * sz + sx * cy * cz, 0],
			[cx * sy, -sx, cx * cy, 0],
			[translation[0], translation[1], translation[2], 1]
		]

		let vertices = [v1, v2, v3]
		let nvertices = []

		for (let vertex of vertices) {
			nvertices.push(new Vertex(
				vertex.x * mat[0][0] + vertex.y * mat[1][0] + vertex.z * mat[2][0] + mat[3][0],
				vertex.x * mat[0][1] + vertex.y * mat[1][1] + vertex.z * mat[2][1] + mat[3][1],
				vertex.x * mat[0][2] + vertex.y * mat[1][2] + vertex.z * mat[2][2] + mat[3][2]
			))
		}

		v1 = nvertices[0]
		v2 = nvertices[1]
		v3 = nvertices[2]

		let x1 = v1.x
		let y1 = v1.y
		let z1 = v1.z

		let x2 = v2.x
		let y2 = v2.y
		let z2 = v2.z

		let x3 = v3.x
		let y3 = v3.y
		let z3 = v3.z

		let nx = (y2 - y1) * (z3 - z2) - (z2 - z1) * (y3 - y2)
		let ny = (z2 - z1) * (x3 - x2) - (x2 - x1) * (z3 - z2)
		let nz = (x2 - x1) * (y3 - y2) - (y2 - y1) * (x3 - x2)
		let mag = sqrtf(nx * nx + ny * ny + nz * nz)

		if (mag < 0.0001) {
			return null
		}

		mag = 1 / mag
		nx *= mag
		ny *= mag
		nz *= mag

		let oo = -(nx * x1 + ny * y1 + nz * z1)

		let minY = Math.min(y1, y2, y3)
		let maxY = Math.max(y1, y2, y3)

		return new Surface(type, v1, v2, v3, new Normal(nx, ny, nz), oo, minY - 5, maxY + 5)
	}
}

class SurfaceData {
	constructor() {
		this.reset()
	}

	reset() {
		this.dynamic = new Array(16).fill().map(() => new Array(16).fill().map(() => new Array(3).fill().map(() => [])))
		this.static  = new Array(16).fill().map(() => new Array(16).fill().map(() => new Array(3).fill().map(() => [])))
	}
}

module.exports = {
	Vertex,
	Normal,
	Surface,
	SurfaceData,
}
