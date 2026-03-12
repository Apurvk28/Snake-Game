import pygame
import random
import os

pygame.init()

# Window settings
WIDTH = 600
HEIGHT = 400

game_window = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Snake Game - Apurv")

# Colors
white = (255,255,255)
red = (255,0,0)
black = (0,0,0)
green = (0,255,0)

# Game clock
clock = pygame.time.Clock()

# Font
font = pygame.font.SysFont(None, 35)

def text_screen(text, color, x, y):
    screen_text = font.render(text, True, color)
    game_window.blit(screen_text, [x,y])

def plot_snake(game_window, color, snake_list, snake_size):
    for x,y in snake_list:
        pygame.draw.rect(game_window, color, [x, y, snake_size, snake_size])


def game_loop():

    exit_game = False
    game_over = False

    snake_x = 45
    snake_y = 55

    velocity_x = 0
    velocity_y = 0

    snake_size = 10
    fps = 15

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

            with open("highscore.txt","w") as f:
                f.write(str(highscore))

            game_window.fill(white)
            text_screen("Game Over! Press ENTER to Restart", red, 80, 180)

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
                        velocity_x = 5
                        velocity_y = 0

                    if event.key == pygame.K_LEFT:
                        velocity_x = -5
                        velocity_y = 0

                    if event.key == pygame.K_UP:
                        velocity_y = -5
                        velocity_x = 0

                    if event.key == pygame.K_DOWN:
                        velocity_y = 5
                        velocity_x = 0

            snake_x += velocity_x
            snake_y += velocity_y

            if abs(snake_x - food_x) < 10 and abs(snake_y - food_y) < 10:
                score += 10
                food_x = random.randint(20, WIDTH-20)
                food_y = random.randint(20, HEIGHT-20)
                snake_length += 5

                if score > int(highscore):
                    highscore = score

            game_window.fill(white)

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

            plot_snake(game_window, black, snake_list, snake_size)

        pygame.display.update()
        clock.tick(fps)

    pygame.quit()
    quit()

game_loop()