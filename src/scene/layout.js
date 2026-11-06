// Where everything sits. Night positions were solved from the boteco photo:
// the camera was calibrated on the six pool-table pockets (focal 1060 px on a
// 1294 px frame, 3.8 px reprojection error) and each object's pixel was cast
// back onto its wall or the floor. Day pieces take the spot of their night
// pair so one morphs into the other; the day camera frames them like the
// office concept. World origin is the pool table centre; back wall at
// z = -4.5 (faces +z), bar wall at x = ROOM.right (faces -x).
const BAR_WALL = [0, -Math.PI / 2, 0]
const FACE_CAMERA = -0.78 // yaw that turns a prop square to the night camera

// The robot office (day) is its own room built at this offset; see DayRoom.jsx.
export const DAY_ORIGIN = [30, 0, 0]
const day = (x, y, z) => [x + DAY_ORIGIN[0], y + DAY_ORIGIN[1], z + DAY_ORIGIN[2]]

export const CAMERAS = {
  night: { pos: [-2.84, 2.39, 2.88], target: [0.57, 1.22, -0.58], fov: 37.2 },
  day: { pos: [-2.17, 1.59, 7.71], target: [-0.23, 1.15, 3.13], fov: 25.6 },
}

export { day as dayPoint }

export const LAYOUT = {
  // ---- shared fixtures (back wall, far left) ----
  fan: { position: [-0.33, 2.46, -4.5] },
  calendar: { position: [-0.33, 1.71, -4.455] }, // in front of the tile trim

  // ---- night: boteco photo ----
  pool: { position: [0, 0, 0], rotation: [0, -Math.PI / 2, 0] }, // rack on the end nearest the camera
  poolLamp: { position: [0, 2.23, 0], rotation: [0, Math.PI / 2, 0], scale: [1.18, 1, 1] },
  cueRack: { position: [0.45, 1.38, -4.5], scale: [0.62, 1.14, 1] },
  nightSign: { position: [1.6, 2.4, -4.48], scale: 0.93 },
  poster: { position: [1.7, 1.55, -4.455] }, // in front of the tile trim
  tv: { position: [1.1, 2.45, -1.7], rotation: [0, FACE_CAMERA, 0], scale: 0.74 },
  crates: { position: [4.0, 0, -4.2], scale: [1.08, 1.18, 1.08] }, // labels to the front of the room
  floorCrate: { position: [3.75, 0, -3.8] },
  signStand: { position: [2.37, 0, -3.75], rotation: [0, FACE_CAMERA + 0.3, 0] },
  floorBottle: { position: [2.71, 0, -3.7] },
  beerFridge: { position: [4.56, 0, -2.95], rotation: [0, -Math.PI / 2, 0], scale: [1.12, 1.3, 1.12] }, // back to the bar wall, door facing into the room
  chalkboard: { position: [4.93, 2.12, -1.39], rotation: BAR_WALL, scale: [0.85, 0.82, 1] },
  bottleShelf: { position: [4.8, 0, 0.05], rotation: BAR_WALL },
  bottleShelf2: { position: [4.8, 0, 1.5], rotation: BAR_WALL },
  tube: { position: [4.86, 2.95, 0.75], rotation: BAR_WALL }, // over both bottle shelves
  bar: { position: [4.57, 0, 0.15], rotation: BAR_WALL },
  dog: { position: [3.05, 0, 1.05], rotation: [0, -1.3, 0] }, // asleep by the foot rail, side to the room
  plastic: { position: [-1.33, 0, -2.93] },
  plasticTables: [
    { position: [0.33, 0, -0.94], seats: [0, Math.PI / 2, Math.PI] },
    { position: [-0.33, 0, 0.93], seats: [Math.PI / 2, Math.PI, -Math.PI / 2] },
  ],

  // ---- day: office concept ----
  // The concept's perspective is not physically consistent; its camera is a
  // least-squares fit to the wall lines (a long lens from further back) and
  // every piece below was cast back from its pixel through that camera.
  dayFan: { position: [-1.19, 2.64, -4.5], scale: 1.5 },
  dayCalendar: { position: [-1.13, 1.77, -4.49] },
  desk: { position: [0.18, 0, 3.0], rotation: [0, 0.478, 0], scale: [0.92, 0.86, 1.05] },
  chair: { position: [0.32, 0, 3.75], rotation: [0, 0.478, 0], scale: 0.88 },
  rug: { position: [0.12, 0, 1.85], rotation: [0, 0.478, 0] }, // under the desk, its back half in the window's sun
  pegboard: { position: [-0.24, 1.55, -4.47] }, // stands proud of the tile trim
  daySign: { position: [1.71, 2.86, -4.48], scale: 1.12 }, // centred over the window
  screen: { position: [3.08, 2.81, -4.45] },
  retroFridge: { position: [4.54, 0, -3.78], rotation: BAR_WALL, scale: [1.12, 1, 1.12] }, // at the end of the sideboard, door to the room
  portfolio: { position: [4.93, 2.19, -2.34], rotation: BAR_WALL, scale: [1.3, 1.02, 1] },
  bookshelf: { position: [4.8, 0.05, -0.1], rotation: BAR_WALL },
  sideboard: { position: [4.68, 0, -0.95], rotation: BAR_WALL, modelScale: [1.5, 1, 1] },
  hangingPlant: { position: [4.55, 2.75, -4.15] },
  plantShelf: { position: [3.85, 2.2, -4.5] },
  pendant: { position: [3.75, 2.1, -3.55] },
  lounge: { position: [-1.33, 0, -0.97] },
  loungeSideTable: [-0.52, 0, 1.93],
  loungeBeanbag: [-0.5, 0, 3.55],
  plantBig: { position: [0.66, 0, -4.2], rotation: [0, 0.6, 0], scale: 0.78 },
  plantSmall: { position: [3.3, 0, -4.15] },
}
