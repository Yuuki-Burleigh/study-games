// All CS 209 templates, one file per unit (lecture). A new lecture = a new file here + one line below.
import basics from './cs209/basics.js';
import loops from './cs209/loops.js';
import nested from './cs209/nested.js';
import methods from './cs209/methods.js';
import methods2 from './cs209/methods2.js';

const unit = (name, templates) => templates.map((t) => ({ ...t, unit: name }));

export default [
  ...unit('Java Basics', basics),
  ...unit('For Loops', loops),
  ...unit('Nested Loops', nested),
  ...unit('Static Methods', methods),
  ...unit('Methods Continued', methods2),
];
