function dot(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}

function normalize(vector) {
    const length = Math.sqrt(dot(vector, vector));
    if (length === 0) {
        throw new Error('Nie można znormalizować wektora zerowego.');
    }
    return vector.map((value) => value / length);
}

function weightedMean(vectors, weights) {
    if (vectors.length === 0 || vectors.length !== weights.length) {
        throw new Error('Potrzebna jest niepusta lista wektorów i tyle samo wag.');
    }
    const result = new Array(vectors[0].length).fill(0);
    let totalWeight = 0;
    for (let i = 0; i < vectors.length; i++) {
        for (let j = 0; j < result.length; j++) {
            result[j] += vectors[i][j] * weights[i];
        }
        totalWeight += weights[i];
    }
    if (!(totalWeight > 0)) {
        throw new Error('Suma wag musi być dodatnia.');
    }
    return result.map((value) => value / totalWeight);
}

module.exports = { dot, normalize, weightedMean };