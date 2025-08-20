const extraSubmissionsPenaltyUnit = document.getElementById('extraSubmissionsPenaltyUnit');
const freeSubmissions = document.getElementById('freeSubmissions');
const extraSubmissionsPenalty = document.getElementById('extraSubmissionsPenalty');

extraSubmissionsPenaltyUnit.addEventListener('change', validatePenaltyInputs);
freeSubmissions.addEventListener('input', validatePenaltyInputs);
extraSubmissionsPenalty.addEventListener('input', validatePenaltyInputs);

function validatePenaltyInputs() {
    const penaltyWarning = document.getElementById('penaltyWarning');
    const penaltyValue = parseFloat(extraSubmissionsPenalty.value);
    const freeSubmissionsValue = parseFloat(freeSubmissions.value);
    const penaltyUnit = extraSubmissionsPenaltyUnit.value;

    if (penaltyUnit === 'none' && (penaltyValue > 0 || freeSubmissionsValue != 0)) {
        penaltyWarning.style.display = 'block';
        penaltyWarning.innerHTML = "Warning: Penalty unit is set to 'none' but a penalty value is provided or there is a limit on free submissions. This will not apply any penalties.";
    } else if (penaltyUnit !== 'none' && (penaltyValue <= 0 || isNaN(penaltyValue))) {
        penaltyWarning.style.display = 'block';
        penaltyWarning.innerHTML = "Warning: A penalty value must be provided when the penalty unit is not 'none'.";
    } else if (penaltyUnit !== 'none' && (freeSubmissionsValue <= 0 || isNaN(freeSubmissionsValue))) {
        penaltyWarning.style.display = 'block';
        penaltyWarning.innerHTML = "Warning: Free submissions must be greater than 0 when a penalty unit is set.";
    } else {
        penaltyWarning.style.display = 'none';
        penaltyWarning.innerHTML = "";
    }
}
