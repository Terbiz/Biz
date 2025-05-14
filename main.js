// --- START OF FILE main.js ---

// --- START OF FILE main.js ---

// main.js: Logica principale, sistema solare, UI, eventi cosmici, testo costellazione.

// Ensure THREE is available
if (typeof THREE === 'undefined') {
    throw new Error("THREE.js non è stato caricato correttamente!");
}

// Scena e Oggetti Principali
let scene, camera, renderer, controls;
let sun, proceduralMilkyWayStars, galaxyDust, distantUniverseStars;
const planets = [];      // Corpi solidi per picking (Planets + Sun)
const planetGroups = []; // Gruppi orbitali (Planet + accessories)
const orbitalPaths = []; // Linee delle orbite
let orbitsVisible = false;
let earthGroup = null;   // Riferimento al gruppo Terra per la Luna

// Raycasting e Interfaccia Hover
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-Infinity, -Infinity);
const planetInfoDiv = document.getElementById('planet-info'); // Hover info
let lastIntersected = null; // Oggetto fisico sotto il mouse

// Costanti Globali
const MILKYWAY_DISK_RADIUS = 8000;
const MILKYWAY_DISK_THICKNESS = 600;
const MILKYWAY_BULGE_RADIUS = 1500;
const NUM_MILKYWAY_STARS = 180000;
const NUM_GALAXY_DUST_PARTICLES = 70000;
const UNIVERSE_STARS_OUTER_RADIUS = 45000;
const NUM_UNIVERSE_STARS = 120000;
const sunColor = 0xFFF39A;
let sunBaseSize = 5;
let sunPointLight;

const CONSTELLATION_TEXT_VISIBILITY_THRESHOLD = MILKYWAY_DISK_RADIUS * 0.7;

// Dati Pianeti e Sole
const planetData = [
    { name: "Mercurio", radius: 0.5, distance: 18, color: 0x9E9E9E, rotationSpeed: 0.005, isOrbitToggle: true, funFact: "Un anno su Mercurio dura solo 88 giorni terrestri!" },
    { name: "Venere", radius: 0.9, distance: 28, color: 0xFFE0B2, orbitalSpeed: 0.035, rotationSpeed: 0.002, atmosphereColor: 0xffcc66, atmosphereOpacity: 0.2, funFact: "Ruota al contrario rispetto alla maggior parte dei pianeti." },
    { name: "Terra", radius: 1, distance: 40, color: 0x42A5F5, orbitalSpeed: 0.029, rotationSpeed: 0.01, hasClouds: true, cloudColor: 0xFFFFFF, atmosphereColor: 0x87CEEB, atmosphereOpacity: 0.3, funFact: "L'unico pianeta conosciuto con vita e acqua liquida." },
    { name: "Marte", radius: 0.7, distance: 55, color: 0xFF7043, rotationSpeed: 0.009, atmosphereColor: 0xff8c00, atmosphereOpacity: 0.1, funFact: "Ospita Olympus Mons, il vulcano più grande del sistema solare." },
    { name: "Giove", radius: 3.5, distance: 90, color: 0xFFCA28, orbitalSpeed: 0.013, rotationSpeed: 0.02, funFact: "Potrebbe contenere più di 1300 Terre al suo interno." },
    { name: "Saturno", radius: 3, distance: 130, color: 0xFFEE58, rotationSpeed: 0.018, hasRing: true, ringColor: 0xFFF59D, funFact: "I suoi anelli sono composti principalmente da particelle di ghiaccio." },
    { name: "Urano", radius: 2, distance: 170, color: 0x4DD0E1, orbitalSpeed: 0.006, rotationSpeed: 0.015, funFact: "Il suo asse di rotazione è inclinato di quasi 98 gradi." },
    { name: "Nettuno", radius: 1.9, distance: 200, color: 0x3F51B5, orbitalSpeed: 0.005, rotationSpeed: 0.012, funFact: "Ha i venti più forti del sistema solare, fino a 2100 km/h." }
];
const sunData = { name: "Sole", radius: sunBaseSize, distance: 0, isSun: true, funFact: "Contiene il 99.86% della massa totale del sistema solare." };

// Stato Globale Applicazione
let globalShaderTime = 0;

// --- Inizializzazione ---
init();
animate();

// --- Funzioni Ausiliarie ---

function createOrbitalPath(distance) {
    const segments = 128;
    const material = new THREE.LineBasicMaterial({
        color: 0x666666, transparent: true, opacity: 0.5, depthWrite: false
    });
    const points = [];
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * distance, 0, Math.sin(theta) * distance));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, material);
    line.visible = orbitsVisible;
    return line;
}

function toggleOrbitalPaths() {
    orbitsVisible = !orbitsVisible;
    orbitalPaths.forEach(path => { if (path) path.visible = orbitsVisible; });
    console.log("Visibilità orbite:", orbitsVisible);
}

// --- Funzione Inizializzazione Principale ---

function init() {
    // Scena (resa accessibile globalmente se necessario dal font loader)
    scene = new THREE.Scene();
    window.scene = scene;
    scene.background = new THREE.Color(0x000000);
    scene.fog = new THREE.FogExp2(0x000000, 0.00006);

    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, UNIVERSE_STARS_OUTER_RADIUS * 1.5);
    camera.position.set(0, 80, 220);
    camera.lookAt(scene.position);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Controlli
    if (typeof THREE.OrbitControls === 'undefined') console.error("OrbitControls non caricato!");
    else {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.05;
        controls.minDistance = 10; controls.maxDistance = MILKYWAY_DISK_RADIUS * 1.5;
        controls.target.set(0, 0, 0);
    }

    // Luci
    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    sunPointLight = new THREE.PointLight(sunColor, 1.5, 0, 1.8);
    scene.add(sunPointLight);

    // Sfondi Stellari
    if (typeof createProceduralGalaxyStars === 'function') {
        proceduralMilkyWayStars = createProceduralGalaxyStars(MILKYWAY_DISK_RADIUS, MILKYWAY_DISK_THICKNESS, MILKYWAY_BULGE_RADIUS, NUM_MILKYWAY_STARS);
        if (proceduralMilkyWayStars) scene.add(proceduralMilkyWayStars); else console.error("Creazione Via Lattea fallita.");
    } else console.error("Funzione createProceduralGalaxyStars non trovata!");
    if (typeof createGalaxyDustLanes === 'function') {
        galaxyDust = createGalaxyDustLanes(MILKYWAY_DISK_RADIUS * 0.85, MILKYWAY_DISK_THICKNESS * 0.55, NUM_GALAXY_DUST_PARTICLES);
        if (galaxyDust) scene.add(galaxyDust); else console.error("Creazione Polvere Galattica fallita.");
    } else console.error("Funzione createGalaxyDustLanes non trovata!");
    if (typeof createDistantUniverseStars === 'function') {
        distantUniverseStars = createDistantUniverseStars(MILKYWAY_DISK_RADIUS * 1.5, UNIVERSE_STARS_OUTER_RADIUS, NUM_UNIVERSE_STARS);
        if (distantUniverseStars) scene.add(distantUniverseStars); else console.error("Creazione Universo Distante fallita.");
    } else console.error("Funzione createDistantUniverseStars non trovata!");

    // Sole
    const sunGeometry = new THREE.SphereGeometry(sunBaseSize, 48, 48);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: sunColor });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = { ...sunData, initialRotationY: Math.random() * Math.PI * 2, rotationSpeed: 0.00012 };
    scene.add(sun);
    planets.push(sun);

    // Pianeti
    planetData.forEach(data => {
        const planetGroup = new THREE.Group();
        scene.add(planetGroup);
        planetGroup.userData = { ...data, initialAngle: Math.random() * Math.PI * 2 };
        planetGroup.userData.angle = planetGroup.userData.initialAngle;
        planetGroups.push(planetGroup);

        const planetGeometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.8, metalness: 0.1 });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.userData = { name: data.name, isPlanetBody: true, isOrbitToggle: data.isOrbitToggle || false };
        planetGroup.add(planet);
        planets.push(planet);

        if (data.name === "Terra") earthGroup = planetGroup;

        const orbitalPath = createOrbitalPath(data.distance);
        scene.add(orbitalPath); orbitalPaths.push(orbitalPath);

        // Atmosfera, Anelli, Nuvole (codice invariato)
        if (data.atmosphereColor) {
            const atmGeo = new THREE.SphereGeometry(data.radius * 1.08, 32, 32);
            const atmMat = new THREE.MeshLambertMaterial({ color: data.atmosphereColor, transparent: true, opacity: data.atmosphereOpacity || 0.25, depthWrite: false });
            planetGroup.add(new THREE.Mesh(atmGeo, atmMat));
        }
        if (data.hasRing && data.ringColor) {
            const ringGeo = new THREE.RingGeometry(data.radius * 1.2, data.radius * 2.2, 64);
            const ringMat = new THREE.MeshStandardMaterial({ color: data.ringColor, side: THREE.DoubleSide, transparent: true, opacity: 0.4, roughness: 0.9, metalness: 0.05, depthWrite: false });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2 - 0.05;
            planetGroup.add(ring);
        }
        if (data.hasClouds && data.cloudColor) {
            const cloudGeo = new THREE.SphereGeometry(data.radius * 1.04, 32, 32);
            const cloudMat = new THREE.MeshLambertMaterial({ color: data.cloudColor, transparent: true, opacity: 0.3, depthWrite: false });
            planetGroup.add(new THREE.Mesh(cloudGeo, cloudMat));
             // Aggiungi userData alle nuvole se necessario per rotazione separata
             planetGroup.children[planetGroup.children.length-1].userData = { isClouds: true, rotationSpeed: (data.rotationSpeed || 0.01) * 1.18, initialRotationY: Math.random() * Math.PI * 2 };

        }
        planetGroup.position.x = data.distance * Math.cos(planetGroup.userData.angle);
        planetGroup.position.z = data.distance * Math.sin(planetGroup.userData.angle);
    });

    // Orologio Cosmico
    if (typeof createCosmicClock === 'function') createCosmicClock(scene);
    else console.error("Funzione createCosmicClock non definita.");

    // Luna
    if (earthGroup && typeof createMoon === 'function') createMoon(earthGroup);
    else if (!earthGroup) console.warn("Gruppo Terra non trovato, Luna non creata.");
    else console.error("Funzione createMoon non definita.");

    // UI Manager
    if (typeof initUIManager === 'function') initUIManager();
    else console.error("Funzione initUIManager non definita.");

    // Event Manager
    if (typeof eventManager !== 'undefined' && eventManager.init) eventManager.init(scene);
    else console.error("Oggetto eventManager o init non definito.");

    // Event Listener
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('click', onMouseClick, false);
}

// --- Gestori Eventi ---

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function hidePlanetInfo() {
    if (planetInfoDiv) planetInfoDiv.style.display = 'none';
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Gestione stato UI (isCentering, isClockVisible)
    if (typeof isCentering !== 'undefined' && isCentering) return;
    if (typeof isClockVisible !== 'undefined' && isClockVisible && lastIntersected && lastIntersected.userData.isSun) {
         if (document.body.style.cursor !== 'pointer') document.body.style.cursor = 'pointer';
         return;
    }

    // *** MODIFICA: Lista oggetti per hover ***
    // Includi la costellazione se visibile per cambiare cursore
    let hoverObjects = [...planets];
    const constellationObj = typeof getConstellationPointsObject === 'function' ? getConstellationPointsObject() : null;
    if (constellationObj && constellationObj.visible) {
        hoverObjects.push(constellationObj);
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(hoverObjects, false);
    let currentHoveredObject = intersects.length > 0 ? intersects[0].object : null;

    if (currentHoveredObject) { // Se sto puntando qualcosa
        if (currentHoveredObject !== lastIntersected) { // Se è diverso da prima
            hidePlanetInfo(); // Nascondi label vecchia
            lastIntersected = currentHoveredObject;

            // Mostra etichetta hover SOLO per pianeti/sole e NON per sole+orologio
            if (lastIntersected.userData.isPlanetBody || lastIntersected.userData.isSun) {
                 if (!(typeof isClockVisible !== 'undefined' && isClockVisible && lastIntersected.userData.isSun)) {
                    if (planetInfoDiv && lastIntersected.userData.name) { // Assicurati che abbia un nome
                        planetInfoDiv.textContent = `${lastIntersected.userData.name}`;
                        planetInfoDiv.style.left = (event.clientX + 15) + 'px';
                        planetInfoDiv.style.top = (event.clientY - 30) + 'px';
                        planetInfoDiv.style.display = 'block';
                    }
                }
            }
        }
         // Cambia cursore per tutti gli oggetti intersecabili
        if (document.body.style.cursor !== 'pointer') document.body.style.cursor = 'pointer';

    } else { // Se non sto puntando nulla
        if (lastIntersected) { // Se prima puntavo qualcosa
            hidePlanetInfo(); // Nascondi etichetta
            if (document.body.style.cursor !== 'default') document.body.style.cursor = 'default';
            lastIntersected = null; // Resetta
        }
    }
}


function onMouseClick(event) {
    if (typeof isCentering !== 'undefined' && isCentering) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // *** MODIFICA: Lista oggetti per click ***
    let objectsToIntersect = [...planets]; // Pianeti e Sole
    const constellationObj = typeof getConstellationPointsObject === 'function' ? getConstellationPointsObject() : null;
    if (constellationObj && constellationObj.visible) {
        objectsToIntersect.push(constellationObj); // Aggiungi la costellazione cliccabile
    }

    const intersects = raycaster.intersectObjects(objectsToIntersect, false);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;

        // 1. Click sulla COSTELLAZIONE TESTO
        if (clickedObject.userData.isConstellationText) {
            if (typeof toggleConstellationLines === 'function') {
                toggleConstellationLines();
            }
            return; // Azione gestita
        }

        // 2. Click su PIANETI / SOLE
        const objectName = clickedObject.userData.name; // Nome della mesh (può mancare per gruppi)
        let targetGroup = clickedObject;
        // Risali gerarchia per trovare il gruppo orbitale o il Sole stesso
        while (targetGroup.parent && targetGroup.userData.distance == null && targetGroup !== scene && !targetGroup.userData.isSun) {
             targetGroup = targetGroup.parent;
        }
        // Ottieni i dati dal gruppo trovato o direttamente dal Sole se è stato cliccato
        const targetData = (targetGroup.userData.distance != null || targetGroup.userData.isSun) ? targetGroup.userData : null;

        if (!targetData) {
             console.warn("Impossibile trovare dati completi per l'oggetto cliccato:", clickedObject);
             if (typeof hideInfoPanel === 'function') hideInfoPanel();
             return;
        }

        let actionPerformed = false;
        if (targetData.isSun) {
            if (typeof toggleCosmicClock === 'function') toggleCosmicClock();
            hidePlanetInfo(); // Nasconde l'etichetta hover del sole dopo il click
            actionPerformed = true;
        } else if (targetGroup.userData.name === "Terra") { // Usa il nome del gruppo per sicurezza
            if (typeof toggleMoonVisibility === 'function') toggleMoonVisibility();
             actionPerformed = true;
        } else if (targetData.isOrbitToggle && targetGroup.userData.name === "Mercurio") { // Usa il nome del gruppo
            toggleOrbitalPaths();
            actionPerformed = true;
        }

        // Mostra sempre il pannello UI per pianeti/sole, anche se un'altra azione è avvenuta
        // (es. clicco Terra -> toggle Luna -> mostra pannello Terra)
        if (typeof showInfoPanel === 'function') {
            showInfoPanel(targetGroup, targetData);
        }

    } else { // Click sullo sfondo
         if (typeof hideInfoPanel === 'function') {
             hideInfoPanel();
         }
    }
}

// --- Funzione Animazione ---

function animate() {
    requestAnimationFrame(animate);
    const currentTime = performance.now();

    // Aggiorna UI Centering
    if (typeof updateCenteringAnimation === 'function') updateCenteringAnimation();
    if (typeof isCentering !== 'undefined' && isCentering) {
        renderer.render(scene, camera);
        return;
    }

    // Aggiorna Event Manager
    if (typeof eventManager !== 'undefined' && eventManager.update) eventManager.update(currentTime);

    // Aggiorna tempo globale e fattore tempo reale
    globalShaderTime += 0.015;
    const realTimeFactor = currentTime * 0.00000028;

    // Aggiorna Visibilità Testo Costellazione
    if (camera && controls && typeof updateConstellationTextVisibility === 'function') {
        const distance = camera.position.distanceTo(controls.target);
        updateConstellationTextVisibility(distance, CONSTELLATION_TEXT_VISIBILITY_THRESHOLD);
    }

    // Aggiorna Shader Stelle
    [proceduralMilkyWayStars, distantUniverseStars, galaxyDust].forEach(s => {
        if (s && s.material && s.material.uniforms && s.material.uniforms.time) s.material.uniforms.time.value = globalShaderTime; });

    // Animazione Sole
    if (sun) {
        const sinTime = Math.sin(globalShaderTime * 0.5);
        const sunScaleFactor = 1.0 + sinTime * 0.02;
        sun.scale.set(sunScaleFactor, sunScaleFactor, sunScaleFactor);
        if (sunPointLight) sunPointLight.intensity = 1.5 + Math.sin(globalShaderTime * 0.5 + Math.PI/2) * 0.2;
        sun.rotation.y = (sun.userData.initialRotationY || 0) + realTimeFactor * (sun.userData.rotationSpeed || 0) * 12000;
    }

    // Aggiornamento Pianeti
    planetGroups.forEach(group => {
        const data = group.userData;
        if (data && data.distance != null) {
            const orbitalSpeedMultiplier = data.orbitalSpeed ? data.orbitalSpeed * 3500 : 50; // Usa 3500 o un default
            data.angle = (data.initialAngle || 0) + realTimeFactor * orbitalSpeedMultiplier;
            group.position.x = data.distance * Math.cos(data.angle);
            group.position.z = data.distance * Math.sin(data.angle);

            // Rotazione oggetti nel gruppo (pianeta, nuvole, ecc.)
            let baseRotationSpeedMultiplier = (data.rotationSpeed != null ? data.rotationSpeed * 18000 : 0); // Default 0 se non specificato

            group.children.forEach(child => {
                const childData = child.userData;
                let effectiveRotationSpeedMultiplier = baseRotationSpeedMultiplier; // Usa la velocità del genitore di default

                // Sovrascrivi se il figlio ha una sua velocità specifica (es. nuvole)
                if (childData && childData.rotationSpeed != null) {
                    effectiveRotationSpeedMultiplier = childData.rotationSpeed * 18000;
                }

                // Applica rotazione solo se la velocità è diversa da zero
                if (effectiveRotationSpeedMultiplier !== 0) {
                    child.rotation.y = (childData.initialRotationY || 0) + realTimeFactor * effectiveRotationSpeedMultiplier;
                }
            });
        }
    });


    // Rotazione Sfondi Stellari
    if (proceduralMilkyWayStars) proceduralMilkyWayStars.rotation.y += 0.0000035;
    if (galaxyDust) galaxyDust.rotation.y += 0.0000040;
    if (distantUniverseStars) { distantUniverseStars.rotation.y += 0.0000008; distantUniverseStars.rotation.x += 0.00000025; }

    // Aggiorna Orologio
    if (typeof updateCosmicClock === 'function') updateCosmicClock();

    // Aggiorna Luna
    if (typeof updateMoonOrbit === 'function') updateMoonOrbit();

    // Aggiorna Controlli
    if (controls) controls.update();

    // Renderizza
    renderer.render(scene, camera);
}

// --- END OF FILE main.js ---