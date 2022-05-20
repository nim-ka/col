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

module.exports = {
	find_floor_from_list,
	find_ceil_from_list,
	set_static_floor_list,
	set_dynamic_floor_list,
	find_floor,
	set_static_ceil_list,
	set_dynamic_ceil_list,
	find_ceil,
}
