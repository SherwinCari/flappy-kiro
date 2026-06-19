# Requirements Document

## Introduction

Flappy Kiro is a retro browser-based endless side-scroller game. The player guides a ghost character through gaps between pairs of green pipes by tapping or clicking to flap. The game tracks the current score and persists a high score across sessions. The visual style is hand-drawn and retro, with a light blue sky, white cloud decorations, and a dark navy ground strip. The game features frame-independent physics, progressive difficulty scaling, audio feedback, and visual effects including particle trails and screen shake.

## Glossary

- **Game**: The Flappy Kiro browser application running in an HTML5 canvas
- **Ghost**: The player-controlled character rendered from the ghosty.png sprite
- **Pipe_Pair**: A top pipe and a bottom pipe separated by a navigable gap
- **Gap**: The vertical opening between the top and bottom pipes in a Pipe_Pair
- **Score_Display**: The UI element at the bottom of the screen showing the current score and high score
- **Game_Loop**: The animation loop that updates game state and renders each frame
- **Ground**: The dark navy strip at the bottom of the play area representing the floor
- **Delta_Time**: The elapsed time in seconds between the current frame and the previous frame, used for frame-independent physics calculations
- **Particle_Trail**: A series of small translucent visual elements emitted behind the Ghost during flight
- **Score_Popup**: A floating "+1" text animation displayed at the Ghost position when a point is scored
- **Screen_Shake**: A brief random displacement applied to the canvas rendering offset upon collision
- **Background_Music**: An optional looping audio track that plays during the running state

## Requirements

### Requirement 1: Game Initialization

**User Story:** As a player, I want the game to load quickly in my browser, so that I can start playing without delay.

#### Acceptance Criteria

1. WHEN the page loads, THE Game SHALL render an HTML5 canvas at 100% of the browser viewport width and height with no scrollbars
2. WHEN the page loads, THE Game SHALL display the Ghost at a horizontal position within the left third of the canvas and vertically centered on the canvas
3. WHEN the page loads, THE Game SHALL display a light blue background with white rounded-rectangle cloud decorations and a dark navy Ground strip at the bottom of the canvas
4. WHEN the page loads, THE Game SHALL display a visible text prompt on the canvas instructing the player to tap or click to start
5. WHEN the page loads, THE Game SHALL enter an idle state where the Game_Loop renders the scene but does not apply gravity or scroll Pipe_Pairs until the player provides a flap input

### Requirement 2: Player Input

**User Story:** As a player, I want to control the ghost by tapping or clicking, so that I can navigate through the pipes.

#### Acceptance Criteria

1. WHILE the game is in the running state or the start-prompt state, WHEN the player clicks the mouse or taps the screen, THE Game SHALL set the Ghost vertical velocity to -8 pixels per frame (upward), regardless of the Ghost's current velocity
2. WHILE the game is in the running state or the start-prompt state, WHEN the player presses the spacebar, THE Game SHALL set the Ghost vertical velocity to -8 pixels per frame (upward), identical to a click or tap input
3. WHEN the player provides a flap input (mouse click, screen tap, or spacebar press) while the game is in the running state, THE Game SHALL play the jump.wav sound effect
4. WHILE the game is in the game-over state, THE Game SHALL ignore flap inputs until the game-over overlay is displayed

### Requirement 3: Ghost Physics

**User Story:** As a player, I want the ghost to respond to gravity and my inputs with smooth frame-independent motion, so that the gameplay feels natural and challenging regardless of frame rate.

#### Acceptance Criteria

1. WHILE the game is running, THE Game_Loop SHALL compute Delta_Time as the elapsed seconds since the previous frame, clamping the value between 0 and 0.05 seconds to prevent large jumps after frame drops
2. WHILE the game is running, THE Game_Loop SHALL apply a constant downward gravitational acceleration of 0.5 pixels per frame squared to the Ghost vertical velocity each frame, scaled by Delta_Time relative to a reference frame duration of 16.67 milliseconds
3. WHILE the game is running, THE Game_Loop SHALL update the Ghost vertical position by adding the current velocity multiplied by the Delta_Time scaling factor each frame
4. WHILE the game is running, THE Game_Loop SHALL cap the Ghost downward velocity at a maximum of 10 pixels per frame to prevent the Ghost from falling unreasonably fast
5. WHILE the game is running, THE Game_Loop SHALL cap the Ghost upward velocity at a maximum of -12 pixels per frame to prevent the Ghost from ascending unreasonably fast
6. WHILE the game is running, THE Game_Loop SHALL preserve the Ghost vertical velocity between consecutive frames, applying gravity additively to the existing velocity each frame to produce smooth momentum-based movement
7. WHEN the player provides a flap input, THE Game SHALL set the Ghost vertical velocity to exactly -8 pixels per frame, overriding the current velocity to provide a consistent ascent impulse
8. IF the Ghost vertical position reaches the top edge of the canvas, THEN THE Game SHALL clamp the Ghost position to the top edge and reset its vertical velocity to zero

### Requirement 4: Pipe Generation and Movement

**User Story:** As a player, I want pipes to appear and scroll toward me with increasing speed, so that I have progressively challenging obstacles to navigate.

#### Acceptance Criteria

1. WHILE the game is running, THE Game SHALL generate a new Pipe_Pair when the horizontal distance from the last generated Pipe_Pair exceeds a spawn spacing of 200 logical pixels, placing it off the right edge of the canvas
2. THE Game SHALL randomize the vertical center of each Gap using a uniform distribution constrained so that the top pipe has a minimum height of 50 logical pixels and the bottom pipe has a minimum height of 50 logical pixels above the Ground
3. THE Game SHALL render each Pipe_Pair as green rectangles with a fixed width of 50 logical pixels, where the top rectangle extends from the top of the canvas down to the Gap upper edge and the bottom rectangle extends from the Gap lower edge down to the top of the Ground, separated by a Gap height of 120 logical pixels
4. WHILE the game is running, THE Game_Loop SHALL move all Pipe_Pairs leftward at a base horizontal speed of 2 logical pixels per frame, scaled by Delta_Time relative to a reference frame duration of 16.67 milliseconds
5. WHILE the game is running, THE Game_Loop SHALL increase the Pipe_Pair horizontal speed by 0.1 pixels per frame for every 5 points scored, up to a maximum speed of 5 pixels per frame
6. WHEN a Pipe_Pair moves entirely off the left edge of the canvas, THE Game SHALL remove that Pipe_Pair from active rendering and memory

### Requirement 5: Collision Detection

**User Story:** As a player, I want the game to detect when my ghost hits a pipe or the ground, so that the game ends fairly.

#### Acceptance Criteria

1. WHILE the game is running, THE Game_Loop SHALL check for axis-aligned bounding-box overlap between the Ghost hitbox and each Pipe_Pair hitbox every frame, where each hitbox is defined as the full rectangular bounds of the rendered element
2. WHILE the game is running, THE Game_Loop SHALL check whether the bottom edge of the Ghost hitbox meets or exceeds the top edge of the Ground every frame
3. WHEN a collision is detected between the Ghost and a Pipe_Pair or the Ground, THE Game SHALL immediately stop updating the Ghost position and transition to the game-over state within the same frame

### Requirement 6: Scoring

**User Story:** As a player, I want to earn points for each pipe I pass with clear visual and audio feedback, so that I can track my performance.

#### Acceptance Criteria

1. WHEN the Ghost horizontal position passes the trailing edge of a Pipe_Pair, THE Game SHALL increment the current score by one
2. THE Game SHALL count each Pipe_Pair only once for scoring purposes
3. WHILE the game is running, THE Score_Display SHALL show the current score at the bottom of the canvas in the format "Score: X"
4. WHEN the current score is incremented, THE Game SHALL play the score.wav sound effect
5. WHEN the current score is incremented, THE Game SHALL display a Score_Popup at the Ghost position showing "+1" text that animates upward by 30 pixels and fades from full opacity to zero opacity over a duration of 800 milliseconds

### Requirement 7: High Score Persistence

**User Story:** As a player, I want my highest score saved between sessions, so that I can track my all-time best.

#### Acceptance Criteria

1. WHEN the game transitions to the game-over state, THE Game SHALL compare the current score against the stored high score
2. WHEN the current score is strictly greater than the stored high score, THE Game SHALL persist the new high score to browser local storage
3. WHEN the page loads, THE Game SHALL retrieve the high score from browser local storage and use it as the stored high score
4. IF the high score value in browser local storage is absent or non-numeric, THEN THE Game SHALL default the stored high score to zero
5. THE Score_Display SHALL show the high score in the format "High: X" alongside the current score at the bottom of the canvas

### Requirement 8: Game Over and Restart

**User Story:** As a player, I want to see my final score and restart easily with dramatic feedback on collision, so that I can try again quickly.

#### Acceptance Criteria

1. WHEN the game transitions to the game-over state, THE Game SHALL stop the Game_Loop and freeze the current frame on screen
2. WHEN the game transitions to the game-over state, THE Game SHALL play the game_over.wav sound effect
3. WHEN the game transitions to the game-over state, THE Game SHALL apply a Screen_Shake effect by displacing the canvas rendering offset by a random amount between -5 and 5 pixels on both axes for a duration of 300 milliseconds, decaying linearly to zero displacement
4. WHEN the game transitions to the game-over state, THE Game SHALL display a game-over overlay showing the final score, the high score, and a prompt instructing the player to tap or click to restart
5. WHILE in the game-over state, WHEN the player provides a flap input at least 500 milliseconds after the game-over state began, THE Game SHALL reset the score to zero, remove all Pipe_Pairs, reset the Pipe_Pair speed to the base value of 2 pixels per frame, reposition the Ghost to the default starting position, and start a new Game_Loop
6. IF the player provides a flap input less than 500 milliseconds after the game-over state began, THEN THE Game SHALL ignore the input

### Requirement 9: Visual Rendering and Effects

**User Story:** As a player, I want smooth retro-style visuals with particle effects and animations, so that the game feels polished and enjoyable.

#### Acceptance Criteria

1. THE Game_Loop SHALL render frames using requestAnimationFrame for smooth animation
2. THE Game SHALL render the Ghost using the ghosty.png sprite from the assets directory
3. THE Game SHALL render between 3 and 6 clouds as white rounded rectangles with an opacity between 0.3 and 0.7, positioned at varying heights between the top of the canvas and the top edge of the Ground in the background
4. THE Game SHALL render the Ground as a dark navy rectangle spanning the full width of the canvas at the bottom
5. WHILE the game is running, THE Game SHALL assign each cloud an individual horizontal scroll speed between 0.25 and 1.0 pixels per frame, where slower clouds have lower opacity and faster clouds have higher opacity, to create a depth perspective effect
6. THE Game SHALL render visual layers in back-to-front order: background color, then clouds ordered from slowest to fastest, then Pipe_Pairs, then Ground, then Particle_Trail, then Ghost, then Score_Popup, then Score_Display
7. WHILE the game is running, THE Game SHALL emit Particle_Trail elements behind the Ghost at a rate of one particle every 3 frames, where each particle is a translucent white circle with a radius between 2 and 4 pixels
8. WHILE the game is running, THE Game SHALL animate each Particle_Trail element by reducing its opacity from 0.6 to 0 over a lifespan of 500 milliseconds, after which the particle is removed from rendering
9. WHILE the game is running, THE Game SHALL position each new Particle_Trail element at the horizontal center-left edge of the Ghost sprite with a random vertical offset of up to 3 pixels from the Ghost vertical center

### Requirement 10: Responsive Canvas

**User Story:** As a player, I want the game to work on different screen sizes, so that I can play on my phone or desktop.

#### Acceptance Criteria

1. WHEN the browser window is resized, THE Game SHALL resize the canvas to match the full width and height of the browser viewport within 100 milliseconds of the resize event completing
2. THE Game SHALL maintain a fixed aspect ratio for the play area, letterboxing with the background color if the viewport aspect ratio differs from the base aspect ratio
3. THE Game SHALL scale all game elements — including the Ghost, Pipe_Pairs, Gap, Ground, clouds, and Score_Display text — proportionally relative to the canvas height so that their size ratios to the play area remain constant across screen sizes
4. WHILE the game is running, WHEN the browser window is resized, THE Game SHALL recalculate element positions to maintain their relative location within the play area without resetting the current game state
5. IF the viewport width is less than 300 pixels or the viewport height is less than 400 pixels, THEN THE Game SHALL display the game at a minimum canvas size of 300 by 400 pixels with scrolling enabled rather than scaling below those dimensions

### Requirement 11: Audio System

**User Story:** As a player, I want sound effects and optional background music, so that the game provides satisfying audio feedback.

#### Acceptance Criteria

1. WHEN the page loads, THE Game SHALL preload all audio assets (jump.wav, game_over.wav, score.wav, and background_music.mp3) to prevent playback delays during gameplay
2. WHILE the game is in the running state, THE Game SHALL loop the Background_Music audio track continuously at a volume level of 0.3
3. WHEN the game transitions to the game-over state, THE Game SHALL pause the Background_Music
4. WHEN a new Game_Loop starts after a restart, THE Game SHALL resume the Background_Music from the beginning
5. WHERE the player has not interacted with the page, THE Game SHALL defer Background_Music playback until the first player interaction to comply with browser autoplay policies
6. IF an audio file fails to load or play, THEN THE Game SHALL continue gameplay without the failed audio and log a warning to the browser console
