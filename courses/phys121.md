# Physics 121: what's been taught (the scope for new problems)

Sources: Quiz 1 (Winter 2026, Dr. Gamble) and the instructor's **Mechanics Blueprint** (50 handwritten pages, the
whole quarter's topic map; `School/PHY 121/` in the vault). The units after Vectors come from the blueprint and may run
ahead of lecture: they're there to study ahead, filtered by unit. Problems may combine anything under **Taught**, but nothing under **Not taught yet**.
Sign convention used throughout: East / North / right = +, West / South / left = −, stated in every prompt.

## Taught
- **Measurement.** Significant figures: nonzero digits count; captive zeros count; leading zeros never count; trailing
  zeros count only with a decimal point (190 → 2, 140. → 3, 0.0500 → 3). Scientific notation that keeps the sig figs
  (0.0500 = 5.00 × 10⁻²); negative powers for numbers below 1; rounding a value to n sig figs.
- **Units and dimensional analysis.** "No units, no points": carry units on every step and cross them out.
  Conversion factors (km ↔ m, cm, mm; s ↔ min ↔ h ↔ days ↔ weeks ↔ months ↔ years; km/h ↔ m/s). Money problems:
  price ÷ value per item (rounding up to whole items), time per item → years, a cost rate ($/day) × days,
  profit = revenue − cost (negative = loss).
- **1D motion.** Position, displacement (signed) vs distance (path length); velocity vs speed; acceleration
  a = Δv/Δt with signs (moving West and speeding up → a < 0; slowing down → a opposite to v). Constant velocity
  (t = Δx / v). Constant acceleration: v = v₀ + at, Δx = v₀t + ½at², v² = v₀² + 2aΔx, Δx = ½(v₀ + v)t.
  Multi-part trips (speed up, cruise a distance, brake to a stop, speed up again): total time, total displacement,
  distance. Average velocity (total Δx / total t) vs average speed. Graphs: x-t (slope = v), v-t (slope = a,
  area = Δx), a-t; sketching each for a piecewise trip.
- **Vectors.** Vector vs scalar; components (cos / sin, and which one when the angle is measured from N/S);
  component signs by quadrant; adding 2–3 vectors by components; magnitude √(Rx² + Ry²); direction as a polar angle
  (0–360°, quadrant correction when Rx < 0) or compass form ("θ° North of West"); −A and A − B; |A − B| ≤ |A + B| ≤ |A| + |B|.

- **Blueprint p1: SI units.** The seven base units (m, kg, s, A, K, mol, cd); derived units like N = kg·m/s², J.
- **Calculus & Motion (p15).** v = dx/dt, a = dv/dt; power rule on polynomials; integrating back (x = ∫v dt + x₀,
  v = ∫a dt + v₀); the constant of integration is the starting value.
- **Projectile Motion (p16-21).** x and y as two 1D problems sharing only t; a_x = 0, a_y = −9.8 m/s² (up = +);
  the "limiting factor" (fall height, wall distance) sets t; horizontal launches, angled launches (v₀ cos θ, v₀ sin θ),
  max height, time of flight, level-ground range, height at a wall.
- **Momentum & Impulse (p22-31).** p = mv (vector); conservation in a closed system; 1D/2D inelastic (stick together);
  1D elastic (KE also conserved; target-at-rest formulas); impulse J = FΔt = Δp, area under F-t; N·s = kg·m/s.
- **Forces & Friction (p32-38).** F_net = ma (= Δp/Δt); free-body diagrams; normal force; |f| = μF_N, static (up to
  μs·F_N, matching the push) vs kinetic; inclines with tilted axes (F_N = mg cos θ, mg sin θ along the ramp).
- **Circular Motion & Gravity (p39-41).** a = v²/r toward the center; F = mv²/r supplied by friction / tension / gravity;
  F = Gm₁m₂/r², G = 6.67 × 10⁻¹¹; circular orbits v = √(GM/r), period = 2πr/v.
- **Rotation & Torque (p42-46).** θ, ω, α (radians) with the same kinematics equations; s = rθ; CCW = +;
  |τ| = rF sin θ; τ = Iα; I for rod (center mL²/12, end mL²/3), ring mr², sphere ⅖mr².
- **Energy (p47-49).** KE = ½mv², PE = mgh, ½kx²; conservation; friction work μk·F_N·d; energy is a scalar
  (1 J = 1 kg·m²/s²); energy gives speeds, not times.
- **Equilibrium (p50).** Σ F = 0 and Σ τ = 0; seesaws, balance beams, a uniform beam's weight at its center.
- **Blueprint corrections** (said in the problems that use them): p2 gold uses the everyday ounce (35.27/kg) but gold
  is priced per troy ounce (32.15/kg); p12's v-t graph ends at 100 s but the trip takes 120 s; p13 √1300 = 36.06 (not
  36.05); p19 Δy = 7.74 m (not 7.69); p36 v = 4.98 m/s and Δx = 1.41 m (not 4.9 and 1.36); p41 ≈ 363 days (not 362);
  p49 v_b = 23.4 m/s (not 23.3).

## Not taught yet (don't require these)
Relative velocity; dot and cross products (torque only as rF sin θ); elastic collisions in 2D; angular momentum
problems (L = Iω is named only); rotational energy problems; variable mass (rockets); the three-body problem;
sig-fig rules for arithmetic (fewest sig figs / decimal places); metric prefixes beyond k, c, m.
