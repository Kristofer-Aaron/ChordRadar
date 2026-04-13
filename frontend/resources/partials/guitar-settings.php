<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">


<h5 class="text-center mb-3">Guitar Settings</h5>

<hr>

<div class="mb-3">
    <label class="form-label">Strings</label>
    <input class="form-control" type="number" min="4" max="8" value="6">
    <label class="form-label">Frets</label>
    <input class="form-control" type="number" min="12" max="24" value="22">
</div>

<div class="mb-3">
    <label class="form-label">Tuning</label>
    <select class="form-select">
        <option>Standard</option>
        <option>Drop D</option>
        <option>Open G</option>
    </select>
</div>

<div class="mb-3">
    <label class="form-label">Playing hand</label>
    <div class="d-flex gap-2">
        <div class="form-check">
            <input class="form-check-input" type="radio" name="handedness">
            <label class="form-check-label">Left</label>
        </div>
        <div class="form-check">
            <input class="form-check-input" type="radio" name="handedness" checked>
            <label class="form-check-label">Right</label>
        </div>
    </div>

</div>

<div class="mb-3">
    <label class="form-label">Note Display</label>
    <div class="d-flex gap-2">
        <div class="form-check">
            <input class="form-check-input" type="radio" name="noteDisplay">
            <label class="form-check-label">Flat (b)</label>
        </div>
        <div class="form-check">
            <input class="form-check-input" type="radio" name="noteDisplay" checked>
            <label class="form-check-label">Sharp (#)</label>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
