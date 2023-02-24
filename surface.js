const { sqrtf, sins, coss } = require("./math.js")

class Vertex {
	constructor(x, y, z) {
		this.x = x | 0
		this.y = y | 0
		this.z = z | 0
	}
}

class Normal {
	constructor(x, y, z) {
		this.x = Math.fround(x)
		this.y = Math.fround(y)
		this.z = Math.fround(z)
	}
}

class Surface {
	static COL_FLOOR = "COL_FLOOR"
	static COL_WALL = "COL_WALL"
	static COL_CEILING = "COL_CEILING"

	constructor(type, v1, v2, v3, normal, originOffset, lowerY, upperY) {
		this.col = undefined
		this.type = type
		this.v1 = v1
		this.v2 = v2
		this.v3 = v3
		this.normal = normal
		this.originOffset = Math.fround(originOffset)
		this.lowerY = lowerY
		this.upperY = upperY
		this.proj = "z"
	}

	addToList(floorList, wallList, ceilList) {
		let surfList
		let sortDir

		if (this.normal.y > 0.01) {
			this.col = Surface.COL_FLOOR
			surfList = floorList
			sortDir = 1
		} else if (this.normal.y < -0.01) {
			this.col = Surface.COL_CEILING
			surfList = ceilList
			sortDir = -1
		} else {
			this.col = Surface.COL_WALL
			surfList = wallList
			sortDir = 0

			if (this.normal.x < -0.707 || this.normal.x > 0.707) {
				this.proj = "x"
			}
		}

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

module.exports = {
	Vertex,
	Normal,
	Surface,
}
