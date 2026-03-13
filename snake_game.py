import pygame
import random
import os

pygame.init()

# Window size
WIDTH = 600
HEIGHT = 400

game_window = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Advanced Snake Game")

clock = pygame.time.Clock()

# Colors
white = (255,255,255)
black = (0,0,0)
red = (255,0,0)
green = (0,200,0)
gray = (220,220,220)

font = pygame.font.SysFont(None, 35)

# Load sounds
try:
    eat_sound = pygame.mixer.Sound("assets/eat.wav")
    gameover_sound = pygame.mixer.Sound("assets/gameover.wav")
except FileNotFoundError:
    print("Warning: Sound files missing! Make sure 'assets/eat.wav' and 'assets/gameover.wav' exist.")
    eat_sound = None
    gameover_sound = None


def text_screen(text, color, x, y):
    screen_text = font.render(text, True, color)
    game_window.blit(screen_text, [x,y])


def draw_grid():
    for x in range(0, WIDTH, 20):
        pygame.draw.line(game_window, gray, (x,0), (x,HEIGHT))
    for y in range(0, HEIGHT, 20):
        pygame.draw.line(game_window, gray, (0,y), (WIDTH,y))


def plot_snake(color, snake_list, snake_size):
    for x,y in snake_list:
        pygame.draw.rect(game_window, color, [x, y, snake_size, snake_size])


def start_screen():

    waiting = True

    while waiting:

        game_window.fill(white)

        text_screen("SNAKE GAME", black, 240,150)
        text_screen("Press SPACE to Start", black, 200,200)

        pygame.display.update()

        for event in pygame.event.get():

            if event.type == pygame.QUIT:
                pygame.quit()
                quit()

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE:
                    waiting = False


def game_loop():

    exit_game = False
    game_over = False

    snake_x = 45
    snake_y = 55

    velocity_x = 0
    velocity_y = 0

    snake_size = 10
    fps = 10

    food_x = random.randint(20, WIDTH-20)
    food_y = random.randint(20, HEIGHT-20)

    score = 0

    if not os.path.exists("highscore.txt"):
        with open("highscore.txt","w") as f:
            f.write("0")

    with open("highscore.txt","r") as f:
        highscore = f.read()

    snake_list = []
    snake_length = 1

    while not exit_game:

        if game_over:

            if gameover_sound:
                gameover_sound.play()

            with open("highscore.txt","w") as f:
                f.write(str(highscore))

            game_window.fill(white)

            text_screen("Game Over!", red, 240,150)
            text_screen("Press ENTER to Restart", black, 200,200)

            for event in pygame.event.get():

                if event.type == pygame.QUIT:
                    exit_game = True

                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_RETURN:
                        game_loop()

        else:

            for event in pygame.event.get():

                if event.type == pygame.QUIT:
                    exit_game = True

                if event.type == pygame.KEYDOWN:

                    if event.key == pygame.K_RIGHT:
                        velocity_x = 10
                        velocity_y = 0

                    if event.key == pygame.K_LEFT:
                        velocity_x = -10
                        velocity_y = 0

                    if event.key == pygame.K_UP:
                        velocity_y = -10
                        velocity_x = 0

                    if event.key == pygame.K_DOWN:
                        velocity_y = 10
                        velocity_x = 0

            snake_x += velocity_x
            snake_y += velocity_y

            if abs(snake_x - food_x) < 10 and abs(snake_y - food_y) < 10:

                if eat_sound:
                    eat_sound.play()

                score += 10
                fps += 1

                food_x = random.randint(20, WIDTH-20)
                food_y = random.randint(20, HEIGHT-20)

                snake_length += 5

                if score > int(highscore):
                    highscore = score

            game_window.fill(white)

            draw_grid()

            text_screen("Score: " + str(score) + "  High Score: " + str(highscore), black, 5, 5)

            pygame.draw.rect(game_window, red, [food_x, food_y, snake_size, snake_size])

            head = []
            head.append(snake_x)
            head.append(snake_y)

            snake_list.append(head)

            if len(snake_list) > snake_length:
                del snake_list[0]

            if head in snake_list[:-1]:
                game_over = True

            if snake_x < 0 or snake_x > WIDTH or snake_y < 0 or snake_y > HEIGHT:
                game_over = True

            plot_snake(green, snake_list, snake_size)

        pygame.display.update()
        clock.tick(fps)

    pygame.quit()
    quit()


start_screen()
game_loop()