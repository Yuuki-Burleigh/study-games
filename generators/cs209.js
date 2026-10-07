// All CS 209 templates, one file per unit (lecture). A new lecture = a new file here + one line below.
import basics from './cs209/basics.js';
import loops from './cs209/loops.js';

const unit = (name, templates) => templates.map((t) => ({ ...t, unit: name }));

export default [
  ...unit('Java Basics', basics),
  ...unit('For Loops', loops),
];
