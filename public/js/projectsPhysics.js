document.addEventListener("DOMContentLoaded", () => {
    const projectEls = document.querySelectorAll(".projectBubble");
    if (projectEls.length === 0) return;

    const Engine = Matter.Engine;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Render = Matter.Render;
    const Events = Matter.Events;

    // 1️⃣ Créer moteur
    const engine = Engine.create();

    const element = document.getElementById("physics-container");
    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
        element: document.getElementById("physics-container"), // ou ton conteneur
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            wireframes: true, // ← affiche toutes les formes en fil de fer
            background: "transparent"
        }
    });
    // 2️⃣ Sol + murs
    const footerHeight = document.querySelector("footer")?.offsetHeight || 0;
    const ground = Bodies.rectangle(
      width / 2,
      height - 150,
      width,
      150,
      { isStatic: true,
        render: {fillStyle : "red"}
      }
    );
    const wallLeft = Bodies.rectangle(-50, height / 2, 100, height * 3, { isStatic: true , render: {fillStyle : 'blue'}});
    const wallRight = Bodies.rectangle(width + 50, height / 2, 100, height * 3, { isStatic: true });

    World.add(engine.world, [ground, wallLeft, wallRight]);

    // 3️⃣ Bulles
    const bubbles = [];
    console.log(height + width);
    const base_radius = (height + width) / 50;
    projectEls.forEach((el, index) => {
        const radius = Math.floor(Math.random() * base_radius) + base_radius; // 60 à 120 px
        const startX = Math.random() * (width - 2 * radius) + radius; // éviter d’être collé au bord

        const body = Bodies.circle(startX, Math.random() * 500 - index * 50, radius, {
            restitution: 0.9,
            friction: 0.1
        });

        World.add(engine.world, body);
        bubbles.push({ el, body });
        // click
        el.addEventListener("click", () => {
            window.location.href = el.dataset.url;
        });

        // initial style
        el.style.width = el.style.height = `${radius * 2}px`;
        el.style.position = "absolute";
        el.style.borderRadius = "50%";
        el.style.overflow = "hidden";
        el.style.backgroundImage = `url(${el.dataset.image})`;
        el.style.backgroundSize = "cover";
        el.style.backgroundPosition = "center";
        el.style.cursor = "pointer";
        el.style.transform = `translate(${startX - radius}px, ${-200 - index*50 - radius}px)`;
    });

    // 4️⃣ Mettre à jour DOM à chaque frame
    // 1️⃣ Ajout des écouteurs hover une seule fois
    bubbles.forEach(({el, body}) => {
      el.addEventListener("mouseenter", () => el.classList.add("hovered"));
      el.addEventListener("mouseleave", () => el.classList.remove("hovered"));
    });

// 2️⃣ AfterUpdate pour mise à jour du DOM + forces
      Matter.Events.on(engine, "afterUpdate", () => {
          bubbles.forEach(({el, body}) => {
              // scale visuel
              let scale = el.classList.contains("hovered") ? 1.2 : 1;
              el.style.transform = `translate(${body.position.x - el.clientWidth/2}px,
                                              ${body.position.y - el.clientHeight/2}px)
                                    rotate(${body.angle}rad) scale(${scale})`;

              // si hover, pousser les voisins
              if (el.classList.contains("hovered")) {
                  bubbles.forEach(({body: other}) => {
                      if (other !== body) {
                          const dx = other.position.x - body.position.x;
                          const dy = other.position.y - body.position.y;
                          const dist = Math.sqrt(dx*dx + dy*dy);
                          const minDist = (body.circleRadius + other.circleRadius) * 1.3; // zone d’influence

                          if (dist < minDist && dist > 0) {
                              const force = 0.007 ; // ajustable
                              Matter.Body.applyForce(
                                  other,
                                  other.position,
                                  { x: (dx/dist)*force, y: (dy/dist)*force }
                              );
                          }
                      }
                  });
              }
          });
      });
    //Render.run(render);
    // 5️⃣ Lancer moteur
    Engine.run(engine);
});