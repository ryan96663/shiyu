module.exports = {
  "restaurantType": "川菜小馆",
  "description": "温馨家常菜氛围,普通小馆子感觉",
  "layout": {
    "totalTable": 8,
    "tablePerRow": 3,
    "occupiedRatio": 0.75,
    "canvasWidth": 1024,
    "canvasHeight": 768
  },
  "tablePositions": [
    { "x": 100, "y": 200, "width": 120, "height": 80, "occupied": true },
    { "x": 300, "y": 200, "width": 120, "height": 80, "occupied": true },
    { "x": 500, "y": 200, "width": 120, "height": 80, "occupied": true },
    { "x": 100, "y": 350, "width": 120, "height": 80, "occupied": false },
    { "x": 300, "y": 350, "width": 120, "height": 80, "occupied": true },
    { "x": 500, "y": 350, "width": 120, "height": 80, "occupied": true },
    { "x": 100, "y": 500, "width": 120, "height": 80, "occupied": true },
    { "x": 300, "y": 500, "width": 120, "height": 80, "occupied": false }
  ],
  "characterSettings": {
    "charactersPerTable": {
      "min": 1,
      "max": 3
    },
    "availableCharacters": [
      "man-01",
      "woman-01",
      "woman-02"
    ],
    "characterSize": {
      "width": 64,
      "height": 64
    }
  },
  "frontDesk": {
    "position": { "x": 750, "y": 100 },
    "size": { "width": 150, "height": 60 },
    "waiterPosition": { "x": 780, "y": 120 }
  },
  "decorations": {
    "lighting": {
      "ceilingLights": [
        { "x": 200, "y": 150 },
        { "x": 400, "y": 150 },
        { "x": 600, "y": 150 }
      ],
      "tableLamp": true
    },
    "floorTiles": {
      "pattern": "checkerboard",
      "color1": "#D2B48C",
      "color2": "#F5DEB3"
    }
  }
};