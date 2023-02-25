const { s16, f32 } = require("./math.js")
const { Surface, SurfaceData } = require("./surface.js")

class WallCollisionData {
	numWalls = 0
	walls = []

	constructor(x, y, z, offsetY, radius) {
		this.x = f32(x)
		this.y = f32(y)
		this.z = f32(z)

		this.offsetY = f32(offsetY)
		this.radius = f32(radius)
	}
}

const surfData = new SurfaceData()

function reset() {
	surfData.reset()
}

function add_static(surface) {
	surface.addToData(surfData, false)
}

function add_dynamic(surface) {
	surface.addToData(surfData, true)
}

function find_wall_collisions_from_list(surfList, data) {
	let radius = Math.min(data.radius, 200)
	let x = data.x
	let y = data.y + data.offsetY
	let z = data.z

	let numCols = 0

	for (let surf of surfList) {
		if (y < surf.lowerY || y > surf.upperY) {
			continue
		}

		let offset = surf.normal.x * x + surf.normal.y * y + surf.normal.z * z + surf.originOffset

		if (offset < -radius || offset > radius) {
			continue
		}

		if (surf.proj == "x") {
			let w1 = -surf.v1.z
			let w2 = -surf.v2.z
			let w3 = -surf.v3.z

			let y1 = surf.v1.y
			let y2 = surf.v2.y
			let y3 = surf.v3.y

			if (surf.normal.x > 0) {
				if ((y1 - y) * (w2 - w1) - (w1 - -z) * (y2 - y1) > 0) {
					continue
				}
				if ((y2 - y) * (w3 - w2) - (w2 - -z) * (y3 - y2) > 0) {
					continue
				}
				if ((y3 - y) * (w1 - w3) - (w3 - -z) * (y1 - y3) > 0) {
					continue
				}
			} else {
				if ((y1 - y) * (w2 - w1) - (w1 - -z) * (y2 - y1) < 0) {
					continue
				}
				if ((y2 - y) * (w3 - w2) - (w2 - -z) * (y3 - y2) < 0) {
					continue
				}
				if ((y3 - y) * (w1 - w3) - (w3 - -z) * (y1 - y3) < 0) {
					continue
				}
			}
		} else {
			let w1 = surf.v1.x
			let w2 = surf.v2.x
			let w3 = surf.v3.x

			let y1 = surf.v1.y
			let y2 = surf.v2.y
			let y3 = surf.v3.y

			if (surf.normal.z > 0) {
				if ((y1 - y) * (w2 - w1) - (w1 - x) * (y2 - y1) > 0) {
					continue
				}
				if ((y2 - y) * (w3 - w2) - (w2 - x) * (y3 - y2) > 0) {
					continue
				}
				if ((y3 - y) * (w1 - w3) - (w3 - x) * (y1 - y3) > 0) {
					continue
				}
			} else {
				if ((y1 - y) * (w2 - w1) - (w1 - x) * (y2 - y1) < 0) {
					continue
				}
				if ((y2 - y) * (w3 - w2) - (w2 - x) * (y3 - y2) < 0) {
					continue
				}
				if ((y3 - y) * (w1 - w3) - (w3 - x) * (y1 - y3) < 0) {
					continue
				}
			}
		}

		data.x += surf.normal.x * (radius - offset)
		data.z += surf.normal.z * (radius - offset)

		if (data.numWalls < 4) {
			data.walls[data.numWalls++] = surf
		}

		numCols++
	}

	return numCols
}

function find_floor_from_list(surfList, x, y, z) {
	let pheight = -11000
	let floor = null

	for (let surf of surfList) {
		let x1 = surf.v1.x
		let z1 = surf.v1.z
		let x2 = surf.v2.x
		let z2 = surf.v2.z

		if ((z1 - z) * (x2 - x1) - (x1 - x) * (z2 - z1) < 0) {
			continue
		}

		let x3 = surf.v3.x
		let z3 = surf.v3.z

		if ((z2 - z) * (x3 - x2) - (x2 - x) * (z3 - z2) < 0) {
			continue
		}

		if ((z3 - z) * (x1 - x3) - (x3 - x) * (z1 - z3) < 0) {
			continue
		}

		if (surf.type == Surface.SURFACE_CAMERA_BOUNDARY) {
			continue
		}

		let nx = surf.normal.x
		let ny = surf.normal.y
		let nz = surf.normal.z
		let oo = surf.originOffset

		if (ny == 0) {
			continue
		}

		let height = f32(-(x * nx + nz * z + oo) / ny)

		if (y - (height + -78) < 0) {
			continue
		}

		pheight = height
		floor = surf
		break
	}

	return { floor: floor, height: pheight }
}

function find_ceil_from_list(surfList, x, y, z) {
	let pheight = 20000
 	let ceil = null

	for (let surf of surfList) {
		let x1 = surf.v1.x
		let z1 = surf.v1.z
		let x2 = surf.v2.x
		let z2 = surf.v2.z

		if ((z1 - z) * (x2 - x1) - (x1 - x) * (z2 - z1) > 0) {
			continue
		}

		let x3 = surf.v3.x
		let z3 = surf.v3.z

		if ((z2 - z) * (x3 - x2) - (x2 - x) * (z3 - z2) > 0) {
			continue
		}

		if ((z3 - z) * (x1 - x3) - (x3 - x) * (z1 - z3) > 0) {
			continue
		}

		if (surf.type == Surface.SURFACE_CAMERA_BOUNDARY) {
			continue
		}

		let nx = surf.normal.x
		let ny = surf.normal.y
		let nz = surf.normal.z
		let oo = surf.originOffset

		if (ny == 0) {
			continue
		}

		let height = f32(-(x * nx + nz * z + oo) / ny)

		if (y - (height - -78) > 0) {
			continue
		}

		pheight = height
		ceil = surf
		break
	}

	return { ceil: ceil, height: pheight }
}

function find_wall_collision(x, y, z, offsetY, radius) {
	const collision = new WallCollisionData(x, y, z, offsetY, radius)
	const numCols = find_wall_collisions(collision)

	return { x: collision.x, y: collision.y, z: collision.z, numCols }
}

function find_wall_collisions(colData) {
	let x = colData.x
	let z = colData.z

	colData.numWalls = 0

	if (x <= -8192 || x >= 8192) {
		return 0
	}

	if (z <= -8192 || z >= 8192) {
		return 0
	}

	let cellX = ((x + 8192) / 0x400) & 15
	let cellZ = ((z + 8192) / 0x400) & 15

	let numDynamicCols = find_wall_collisions_from_list(surfData.dynamic[cellZ][cellX][Surface.COL_WALL], colData)
	let numStaticCols = find_wall_collisions_from_list(surfData.static[cellZ][cellX][Surface.COL_WALL], colData)

	return numDynamicCols + numStaticCols
}

function find_floor(x, y, z) {
	x = s16(x)
	y = s16(y)
	z = s16(z)

	if (x <= -8192 || x >= 8192) {
		return { floor: null, height: -11000 }
	}

	if (z <= -8192 || z >= 8192) {
		return { floor: null, height: -11000 }
	}

	let cellX = ((x + 8192) / 0x400) & 15
	let cellZ = ((z + 8192) / 0x400) & 15

	let { floor: dynamicFloor, height: dynamicHeight } = find_floor_from_list(surfData.dynamic[cellZ][cellX][Surface.COL_FLOOR], x, y, z)
	let { floor, height } = find_floor_from_list(surfData.static[cellZ][cellX][Surface.COL_FLOOR], x, y, z)

	if (floor && floor.type == Surface.SURFACE_INTANGIBLE) {
		({ floor, height } = find_floor_from_list(staticFloors, x, (y - 200) | 0, z))
	}

	if (dynamicHeight > height) {
		floor = dynamicFloor
		height = dynamicHeight
	}

	return { floor: floor, height: height }
}

function find_ceil(x, y, z) {
	x = s16(x)
	y = s16(y)
	z = s16(z)

	if (x <= -8192 || x >= 8192) {
		return { ceil: null, height: 20000 }
	}

	if (z <= -8192 || z >= 8192) {
		return { ceil: null, height: 20000 }
	}

	let cellX = ((x + 8192) / 0x400) & 15
	let cellZ = ((z + 8192) / 0x400) & 15

	let { ceil: dynamicCeil, height: dynamicHeight } = find_ceil_from_list(surfData.dynamic[cellZ][cellX][Surface.COL_CEILING], x, y, z)
	let { ceil, height } = find_ceil_from_list(surfData.static[cellZ][cellX][Surface.COL_CEILING], x, y, z)

	if (dynamicHeight < height) {
		ceil = dynamicCeil
		height = dynamicHeight
	}

	return { ceil: ceil, height: height }
}

function vec3f_find_ceil(pos, height) {
	return find_ceil(pos[0], height + 80, pos[2])
}

module.exports = {
	WallCollisionData,
	reset,
	add_static,
	add_dynamic,
	find_wall_collisions_from_list,
	find_floor_from_list,
	find_ceil_from_list,
	find_wall_collision,
	find_wall_collisions,
	find_floor,
	find_ceil,
	vec3f_find_ceil,
}
