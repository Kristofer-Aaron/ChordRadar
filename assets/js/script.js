
tuning = ['E','A','D','G','B','E'];

function generateGuitarNeck(strings, frets) {
    let guitarNeck = document.getElementById('guitarNeck');

    let html = '<div>';
    for (let i = 0; i < strings; i++) {
        html += `<div class="tuningCell">${tuning[i]}</div>`
    }
    for (let i = 0; i < frets + 2; i++) {
        html += '<div class="fretboardColumn">';
        for (j = 0; j < strings; j++) {
            html += `<div class="fretboardCell">
                <input type="radio" name="s${j}" value="${i}" id="s${j}f${i}radio" class="fretboardRadio">
                <label for="s${j}f${i}radio">
                <div>${i}</div>
                </label>
                </div>`;
        }

        html += '</div>'
    }

    guitarNeck.innerHTML = html; // Set the generated html string to be the innerHTML of guitarNeck
}

function getRadioValues() {
    const radios = document.querySelectorAll('input.fretboardRadio[type="radio"]');
    const radioGroupNames = [...new Set(Array.from(radios).map(r => r.name))];

    let result = [];
    radioGroupNames.forEach(name => {
        checked = document.querySelector(`input[name="${name}"]:checked`);
        result.push(checked ? checked.value : "x");
    });
    return result;
}

function alertValues(array) {
    let result = '';
    array.forEach(element => {
        result += element;
    });
}


// Radio unchecking script + output call
document.addEventListener('click', function(e) {
    if (e.target.classList.contains("fretboardRadio")) {
        const radio = e.target;
        const group = document.getElementsByName(radio.name);

        // If it was already checked, uncheck it
        if (radio.wasChecked) {
            radio.checked = false;
        }

        // Reset wasChecked for all radios in the same group
        group.forEach(r => r.wasChecked = r.checked);

        // Output
        alertValues(getRadioValues());
    }
});


generateGuitarNeck(6,24);