const assert = require('assert');

const mapTreatments = (treatmentsStr) => {
    if (!treatmentsStr || treatmentsStr.trim() === '') return null;
    
    // Split by comma since the frontend joins them
    const rawTreatments = treatmentsStr.split(',').map(t => t.trim());
    if (rawTreatments.length === 0) return null;

    const treatmentMap = {
        'Dental Implants': 'dental implant',
        'Veneers / Smile Makeovers': 'veneer',
        'Invisalign / Clear Aligners': 'Invisalign',
        'Braces / Orthodontics': 'orthodontics',
        'Full-Mouth Restoration': 'full-mouth restoration',
        'Teeth Whitening': 'teeth whitening',
        'Cosmetic Bonding': 'cosmetic bonding',
        'General Dentistry': 'general dentistry',
        'Other': 'other'
    };

    let mapped = rawTreatments.map(t => treatmentMap[t] || t.toLowerCase());
    mapped = mapped.filter(t => t !== 'other'); // Remove 'other' for cleaner sentence if present with actuals
    if (mapped.length === 0) return null;

    if (mapped.length === 1) return mapped[0];
    if (mapped.length === 2) return `${mapped[0]} and ${mapped[1]}`;
    
    const last = mapped.pop();
    return `${mapped.join(', ')}, and ${last}`;
};

// 1. One treatment
assert.strictEqual(mapTreatments('Dental Implants'), 'dental implant');

// 2. Two treatments
assert.strictEqual(mapTreatments('Dental Implants, Veneers / Smile Makeovers'), 'dental implant and veneer');

// 3. Three treatments
assert.strictEqual(mapTreatments('Dental Implants, Veneers / Smile Makeovers, Invisalign / Clear Aligners'), 'dental implant, veneer, and Invisalign');

// 4. Missing treatment string
assert.strictEqual(mapTreatments(''), null);

// 5. Four treatments
assert.strictEqual(mapTreatments('Dental Implants, Veneers / Smile Makeovers, Invisalign / Clear Aligners, Teeth Whitening'), 'dental implant, veneer, Invisalign, and teeth whitening');

console.log("All tests passed!");
