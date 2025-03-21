
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("simulationCanvas");
    const ctx = canvas.getContext("2d");

    const trail_check = document.getElementById("trail");
    const path_check = document.getElementById("path");
    
    canvas.width = window.innerWidth;
    canvas.height = 300;

    let color1 = document.getElementById("color1").value;
    let color2 = document.getElementById("color2").value;
    
   

    let balls = [
        { x: canvas.width/4, y: 150, r: 20, vx: 1, vy: 1, mass: 1, color: color1 },
        { x: 3*canvas.width/4, y: 150, r: 20, vx: -1, vy: -1, mass: 1, color: color2 }
    ];
    
    
    function drawBalls() { 
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        balls.forEach(ball => {
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fillStyle = ball.color;
            ctx.fill();
        });
    }

    let trailPoints = []; // Tablica przechowująca historię pozycji kulek
    let maxTrailLength = document.getElementById("path_length").value * 60 * 5;

    let animationId = null;
    let isAnimating = false;
    let isPaused = false;
    let savedVx1 = 0, savedVy1 = 0, savedVx2 = 0, savedVy2 = 0;
    let energy_loss;

   
    drawBalls();

    document.getElementById("startSimulation").addEventListener("click", () => {

        ctx.fillStyle = "lightblue"; // Ustawienie koloru tła
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        trailPoints =[];
        const mass1 = parseFloat(document.getElementById("mass1").value);
        const speedX1 = parseFloat(document.getElementById("speedX1").value);
        const speedY1 = parseFloat(document.getElementById("speedY1").value);
        const r1 = parseFloat(document.getElementById("r1").value);
        const mass2 = parseFloat(document.getElementById("mass2").value);
        const speedX2 = parseFloat(document.getElementById("speedX2").value);
        const speedY2 = parseFloat(document.getElementById("speedY2").value);
        const r2 = parseFloat(document.getElementById("r2").value);
        energy_loss = parseFloat(document.getElementById("energy_loss").value)/100;
        color1 = document.getElementById("color1").value;
        color2 = document.getElementById("color2").value;
        maxTrailLength = document.getElementById("path_length").value * 60 * 5;


        if(energy_loss < 0){
            document.getElementById("energy_loss").value =0;
            energy_loss = 0;
        }

        if (isAnimating){
            balls[0].x = canvas.width/4;
            balls[0].y = 150;
            balls[0].vx = speedX1;
            balls[0].vy = speedY1;
            balls[0].mass = mass1;
            balls[0].r = r1;
            balls[0].counter =0;

            balls[1].x = 3*canvas.width/4;
            balls[1].y = 150;
            balls[1].vx = speedX2;
            balls[1].vy = speedY2;
            balls[1].mass = mass2;
            balls[1].r = r2;
            balls[1].counter =0;
            return;
        } 

        balls = [
            { x: canvas.width/4, y: 150, r: r1, vx: speedX1, vy: speedY1, mass: mass1, color: color1,counter:0 },
            { x: 3*canvas.width/4, y: 150, r: r2, vx: speedX2, vy: speedY2, mass: mass2, color: color2,counter:0 }
        ];

        isAnimating = true;
        isPaused = false;
        animate();
    });

    document.getElementById("pauseSimulation").addEventListener("click",() => {
        if (!isAnimating || isPaused) return;

        savedVx1 = balls[0].vx;
        savedVy1 = balls[0].vy;
        savedVx2 = balls[1].vx;
        savedVy2 = balls[1].vy;
        
        balls[0].vx = 0;
        balls[0].vy = 0;
        balls[1].vx = 0;
        balls[1].vy = 0;

        if (animationId) {
            cancelAnimationFrame(animationId); 
            animationId = null;
        }
        isAnimating = false;
        isPaused = true;
        console.log(balls[0].counter);
        console.log(balls[1].counter);
    });

    document.getElementById("resumeSimulation").addEventListener("click",() => {
        if (isAnimating || !isPaused) return;

        balls[0].vx = savedVx1;
        balls[0].vy = savedVy1;
        balls[1].vx = savedVx2;
        balls[1].vy = savedVy2;

        isAnimating = true;
        isPaused = false;
        animate();
        
    });

    function checkCollision(ball1, ball2) {
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy); 

        return distance <= ball1.r + ball2.r;
    }

    function resolveCollision(ball1, ball2) {
        const dx = ball2.x - ball1.x;
        const dy = ball2.y - ball1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
    
        // Normalizacja wektora od środka jednej kulki do drugiej
        const nx = dx / distance;
        const ny = dy / distance;
    
        // Prędkości przed zderzeniem wzdłuż osi normalnej i stycznej
        const v1n = ball1.vx * nx + ball1.vy * ny;
        const v2n = ball2.vx * nx + ball2.vy * ny;
        const v1t = -ball1.vx * ny + ball1.vy * nx;
        const v2t = -ball2.vx * ny + ball2.vy * nx;
    
        // Prędkości po zderzeniu wzdłuż normalnej (wzór dla zderzenia sprężystego)
        const newV1n = ((ball1.mass - ball2.mass) * v1n + 2 * ball2.mass * v2n) / (ball1.mass + ball2.mass);
        const newV2n = ((ball2.mass - ball1.mass) * v2n + 2 * ball1.mass * v1n) / (ball1.mass + ball2.mass);
        
        const reducedV1n = newV1n //* (1 - energy_loss);
        const reducedV2n = newV2n //* (1 - energy_loss);

        // Konwersja z powrotem na współrzędne x, y
        ball1.vx = reducedV1n * nx - v1t * ny;
        ball1.vy = reducedV1n * ny + v1t * nx;
        ball2.vx = reducedV2n * nx - v2t * ny;
        ball2.vy = reducedV2n * ny + v2t * nx;

        const overlap = ball1.r + ball2.r - distance;
    if (overlap > 0) {
        const correction = overlap / 2;
        ball1.x -= correction * nx;
        ball1.y -= correction * ny;
        ball2.x += correction * nx;
        ball2.y += correction * ny;
    }
    }
    

    function checkWallXCollision(ball) {
        if (ball.x - ball.r <= 0) {  // Kolizja z lewą ścianą
            ball.x = ball.r;  // Korekta pozycji
            ball.vx = Math.abs(ball.vx) //* (1 - energy_loss); // Odbicie w prawo
            return true;
        } else if (ball.x + ball.r >= canvas.width) {  // Kolizja z prawą ścianą
            ball.x = canvas.width - ball.r; // Korekta pozycji
            ball.vx = -Math.abs(ball.vx) //* (1 - energy_loss); // Odbicie w lewo
            return true;
        }
        return false;
    }
    
    function checkWallYCollision(ball) {
        if (ball.y - ball.r <= 0) {  // Kolizja z górną ścianą
            ball.y = ball.r;  // Korekta pozycji
            ball.vy = Math.abs(ball.vy) //* (1 - energy_loss); // Odbicie w dół
            return true;
        } else if (ball.y + ball.r >= canvas.height) {  // Kolizja z dolną ścianą
            ball.y = canvas.height - ball.r; // Korekta pozycji
            ball.vy = -Math.abs(ball.vy) //* (1 - energy_loss); // Odbicie w górę
            return true;
        }

        return false;
    
    }

    function checkWallCollision(ball){
        if(checkWallXCollision(ball) || checkWallYCollision(ball)){
            ball.vx = ball.vx * (1 - energy_loss);
            ball.vy = ball.vy * (1 - energy_loss);
            ball.counter ++;
            
        }
    }

    function parseHexColor(colorString) {
        if (colorString.charAt(0) === '#') {
          colorString = colorString.substring(1);
        }
        if (colorString.length === 3) {
          colorString = colorString.charAt(0) + colorString.charAt(0) + colorString.charAt(1) + colorString.charAt(1) + colorString.charAt(2) + colorString.charAt(2);
        }
        const r = parseInt(colorString.substring(0, 2), 16);
        const g = parseInt(colorString.substring(2, 4), 16);
        const b = parseInt(colorString.substring(4, 6), 16);
        return { r, g, b };
      }

    function lightenColorToHSL(color,factor=1.5) {
        // Make r, g, and b fractions of 1
        color_tab = parseHexColor(color);
        r =color_tab.r/255;
        g =color_tab.g/255;
        b =color_tab.b/255;
      
        // Find greatest and smallest channel values
        let cmin = Math.min(r,g,b),
            cmax = Math.max(r,g,b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;
      
        // Calculate hue
        // No difference
        if (delta === 0)
          h = 0;
        // Red is max
        else if (cmax === r)
          h = ((g - b) / delta) % 6;
        // Green is max
        else if (cmax === g)
          h = (b - r) / delta + 2;
        // Blue is max
        else
          h = (r - g) / delta + 4;
      
        h = Math.round(h * 60);
          
        // Make negative hues positive behind 360°
        if (h < 0)
            h += 360;
      
        // Calculate lightness
        l = (cmax + cmin) / 2;
      
        // Calculate saturation
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
          
        // Multiply l and s by 100
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);
        l = l*factor;
        return "hsl(" + h + "," + s + "%," + l + "%)";
      }
    


    function animate() {
        if(trail_check.checked == true){
            ctx.fillStyle = "rgba(173, 216, 230, 0.05)"; // Delikatne czyszczenie
        }
        else{
            ctx.fillStyle = "rgba(173, 216, 230, 1.00)";
        }

        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        if (checkCollision(balls[0], balls[1])) {
            resolveCollision(balls[0], balls[1]);
            balls[0].vx = balls[0].vx * (1 - energy_loss);
            balls[0].vy = balls[0].vy * (1 - energy_loss);
            balls[1].vx = balls[1].vx * (1 - energy_loss);
            balls[1].vy = balls[1].vy * (1 - energy_loss);
            balls[0].counter++;
            balls[1].counter++;
        }
        
        balls.forEach(ball => {
            checkWallCollision(ball);
            
            
            if(path_check.checked == true){
                trailPoints.push({ x: ball.x, y: ball.y, color: lightenColorToHSL(ball.color) });
            
        
                // Ogranicz liczbę zapisanych punktów (usunąć najstarsze)
                if (trailPoints.length > maxTrailLength) {
                    trailPoints.shift();
            }}
        });
    
        
        // Rysowanie śladu
            if(path_check.checked == true){trailPoints.forEach(point => {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = point.color;
                ctx.fill();
            });}
    
        // Rysowanie kulek
        balls.forEach(ball => {
            ball.x += ball.vx;
            ball.y += ball.vy;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
            ctx.fillStyle = ball.color;
            ctx.fill();
        });
        
        document.getElementById("collision1").innerHTML = balls[0].counter;
        document.getElementById("collision2").innerHTML = balls[1].counter;
        animationId = requestAnimationFrame(animate);
    }
    
    

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = 300;
    });
});
