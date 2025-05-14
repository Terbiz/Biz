// --- START OF FILE eventManager.js ---

// eventManager.js: Gestisce la creazione e l'animazione di eventi cosmici casuali.

const eventManager = {
    sceneRef: null,
    activeEvents: [], // Array di oggetti che descrivono eventi attivi
    nextEventTime: 0, // Timestamp (performance.now()) per il prossimo evento
    minInterval: 15000, // Millisecondi minimi tra eventi (15 secondi)
    maxInterval: 45000, // Millisecondi massimi tra eventi (45 secondi)
    eventTypes: ['comet', 'meteorShower', 'supernovaGlow'],

    // Deve essere chiamato da main.js dopo la creazione della scena
    init(scene) {
        if (!scene || typeof THREE === 'undefined') {
            console.error("EventManager: Scena non valida o THREE non definito.");
            return;
        }
        // Assicurati che le costanti globali da main.js siano definite
        if (typeof MILKYWAY_DISK_RADIUS === 'undefined' || typeof UNIVERSE_STARS_OUTER_RADIUS === 'undefined') {
             console.error("EventManager: Costanti globali (MILKYWAY_DISK_RADIUS, etc.) non definite.");
             return;
        }

        this.sceneRef = scene;
        this.scheduleNextEvent(5000); // Schedula il primo evento tra 5 secondi
        console.log("EventManager Inizializzato.");
    },

    // Calcola quando il prossimo evento potrebbe verificarsi
    scheduleNextEvent(delay = 0) {
        const interval = this.minInterval + Math.random() * (this.maxInterval - this.minInterval);
        this.nextEventTime = performance.now() + interval + delay;
    },

    // Chiamato ad ogni frame da main.js
    update(time) { // time è performance.now()
        if (!this.sceneRef) return;

        // 1. Controlla se è ora di triggerare un nuovo evento
        if (time >= this.nextEventTime && this.activeEvents.length < 5) { // Limita eventi attivi
            this.triggerRandomEvent();
            this.scheduleNextEvent(); // Schedula il successivo
        }

        // 2. Aggiorna e pulisci eventi attivi
        const remainingEvents = [];
        for (let i = 0; i < this.activeEvents.length; i++) {
            const event = this.activeEvents[i];
            if (!event) continue; // Sicurezza

            const elapsed = time - event.startTime;
            let keepEvent = true;

            if (elapsed >= event.duration) {
                // Evento terminato, pulisci
                this.cleanupEvent(event);
                keepEvent = false;
            } else {
                // Aggiorna l'evento in base al tipo
                const progress = elapsed / event.duration; // 0 to 1
                try { // Aggiungi try-catch per robustezza
                    switch (event.type) {
                        case 'comet':
                            this.updateComet(event, progress);
                            break;
                        case 'meteorShower':
                             this.updateMeteorShower(event, progress);
                             break;
                        case 'supernovaGlow':
                            this.updateSupernovaGlow(event, progress);
                            break;
                    }
                } catch (error) {
                     console.error(`Errore durante l'aggiornamento dell'evento ${event.type}:`, error);
                     this.cleanupEvent(event); // Tenta di pulire l'evento problematico
                     keepEvent = false;
                }
            }

            if (keepEvent) {
                remainingEvents.push(event);
            }
        }
        this.activeEvents = remainingEvents;
    },

    // Seleziona e avvia un evento casuale
    triggerRandomEvent() {
        const randomIndex = Math.floor(Math.random() * this.eventTypes.length);
        const type = this.eventTypes[randomIndex];
        console.log(`%cEventManager: Triggering event - ${type}`, 'color: cyan'); // Log colorato

        try {
            switch (type) {
                case 'comet':
                    this.createComet();
                    break;
                case 'meteorShower':
                     this.createMeteorShower();
                     break;
                case 'supernovaGlow':
                    this.createSupernovaGlow();
                    break;
            }
        } catch(error) {
            console.error(`Errore durante la creazione dell'evento ${type}:`, error);
        }
    },

    // --- Funzioni Specifiche per Evento ---

    // COMETA
    createComet() {
        const duration = 8000 + Math.random() * 7000;
        const distance = MILKYWAY_DISK_RADIUS * (0.8 + Math.random() * 0.6);
        const startAngle = Math.random() * Math.PI * 2;
        const startY = THREE.MathUtils.randFloatSpread(MILKYWAY_DISK_THICKNESS * 0.5);
        const startPos = new THREE.Vector3(
            distance * Math.cos(startAngle), startY, distance * Math.sin(startAngle)
        );
        const endPos = new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(distance * 0.4),
            THREE.MathUtils.randFloatSpread(startY * 0.5),
            THREE.MathUtils.randFloatSpread(distance * 0.4)
        );

        const headMaterial = new THREE.SpriteMaterial({
            color: 0xAAE8FF, blending: THREE.AdditiveBlending, sizeAttenuation: true,
            map: this.createGlowTexture(0xAAE8FF), depthWrite: false, transparent: true, opacity: 0
        });
        const cometHead = new THREE.Sprite(headMaterial);
        cometHead.scale.set(80, 80, 1);
        cometHead.position.copy(startPos);
        this.sceneRef.add(cometHead);

        const eventData = {
            type: 'comet', startTime: performance.now(), duration: duration,
            objects: [cometHead], startPos: startPos, endPos: endPos, headMaterial: headMaterial
        };
        this.activeEvents.push(eventData);
    },

    updateComet(event, progress) {
        if (!event || !event.objects || !event.objects[0]) return;
        event.objects[0].position.lerpVectors(event.startPos, event.endPos, progress);
        const fadeInDuration = 0.15, fadeOutStart = 0.75;
        if (progress < fadeInDuration) event.headMaterial.opacity = progress / fadeInDuration;
        else if (progress > fadeOutStart) event.headMaterial.opacity = 1.0 - (progress - fadeOutStart) / (1.0 - fadeOutStart);
        else event.headMaterial.opacity = 1.0;
        const scaleFactor = 1.0 - progress * 0.3;
        event.objects[0].scale.set(80 * scaleFactor, 80 * scaleFactor, 1);
    },

    // SCIAME METEORICO
    createMeteorShower() {
        const duration = 3000 + Math.random() * 4000;
        const numMeteors = 50 + Math.floor(Math.random() * 100);
        const showerRadius = 300 + Math.random() * 400;
        const centerDistance = MILKYWAY_DISK_RADIUS * (0.6 + Math.random() * 0.4);
        const centerAngle = Math.random() * Math.PI * 2;
        const centerPos = new THREE.Vector3(
             centerDistance * Math.cos(centerAngle),
             THREE.MathUtils.randFloatSpread(MILKYWAY_DISK_THICKNESS * 0.8),
             centerDistance * Math.sin(centerAngle)
        );
        const direction = new THREE.Vector3(
             -centerPos.x * 0.1 + THREE.MathUtils.randFloatSpread(0.5),
             -0.8 + THREE.MathUtils.randFloatSpread(0.4),
             -centerPos.z * 0.1 + THREE.MathUtils.randFloatSpread(0.5)
         ).normalize();

        const positions = []; const speeds = []; const startOffsets = [];
        for (let i = 0; i < numMeteors; i++) {
            const pos = centerPos.clone().add( new THREE.Vector3(
                    THREE.MathUtils.randFloatSpread(showerRadius),
                    THREE.MathUtils.randFloatSpread(showerRadius * 0.5),
                    THREE.MathUtils.randFloatSpread(showerRadius) ) );
            positions.push(pos.x, pos.y, pos.z);
            speeds.push(80 + Math.random() * 120);
            startOffsets.push(Math.random() * 0.6);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.userData = { speeds, startOffsets, direction, initialPositions: new Float32Array(positions) };

        const material = new THREE.PointsMaterial({
            color: 0xFFFFAA, size: 15, blending: THREE.AdditiveBlending,
            transparent: true, opacity: 0.7, sizeAttenuation: true, depthWrite: false
        });
        const points = new THREE.Points(geometry, material);
        this.sceneRef.add(points);

        const eventData = {
            type: 'meteorShower', startTime: performance.now(), duration: duration,
            objects: [points], geometry: geometry, material: material
        };
        this.activeEvents.push(eventData);
    },

    updateMeteorShower(event, progress) {
        if (!event || !event.geometry || !event.geometry.attributes || !event.geometry.attributes.position) return;
        const positions = event.geometry.attributes.position.array;
        const { initialPositions, speeds, startOffsets, direction } = event.geometry.userData;
        const numPoints = positions.length / 3;
        const timeDelta = event.duration / 1000; // Scale speed by duration

        for (let i = 0; i < numPoints; i++) {
            const i3 = i * 3; const startOffset = startOffsets[i]; const speed = speeds[i];
            let pointProgress = 0;
            if (progress > startOffset) pointProgress = Math.min((progress - startOffset) / (1.0 - startOffset), 1.0);
            positions[i3]     = initialPositions[i3]     + direction.x * speed * pointProgress * timeDelta;
            positions[i3 + 1] = initialPositions[i3 + 1] + direction.y * speed * pointProgress * timeDelta;
            positions[i3 + 2] = initialPositions[i3 + 2] + direction.z * speed * pointProgress * timeDelta;
        }
        event.geometry.attributes.position.needsUpdate = true;

        const fadeOutStart = 0.5;
        if(progress > fadeOutStart) {
            event.material.opacity = Math.max(0, 0.7 * (1.0 - (progress - fadeOutStart) / (1.0 - fadeOutStart)));
        } else {
             event.material.opacity = 0.7; // Reset opacity if needed
        }
    },

    // SUPERNOVA
    createSupernovaGlow() {
        const duration = 2500 + Math.random() * 3500;
        const distance = UNIVERSE_STARS_OUTER_RADIUS * (0.8 + Math.random() * 0.4);
        const angle = Math.random() * Math.PI * 2;
        const heightAngle = Math.acos(THREE.MathUtils.randFloatSpread(1.8)); // More spread vertically
        const position = new THREE.Vector3(
            distance * Math.sin(heightAngle) * Math.cos(angle),
            distance * Math.cos(heightAngle),
            distance * Math.sin(heightAngle) * Math.sin(angle)
        );

        const glowMaterial = new THREE.SpriteMaterial({
            color: 0xFFFFFF, blending: THREE.AdditiveBlending,
            map: this.createGlowTexture(0xFFFFFF), sizeAttenuation: false,
            depthWrite: false, transparent: true, opacity: 0
        });
        const glowSprite = new THREE.Sprite(glowMaterial);
        glowSprite.scale.set(0.05, 0.05, 1); // Start small
        glowSprite.position.copy(position);
        this.sceneRef.add(glowSprite);

        const eventData = {
            type: 'supernovaGlow', startTime: performance.now(), duration: duration,
            objects: [glowSprite], glowMaterial: glowMaterial,
            baseColor: new THREE.Color(0xFFFFFF), // Store colors for lerp
            endColor: new THREE.Color(0xFFaa88)
        };
        this.activeEvents.push(eventData);
    },

    updateSupernovaGlow(event, progress) {
        if (!event || !event.objects || !event.objects[0]) return;
        const peakTime = 0.15; let opacity = 0; let scale = 0.05;
        if (progress < peakTime) {
            const fadeInProgress = progress / peakTime;
            opacity = fadeInProgress * fadeInProgress;
            scale = 0.05 + opacity * 0.15;
            event.glowMaterial.color = event.baseColor;
        } else {
            const fadeOutProgress = (progress - peakTime) / (1.0 - peakTime);
            opacity = (1.0 - fadeOutProgress) * (1.0 - fadeOutProgress);
            scale = 0.05 + 0.15 * (1.0 - fadeOutProgress); // Shrink from peak size
            event.glowMaterial.color.lerpColors(event.baseColor, event.endColor, fadeOutProgress * 0.8);
        }
        event.glowMaterial.opacity = Math.max(0, Math.min(1, opacity));
        event.objects[0].scale.set(scale, scale, 1);
    },

    // --- Utilità ---
    cleanupEvent(event) {
        // console.log(`EventManager: Cleaning up event - ${event.type}`);
        event.objects.forEach(obj => {
            if (obj) {
                if (obj.parent) obj.parent.remove(obj); // Usa parent.remove
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if(obj.material.map && obj.material.map instanceof THREE.Texture) {
                        obj.material.map.dispose(); // Dispose texture if created uniquely
                    }
                    obj.material.dispose();
                }
            }
        });
        event.objects = []; // Clear array
    },

    createGlowTexture(colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 64; canvas.height = 64;
        const context = canvas.getContext('2d');
        const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
        const color = new THREE.Color(colorHex);
        const r = Math.floor(color.r*255), g = Math.floor(color.g*255), b = Math.floor(color.b*255);
        gradient.addColorStop(0, `rgba(${r},${g},${b},0.8)`);
        gradient.addColorStop(0.4, `rgba(${r},${g},${b},0.3)`); // Fade more quickly
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        // texture.needsUpdate = true; // Non necessario per CanvasTexture
        return texture;
    }
};

// --- END OF FILE eventManager.js ---