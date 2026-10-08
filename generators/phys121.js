// All Physics 121 templates, one file per unit. A new unit = a new file here + one line below.
import measure from './phys121/measure.js';
import motion from './phys121/motion.js';
import vectors from './phys121/vectors.js';

const unit = (name, templates) => templates.map((t) => ({ ...t, unit: name }));

export default [
  ...unit('Measurement & Units', measure),
  ...unit('1D Motion', motion),
  ...unit('Vectors', vectors),
];
