// --- START OF FILE lunarModule.js ---

// lunarModule.js: Logica per creare e gestire la Luna in orbita attorno alla Terra.

let moonMesh, moonOrbitGroup;
let earthGroupRef = null; // Riferimento al gruppo della Terra
let isMoonVisible = false;
let moonAngle = 0; // Angolo orbitale corrente della luna

// Variabili globali definite in main.js (se necessario accedervi direttamente)
// extern let lastIntersected;
// extern function hidePlanetInfo();

const MOON_RADIUS = 0.27; // Circa 1/4 del raggio terrestre
const MOON_ORBIT_RADIUS = 2.8; // Distanza orbitale dalla Terra (relativa alla scala dei raggi dei pianeti)
const MOON_ORBITAL_SPEED = 0.04; // Velocità orbitale relativa
const MOON_ROTATION_SPEED = 0.005; // Velocità di rotazione su se stessa

function createMoon(targetEarthGroup) {
    if (!targetEarthGroup) {
        console.error("Errore: Gruppo della Terra non fornito per creare la Luna.");
        return;
    }
    earthGroupRef = targetEarthGroup; // Salva il riferimento al gruppo della Terra

    // 1. Gruppo per l'orbita della Luna
    // Questo gruppo sarà figlio del gruppo della Terra, quindi seguirà la Terra.
    // La rotazione di questo gruppo determinerà l'orbita della Luna.
    moonOrbitGroup = new THREE.Group();
    moonOrbitGroup.visible = isMoonVisible; // Inizialmente invisibile
    earthGroupRef.add(moonOrbitGroup); // Aggiungi al gruppo della Terra

    // 2. Mesh della Luna
    const moonGeometry = new THREE.SphereGeometry(MOON_RADIUS, 16, 16);
    const moonMaterial = new THREE.MeshStandardMaterial({
        color: 0xB0B0B0, // Grigio
        roughness: 0.9,
        metalness: 0.1
    });
    moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.userData = { name: "Luna", isMoon: true, initialRotationY: Math.random() * Math.PI * 2 };

    // 3. Posiziona la Luna all'interno del suo gruppo orbitale
    // Il gruppo orbitale è centrato sulla Terra. Posizioniamo la Luna
    // alla distanza orbitale desiderata lungo l'asse x (o z).
    moonMesh.position.x = MOON_ORBIT_RADIUS;
    moonOrbitGroup.add(moonMesh); // Aggiungi la mesh della Luna al suo gruppo orbitale

    console.log("Luna creata e agganciata alla Terra.");
}

function toggleMoonVisibility() {
    if (!moonOrbitGroup) {
        console.warn("Impossibile cambiare visibilità Luna: non ancora creata.");
        return;
    }
    isMoonVisible = !isMoonVisible;
    moonOrbitGroup.visible = isMoonVisible;
    console.log("Visibilità Luna:", isMoonVisible);

    // Nascondi anche le info pianeta se la luna viene nascosta e si stava mostrando la Terra
    // Assicurati che lastIntersected e hidePlanetInfo siano accessibili (potrebbero essere globali o passate)
    if (typeof lastIntersected !== 'undefined' && typeof hidePlanetInfo === 'function') {
        if (!isMoonVisible && lastIntersected && lastIntersected.userData.name === "Terra") {
             hidePlanetInfo();
             if (typeof document !== 'undefined') document.body.style.cursor = 'default';
        }
    }
}

function updateMoonOrbit() {
    // Aggiorna solo se la Luna è visibile e il gruppo esiste
    if (!isMoonVisible || !moonOrbitGroup || !earthGroupRef) {
        return;
    }

    // Calcola il nuovo angolo orbitale
    // Usiamo un fattore temporale simile a quello dei pianeti per coerenza
    const time = Date.now() * 0.0000028; // Stesso fattore di main.js
    moonAngle = (time * MOON_ORBITAL_SPEED * 350) % (Math.PI * 2); // Simile al calcolo dell'angolo dei pianeti

    // Applica la rotazione al gruppo orbitale della Luna
    moonOrbitGroup.rotation.y = moonAngle;

    // Applica la rotazione della Luna su se stessa
    if (moonMesh) {
       moonMesh.rotation.y = (moonMesh.userData.initialRotationY || 0) + (time * MOON_ROTATION_SPEED * 1800);
       // Per simulare la rotazione sincrona (stessa faccia verso Terra):
       // moonMesh.rotation.y = -moonAngle + (moonMesh.userData.initialRotationY || 0);
    }
}

// --- END OF FILE lunarModule.js ---