# Bounce

A 3D physics puzzle: shape a cloth trampoline so a dropped ball bounces into a hole. A web game, mobile-first, built on the orillusion engine.

## Language

### The trampoline

**Frame**:
The four Posts plus the Cloth stretched between them — the player-positionable, player-shaped assembly that acts as a trampoline.
_Avoid_: stand, structure, rig

**Post**:
One of the four vertical corner anchors of the Frame. Each Post has a height; the combination of the four heights defines the Cloth's shape. In Setup the player sets these collectively by choosing a Preset, not individually.
_Avoid_: leg, pillar, pole, peg

**Cloth**:
The sheet of fabric spanning the four Posts; the deformable surface the Ball bounces off. The Frame's job is to tension the Cloth into a trampoline.
_Avoid_: fabric, sheet, net, mesh (mesh = the geometry), trampoline (that's the Frame's role, not the material)

**Preset**:
A prebuilt Frame — a fixed combination of the four Posts' heights, selectable from a gallery in Setup. Choosing a Preset is how the player shapes the Cloth; individual Posts are not tuned separately.
_Avoid_: template, configuration, variant, shape

### The level

**Platform**:
The floating surface the action sits on — the Ball falls onto it, the Frame rests on it, and the Hole is cut into it. Sits over a soft gradient void.
_Avoid_: stage (= a Level), ground, floor, table

**Ball**:
The sphere released in the Release phase; it falls from the Drop point, bounces off the Cloth, and must land in the Hole.
_Avoid_: sphere (that's the geometry), marble, orb

**Hole**:
A real concavity cut into the Platform; the Level is won when the Ball's center descends below the rim inside the opening (a grazing skim counts as a miss). Its position is fixed per Level.
_Avoid_: pocket, cup, target, goal

**Drop point**:
The fixed point in space (per Level) from which the Ball is released.
_Avoid_: launcher, spawn, start, emitter

**Level**:
A configured scene, defined by a (Drop point, Hole) pair and, later, obstacles.
_Avoid_: stage, board, puzzle (puzzle = the whole game)

### Phases

**Setup**:
The phase where the player positions the Frame and selects a Preset before releasing the Ball.
_Avoid_: arrange, edit, build, design

**Release**:
The action that drops the Ball from the Drop point; physics then runs autonomously — the player has no control — until the Ball scores, settles, or leaves play.
_Avoid_: launch, fire, drop (collides with Drop point), play

**Attempt**:
One Setup → Release → outcome cycle — a single try at a Level. A miss lets the player start a new Attempt, usually by refining the previous Setup.
_Avoid_: try, shot, go, turn
