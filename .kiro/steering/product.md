# Product: Flappy Kiro

Flappy Kiro is a retro browser-based endless side-scroller game. The player controls a ghost character ("Ghosty") that navigates through gaps between scrolling pipe pairs by tapping, clicking, or pressing spacebar to flap.

## Core Gameplay
- Ghost flies forward automatically; player controls vertical movement via flap inputs
- Pipes scroll from right to left with progressively increasing speed
- Score increments each time the ghost passes a pipe pair
- High score persists across sessions via localStorage
- Game over on collision with pipes or ground

## Visual Style
- Hand-drawn retro aesthetic
- Light blue sky, white cloud decorations, dark navy ground
- Particle trail behind the ghost during flight
- Screen shake on collision
- Score popup animations (+1 floating text)

## Target Platform
- Browser-based (HTML5 Canvas)
- Responsive — works on desktop and mobile
- No server required; runs as a static file
