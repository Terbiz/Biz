// stars.js: Logica per la creazione della Via Lattea procedurale e delle stelle dell'universo.

function createStarPointsShaderMaterial() {
    return new THREE.ShaderMaterial({
        uniforms: {
            baseColor: { value: new THREE.Color(0xffffff) },
            time: { value: 0.0 }
        },
        vertexShader: `
            attribute float customSize;
            attribute vec3 customColor;
            varying float vAlpha;
            varying vec3 vColor;
            uniform float time;

            void main() {
                vColor = customColor;
                float randomFactor = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453 + time * 0.5);
                vAlpha = clamp(customSize / 2.8, 0.05, 0.95) * (0.8 + randomFactor * 0.2) ;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                float pointSizeFactor = clamp(180.0 / length(mvPosition.xyz), 0.2, 3.5);
                gl_PointSize = customSize * pointSizeFactor;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 baseColor;
            varying vec3 vColor;
            varying float vAlpha;

            void main() {
                float dist = length(gl_PointCoord - vec2(0.5, 0.5));
                float strength = 1.0 - dist * 2.0;
                strength = smoothstep(0.0, 1.0, strength);

                if (strength < 0.01) discard;

                gl_FragColor = vec4(baseColor * vColor, vAlpha * strength);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true
    });
}

function getRandomStarColor() {
    const rand = Math.random();
    if (rand < 0.6) return new THREE.Color(0xfff5e6);
    if (rand < 0.85) return new THREE.Color(0xddeeff);
    if (rand < 0.95) return new THREE.Color(0xffccaa);
    return new THREE.Color(0xff9966);
}

function createProceduralGalaxyStars(diskRadius, diskThickness, bulgeRadius, numStarsTotal) {
    const starVertices = [];
    const starSizes = [];
    const starColors = [];

    const numBulgeStars = numStarsTotal * 0.18;
    for (let i = 0; i < numBulgeStars; i++) {
        const r = bulgeRadius * Math.random();
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos((2 * Math.random()) - 1);
        starVertices.push( r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta) * 0.65, r * Math.cos(phi) );
        starSizes.push(THREE.MathUtils.randFloat(0.9, 2.4));
        starColors.push(...getRandomStarColor().toArray());
    }

    const numDiskStars = numStarsTotal * 0.82;
    const diskOuterFadeStartRadius = diskRadius * 0.55;

    for (let i = 0; i < numDiskStars; i++) {
        const r = diskRadius * Math.sqrt(Math.random());
        const theta = 2 * Math.PI * Math.random();
        const y = THREE.MathUtils.randFloatSpread(diskThickness * (1 - (r / diskRadius) * 0.6) );

        starVertices.push(r * Math.cos(theta), y, r * Math.sin(theta) );

        let baseSize;
        if (r < diskOuterFadeStartRadius) {
            if (Math.random() < 0.75) baseSize = THREE.MathUtils.randFloat(0.6, 1.4);
            else baseSize = THREE.MathUtils.randFloat(1.4, 2.1);
        } else {
            const fadeFactor = (r - diskOuterFadeStartRadius) / (diskRadius - diskOuterFadeStartRadius);
            if (Math.random() < 0.88) baseSize = THREE.MathUtils.randFloat(0.3, 0.9 - fadeFactor * 0.5);
            else baseSize = THREE.MathUtils.randFloat(0.9 - fadeFactor * 0.5, 1.4 - fadeFactor * 0.7);
        }
        starSizes.push(Math.max(0.25, baseSize));
        starColors.push(...getRandomStarColor().toArray());
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starsGeometry.setAttribute('customSize', new THREE.Float32BufferAttribute(starSizes, 1));
    starsGeometry.setAttribute('customColor', new THREE.Float32BufferAttribute(starColors, 3));

    const material = createStarPointsShaderMaterial();
    const points = new THREE.Points(starsGeometry, material);
    console.log("Stelle procedurali Via Lattea create:", starVertices.length / 3);
    return points;
}


function createGalaxyDustLanes(diskRadius, diskThickness, numDustParticles) {
    const dustVertices = [];
    const dustOpacities = []; // L'opacità verrà passata come "customSize" allo shader

    const dustLaneThickness = diskThickness * 0.6;
    const dustConcentrationFactor = 0.6;

    for (let i = 0; i < numDustParticles; i++) {
        const angle = Math.random() * Math.PI * 10;
        const distance = Math.pow(Math.random(), 1.5) * diskRadius * dustConcentrationFactor + (diskRadius * (1-dustConcentrationFactor) * Math.random());

        const offsetX = Math.sin(angle * 0.2 + distance * 0.01) * distance * 0.3;
        const offsetZ = Math.cos(angle * 0.2 + distance * 0.01) * distance * 0.3;

        const r = distance * (1 + THREE.MathUtils.randFloatSpread(0.3));
        const theta = angle + THREE.MathUtils.randFloatSpread(Math.PI / 4);

        const x = r * Math.cos(theta) + offsetX;
        const y = THREE.MathUtils.randFloatSpread(dustLaneThickness);
        const z = r * Math.sin(theta) + offsetZ;

        if (Math.sqrt(x*x + z*z) < diskRadius * 0.1 && Math.random() < 0.5) continue;

        dustVertices.push(x, y, z);
        dustOpacities.push(Math.random() * 0.05 + 0.01);
    }

    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dustVertices, 3));
    dustGeometry.setAttribute('customSize', new THREE.Float32BufferAttribute(dustOpacities, 1));

    const dustMaterial = createStarPointsShaderMaterial();
    dustMaterial.uniforms.baseColor.value = new THREE.Color(0x1a1008);
    dustMaterial.blending = THREE.NormalBlending;

    dustMaterial.vertexShader = `
        attribute float customSize; // Qui customSize è usato come alpha/strength
        varying float vAlpha;
        // varying vec3 vColor; // Non serve per la polvere, useremo baseColor
        void main() {
            vAlpha = customSize;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = 35.0 * (150.0 / length(mvPosition.xyz)); // Leggermente più grandi
            gl_Position = projectionMatrix * mvPosition;
        }
    `;
     dustMaterial.fragmentShader = `
        uniform vec3 baseColor;
        varying float vAlpha;
        void main() {
            float dist = length(gl_PointCoord - vec2(0.5, 0.5));
            if (dist > 0.48) discard; // Punti leggermente più tondi e pieni
            gl_FragColor = vec4(baseColor, vAlpha * 0.6); // Opacità leggermente aumentata
        }
    `;

    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    console.log("Polvere Galattica creata (da stars.js):", dustVertices.length / 3);
    return dustPoints;
}


function createDistantUniverseStars(minOuterRadius, maxOuterRadius, numStars) {
    const starVertices = [];
    const starSizes = [];
    const starColors = [];

    for (let i = 0; i < numStars; i++) {
        const r = THREE.MathUtils.randFloat(minOuterRadius, maxOuterRadius);
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos((2 * Math.random()) - 1);
        starVertices.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
        starSizes.push(THREE.MathUtils.randFloat(0.8, 2.0));
        starColors.push(...getRandomStarColor().toArray());
    }

    const starsGeometry = new THREE.BufferGeometry();
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    starsGeometry.setAttribute('customSize', new THREE.Float32BufferAttribute(starSizes, 1));
    starsGeometry.setAttribute('customColor', new THREE.Float32BufferAttribute(starColors, 3));

    const material = createStarPointsShaderMaterial();
    const points = new THREE.Points(starsGeometry, material);
    console.log("Stelle universo distante create:", numStars);
    return points;
}