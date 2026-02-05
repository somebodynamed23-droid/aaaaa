
export const CONSTANTS = {
  R: 8.314, // Universal gas constant J/(mol·K)
  MOLAR_MASS_CO2: 44.01, // g/mol
  MOLAR_MASS_NA2CO3: 105.99, // g/mol
  MOLAR_MASS_AIR: 28.97, // g/mol
  IDEAL_GAS_VOLUME_STP: 22.4, // L/mol at 0C, 1atm
  AIR_DENSITY_STP: 1.225, // kg/m^3
};

/**
 * Calculates theoretical Na2CO3 yield (mg) for 1 ppm change in 1 m^3 of air.
 * Reaction: 2NaOH + CO2 -> Na2CO3 + H2O
 * 1 mole CO2 (44g) creates 1 mole Na2CO3 (106g)
 */
export const getYieldFactor = (volumeM3: number, tempK: number) => {
  const pressurePa = 101325; // 1 atm
  const totalMolesAir = (pressurePa * volumeM3) / (CONSTANTS.R * tempK);
  // 1 PPM is 1e-6 moles of CO2 per mole of air
  const molesCO2PerPPM = totalMolesAir * 1e-6;
  // Moles Na2CO3 = Moles CO2
  const massNa2CO3PerPPM_G = molesCO2PerPPM * CONSTANTS.MOLAR_MASS_NA2CO3;
  return massNa2CO3PerPPM_G * 1000; // to milligrams
};
