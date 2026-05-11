# Glossarium

This document defines the terminology and concepts used within the IconSlicer project.

## Terminology

### Canvas
The central workspace area of the application where images are displayed, cropped, and sliced. It typically features a checkerboard background to indicate transparency and supports zooming and panning.

### App Mode
The current state of the application flow.
- **UPLOAD**: The initial state where users can drop their icon pack.
- **CROP**: The state where users isolate the icon grid from the original image.
- **SLICE**: The state where users define grid lines and export individual icons.

### Slicing
The process of cutting a larger image into multiple smaller PNG files based on a grid of vertical and horizontal lines.

### Grid Line
A draggable interactive line (Vertical or Horizontal) used to define the boundaries of a slice.
