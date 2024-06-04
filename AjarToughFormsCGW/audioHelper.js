let audio = null,
    context,
    source,
    filter,
    panner;

function handleContext() {
    handleAudio()
    handleFilter()
    audio.play();
}
function handleAudio() {
    audio = document.getElementById('audioElId');

    audio.addEventListener('play', () => {
        if (!context) {
            context = new AudioContext();
            source = context.createMediaElementSource(audio);
            panner = context.createPanner();
            filter = context.createBiquadFilter();

            source.connect(panner);
            panner.connect(filter);
            filter.connect(context.destination);

            filter.type = 'notch';
            filter.Q.value = 0.5;
            filter.frequency.value = 9090;
            context.resume();
        }
    })


    audio.addEventListener('pause', () => {
        console.log('pause');
        context.resume();
    })
}
function handleFilter() {
    let filterState = document.getElementById('notch');
    filterState.addEventListener('change', function() {
        if (filterState.checked) {
            panner.disconnect();
            panner.connect(filter);
            filter.connect(context.destination);
        } else {
            panner.disconnect();
            panner.connect(context.destination);
        }
    });
}

function deviceorientationToAudioPosition(alpha, beta, gamma) {
    // Convert angles to radians
    const alphaRad = (alpha * Math.PI) / 180;
    const betaRad = (beta * Math.PI) / 180;
    const gammaRad = (gamma * Math.PI) / 180;

    // Define the initial vector along the x-axis
    let vector = [0, 1, 0];

    // Rotation around the z-axis (gamma)
    const rotZ = [
        [Math.cos(gammaRad), -Math.sin(gammaRad), 0],
        [Math.sin(gammaRad), Math.cos(gammaRad), 0],
        [0, 0, 1]
    ];
    vector = multiplyMatrixVector(rotZ, vector);

    // Rotation around the y-axis (beta)
    const rotY = [
        [Math.cos(betaRad), 0, Math.sin(betaRad)],
        [0, 1, 0],
        [-Math.sin(betaRad), 0, Math.cos(betaRad)]
    ];
    vector = multiplyMatrixVector(rotY, vector);

    // Rotation around the x-axis (alpha)
    const rotX = [
        [1, 0, 0],
        [0, Math.cos(alphaRad), -Math.sin(alphaRad)],
        [0, Math.sin(alphaRad), Math.cos(alphaRad)]
    ];
    vector = multiplyMatrixVector(rotX, vector);

    return vector;
}

function multiplyMatrixVector(matrix, vector) {
    const result = [];
    for (let i = 0; i < matrix.length; i++) {
        let sum = 0;
        for (let j = 0; j < vector.length; j++) {
            sum += matrix[i][j] * vector[j];
        }
        result.push(sum);
    }
    return result;
}