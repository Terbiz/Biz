// --- START OF FILE constellationText.js ---

// constellationText.js: Logica per creare testo "stellare" PUNTIFORME
// campionando punti all'interno dei triangoli della mesh del testo.

// Variabili globali necessarie (definite in main.js o THREE)
// extern let THREE;
// extern let scene;
// extern let MILKYWAY_DISK_RADIUS;

let constellationPointsObject = null;
// let constellationLinesObject = null; // Linee rimosse per ora
// let areConstellationLinesVisible = false;

const CONSTELLATION_TEXT = "A l v i - B i z"; // Mantieni il testo corretto

function createConstellationText(font, targetScene) {
    if (!font || !targetScene || typeof THREE === 'undefined' || typeof THREE.TextGeometry === 'undefined') {
        console.error("ConstellationText: Font, Scena o THREE/TextGeometry mancanti.");
        return null;
    }
    if (typeof MILKYWAY_DISK_RADIUS === 'undefined') {
        console.error("ConstellationText: MILKYWAY_DISK_RADIUS non definita.");
        return null;
    }

    const textSettings = {
        font: font,
        size: 400,       // Dimensione base del testo
        height: 10,        // <-- AUMENTA L'ALTEZZA/SPESSORE per dare volume al campionamento
        curveSegments: 0.1,  // Meno segmenti potrebbero andare bene per questo approccio
    };

    try {
        // 1. Crea la geometria del testo mesh con uno spessore
        const textGeo = new THREE.TextGeometry(CONSTELLATION_TEXT, textSettings);
        textGeo.computeBoundingBox();
        textGeo.center();

        // 2. Estrai i vertici e gli indici
        const positions = textGeo.attributes.position.array;
        const indices = textGeo.index ? textGeo.index.array : null;

        // *** NUOVA LOGICA: Campionamento di punti casuali all'interno dei triangoli ***
        const sampledPoints = [];
        const numPointsToSamplePerLetterApprox = 50; // Punti desiderati per lettera (circa)
        const numLetters = CONSTELLATION_TEXT.replace(/[^a-zA-Z0-9]/g, "").length || 1; // Conta lettere/numeri
        const totalPointsToSample = numPointsToSamplePerLetterApprox * numLetters;

        const vecA = new THREE.Vector3();
        const vecB = new THREE.Vector3();
        const vecC = new THREE.Vector3();
        const randomPoint = new THREE.Vector3();

        if (indices) { // Geometria indicizzata (normale per TextGeometry)
            const numTriangles = indices.length / 3;
            const pointsPerTriangle = Math.max(1, Math.ceil(totalPointsToSample / numTriangles));

            for (let i = 0; i < indices.length; i += 3) {
                vecA.fromBufferAttribute(textGeo.attributes.position, indices[i]);
                vecB.fromBufferAttribute(textGeo.attributes.position, indices[i + 1]);
                vecC.fromBufferAttribute(textGeo.attributes.position, indices[i + 2]);

                for (let j = 0; j < pointsPerTriangle; j++) {
                    // Genera coordinate baricentriche casuali
                    let r1 = Math.random();
                    let r2 = Math.random();

                    // Assicura che il punto sia dentro il triangolo
                    if (r1 + r2 > 1) {
                        r1 = 1 - r1;
                        r2 = 1 - r2;
                    }
                    const r3 = 1 - r1 - r2; // La terza coordinata

                    randomPoint.set(0,0,0)
                        .addScaledVector(vecA, r1)
                        .addScaledVector(vecB, r2)
                        .addScaledVector(vecC, r3);

                    sampledPoints.push(randomPoint.x, randomPoint.y, randomPoint.z);
                }
            }
        } else { // Geometria non indicizzata (fallback, meno probabile)
            console.warn("ConstellationText: TextGeometry non indicizzata. Il campionamento potrebbe essere meno uniforme.");
            const numTriangles = positions.length / 9; // 3 vertici * 3 coordinate
            const pointsPerTriangle = Math.max(1, Math.ceil(totalPointsToSample / numTriangles));

            for (let i = 0; i < positions.length; i += 9) {
                vecA.set(positions[i], positions[i+1], positions[i+2]);
                vecB.set(positions[i+3], positions[i+4], positions[i+5]);
                vecC.set(positions[i+6], positions[i+7], positions[i+8]);

                for (let j = 0; j < pointsPerTriangle; j++) {
                    let r1 = Math.random();
                    let r2 = Math.random();
                    if (r1 + r2 > 1) { r1 = 1 - r1; r2 = 1 - r2; }
                    const r3 = 1 - r1 - r2;
                    randomPoint.set(0,0,0).addScaledVector(vecA, r1).addScaledVector(vecB, r2).addScaledVector(vecC, r3);
                    sampledPoints.push(randomPoint.x, randomPoint.y, randomPoint.z);
                }
            }
        }


        // 3. Crea la geometria dei PUNTI
        const pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sampledPoints, 3));

        // 4. Crea il materiale per i PUNTI
        const pointsMaterial = new THREE.PointsMaterial({
            color: 0xE8F0FF,
            size: 1, // <-- Dimensione PUNTI. Prova valori tra 2 e 4.
            sizeAttenuation: false,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.55,
            depthWrite: false
        });

        // 5. Crea l'oggetto PUNTI
        const points = new THREE.Points(pointsGeometry, pointsMaterial);
        points.position.y = MILKYWAY_DISK_RADIUS * 0.6;
        points.position.z = -MILKYWAY_DISK_RADIUS * 1.1;
        points.rotation.x = -Math.PI / 12;
        points.visible = false; // Inizialmente invisibile
        points.userData = { isConstellationText: true, name: "Costellazione Testo" };
        targetScene.add(points);
        constellationPointsObject = points;

        // --- Logica per le linee TEMPORANEAMENTE RIMOSSA ---
        // Dovrà essere ripensata se vogliamo connettere questi punti campionati casualmente,
        // o potremmo tornare a disegnare le linee basate sui contorni originali di textGeo.

        console.log(`ConstellationText: Creato PUNTI per "${CONSTELLATION_TEXT}" con ${sampledPoints.length / 3} punti (CAMPIONATI).`);
        textGeo.dispose();
        return points;

    } catch (error) {
        console.error("ConstellationText: Errore durante la creazione:", error);
        return null;
    }
}

// Funzione per aggiornare la visibilità dei PUNTI (chiamata da main.js)
function updateConstellationTextVisibility(cameraDistance, threshold) {
    if (constellationPointsObject) {
        const shouldBeVisible = cameraDistance > threshold;
        if (constellationPointsObject.visible !== shouldBeVisible) {
            constellationPointsObject.visible = shouldBeVisible;
            // Se i punti scompaiono e le linee erano gestite, nascondi anche quelle
            // if (!shouldBeVisible && constellationLinesObject && constellationLinesObject.visible) {
            //     constellationLinesObject.visible = false;
            //     areConstellationLinesVisible = false;
            // }
        }
    }
}


// Esporta la funzione get per permettere a main.js di accedere all'oggetto PUNTI
function getConstellationPointsObject() {
    return constellationPointsObject;
}

// --- END OF FILE constellationText.js ---