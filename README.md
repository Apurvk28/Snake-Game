# Snake Game (Python + Pygame)

A classic Snake Game built using Python and the Pygame library.

## Features
- **Score Tracking:** Earn 10 points for every food item eaten.
- **High Score System:** Persistent high score tracking using a local text file (`highscore.txt`).
- **Progressive Difficulty:** The snake grows longer with every food eaten, making maneuvering more challenging.
- **Game Over Conditions:** The game ends if the snake collides with the walls or itself.
- **Restart Functionality:** Easily restart the game after a Game Over by pressing the **ENTER** key.

## Prerequisites
- Python 3.x
- Pygame library

## Installation

1. Clone this repository or download the source code.
2. Install the required dependency:

```bash
pip install pygame
```

## How to Play

Run the game using Python:

```bash
python snake_game.py
```

### Controls:
- **Up Arrow:** Move Up
- **Down Arrow:** Move Down
- **Left Arrow:** Move Left
- **Right Arrow:** Move Right
- **ENTER:** Restart after Game Over

## Project Structure
- `snake_game.py`: The main Python script containing the game logic.
- `highscore.txt`: A text file automatically generated to store the highest score achieved.