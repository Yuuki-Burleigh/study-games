// All Physics 121 templates, one file per unit. A new unit = a new file here + one line below.
import measure from './phys121/measure.js';
import motion from './phys121/motion.js';
import vectors from './phys121/vectors.js';
import calculus from './phys121/calculus.js';
import projectile from './phys121/projectile.js';
import momentum from './phys121/momentum.js';
import forces from './phys121/forces.js';
import circular from './phys121/circular.js';
import rotation from './phys121/rotation.js';
import energy from './phys121/energy.js';
import equilibrium from './phys121/equilibrium.js';

const unit = (name, templates) => templates.map((t) => ({ ...t, unit: name }));

export default [
  ...unit('Measurement & Units', measure),
  ...unit('1D Motion', motion),
  ...unit('Vectors', vectors),
  ...unit('Calculus & Motion', calculus),
  ...unit('Projectile Motion', projectile),
  ...unit('Momentum & Impulse', momentum),
  ...unit('Forces & Friction', forces),
  ...unit('Circular Motion & Gravity', circular),
  ...unit('Rotation & Torque', rotation),
  ...unit('Energy', energy),
  ...unit('Equilibrium', equilibrium),
];
