// cosmicClock.js: Logica per creare e gestire l'orologio cosmico.

let clockGroup, hourHand, minuteHand, secondHand;
let isClockVisible = false;

const CLOCK_RADIUS = 70;
const CLOCK_Y_OFFSET = -20;

function addRomanNumeralsToClock(targetGroup, font) {
    if (!targetGroup || !font || typeof THREE.TextGeometry === 'undefined') {
        console.warn("Impossibile aggiungere numeri romani: gruppo, font o TextGeometry mancanti.");
        if (!font) console.warn("FONT_LOADED non è ancora definito o il font non è stato caricato.");
        if (typeof THREE.TextGeometry === 'undefined') console.warn("THREE.TextGeometry non è inclusa.");
        return;
    }

    let numeralsExist = false;
    targetGroup.children.forEach(child => {
        if (child.userData && child.userData.isRomanNumeralContainer) {
            numeralsExist = true;
        }
    });
    if (numeralsExist) {
        console.log("Numeri romani già presenti, non verranno aggiunti di nuovo.");
        return;
    }

    const romanNumerals = [ "I","XII", "XI", "X", "IX", "VIII", "VII", "VI", "V", "IV", "III", "II"];
    const numeralSettings = {
        font: font,
        size: 6, // Leggermente più grandi se sono l'unico indicatore
        height: 0.8,
        curveSegments: 3,
    };
    const numeralMaterial = new THREE.MeshStandardMaterial({ color: 0xE0E8FF, metalness: 0.65, roughness: 0.45 }); // Tonalità più chiara
    // Posizioniamo i numeri leggermente più all'interno se devono guardare verso il centro
    const numeralRadius = CLOCK_RADIUS * 0.82;
    const numeralBaseYOffset = 0.3; // Leggermente più sollevati

    for (let i = 0; i < 12; i++) {
        const hourValue = i + 1;
        const text = romanNumerals[i];

        const textGeo = new THREE.TextGeometry(text, numeralSettings);
        textGeo.computeBoundingBox();
        const textWidth = textGeo.boundingBox.max.x - textGeo.boundingBox.min.x;

        textGeo.translate(-textWidth / 2, 0, 0);

        const textMesh = new THREE.Mesh(textGeo, numeralMaterial);
        const numeralContainer = new THREE.Group();
        numeralContainer.userData = { isRomanNumeralContainer: true };
        numeralContainer.add(textMesh);

        const angle = (Math.PI / 2) - (hourValue / 12) * (Math.PI * 2);

        numeralContainer.position.x = numeralRadius * Math.cos(angle);
        numeralContainer.position.z = numeralRadius * Math.sin(angle);
        numeralContainer.position.y = numeralBaseYOffset;

        // Orientamento del testo "in piedi" e RIVOLTO VERSO L'INTERNO:
        // 1. Ruota il textMesh per alzarlo
       

        // 2. Ruota il numeralContainer per orientare il testo alzato.
        //    L'asse X del textMesh (la sua larghezza) deve ora essere PERPENDICOLARE alla tangente,
        //    cioè allineato con il raggio, e la "faccia" del testo (che era +Z del textMesh prima della rotazione X,
        //    ora è diventata +Y del textMesh) deve puntare verso il centro.
        //    Per far sì che la faccia del testo (che ora è il suo "alto", dopo la rotazione X) guardi verso il centro,
        //    e la sua "base" (asse X) sia radiale, la rotazione Y del container dovrebbe essere 'angle'.
        //    Considerando che il testo è stato ruotato su X, il suo "fronte" originale (asse Z) ora punta verso l'alto (asse Y globale).
        //    Vogliamo che l'asse X del testo (la direzione della scrittura) sia radiale (punti verso o lontano dal centro).
        //    E il "dorso" del testo (il suo -Z originale, che dopo la rotazione X è diventato il suo -Y locale)
        //    sia appoggiato sul bordo guardando verso il centro.
        //    L'angolo `angle` è la direzione dal centro al numero.
        //    Se vogliamo che la faccia del testo (-Z originale, ora -Y locale del mesh) guardi al centro,
        //    la rotazione y del container deve essere l'angolo stesso.
         // Il testo sarà "seduto" sul raggio, la sua larghezza (asse X) è lungo il raggio.
                                           // Il "davanti" del testo (originariamente +Z) punterà verso l'alto.
                                           // Per farlo guardare al centro, la sua "faccia" (che è il piano XY del testo originale)
                                           // deve essere orientata correttamente.
                                           // La rotazione 'angle' fa sì che l'asse X locale del container punti lungo il raggio.
                                           // Dopo che textMesh.rotation.x = -Math.PI/2, il "davanti" del testo è lungo l'asse +Y del textMesh.
                                           // Se il container ruota di 'angle', l'asse +Y del textMesh punterà anch'esso radialmente verso l'alto.
                                           // Vogliamo che il "davanti" del testo (originariamente +Z) punti verso il centro.
                                           // Il "davanti" è ora lungo +Y del textMesh.
                                           // Quindi l'asse +Y del textMesh deve puntare verso -X o -Z del mondo a seconda dell'angolo.
                                           // Questo significa che la rotazione Y del container dovrebbe essere 'angle + Math.PI'
                                           // se il testo fosse "sdraiato".
                                           // Ma è in piedi. L'asse X del testo (la sua larghezza) è ora orientato dall'angolo.
                                           // Per far sì che il "fronte" del testo (asse +Y del mesh) guardi verso il centro,
                                           // la rotazione Y del container deve essere:
        numeralContainer.rotation.y = angle + 40; // O angle - Math.PI/2. Proviamo.
                                                           // Con angle + PI/2: L'asse X del testo (la sua larghezza) diventa tangenziale.
                                                           // La sua faccia (+Y del mesh) punterà verso il centro.

        targetGroup.add(numeralContainer);
    }
    console.log("Numeri Romani (rivolti verso l'interno) aggiunti all'orologio.");
}


function createCosmicClock(scene) {
    clockGroup = new THREE.Group();
    clockGroup.position.y = CLOCK_Y_OFFSET;
    clockGroup.rotation.x = Math.PI / 18;
    clockGroup.visible = isClockVisible;
    scene.add(clockGroup);

    const dialOuterGeometry = new THREE.RingGeometry(CLOCK_RADIUS * 0.98, CLOCK_RADIUS, 64);
    const dialOuterMaterial = new THREE.MeshStandardMaterial({ color: 0x333340, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide });
    const dialOuter = new THREE.Mesh(dialOuterGeometry, dialOuterMaterial);
    dialOuter.rotation.x = -Math.PI / 2;
    clockGroup.add(dialOuter);

    const dialInnerGeometry = new THREE.CircleGeometry(CLOCK_RADIUS * 0.96, 64);
    const dialInnerMaterial = new THREE.MeshStandardMaterial({ color: 0x181820, metalness: 0.4, roughness: 0.7, side: THREE.DoubleSide });
    const dialInner = new THREE.Mesh(dialInnerGeometry, dialInnerMaterial);
    dialInner.rotation.x = -Math.PI / 2;
    dialInner.position.y = -0.05;
    clockGroup.add(dialInner);

    // ***** SEGNAPOSTO ORE RIMOSSI *****
    /*
    for (let i = 0; i < 12; i++) {
        // ... codice per i segni delle ore ...
    }
    */

    // Lancette (invariate rispetto a prima)
    const handShaftMaterial = new THREE.MeshStandardMaterial({ color: 0x777788, metalness: 0.85, roughness: 0.35, side: THREE.DoubleSide });
    const handAccentMaterial = new THREE.MeshStandardMaterial({ color: 0xD0D0E0, metalness: 0.75, roughness: 0.3 });
    const secondHandMaterial = new THREE.MeshStandardMaterial({ color: 0xFF3322, metalness: 0.6, roughness: 0.45, emissive: 0x550000 });

    hourHand = new THREE.Group();
    const hourBaseWidth = 2.0; const hourBaseDepth = 0.7;
    const hourLength = CLOCK_RADIUS * 0.48; const hourTipLength = hourLength * 0.3;
    const hourShaftLength = hourLength - hourTipLength;
    const hourShaftGeo = new THREE.BoxGeometry(hourBaseWidth * 0.75, hourBaseDepth * 0.85, hourShaftLength);
    hourShaftGeo.translate(0, 0, hourShaftLength / 2);
    const hourShaftMesh = new THREE.Mesh(hourShaftGeo, handShaftMaterial);
    const hourTipGeo = new THREE.ConeGeometry(hourBaseWidth * 0.55, hourTipLength, 12);
    hourTipGeo.translate(0, hourTipLength / 2, 0).rotateX(Math.PI / 2);
    const hourTipMesh = new THREE.Mesh(hourTipGeo, handAccentMaterial);
    hourTipMesh.position.z = hourShaftLength;
    const hourCounterWeightGeo = new THREE.CylinderGeometry(hourBaseWidth * 0.45, hourBaseWidth * 0.45, hourLength * 0.18, 12);
    hourCounterWeightGeo.rotateX(Math.PI / 2);
    const hourCounterWeightMesh = new THREE.Mesh(hourCounterWeightGeo, handAccentMaterial);
    hourCounterWeightMesh.position.z = -hourLength * 0.12;
    hourHand.add(hourShaftMesh); hourHand.add(hourTipMesh); hourHand.add(hourCounterWeightMesh);
    hourHand.position.y = 0.65;
    clockGroup.add(hourHand);

    minuteHand = new THREE.Group();
    const minuteBaseWidth = 1.6; const minuteBaseDepth = 0.6;
    const minuteLength = CLOCK_RADIUS * 0.70; const minuteTipLength = minuteLength * 0.28;
    const minuteShaftLength = minuteLength - minuteTipLength;
    const minuteShaftGeo = new THREE.BoxGeometry(minuteBaseWidth * 0.65, minuteBaseDepth * 0.75, minuteShaftLength);
    minuteShaftGeo.translate(0, 0, minuteShaftLength / 2);
    const minuteShaftMesh = new THREE.Mesh(minuteShaftGeo, handShaftMaterial);
    const minuteTipGeo = new THREE.ConeGeometry(minuteBaseWidth * 0.50, minuteTipLength, 12);
    minuteTipGeo.translate(0, minuteTipLength / 2, 0).rotateX(Math.PI / 2);
    const minuteTipMesh = new THREE.Mesh(minuteTipGeo, handAccentMaterial);
    minuteTipMesh.position.z = minuteShaftLength;
    const minuteCounterWeightGeo = new THREE.CylinderGeometry(minuteBaseWidth * 0.35, minuteBaseWidth * 0.35, minuteLength * 0.15, 12);
    minuteCounterWeightGeo.rotateX(Math.PI / 2);
    const minuteCounterWeightMesh = new THREE.Mesh(minuteCounterWeightGeo, handAccentMaterial);
    minuteCounterWeightMesh.position.z = -minuteLength * 0.1;
    minuteHand.add(minuteShaftMesh); minuteHand.add(minuteTipMesh); minuteHand.add(minuteCounterWeightMesh);
    minuteHand.position.y = 0.75;
    clockGroup.add(minuteHand);

    secondHand = new THREE.Group();
    const secondShaftRadius = 0.3;
    const secondLengthFull = CLOCK_RADIUS * 0.80;
    const secondCounterWeightRatio = 0.22;
    const secondShaftActualLength = secondLengthFull * (1 - secondCounterWeightRatio);
    const secondCounterWeightActualLength = secondLengthFull * secondCounterWeightRatio;
    const secondShaftGeo = new THREE.CylinderGeometry(secondShaftRadius, secondShaftRadius * 0.6, secondShaftActualLength, 10);
    secondShaftGeo.translate(0, secondShaftActualLength / 2, 0).rotateX(Math.PI / 2);
    const secondShaftMesh = new THREE.Mesh(secondShaftGeo, secondHandMaterial);
    const secondCounterWeightGeo = new THREE.CylinderGeometry(secondShaftRadius * 1.8, secondShaftRadius * 1.5, secondCounterWeightActualLength, 10);
    secondCounterWeightGeo.translate(0, -secondCounterWeightActualLength/2 ,0).rotateX(Math.PI/2);
    const secondCounterWeightMesh = new THREE.Mesh(secondCounterWeightGeo, secondHandMaterial);
    secondHand.add(secondShaftMesh); secondHand.add(secondCounterWeightMesh);
    secondHand.position.y = 0.85;
    clockGroup.add(secondHand);

    const centerPinGeo = new THREE.CylinderGeometry(2.2, 2.0, 1.8, 24);
    const centerPinMat = new THREE.MeshStandardMaterial({ color: 0x505060, metalness: 0.9, roughness: 0.3 });
    const centerPin = new THREE.Mesh(centerPinGeo, centerPinMat);
    centerPin.rotation.x = Math.PI / 2;
    centerPin.position.y = 0.35;
    clockGroup.add(centerPin);

    if (typeof FONT_LOADED !== 'undefined' && FONT_LOADED) {
        addRomanNumeralsToClock(clockGroup, FONT_LOADED);
    } else {
        console.log("Font non ancora caricato per cosmicClock, i numeri romani verranno aggiunti in seguito.");
    }

    console.log("Orologio Cosmico creato.");
}

function toggleCosmicClock() {
    isClockVisible = !isClockVisible;
    if (clockGroup) {
        clockGroup.visible = isClockVisible;
        console.log("Visibilità Orologio Cosmico:", isClockVisible);
    }
}

function updateCosmicClock() {
    if (!isClockVisible || !hourHand || !minuteHand || !secondHand) {
        return;
    }

    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const milliseconds = now.getMilliseconds();

    const secondsProgress = (seconds + milliseconds / 1000) / 60;
    const minutesProgress = (minutes + seconds / 60) / 60;
    const hoursProgress = (hours + minutes / 60) / 12;

    const currentSecondAngle = Math.PI / 2 - (secondsProgress * 2 * Math.PI);
    const currentMinuteAngle = Math.PI / 2 - (minutesProgress * 2 * Math.PI);
    const currentHourAngle   = Math.PI / 2 - (hoursProgress * 2 * Math.PI);

    secondHand.rotation.y = currentSecondAngle;
    minuteHand.rotation.y = currentMinuteAngle;
    hourHand.rotation.y   = currentHourAngle;
}