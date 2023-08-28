import * as PIXI from "./pixi.mjs";

const app = new PIXI.Application({
    view: document.getElementById("pixi-canvas"),
    width: 800,
    height: 600
});

//масив з розмірами астероїдів
const asteroidSizes = [20, 30];

//масив зі швидкостями падіння астероїдів
const asteroidFallSpeeds = [0.5, 1];

/*створення графіки для корабля гравця, тестовий вигляд - трикутник
const playerShip = new PIXI.Graphics();
playerShip.lineStyle({ width: 2, color: 0xFFFFFF });
playerShip.beginFill(0x800080);
playerShip.drawPolygon([
    -25, 15,
    25, 15,
    0, -15
]);
playerShip.endFill();
playerShip.position.set(app.renderer.width / 2, app.renderer.height - 50);
app.stage.addChild(playerShip);*/

//додаання спрайту - стороннього зображення корабля
const shipTexture = PIXI.Texture.from("ship1.png");
const playerShip = new PIXI.Sprite(shipTexture);
playerShip.anchor.set(0.5);
playerShip.position.set(app.renderer.width / 2, app.renderer.height - 50);
app.stage.addChild(playerShip);

const numStars = 100; //кількість зірок
const stars = createStars(numStars);

let playerSpeed = 0; //початкова швидкість гравця

//змінні для стану гри
let isGameOver = false;
let shotsFired = 0;
let destroyedAsteroids = 0;
let timerInterval;

const starSpeed = 0.1; //швидкість руху зірок

//створення масивів для астероїдів та пострілів
const asteroids = [];
const bullets = [];

let remainingShots = 10; //лічильник пострілів
let gameTime = 60; //лічильник часу, таймер гри

let timerText;
let shotsCounter;

document.addEventListener("DOMContentLoaded", function () {
    StartGame();
});

//функція для оновлення позиції гравця
function updatePlayerPosition() {
    playerShip.x += playerSpeed;

    //обмеження для позиції гравця по горизонталі
    if (playerShip.x < playerShip.width / 2) {
        playerShip.x = playerShip.width / 2;
    } else if (playerShip.x > app.renderer.width - playerShip.width / 2) {
        playerShip.x = app.renderer.width - playerShip.width / 2;
    }

    //зміна позиції корабля вниз, якщо він не на нижньому краю ігрової зони - було актуально для тестового корабля-трикутника, т.з. "посадка" тест-корабля
    if (playerShip.y < app.renderer.height - playerShip.height / 2) {
        playerShip.y += 1;
    }
}

//функція для створення зірок на фоні гри
function createStars(numStars) {
    const stars = [];
    for (let i = 0; i < numStars; i++) {
        const star = new PIXI.Graphics();
        const size = Math.random() * 2 + 1;
        const alpha = Math.random();
        star.beginFill(0xFFFFFF, alpha);
        star.drawCircle(0, 0, size);
        star.endFill();
        star.position.set(Math.random() * app.renderer.width, Math.random() * app.renderer.height);
        app.stage.addChildAt(star, 0);
        stars.push(star);
    }
    return stars;
}

//обробник події натискання клавіші "ArrowLeft" або "ArrowRight"
document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
        playerSpeed = -5;
    } else if (event.key === "ArrowRight") {
        playerSpeed = 5;
    }
});

//обробник події відпускання клавіші "ArrowLeft" або "ArrowRight"
document.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        playerSpeed = 0;
    }
});

//додавання функції до анімаційного циклу для оновлення стану гри
app.ticker.add(() => {
    updatePlayerPosition();

    //оновлення позицій зірок
    for (const star of stars) {
        star.y += starSpeed;
        if (star.y > app.renderer.height) {
            star.y = 0;
        }
    }
});

//функція для створення астероїдів
function createAsteroids() {
    //вибір випадкових розміру та швидкості для першого астероїда
    const asteroid1SizeIndex = Math.floor(Math.random() * asteroidSizes.length);
    const asteroid1SpeedIndex = Math.floor(Math.random() * asteroidFallSpeeds.length);
    const asteroid1Size = asteroidSizes[asteroid1SizeIndex];
    const asteroid1Speed = asteroidFallSpeeds[asteroid1SpeedIndex];

    //вибір розміру та швидкості для другого астероїда, відмінного від першого
    const asteroid2SizeIndex = (asteroid1SizeIndex + 1) % asteroidSizes.length;
    const asteroid2SpeedIndex = (asteroid1SpeedIndex + 1) % asteroidFallSpeeds.length;
    const asteroid2Size = asteroidSizes[asteroid2SizeIndex];
    const asteroid2Speed = asteroidFallSpeeds[asteroid2SpeedIndex];

    //створення графіки для першого астероїда та його розташування
    const asteroid1 = new PIXI.Graphics();
    asteroid1.lineStyle({ width: 2, color: 0xFFFFFF });
    asteroid1.drawCircle(0, 0, asteroid1Size);
    asteroid1.position.set(Math.random() * (app.renderer.width - asteroid1Size) + asteroid1Size / 2, -30);
    app.stage.addChild(asteroid1);
    asteroids.push({ graphic: asteroid1, speed: asteroid1Speed });

    //створення графіки для другого астероїда та його розташування
    const asteroid2 = new PIXI.Graphics();
    asteroid2.lineStyle({ width: 2, color: 0xFFFFFF });
    asteroid2.drawCircle(0, 0, asteroid2Size);
    asteroid2.position.set(Math.random() * (app.renderer.width - asteroid2Size) + asteroid2Size / 2, -30);
    app.stage.addChild(asteroid2);
    asteroids.push({ graphic: asteroid2, speed: asteroid2Speed });
}

//функція для початку гри
function startGame() {
    //видалення обробника події натискання клавіші під час гри
    document.removeEventListener("keydown", startGame);
    //видалення кнопки "Start Game" після початку гри
    const startButton = app.stage.getChildByName("startButton");
    app.stage.removeChild(startButton);

    createAsteroids(); //створення астероїдів

    //додавання функції до анімаційного циклу для оновлення стану гри
    app.ticker.add(() => {
        //оновлення позицій астероїдів
        for (const asteroidData of asteroids) {
            const asteroid = asteroidData.graphic;
            asteroid.y += asteroidData.speed;

            //перевірка зіткнення корабля гравця та астероїда
            if (playerShip.getBounds().intersects(asteroid.getBounds())) {
                isGameOver = true;
                app.stage.removeChild(playerShip);
                app.stage.removeChild(asteroid);
                showGameOverText("YOU LOSE", 0xFF0000);
            }

            //перевірка зіткнення пострілу та астероїда
            for (const bullet of bullets) {
                if (bullet.getBounds().intersects(asteroid.getBounds())) {
                    destroyedAsteroids++;

                    //app.stage.removeChild(bullet); //з цією умовою не видно пострілу, коли він прямує до астероїда
                    bullets.splice(bullets.indexOf(bullet), 1);
                    app.stage.removeChild(asteroid);
                    asteroids.splice(asteroids.indexOf(asteroidData), 1);

                    const shouldSpawnBoss = destroyedAsteroids >= 2;
                    if (shouldSpawnBoss) {
                        spawnBoss();
                    }

                    /*
                    //перемога гравця після всіх знищених астероїдів
                    if (asteroids.length === 0 && bullets.length === 0 && destroyedAsteroids < 2) {
                    //isGameOver = true;
                    //showGameOverText("YOU WIN", 0x00FF00);
                    }
                    */

                    // break;
                }
            }

            //видалення астероїда, якщо він виходить за межі екрану
            if (asteroid.y > app.renderer.height) {
                app.stage.removeChild(asteroid);
                asteroids.splice(asteroids.indexOf(asteroidData), 1);
            }
        }
    });

    //відображення тексту таймера та лічильника пострілів
    timerText = new PIXI.Text(`Time: ${gameTime}`, { fontSize: 24, fill: 0xFFFFFF });
    timerText.position.set(10, 10);
    app.stage.addChild(timerText);

    shotsCounter = new PIXI.Text(`Shots: ${remainingShots}`, { fontSize: 24, fill: 0xFFFFFF });
    shotsCounter.position.set(10, 40);
    app.stage.addChild(shotsCounter);

    //оновлення таймера
    timerInterval = setInterval(() => {
        gameTime--;
        timerText.text = `Time: ${gameTime}`;
        if (gameTime <= 0) {
            clearInterval(timerInterval);
            if (!isGameOver && (asteroids.length > 0 || destroyedAsteroids < 2)) {
                isGameOver = true;
                showGameOverText("YOU LOSE", 0xFF0000);
            }
        }
    }, 1000);

    //обробник події натискання пробілу для пострілу - це версія зображення пострілу-кулі
    /* document.addEventListener("keydown", (event) => {
         if (event.key === " " && remainingShots > 0 && !isGameOver) {
             const bullet = new PIXI.Graphics();
             bullet.beginFill(0xFF0000); 
             bullet.drawCircle(0, 0, 5); 
             bullet.endFill();
 
             bullet.position.set(playerShip.x, playerShip.y - playerShip.height / 2); //позиція кулі
 
             app.stage.addChild(bullet);
             bullets.push(bullet);
 
             remainingShots--;
             shotsCounter.text = `Shots: ${remainingShots}`;
             shotsFired++;
 
             //поразка гравця після 10 пострілів та наявності астероїдів
             if (shotsFired >= 10 && asteroids.length > 0) {
                 isGameOver = true;
                 showGameOverText("YOU LOSE", 0xFF0000);
             }
 
             if (remainingShots <= 0) {
                 isGameOver = true;
                 showGameOverText("YOU LOSE", 0xFF0000);
             }
 
             const bulletSpeed = 5; //швидкість руху пострілу-кулі нагору
             const bulletInterval = setInterval(() => {
                 if (!isGameOver) {
                     bullet.y -= bulletSpeed; //зміна координати у для руху кулі вгору
 
                     //перевірка зіткнення кулі та астероїда
                     for (const asteroidData of asteroids) {
                         const asteroid = asteroidData.graphic;
 
                         if (!isGameOver && bullet.getBounds().intersects(asteroid.getBounds())) {
                             app.stage.removeChild(asteroid);
                             asteroids.splice(asteroids.indexOf(asteroidData), 1);
                             app.stage.removeChild(bullet);
                             bullets.splice(bullets.indexOf(bullet), 1);
                             break;
                         }
                     }
 
                     //видалення кулі при виході за межі екрану
                     if (bullet.y < 0) {
                         clearInterval(bulletInterval);
                         app.stage.removeChild(bullet);
                         bullets.splice(bullets.indexOf(bullet), 1);
                     }
                 }
             }, 1000 / 60);
         }
     });*/

    //обробник події натискання пробілу для пострілу (варіант пострілу - лінія/промінь)
    document.addEventListener("keydown", (event) => {
        if (event.key === " " && remainingShots > 0 && !isGameOver) {
            const bullet = new PIXI.Graphics();
            bullet.lineStyle({ width: 2, color: 0xFF0000 });
            bullet.moveTo(playerShip.x, playerShip.y - 15);
            bullet.lineTo(playerShip.x, 0);
            app.stage.addChild(bullet);
            bullets.push(bullet);

            remainingShots--;
            shotsCounter.text = `Shots: ${remainingShots}`;
            shotsFired++;

            //поразка гравця після 10 пострілів та наявності астероїдів
            if (shotsFired >= 10 && asteroids.length > 0) {
                isGameOver = true;
                showGameOverText("YOU LOSE", 0xFF0000);
            }

            if (remainingShots <= 0) {
                isGameOver = true;
                showGameOverText("YOU LOSE", 0xFF0000);
            }

            setTimeout(() => {
                // перевірка зіткнення пострілу та астероїда
                for (const asteroidData of asteroids) {
                    const asteroid = asteroidData.graphic;

                    if (!isGameOver && bullet.getBounds().intersects(asteroid.getBounds())) {
                        app.stage.removeChild(asteroid);
                        asteroids.splice(asteroids.indexOf(asteroidData), 1);
                        break;
                    }
                }
                //видалення пострілу при виході за межі екрану
                if (bullet.y > app.renderer.height) {
                    clearInterval(bulletInterval);
                    app.stage.removeChild(bullet);
                }
                app.stage.removeChild(bullet);
                bullets.splice(bullets.indexOf(bullet), 1);
            }, 100);
        }
    });

}

//функція для того, щоб з'явився бос
function spawnBoss() {

    remainingShots = 10; //лічильник пострілів
    gameTime = 60; //таймер гри

    timerText.text = `Time: ${gameTime}`;
    shotsCounter.text = `Shots: ${remainingShots}`;

    const boss = new PIXI.Graphics();
    boss.beginFill(0xFF0000);
    boss.drawCircle(0, 0, 100);
    boss.endFill();
    boss.position.set(app.renderer.width / 2, 100);
    app.stage.addChild(boss);

    let bossHP = 4;

    //відображення шкали здоров'я боса
    const hpBar = new PIXI.Graphics();
    hpBar.beginFill(0x00FF00);
    hpBar.drawRect(app.renderer.width / 2 - 50, 10, 100, 10);
    hpBar.endFill();
    app.stage.addChild(hpBar);

    //функція для оновлення позиції боса
    function updateBossPosition() {
        boss.x = Math.sin(Date.now() * 0.001) * (app.renderer.width / 3) + app.renderer.width / 2;
    }

    //функція для пострілу боса
    function bossShoot() {
        if (!isGameOver) {
            const bullet = new PIXI.Graphics();
            bullet.beginFill(0x00FFFF);
            bullet.drawCircle(0, 0, 5);
            bullet.endFill();

            bullet.position.set(boss.x, boss.y + 30);
            app.stage.addChild(bullet);

            const bulletSpeed = 5;
            const bulletInterval = setInterval(() => {
                if (!isGameOver) {
                    bullet.y += bulletSpeed;

                    //перевірка зіткнення пострілу та корабля гравця
                    if (bullet.getBounds().intersects(playerShip.getBounds())) {
                        clearInterval(bulletInterval);
                        app.stage.removeChild(bullet);
                        isGameOver = true;
                        showGameOverText("YOU LOSE", 0xFF0000);
                    }

                    //видалення пострілу при виході за межі екрану
                    if (bullet.y > app.renderer.height) {
                        clearInterval(bulletInterval);
                        app.stage.removeChild(bullet);
                    }

                    //зменшення здоров'я боса при зіткненні пострілу з босом
                    for (const bullet of bullets) {
                        if (bullet.getBounds().intersects(boss.getBounds())) {
                            bossHP--;
                            if (bossHP >= 0) {
                                hpBar.width = 100 * (bossHP / 4);
                            }

                            //перемога гравця після знищення боса
                            if (bossHP === 0) {
                                isGameOver = true;
                                app.stage.removeChild(boss);
                                showGameOverText("YOU WIN", 0x00FF00);
                                clearInterval(bossShootingInterval);
                            }

                            //видалення пострілу
                            app.stage.removeChild(bullet);
                            bullets.splice(bullets.indexOf(bullet), 1);

                            break;
                        }
                    }
                }
            }, 1000 / 60);
        }
        //поразка гравця після 10 пострілів та наявності астероїдів - реалізація умови з першої частини тестового завдання
        /* if (shotsFired >= 10) { //&& asteroids.length > 0) {
             isGameOver = true;
             showGameOverText("YOU LOSE", 0xFF0000);
         }*/

        if (shotsFired >= 10 && asteroids.length > 0 && !isGameOver) {
            isGameOver = true;
            showGameOverText("YOU LOSE", 0xFF0000);
        }
    }

    //оновлення позиції боса та пострілу
    app.ticker.add(() => {
        updateBossPosition();
        if (isGameOver) {
            app.stage.removeChild(playerShip);
            clearInterval(timerInterval);
            clearInterval(bossShootingInterval);
            resetGame();
        }
    });

    //постріл боса з певною інтервалом
    const bossShootingInterval = setInterval(() => {
        bossShoot();
    }, 2000);
}

//функція для скидання гри
function resetGame() {
    destroyedAsteroids = 0;
    shotsFired = 0;
}
//відображення тексту з фіналом гри
function showGameOverText(text, color) {
    const gameOverText = new PIXI.Text(text, { fontSize: 48, fill: color });
    gameOverText.position.set(app.renderer.width / 2 - gameOverText.width / 2, app.renderer.height / 2 - gameOverText.height / 2);
    app.stage.addChild(gameOverText);
    resetGame();
}

//створення кнопки для початку гри
function StartGame() {
    const startButton = new PIXI.Text("Start Game", { fontSize: 24, fill: 0xFFFFFF });
    startButton.position.set(app.renderer.width / 2 - startButton.width / 2, app.renderer.height / 2 - startButton.height / 2);
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerdown", startGame);
    startButton.name = "startButton";
    app.stage.addChild(startButton);
}