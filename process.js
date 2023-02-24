const { Vertex, Surface } = require("./surface.js")

function getParens(str) {
	return str.match(/\((.+)\)/)[1]
}

function process(str, translation = [0, 0, 0], rotation = [0, 0, 0]) {
	let lines = str.split("\n")
	let i = 0

	while (!lines[++i].includes("COL_INIT("));
	while (!lines[++i].includes("COL_VERTEX_INIT("));

	let numVertices = +getParens(lines[i])
	let vertices = []

	console.log("Loading", numVertices, "vertices")

	while (!lines[++i].includes("COL_TRI_INIT(")) {
		if (lines[i].includes("COL_VERTEX(")) {
			if (vertices.length >= numVertices) {
				throw "Error: exceeded max vertices"
			}

			let parens = getParens(lines[i]).split(/,\s+/).map(e => +e)

			vertices.push(new Vertex(parens[0], parens[1], parens[2]))
		}
	}

	let type
	let numTris
	let tris = []

	for (; i < lines.length; i++) {
		if (lines[i].includes("COL_TRI_INIT(")) {
			let parens = getParens(lines[i]).split(/,\s+/)

			type = parens[0]
			numTris = +parens[1]
			tris.push([])

			console.log("Loading", numTris, "triangles of type", type)
		}

		if (lines[i].includes("COL_TRI(")) {
			if (tris[tris.length - 1].length >= numTris) {
				throw "Error: exceeded max triangles"
			}

			let parens = getParens(lines[i]).split(/,\s+/).map(e => +e)

			tris[tris.length - 1].push(Surface.createSurface(
				type, vertices, parens[0], parens[1], parens[2], translation, rotation))
		}
	}

	return tris
}

module.exports = {
	process,
};
