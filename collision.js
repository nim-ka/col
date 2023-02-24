class WallCollisionData {
	numWalls = 0
	walls = []

	constructor(x, y, z, offsetY, radius) {
		this.x = Math.fround(x)
		this.y = Math.fround(y)
		this.z = Math.fround(z)

		this.offsetY = Math.fround(offsetY)
		this.radius = Math.fround(radius)
	}
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

		if (surf.type == "SURFACE_CAMERA_BOUNDARY") {
			continue
		}

		let nx = surf.normal.x
		let ny = surf.normal.y
		let nz = surf.normal.z
		let oo = surf.originOffset

		if (ny == 0) {
			continue
		}

		let height = Math.fround(-(x * nx + nz * z + oo) / ny)

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

		if (surf.type == "SURFACE_CAMERA_BOUNDARY") {
			continue
		}

		let nx = surf.normal.x
		let ny = surf.normal.y
		let nz = surf.normal.z
		let oo = surf.originOffset

		if (ny == 0) {
			continue
		}

		let height = Math.fround(-(x * nx + nz * z + oo) / ny)

		if (y - (height - -78) > 0) {
			continue
		}

		pheight = height
		ceil = surf
		break
	}

	return { ceil: ceil, height: pheight }
}

let staticWalls
let dynamicWalls

function set_static_wall_list(list) {
	staticWalls = list
}

function set_dynamic_wall_list(list) {
	dynamicWalls = list
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

	let numDynamicCols = find_wall_collisions_from_list(dynamicWalls, colData)
	let numStaticCols = find_wall_collisions_from_list(staticWalls, colData)

	return numDynamicCols + numStaticCols
}

let staticFloors
let dynamicFloors

function set_static_floor_list(list) {
	staticFloors = list
}

function set_dynamic_floor_list(list) {
	dynamicFloors = list
}

function find_floor(x, y, z) {
	x = new Int16Array([x])[0]
	y = new Int16Array([y])[0]
	z = new Int16Array([z])[0]

	if (x <= -8192 || x >= 8192) {
		return { floor: null, height: -11000 }
	}

	if (z <= -8192 || z >= 8192) {
		return { floor: null, height: -11000 }
	}

	let { floor: dynamicFloor, height: dynamicHeight } = find_floor_from_list(dynamicFloors, x, y, z)
	let { floor, height } = find_floor_from_list(staticFloors, x, y, z)

	if (floor && floor.type == "SURFACE_INTANGIBLE") {
		({ floor, height } = find_floor_from_list(staticFloors, x, (y - 200) | 0, z))
	}

	if (dynamicHeight > height) {
		floor = dynamicFloor
		height = dynamicHeight
	}

	return { floor: floor, height: height }
}

let staticCeilings
let dynamicCeilings

function set_static_ceil_list(list) {
	staticCeilings = list
}

function set_dynamic_ceil_list(list) {
	dynamicCeilings = list
}

function find_ceil(x, y, z) {
	x = new Int16Array([x])[0]
	y = new Int16Array([y])[0]
	z = new Int16Array([z])[0]

	if (x <= -8192 || x >= 8192) {
		return { ceil: null, height: 20000 }
	}

	if (z <= -8192 || z >= 8192) {
		return { ceil: null, height: 20000 }
	}

	let { ceil: dynamicCeil, height: dynamicHeight } = find_ceil_from_list(dynamicCeilings, x, y, z)
	let { ceil, height } = find_ceil_from_list(staticCeilings, x, y, z)

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
	find_wall_collisions_from_list,
	find_floor_from_list,
	find_ceil_from_list,
	set_static_wall_list,
	set_dynamic_wall_list,
	find_wall_collision,
	find_wall_collisions,
	set_static_floor_list,
	set_dynamic_floor_list,
	find_floor,
	set_static_ceil_list,
	set_dynamic_ceil_list,
	find_ceil,
	vec3f_find_ceil,
}
